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
        // Try to find a connected gamepad if we don't have one
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i] && gamepads[i].connected) {
            this.gamepadIndex = i;
            break;
          }
        }
        if (this.gamepadIndex === null) return { pitch, yaw, roll, boostHeld };
      }

      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (!gp || !gp.connected) {
        this.gamepadIndex = null;
        return { pitch, yaw, roll, boostHeld };
      }

      // 1. Handle Binary/Digital Inputs (Buttons)
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
          if (action === 'boost') boostHeld = true;
          // Note: freeAirRoll handled after analog to allow override
        }
      });

      // 2. Handle Analog Inputs (Axes) with Deadzones and Sensitivity
      const getAxisValue = (binding) => {
        if (!binding) return 0;
        let val = 0;
        if (binding.axis !== undefined && gp.axes[binding.axis] !== undefined) {
          const raw = gp.axes[binding.axis];
          const dir = binding.axisDirection || 1;
          if ((dir === 1 && raw > 0) || (dir === -1 && raw < 0)) val = Math.abs(raw);
        }
        if (binding.axis2 !== undefined && gp.axes[binding.axis2] !== undefined) {
          const raw = gp.axes[binding.axis2];
          const dir = binding.axis2Direction || 1;
          if ((dir === 1 && raw > 0) || (dir === -1 && raw < 0)) val = Math.max(val, Math.abs(raw));
        }
        return val;
      };

      const rawYawLeft = getAxisValue(this.mappings.yawLeft);
      const rawYawRight = getAxisValue(this.mappings.yawRight);
      const rawPitchUp = getAxisValue(this.mappings.pitchUp);
      const rawPitchDown = getAxisValue(this.mappings.pitchDown);

      let analogYaw = rawYawRight - rawYawLeft;
      let analogPitch = rawPitchUp - rawPitchDown;

      // Fallback: If NO axis mapping is configured at all for yaw, use standard Axis 0
      if (this.mappings.yawLeft.axis === undefined && this.mappings.yawLeft.axis2 === undefined &&
          this.mappings.yawRight.axis === undefined && this.mappings.yawRight.axis2 === undefined) {
        analogYaw = gp.axes[0] || 0;
      }
      // Fallback: If NO axis mapping for pitch, use standard Axis 1
      if (this.mappings.pitchUp.axis === undefined && this.mappings.pitchUp.axis2 === undefined &&
          this.mappings.pitchDown.axis === undefined && this.mappings.pitchDown.axis2 === undefined) {
        analogPitch = gp.axes[1] || 0;
      }

      if (Math.abs(analogYaw) > 0.001 || Math.abs(analogPitch) > 0.001) {
        const { x, y } = this._applyStickDeadzone({ axes: [analogYaw, analogPitch] });
        // Only override if the analog stick is actually pushing something (after deadzone)
        if (Math.abs(x) > 0) yaw = -x;
        if (Math.abs(y) > 0) pitch = y;
      }

      // 3. Handle Free Air Roll override (X/Square or Shift)
      const isFreeAirRoll = (this.mappings.freeAirRoll.button !== undefined && gp.buttons[this.mappings.freeAirRoll.button]?.pressed) ||
                            (this.mappings.freeAirRoll.button2 !== undefined && gp.buttons[this.mappings.freeAirRoll.button2]?.pressed);
      
      if (isFreeAirRoll) {
        roll = -yaw;
        yaw = 0;
      }

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