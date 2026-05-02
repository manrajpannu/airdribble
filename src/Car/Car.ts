// @ts-nocheck
import * as THREE from 'three';
import { CarModel, CAR_MODELS } from './CarModel.js';
import { physics } from '../physicsConfig.js';
import { degToRad } from 'three/src/math/MathUtils.js';
import { BOOST_TYPES, createBoost } from './boost/BoostFactory.js';
import Gun from './Gun';

type BoostInstance = {
  emitParticles: (position: THREE.Vector3, quaternion: THREE.Quaternion, dt: number) => void;
  updateParticles: (dt: number) => void;
  reset?: () => void;
  dispose?: () => void;
};

/**
 * Player-controlled car with rotational physics and chase-camera behavior.
 */
export class Car extends THREE.Group {
  private hostScene: THREE.Object3D;
  carModels: Map<string, CarModel>;
  currentModel: string | null;
  ballCam: boolean;
  Up: THREE.Vector3;
  forward: THREE.Vector3;

  Boost: BoostInstance;
  boostType: keyof typeof BOOST_TYPES;

  showLine: boolean;
  showAxisOfRotationLine: boolean;
  showTorus: boolean;

  rotationVelocity: THREE.Vector3;
  rotationSpeed: { x: number; y: number; z: number };
  maxRotationSpeed: { x: number; y: number; z: number };
  airDragCoefficient: { x: number; y: number; z: number };
  rampSpeed: { x: number; y: number; z: number };

  camera: THREE.PerspectiveCamera;
  LookAt: THREE.Vector3;
  gun: Gun;

  forwardArrow: THREE.ArrowHelper;
  private _rotationLine: THREE.Line;
  private _torusGeometry: THREE.TorusGeometry;
  _torusMaterial: THREE.MeshStandardMaterial;
  torus: THREE.Mesh;
  torusDrawOnTop: boolean;
  private _torusDrawOnTop?: boolean;
  private _lastAxisOfRotation: THREE.Vector3 | null;

  // Pre-allocated scratch objects to avoid per-frame GC pressure
  private _scratchInputVec = new THREE.Vector3();
  private _scratchDrag = new THREE.Vector3();
  private _scratchQuat = new THREE.Quaternion();
  private _scratchEuler = new THREE.Euler();
  private _scratchRotMat = new THREE.Matrix4();
  private _scratchWorldPos = new THREE.Vector3();
  private _scratchWorldQuat = new THREE.Quaternion();
  private _fwdOrigin = new THREE.Vector3();
  private _fwdDir = new THREE.Vector3();
  private _fwdRay = new THREE.Ray();
  private _camForwardDir = new THREE.Vector3();
  private _camLookAt = new THREE.Vector3();
  private _camSphereCenter = new THREE.Vector3();
  private _camTargetOnSphere = new THREE.Vector3();
  private _camVec = new THREE.Vector3();
  private _camCurrentOnSphere = new THREE.Vector3();
  private _camSlerpedVec = new THREE.Vector3();
  private _camTargetVec = new THREE.Vector3();
  private _camNewPos = new THREE.Vector3();
  private _camSmoothLookAt = new THREE.Vector3();

  inertiaTimerX: number;
  inertiaTimerY: number;
  inertiaTimerZ: number;
  lastInertiaX: number;
  lastInertiaY: number;
  lastInertiaZ: number;

  dps: number;

  /**
   * @param scene Parent scene/group used by boost effects.
   * @param dps Maximum shoot sound trigger rate.
   */
  constructor(scene: THREE.Object3D, dps = 5) {
    super();
    this.hostScene = scene;

    this.carModels = new Map();
    this.currentModel = null;

    this.ballCam = true;
    this.Up = new THREE.Vector3(0, 1, 0);
    this.forward = new THREE.Vector3(0, 0, -1);
    this.rotation.x = Math.PI / 2;

    this.boostType = 'Pulse';
    this.Boost = createBoost(scene, this.boostType) as BoostInstance;
    this.add(this.Boost as unknown as THREE.Object3D);

    this.showLine = false;
    this.showAxisOfRotationLine = true;
    this.showTorus = true;

    this.rotationVelocity = new THREE.Vector3();
    this.rotationSpeed = physics.car.rotationSpeed;
    this.maxRotationSpeed = physics.car.maxRotationSpeed;
    this.airDragCoefficient = physics.car.airDragCoefficient;
    this.rampSpeed = physics.car.rampSpeed;

    this.LookAt = new THREE.Vector3(0, 0, 0);
    this.camera = this._createCamera();

    this.forwardArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 2, 'red', 0.1, 0.1);
    this.forwardArrow.visible = this.showLine;
    this.add(this.forwardArrow);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    this._rotationLine = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 'blue' }));
    this._rotationLine.visible = false;
    this.add(this._rotationLine);

    this._torusGeometry = new THREE.TorusGeometry(0.6, 0.02, 64, 64);
    this._torusMaterial = new THREE.MeshToonMaterial({ color: 'magenta' });
    this.torus = new THREE.Mesh(this._torusGeometry, this._torusMaterial);
    this.torus.visible = false;
    this.torus.rotation.x = degToRad(90);
    this.torusDrawOnTop = false;
    this.add(this.torus);
    this._lastAxisOfRotation = null;

    this.inertiaTimerX = 0;
    this.inertiaTimerY = 0;
    this.inertiaTimerZ = 0;
    this.lastInertiaX = 0;
    this.lastInertiaY = 0;
    this.lastInertiaZ = 0;

    this.dps = dps;

    this.gun = new Gun(scene, this, dps);
    this.add(this.gun as unknown as THREE.Object3D);

    this.loadCarModel(CAR_MODELS[physics.car.body]);
  }

  private _createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(physics.camera.fov, window.innerWidth / window.innerHeight);
    camera.position.set(0, 3, 7);
    camera.lookAt(this.LookAt);
    return camera;
  }

  setTorusDrawOnTop(enable: boolean): void {
    if (!this.torus) return;
    this._torusDrawOnTop = Boolean(enable);
    this.torus.renderOrder = this._torusDrawOnTop ? 1000 : 0;
    const mat = this.torus.material as THREE.Material & { depthTest?: boolean; depthWrite?: boolean; needsUpdate?: boolean };
    if (mat) {
      mat.depthTest = !this._torusDrawOnTop;
      mat.depthWrite = !this._torusDrawOnTop;
      mat.needsUpdate = true;
    }
  }

  showForwardAxis(): void {
    this.setForwardAxisVisible(true);
  }

  hideForwardAxis(): void {
    this.setForwardAxisVisible(false);
  }

  setForwardAxisVisible(visible: boolean): void {
    this.showLine = Boolean(visible);
    if (this.forwardArrow) {
      this.forwardArrow.visible = this.showLine;
    }
  }

  showHelperDonut(): void {
    this.setHelperDonutVisible(true);
  }

  hideHelperDonut(): void {
    this.setHelperDonutVisible(false);
  }

  setHelperDonutVisible(visible: boolean): void {
    this.showTorus = Boolean(visible);
    if (this.torus) {
      this.torus.visible = this.showTorus;
    }
    if (this.showTorus && this._lastAxisOfRotation) {
      this.createHelperTorus(this._lastAxisOfRotation.clone(), this._getHelperTorusScale(this._lastAxisOfRotation));
    }
  }

  showAxisOfRotation(): void {
    this.setAxisOfRotationVisible(true);
  }

  hideAxisOfRotation(): void {
    this.setAxisOfRotationVisible(false);
  }

  setAxisOfRotationVisible(visible: boolean): void {
    this.showAxisOfRotationLine = Boolean(visible);
    if (this._rotationLine) {
      this._rotationLine.visible = this.showAxisOfRotationLine;
    }
    if (this.showAxisOfRotationLine && this._lastAxisOfRotation) {
      this.updateAxisOfRotation(this._lastAxisOfRotation.clone());
    } else if (this.torus) {
      this.torus.visible = false;
    }
  }

  changeDonutColor(color: THREE.ColorRepresentation): void {
    this._torusMaterial.color.set(color);
  }

  changeDonutScale(scale: number): void {
    if (!Number.isFinite(scale)) return;
    physics.car.torusBaseScale = Math.max(0, scale);
    if (this._lastAxisOfRotation) {
      this.createHelperTorus(this._lastAxisOfRotation.clone(), this._getHelperTorusScale(this._lastAxisOfRotation));
    }
  }

  changeBoostColor(color: THREE.ColorRepresentation): void {
    const nextColor = new THREE.Color(color);
    const hexColor = nextColor.getHex();

    if (this.Boost) {
      this.Boost.boostColour = hexColor;
    }
  }

  private _updateInertiaTimers(pitch: number, yaw: number, roll: number, dt: number): void {
    if (Math.abs(this.rotationVelocity.x) > 1e-3 && pitch === 0) {
      this.inertiaTimerX += dt;
    } else if (this.inertiaTimerX > 0) {
      this.lastInertiaX = this.inertiaTimerX;
      this.inertiaTimerX = 0;
    }

    if (Math.abs(this.rotationVelocity.y) > 1e-3 && yaw === 0) {
      this.inertiaTimerY += dt;
    } else if (this.inertiaTimerY > 0) {
      this.lastInertiaY = this.inertiaTimerY;
      this.inertiaTimerY = 0;
    }

    if (Math.abs(this.rotationVelocity.z) > 1e-3 && roll === 0) {
      this.inertiaTimerZ += dt;
    } else if (this.inertiaTimerZ > 0) {
      this.lastInertiaZ = this.inertiaTimerZ;
      this.inertiaTimerZ = 0;
    }
  }

  /**
   * Integrates one rotation step using input impulses + drag damping.
   */
  rotate(yaw: number, pitch: number, roll: number, dt: number): void {
    this._scratchInputVec.set(pitch, yaw, roll);
    if (this._scratchInputVec.lengthSq() > 1) this._scratchInputVec.normalize();

    this.rotationVelocity.x += this._scratchInputVec.x * this.rotationSpeed.x * dt;
    this.rotationVelocity.y += this._scratchInputVec.y * this.rotationSpeed.y * dt;
    this.rotationVelocity.z += this._scratchInputVec.z * this.rotationSpeed.z * dt;

    this._updateInertiaTimers(pitch, yaw, roll, dt);

    this._scratchDrag.set(this.airDragCoefficient.x, this.airDragCoefficient.y, this.airDragCoefficient.z);
    this.rotationVelocity.multiply(this._scratchDrag);
    if (this.rotationVelocity.lengthSq() < 1e-3) this.rotationVelocity.set(0, 0, 0);

    this._scratchEuler.set(
      this.rotationVelocity.x * dt,
      this.rotationVelocity.y * dt,
      -this.rotationVelocity.z * dt,
    );
    this._scratchQuat.setFromEuler(this._scratchEuler);
    this._scratchRotMat.makeRotationFromQuaternion(this._scratchQuat);

    this.matrix.multiply(this._scratchRotMat);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
    this.scale.set(1, 1, 1);

    const axis = this.findAxisOfRotation(this._scratchRotMat);
    this.updateAxisOfRotation(axis);
  }

  boost(boostHeld: boolean, dt: number): void {
    if (boostHeld) {
      this.updateMatrixWorld();
      this.getWorldPosition(this._scratchWorldPos);
      this.getWorldQuaternion(this._scratchWorldQuat);
      this.Boost.emitParticles(this._scratchWorldPos, this._scratchWorldQuat, dt);
    }

    this.Boost.updateParticles(dt);
  }

  configureBullets(options: Record<string, unknown> = {}): void {
    this.gun.configure(options);
  }

  setBulletVisualsEnabled(enabled: boolean): void {
    this.gun.setVisualsEnabled(enabled);
  }

  showBulletVisuals(): void {
    this.setBulletVisualsEnabled(true);
  }

  hideBulletVisuals(): void {
    this.setBulletVisualsEnabled(false);
  }

  enableBullets(options: Record<string, unknown> = {}): void {
    this.gun.enable(options);
  }

  disableBullets(): void {
    this.gun.disable();
  }

  setBulletsEnabled(enabled: boolean): void {
    this.gun.setEnabled(enabled);
  }

  getBulletState(): { enabled: boolean; ammo: number; maxAmmo: number } {
    return this.gun.getState();
  }

  updateBullets(dt: number, ballManager: any, fireHeld: boolean): { fired: boolean; miss: boolean } {
    return this.gun.update(dt, ballManager, fireHeld);
  }

  reloadBullets(playSound = false): void {
    this.gun.reloadNow(playSound);
  }

  /**
   * Switches boost implementation at runtime.
   */
  setBoostType(type: keyof typeof BOOST_TYPES, options: Record<string, unknown> = {}): boolean {
    if (!BOOST_TYPES[type]) {
      console.warn(`Unknown boost type: ${type}`);
      return false;
    }
    if (type === this.boostType) return true;

    if (this.Boost && typeof this.Boost.dispose === 'function') {
      this.Boost.dispose();
    }
    if (this.Boost) this.remove(this.Boost as unknown as THREE.Object3D);

    this.boostType = type;
    this.Boost = createBoost(this.parent || this.hostScene || this, this.boostType, options) as BoostInstance;
    this.add(this.Boost as unknown as THREE.Object3D);
    return true;
  }

  findAxisOfRotation(rotMat: THREE.Matrix4): THREE.Vector3 {
    const axis = new THREE.Vector3();
    const m3 = new THREE.Matrix3().setFromMatrix4(rotMat);
    const trace = m3.elements[0] + m3.elements[4] + m3.elements[8];
    const angle = Math.acos(Math.min(Math.max((trace - 1) / 2, -1), 1));

    if (angle > 1e-6) {
      axis.set(
        m3.elements[7] - m3.elements[5],
        m3.elements[2] - m3.elements[6],
        m3.elements[3] - m3.elements[1],
      );
      axis.normalize();
      if (axis.z > 0) axis.negate();
    } else {
      axis.set(0, 0, 1);
    }
    return axis;
  }

  private _getHelperTorusScale(axis: THREE.Vector3): number {
    const axisDir = axis.clone().normalize();
    const alignment = Math.abs(this.forward.dot(axisDir));
    const radius = Math.sqrt(1 - alignment * alignment);
    return radius * 1.5 * physics.car.torusBaseScale;
  }

  updateAxisOfRotation(axis: THREE.Vector3): void {
    this._lastAxisOfRotation = axis.clone();

    if (this._rotationLine) {
      const positions = this._rotationLine.geometry.attributes.position.array as Float32Array;
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;

      const end = axis.multiplyScalar(2);
      positions[3] = end.x;
      positions[4] = end.y;
      positions[5] = end.z;

      this._rotationLine.geometry.attributes.position.needsUpdate = true;
      this._rotationLine.visible = this.showAxisOfRotationLine;

      if (this.showTorus) {
        this.createHelperTorus(axis.clone(), this._getHelperTorusScale(axis));
      } else {
        this.torus.visible = false;
        this.torus.scale.setScalar(0);
      }
    }

    if (!this.showAxisOfRotationLine && this._rotationLine) {
      this._rotationLine.visible = false;
    }
  }

  createHelperTorus(axis: THREE.Vector3, scale: number): void {
    if (!this.torus) return;
    const axisDir = axis.clone().normalize();

    const center = axisDir.clone().multiplyScalar(0.9 - scale * 0.2);
    const torusUp = new THREE.Vector3(0, 0, 1);
    const torusQuat = new THREE.Quaternion();

    if (torusUp.dot(axisDir) > 0.9999) {
      torusQuat.identity();
    } else if (torusUp.dot(axisDir) < -0.9999) {
      torusQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
    } else {
      torusQuat.setFromUnitVectors(torusUp, axisDir);
    }

    this.torus.position.copy(center);
    this.torus.quaternion.copy(torusQuat);

    if (typeof scale === 'number' && isFinite(scale)) {
      this.torus.scale.setScalar(Math.max(0.01, scale));
    }

    this.torus.visible = this.showTorus;
  }

  updateVisibility(): void {
    this.setForwardAxisVisible(this.showLine);
  }

  getForwardVector(): THREE.Ray {
    this.getWorldPosition(this._fwdOrigin);
    this._fwdDir.set(0, 0, -1).applyQuaternion(this.quaternion).normalize();
    this._fwdRay.set(this._fwdOrigin, this._fwdDir);
    return this._fwdRay;
  }

  updateFov(): void {
    this.camera.fov = physics.camera.fov;
    this.camera.updateProjectionMatrix();
  }

  toggleBallCam(): void {
    this.ballCam = !this.ballCam;
  }

  setNeutralState(): void {
    this.rotationVelocity.set(0, 0, 0);
    if (this.Boost && typeof this.Boost.reset === 'function') {
      this.Boost.reset();
    }
  }

  clearBullets(): void {
    this.gun.clearBullets();
  }

  /**
   * Smoothly updates chase camera position/look target.
   */
  updateCamera(ballPosition: THREE.Vector3 | null, ballCam: boolean, dt: number): void {
    if (!ballPosition) ballCam = false;

    const alpha = ballCam ? 0.04 : 0.004;

    // sphereCenter = position + Up * camera.height
    this._camSphereCenter.copy(this.Up).multiplyScalar(physics.camera.height).add(this.position);

    if (ballCam) {
      this._camForwardDir.subVectors(ballPosition, this.position).normalize();
      this._camLookAt.copy(ballPosition);
    } else {
      this._camForwardDir.copy(this.forward).applyQuaternion(this.quaternion).normalize();
      this._camLookAt.copy(this.Up).multiplyScalar(physics.camera.height).add(this.position);
    }

    // targetOnSphere = sphereCenter - forwardDir * camera.distance
    this._camTargetOnSphere.copy(this._camForwardDir).multiplyScalar(physics.camera.distance);
    this._camTargetOnSphere.subVectors(this._camSphereCenter, this._camTargetOnSphere);

    this._camVec.subVectors(this.camera.position, this._camSphereCenter);
    if (this._camVec.lengthSq() === 0) {
      this._camVec.set(0, 0, 1);
    } else {
      this._camVec.normalize();
    }

    this._camVec.multiplyScalar(physics.camera.distance);
    this._camCurrentOnSphere.addVectors(this._camSphereCenter, this._camVec);

    this._camSlerpedVec.subVectors(this._camCurrentOnSphere, this._camSphereCenter).normalize();
    this._camTargetVec.subVectors(this._camTargetOnSphere, this._camSphereCenter).normalize();
    this._camSlerpedVec.lerp(this._camTargetVec, alpha).normalize();

    this._camNewPos.copy(this._camSlerpedVec).multiplyScalar(physics.camera.distance).add(this._camSphereCenter);
    this.camera.position.copy(this._camNewPos);

    this._camSmoothLookAt.lerpVectors(this.LookAt, this._camLookAt, alpha);
    this.camera.lookAt(this._camSmoothLookAt);
  }

  loadCarModel(modelConfig: any): boolean {
    console.log('Loading car model:', modelConfig.name);

    if (!this.carModels.has(modelConfig.name)) {
      const model = new CarModel(this.hostScene, modelConfig);
      this.carModels.set(modelConfig.name, model);
      this.add(model);

      if (!this.currentModel) {
        this.currentModel = modelConfig.name;
        return true;
      }
    }

    return false;
  }

  changeCarModel(modelName: string): boolean {
    if (this.currentModel === modelName) return true;

    if (!this.carModels.has(modelName)) {
      console.warn(`Car model ${modelName} not loaded. Loading it now...`);
      const modelConfig = Object.values(CAR_MODELS).find(config => config.name === modelName);
      if (!modelConfig) {
        console.error(`Car model ${modelName} not found in CAR_MODELS`);
        return false;
      }
      this.loadCarModel(modelConfig);
    }

    if (this.currentModel) {
      this.carModels.get(this.currentModel)!.visible = false;
    }

    this.carModels.get(modelName)!.visible = true;
    this.currentModel = modelName;
    return true;
  }

  switchCarModel(modelName: string): boolean {
    return this.changeCarModel(modelName);
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  playShootSound(dt: number): void {
    this.gun.playDefaultShootSound(dt);
  }

  playShootSoundOnce(): void {
    this.gun.playDefaultShootSoundOnce();
  }
}
