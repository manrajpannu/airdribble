import { Map as GameMap } from './Map';
import { Car } from './Car/Car';
import { Controller } from './Controller';
import { BallManager } from './Ball/BallManager';

import * as THREE from 'three';
import ChallengeMode from './modes/ChallengeMode';
import FreeplayMode from './modes/Freeplay';
import TutorialMode from './modes/TutorialMode';
import { Ball } from './Ball/Ball';
import { ToonSky } from './environment/ToonSky';
import { physics } from './physicsConfig.js';

interface ModeLike {
  name?: string;
  active?: boolean;
  hits?: number;
  kills?: number;
  score?: number;
  _damageDealt?: number;
  _damagePossible?: number;
  _shots?: number;
  _elapsedSeconds?: number;
  timeElapsed?: number;
  timeLimit?: number;
  start: (ballManager: BallManager, context?: { car?: Car }) => void | Promise<void>;
  stop: () => void;
  shouldPauseGameplay?: () => boolean;
  update: (dt: number, context?: { boostHeld?: boolean; ballManager?: BallManager }) => void;
  onHit: (ball?: Ball) => void;
  onKill: (ball?: Ball) => void;
  onMiss: () => void;
}

const buildModeState = (mode: ModeLike, car: Car) => {
  const isChallenge = mode instanceof ChallengeMode;
  const isFreeplay = mode instanceof FreeplayMode;
  const bulletState = car?.getBulletState ? car.getBulletState() : null;

  return {
    modeName: isChallenge ? 'Challenge' : isFreeplay ? 'Freeplay' : 'Unknown',
    active: Boolean(mode?.active),
    isChallenge,
    completed: Boolean((mode as any)?.completed),
    hits: Number(mode?.hits ?? 0),
    kills: Number(mode?.kills ?? 0),
    score: Number(mode?.score ?? 0),
    damageDealt: Number((mode as any)?._damageDealt ?? 0),
    damagePossible: Number((mode as any)?._damagePossible ?? 0),
    shots: Number((mode as any)?._shots ?? 0),
    elapsedSeconds: Number((mode as any)?._elapsedSeconds ?? 0),
    timeLeft: isChallenge ? Number((mode as any)?.timeElapsed ?? 0) : null,
    timeLimit: isChallenge ? Number((mode as any)?.timeLimit ?? 0) : null,
    ammoEnabled: Boolean(bulletState?.enabled),
    ammo: bulletState ? Number(bulletState.ammo) : null,
    ammoMax: bulletState ? Number(bulletState.maxAmmo) : null,
  };
};

type ModeState = ReturnType<typeof buildModeState>;

interface ChallengePreset {
  numBalls: number;
  health: number;
  movement: any;
  size: number | Array<number>;
  boundary: number;
  timeLimit: number;
  killEffect?: 'confetti' | 'bubble' | 'rainbowBubblePop' | 'neonStarburst' | 'plasmaRing' | 'holoShockwave' | 'whiteGlitterExplosion' | 'whiteGlitter' | 'rainbowGlitterExplosion' | 'rainbowGlitter' | 'glitterExplosion' | 'glitter' | 'shockwave' | null;
}

/**
 * Root gameplay coordinator.
 *
 * Engine owns the major gameplay domains (car, balls, map, controller, mode)
 * and defines the per-frame execution order used by the simulation.
 */
export class Engine extends THREE.Group {
  car: Car;
  BallManager: BallManager;
  map: GameMap;
  sky: ToonSky;
  controller: Controller;
  currentMode: ModeLike;
  currentClosestBall: Ball | null;
  private _onHit: () => void;
  private _onKill: (ball?: Ball) => void;
  private _modeStateListeners: Set<(state: ModeState) => void>;
  private _challengePresets: Record<string, ChallengePreset>;
  private _darkMode: boolean = false;
  private _keyLight!: THREE.DirectionalLight;
  private _fillLight!: THREE.DirectionalLight;
  private _rimLight!: THREE.DirectionalLight;
  private _stateEmitAccumulator: number = 0;
  private _carUpDir: THREE.Vector3 = new THREE.Vector3();

  /**
  * @param renderer Active renderer instance used by UI wiring.
  * @param options Initialization options, including scenario config.
  * @param scene The active THREE.Scene.
  */
  constructor(renderer: THREE.WebGLRenderer, options: any = {}, private _scene?: THREE.Scene) {
    super();

    this._modeStateListeners = new Set();
    this.currentClosestBall = null;
    this._darkMode = options.darkMode || false;

    if (this._scene) {
      this._scene.background = new THREE.Color(this._darkMode ? 0x000000 : 0xfafafa);
    }
    this._challengePresets = {
      Warmup: {
        numBalls: 1,
        health: 4,
        movement: null,
        size: 2,
        boundary: 15,
        timeLimit: 30,
        killEffect: 'shockwave',
      },
      Accuracy: {
        numBalls: 2,
        health: 5,
        movement: null,
        size: 1.8,
        boundary: 18,
        timeLimit: 45,
        killEffect: 'shockwave',
      },
      Endurance: {
        numBalls: 4,
        health: 6,
        movement: null,
        size: 2,
        boundary: 22,
        timeLimit: 90,
        killEffect: 'shockwave',
      },
    };

    {
      const ambientLight = new THREE.AmbientLight(0x000000);
      this.add(ambientLight);

      this._keyLight = new THREE.DirectionalLight(0xffffff, this._darkMode ? 0.6 : 2.0);
      this._keyLight.position.set(0, 200, 0);
      this._keyLight.castShadow = true;
      this._keyLight.shadow.mapSize.set(2048, 2048);
      this._keyLight.shadow.camera.near = 1;
      this._keyLight.shadow.camera.far = 400;
      if (this._keyLight.shadow.camera instanceof THREE.OrthographicCamera) {
        this._keyLight.shadow.camera.left = -120;
        this._keyLight.shadow.camera.right = 120;
        this._keyLight.shadow.camera.top = 120;
        this._keyLight.shadow.camera.bottom = -120;
      }
      this._keyLight.shadow.bias = -0.00002;
      this._keyLight.shadow.normalBias = 0.02;
      this.add(this._keyLight);

      this._fillLight = new THREE.DirectionalLight(0xffffff, this._darkMode ? 0.8 : 3.5);
      this._fillLight.position.set(100, 200, 100);
      this.add(this._fillLight);

      this._rimLight = new THREE.DirectionalLight(0xffffff, this._darkMode ? 0.5 : 2.5);
      this._rimLight.position.set(-100, -200, -100);
      this.add(this._rimLight);
    }

    this.car = new Car(this);
    this.add(this.car);

    this.sky = new ToonSky({ darkMode: this._darkMode });
    this.add(this.sky);

    this.BallManager = new BallManager();
    this.add(this.BallManager);

    this.map = new GameMap();
    this.map.setDarkMode(this._darkMode);
    this.map.gen();
    this.map.position.y = -15;

    this.controller = new Controller();

    const modeName = options.modeName || 'Challenge';
    const challengeConfig = options.challengeConfig || {
      numBalls: 1,
      health: 3,
      size: [1.5, 2.0, 2.5],
      timeLimit: 60,
      boundary: 30,
      colors: ['#3459ff', '#04f460', '#f4e404', '#f776fc', '#3cff94', '#3ee9ff'],
      reticleType: 'cross',
      reticleColor: '#ff2222',
    };

    if (modeName === 'Freeplay') {
      this.currentMode = new FreeplayMode(challengeConfig);
    } else if (modeName === 'Tutorial') {
      this.currentMode = new TutorialMode(challengeConfig);
    } else {
      this.currentMode = new ChallengeMode(challengeConfig);
    }

    if (options.appSettings) {
      this.applySettings(options.appSettings);
    }

    if ('boundary' in (this.currentMode as any)) {
      (this.BallManager as any).boundary = (this.currentMode as any).boundary;
    }

    this.currentMode.start(this.BallManager, { car: this.car });

    this._onHit = (ball?: Ball) => {
      this.currentMode.onHit(ball);
      this._emitModeState();
    };

    this._onKill = (ball?: Ball) => {
      if (ball === this.currentClosestBall) {
        this.currentClosestBall = null;
      }
      this.currentMode.onKill(ball);
      this._emitModeState();
    };

    this.BallManager.on('hit', this._onHit);
    this.BallManager.on('killed', this._onKill);

    window.addEventListener('gamepadconnected', e => {
      const gp = navigator.getGamepads()[e.gamepad.index];
      if (!gp) return;
    });

    this._emitModeState();
  }

  update(dt: number): void {
    this.sky?.update(dt);

    const { yaw, pitch, roll, boostHeld, ballCam } = this.controller.handleController();

    if (!this.currentMode.active && this.currentMode.shouldPauseGameplay?.()) {
      this.car.setNeutralState();
      this.currentMode.update(dt, { boostHeld: false, ballManager: this.BallManager });
      this._stateEmitAccumulator += dt;
      if (this._stateEmitAccumulator >= 0.067) {
        this._stateEmitAccumulator = 0;
        this._emitModeState();
      }
      return;
    }

    const bulletState = this.car?.getBulletState ? this.car.getBulletState() : null;
    const bulletsEnabled = Boolean(bulletState?.enabled);
    this._carUpDir.set(0, 1, 0).applyQuaternion(this.car.quaternion).normalize();
    this.BallManager.update(this.car.getForwardVector(), boostHeld, dt, this._carUpDir, {
      bulletsEnabled,
      carPosition: this.car.position,
    });
    this.BallManager.updateHealthBar(this.car.getCamera());

    const { miss } = this.car.updateBullets(dt, this.BallManager, boostHeld);
    if (miss) {
      this.currentMode.onMiss();
    }

    this.car.rotate(yaw, pitch, roll, dt);
    this.car.boost(boostHeld, dt);
    if (!this.currentClosestBall) {
      this.currentClosestBall = this.BallManager.getClosestBall() ?? null;
    }

    this.car.updateCamera(this.currentClosestBall ? this.currentClosestBall.position : null, ballCam, dt);
    this.currentMode.update(dt, { boostHeld, ballManager: this.BallManager });

    this._stateEmitAccumulator += dt;
    if (this._stateEmitAccumulator >= 0.033) {
      this._stateEmitAccumulator = 0;
      this._emitModeState();
    }
  }

  getCamera(): THREE.Camera {
    return this.car.getCamera() as unknown as THREE.Camera;
  }

  setMode(newMode: ModeLike): void {
    if (this.currentMode && typeof this.currentMode.stop === 'function') {
      this.currentMode.stop();
    }

    this.car.clearBullets();

    if (this.car?.Boost && typeof this.car.Boost.reset === 'function') {
      this.car.Boost.reset();
    }

    if (this._onHit) this.BallManager.off('hit', this._onHit);
    if (this._onKill) this.BallManager.off('killed', this._onKill);

    this.currentMode = newMode;

    this._onHit = (ball?: Ball) => {
      this.currentMode.onHit(ball);
      this._emitModeState();
    };
    this._onKill = (ball?: Ball) => {
      if (ball === this.currentClosestBall) {
        this.currentClosestBall = null;
      }
      this.currentMode.onKill(ball);
      this._emitModeState();
    };

    this.BallManager.on('hit', this._onHit);
    this.BallManager.on('killed', this._onKill);

    if ('boundary' in (this.currentMode as any)) {
      (this.BallManager as any).boundary = (this.currentMode as any).boundary;
    }

    this.currentMode.start(this.BallManager, { car: this.car });
    this.currentClosestBall = null;
    this._emitModeState();
  }

  setModeByName(modeName: string, options: Record<string, any> = {}): void {
    if (modeName === 'Challenge') {
      this.setMode(new ChallengeMode({
        ...this._challengePresets.Warmup,
        killEffect: 'shockwave',
        ...options,
      }));
      return;
    }

    if (modeName === 'Tutorial') {
      this.setMode(new TutorialMode(options));
      return;
    }

    this.setMode(new FreeplayMode({
      numBalls: 1,
      health: 6,
      movement: null,
      size: 2,
      boundary: 15,
      ...options,
    }));
  }

  restartCurrentMode(): void {
    if (typeof (this.currentMode as any).restart === 'function') {
      (this.currentMode as any).restart();
    } else {
      this.currentMode.start(this.BallManager, { car: this.car });
    }
    this.currentClosestBall = null;
    this._emitModeState();
  }

  setDarkMode(isDark: boolean): void {
    this._darkMode = isDark;
    this.sky?.setDarkMode(isDark);
    this.map?.setDarkMode(isDark);

    if (this._keyLight) this._keyLight.intensity = isDark ? 0.6 : 2.0;
    if (this._fillLight) this._fillLight.intensity = isDark ? 0.8 : 3.5;
    if (this._rimLight) this._rimLight.intensity = isDark ? 0.5 : 2.5;

    if (this._scene) {
      this._scene.background = new THREE.Color(isDark ? 0x000000 : 0xfafafa);
      this._scene.environmentIntensity = isDark ? 0.2 : 0.8;
    }
  }

  applySettings(settings: any): void {
    if (!settings) return;

    // 1. Camera
    if (settings.camera) {
      physics.camera.fov = settings.camera.fov;
      physics.camera.distance = settings.camera.distance;
      physics.camera.height = settings.camera.height;
      this.car.updateFov();
    }

    // 2. Car Body
    if (settings.carBody) {
      this.car.switchCarModel(settings.carBody);
    }

    // 3. Controller
    if (this.controller) {
      this.controller.applySettings(settings);
    }
  }

  stopCurrentMode(): void {
    this.currentMode.stop();
    this._emitModeState();
  }

  getModeState(): ModeState {
    return buildModeState(this.currentMode, this.car);
  }

  onModeStateChange(listener: (state: ModeState) => void): void {
    this._modeStateListeners.add(listener);
    listener(this.getModeState());
  }

  offModeStateChange(listener: (state: ModeState) => void): void {
    this._modeStateListeners.delete(listener);
  }

  private _emitModeState(): void {
    const state = this.getModeState();
    this._modeStateListeners.forEach(listener => listener(state));
  }
}