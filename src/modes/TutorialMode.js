import * as THREE from 'three';
import { Text } from 'troika-three-text';

class TutorialMode {
    constructor(options = {}) {
        this.active = false;
        this.step = 0;
        this.stepTimer = 0;
        this.ball = null;
        this._ballManager = null;
        this._car = null;
        this.score = 0;

        // UI Text
        this.sprite = null;
        this.canvas = null;
        this.ctx = null;
        this.texture = null;
        this.isDarkMode = options.darkMode || false;
    }

    _createTextSprite() {
        this.sprite = new Text();
        this.sprite.font = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf";
        this.sprite.fontSize = 1;
        this.sprite.maxWidth = 10;
        this.sprite.lineHeight = 1.15;
        this.sprite.anchorX = 'left';
        this.sprite.anchorY = 'middle';
        this.sprite.renderOrder = 999;
        this.sprite.material.depthTest = false;
        this.sprite.material.depthWrite = false;

        // Initial color
        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        this.sprite.color = isDark ? 0xffffff : 0x000000;
        this.sprite.sync();
    }

    _updateText(text) {
        if (!this.sprite) return;
        this.sprite.text = text.toUpperCase();

        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        this.sprite.color = isDark ? 0xffffff : 0x000000;

        this.sprite.sync();
    }

    start(BallManager, context = {}) {
        this._ballManager = BallManager;
        this._car = context.car || null;
        this.active = true;
        this.step = 0;
        this.stepTimer = 0;

        this.hasMoved = false;
        this.hasRolled = false;
        this.hasPointed = false;

        // Disable debugging visual helpers
        if (this._car) {
            if (typeof this._car.hideForwardAxis === 'function') this._car.hideForwardAxis();
            if (typeof this._car.hideHelperDonut === 'function') this._car.hideHelperDonut();
            if (typeof this._car.hideAxisOfRotation === 'function') this._car.hideAxisOfRotation();
        }

        // Create Ball
        if (BallManager.clear) BallManager.clear();
        this.ball = BallManager.createBall(
            new THREE.Vector3(0, 3, -15),
            2.0,
            undefined,
            { maxHealth: 1, health: 1, killEffect: 'confetti' }
        );
        if (this.ball && this.ball.ball && this.ball.ball.material) {
            this.ball.ball.material.color.set('#3459ff');
        }

        // Disable bullets until step 3
        if (this._car && typeof this._car.disableBullets === 'function') {
            this._car.disableBullets();
        }

        this._createTextSprite();
        if (this.sprite && this._ballManager) {
            this._ballManager.add(this.sprite);
        }

        this._updateStepText();
    }

    _updateStepText() {
        switch (this.step) {
            case 0: this._updateText("USE WASD OR JOYSTICK TO MOVE YOUR CAR"); break;
            case 1: this._updateText("USE Q/E OR BUMPERS TO AIR ROLL"); break;
            case 2: this._updateText("POINT THE NOSE OF THE CAR AT THE BALL"); break;
            case 3: this._updateText("SHOOT THE BALL WITH LEFT CLICK OR TRIGGERS"); break;
            case 4: this._updateText("GOOD LUCK!"); break;
            default: break;
        }
    }

    update(dt, context = {}) {
        if (!this.active) return dt;

        // Refresh text if dark mode toggled
        const currentIsDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
        if (this.isDarkMode !== currentIsDark) {
            this.isDarkMode = currentIsDark;
            this._updateStepText();
        }

        // Position sprite right of the ball from camera perspective
        if (this.ball && this.sprite) {
            this.sprite.position.copy(this.ball.position);

            if (this._car && this._car.camera) {
                // Calculate camera's "right" vector
                const cameraDirection = new THREE.Vector3();
                this._car.camera.getWorldDirection(cameraDirection);
                const right = new THREE.Vector3().crossVectors(cameraDirection, this._car.camera.up).normalize();

                // Offset text to the right in screen space
                this.sprite.position.add(right.multiplyScalar(3.5));

                // Face the camera
                this.sprite.lookAt(this._car.camera.position);
            } else {
                this.sprite.position.x += 3;
            }
        }

        if (!this._car) return dt;

        switch (this.step) {
            case 0:
                // Pitch or Yaw > 0.1
                if (this._car.rotationVelocity && (Math.abs(this._car.rotationVelocity.x) > 0.1 || Math.abs(this._car.rotationVelocity.y) > 0.1)) {
                    this.hasMoved = true;
                }
                if (this.hasMoved) {
                    this.stepTimer += dt;
                    if (this.stepTimer > 1.0) {
                        this.step = 1;
                        this.stepTimer = 0;
                        this._updateStepText();
                    }
                }
                break;
            case 1:
                // Roll > 0.1
                if (this._car.rotationVelocity && Math.abs(this._car.rotationVelocity.z) > 0.1) {
                    this.hasRolled = true;
                }
                if (this.hasRolled) {
                    this.stepTimer += dt;
                    if (this.stepTimer > 1.0) {
                        this.step = 2;
                        this.stepTimer = 0;
                        this._updateStepText();
                    }
                }
                break;
            case 2:
                // Point nose at ball
                if (this._car.getForwardVector && this.ball) {
                    const forwardRay = this._car.getForwardVector();
                    const toBall = new THREE.Vector3().subVectors(this.ball.position, forwardRay.origin).normalize();
                    if (forwardRay.direction.dot(toBall) > 0.92) {
                        this.hasPointed = true;
                    }
                }
                if (this.hasPointed) {
                    this.stepTimer += dt;
                    if (this.stepTimer > 1.0) {
                        this.step = 3;
                        this.stepTimer = 0;
                        this._updateStepText();
                        // Enable bullets
                        if (this._car.enableBullets) {
                            this._car.enableBullets({ ammo: Infinity, cooldownSeconds: 0.1, reloadSeconds: 1, speed: 100, range: 200, damage: 1 });
                            if (this._car.setBulletVisualsEnabled) this._car.setBulletVisualsEnabled(true);
                        }
                    }
                }
                break;
            case 3:
                // Handled in onHit/onKill
                break;
            case 4:
                // Complete
                break;
        }

        return dt;
    }

    onHit(ball) { }
    onMiss() { }

    onKill(ball) {
        if (!this.active) return;
        if (this.step === 3) {
            this.step = 4;
            this._updateStepText();
            this.score = 100; // Trigger a state update
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('tutorial-complete'));
                }
            }, 3000);
        }
    }

    stop() {
        this.active = false;
        if (this.sprite && this._ballManager) {
            this._ballManager.remove(this.sprite);
            this.sprite.dispose();
        }
    }
}

export default TutorialMode;
