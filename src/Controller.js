// Deadzone helper


/**
 * Applies independent axis deadzone clipping.
 * @param {number} value
 * @param {number} deadzone
 * @returns {number}
 */
const crossDeadzone = (value, deadzone = 0.10) => {
  return Math.abs(value) < deadzone ? 0 : value;
};

/**
 * Applies radial deadzone clipping in stick space.
 * @param {number} x
 * @param {number} y
 * @param {number} deadzone
 * @returns {{ x: number, y: number }}
 */
const circleDeadzone = (x, y, deadzone = 0.10) => {
  return Math.hypot(x, y) < deadzone ? { x: 0, y: 0 } : { x, y };
};

/**
 * Remaps circular stick input domain to square domain.
 * This preserves edge reach when users prefer square deadzone behavior.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function circleToSquare(x, y) {
  if (x === 0 && y === 0) return { x: 0, y: 0 }; // center
  const r = Math.hypot(x, y);           // sqrt(x*x + y*y)
  const cosT = x / r;
  const sinT = y / r;
  const m = Math.max(Math.abs(cosT), Math.abs(sinT));
  // scale so circle edge maps to square edge
  const scale = (m === 0) ? 0 : r / m;
  return { x: cosT * scale, y: sinT * scale };
}

/**
 * Aggregates keyboard/mouse/gamepad state into normalized control outputs.
 */
export class Controller {
    constructor() {
      this.keysPressed = new Set();
      this.mouseButtonsPressed = new Set();
      
      this.input = {
        yawLeft: 0,
        yawRight: 0,
        pitchUp: 0,
        pitchDown: 0,
        rollLeft: 0,
        rollRight: 0,
        boostHeld: false,
      };
      
      this.controllerDeadzone = 0.15;
      this.controllerDeadzoneType = 'cross'; 
      this.controllerSensitivity = 1.0;
      this.gamepadIndex = null;
      this.ballCam = true;
      
      // Default mappings
      this.mappings = {
        yawLeft: { key: "a" },
        yawRight: { key: "d" },
        pitchUp: { key: "s" },
        pitchDown: { key: "w" },
        airRollLeft: { key: "q", button: 4 },
        airRollRight: { key: "e", button: 5 },
        freeAirRoll: { key: "Shift", button: 2 },
        boost: { key: " ", button: 1 },
      };

      window.addEventListener('gamepadconnected', (e) => this.gamepadIndex = e.gamepad.index);
      window.addEventListener('gamepaddisconnected', (e) => {if (this.gamepadIndex === e.gamepad.index) this.gamepadIndex = null});
      
      document.addEventListener("keydown", (e) => {
        this.keysPressed.add(e.key.toLowerCase());
        if (e.key === " ") this.ballCam = !this.ballCam;
      });
      document.addEventListener("keyup", (e) => {
        this.keysPressed.delete(e.key.toLowerCase());
      });

      window.addEventListener("mousedown", (e) => {
        this.mouseButtonsPressed.add(e.button);
      });
      window.addEventListener("mouseup", (e) => {
        this.mouseButtonsPressed.delete(e.button);
      });
      window.addEventListener("contextmenu", (e) => {
        if (this.keysPressed.size > 0 || this.mouseButtonsPressed.size > 0) {
          e.preventDefault();
        }
      });
    }

    applySettings(settings) {
      if (settings.deadzone) {
        this.controllerDeadzone = settings.deadzone.size;
        this.controllerDeadzoneType = settings.deadzone.type;
        this.controllerSensitivity = settings.deadzone.sensitivity;
      }
      if (settings.controls) {
        this.mappings = settings.controls;
      }
    }

    isLeftMouse() {
        return this.mouseButtonsPressed.has(0);
    }

    /**
     * Reads current input sources and returns one merged control frame.
     * Keyboard input has priority over gamepad on each axis when non-zero.
     *
     * @returns {{ pitch: number, yaw: number, roll: number, boostHeld: boolean, ballCam: boolean }}
     */
    _clampStick(x, y) {
      const hyp = Math.hypot(x, y);
      if (hyp > 1) {
        return { x: x / hyp, y: y / hyp };
      }
      return { x, y };
    }

    _applyStickDeadzone(gp) {
      let x = gp.axes[0];
      let y = gp.axes[1];

      switch (this.controllerDeadzoneType) {
        case 'circle': {
          ({ x, y } = circleDeadzone(x, y, this.controllerDeadzone));
          x *= this.controllerSensitivity;
          y *= this.controllerSensitivity;
          return this._clampStick(x, y);
        }

        case 'cross': {
          x = crossDeadzone(x, this.controllerDeadzone);
          y = crossDeadzone(y, this.controllerDeadzone);
          x *= this.controllerSensitivity;
          y *= this.controllerSensitivity;
          return this._clampStick(x, y);
        }

        case 'square': {
          x = crossDeadzone(gp.axes[0], this.controllerDeadzone);
          y = crossDeadzone(gp.axes[1], this.controllerDeadzone);
          return circleToSquare(x * this.controllerSensitivity, y * this.controllerSensitivity);
        }

        default: {
          x = crossDeadzone(x, this.controllerDeadzone);
          y = crossDeadzone(y, this.controllerDeadzone);
          return { x, y };
        }
      }
    }

    _readGamepadFrame() {
      let pitch = 0;
      let yaw = 0;
      let roll = 0;
      let boostHeld = false;

      if (this.gamepadIndex === null) {
        return { pitch, yaw, roll, boostHeld };
      }

      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (!gp || !gp.connected) {
        return { pitch, yaw, roll, boostHeld };
      }

      const { x, y } = this._applyStickDeadzone(gp);
      pitch = y;
      yaw = -x;

      Object.entries(this.mappings).forEach(([action, binding]) => {
        const isPressed = (binding.button !== undefined && gp.buttons[binding.button]?.pressed) || 
                          (binding.button2 !== undefined && gp.buttons[binding.button2]?.pressed);
        
        if (isPressed) {
          if (action === 'pitchUp') pitch = 1;
          if (action === 'pitchDown') pitch = -1;
          if (action === 'yawLeft') yaw = 1;
          if (action === 'yawRight') yaw = -1;
          if (action === 'airRollLeft') roll = -1;
          if (action === 'airRollRight') roll = 1;
          if (action === 'freeAirRoll') {
            roll = -yaw;
            yaw = 0;
          }
          if (action === 'boost') boostHeld = true;
        }
      });

      return { pitch, yaw, roll, boostHeld };
    }

    _readKeyboardFrame() {
      const frame = {
        pitch: 0,
        yaw: 0,
        roll: 0,
        boostHeld: false,
      };

      Object.entries(this.mappings).forEach(([action, binding]) => {
        const isKeyPressed = (binding.key && this.keysPressed.has(binding.key.toLowerCase())) || 
                             (binding.key2 && this.keysPressed.has(binding.key2.toLowerCase()));
        
        const isMousePressed = (binding.mouse !== undefined && this.mouseButtonsPressed.has(binding.mouse)) ||
                               (binding.mouse2 !== undefined && this.mouseButtonsPressed.has(binding.mouse2));

        if (isKeyPressed || isMousePressed) {
          if (action === 'pitchUp') frame.pitch = 1;
          if (action === 'pitchDown') frame.pitch = -1;
          if (action === 'yawLeft') frame.yaw = 1;
          if (action === 'yawRight') frame.yaw = -1;
          if (action === 'airRollLeft') frame.roll = -1;
          if (action === 'airRollRight') frame.roll = 1;
          if (action === 'freeAirRoll') {
            frame.roll = -frame.yaw;
            frame.yaw = 0;
          }
          if (action === 'boost') frame.boostHeld = true;
        }
      });

      return frame;
    }

    handleController() {
      const gpFrame = this._readGamepadFrame();
      const kbFrame = this._readKeyboardFrame();

      return {
        pitch: kbFrame.pitch || gpFrame.pitch,
        yaw: kbFrame.yaw || gpFrame.yaw,
        roll: kbFrame.roll || gpFrame.roll,
        boostHeld: kbFrame.boostHeld || gpFrame.boostHeld,
        ballCam: this.ballCam,
      };
    }
}