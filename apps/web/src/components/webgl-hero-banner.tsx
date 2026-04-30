"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Image from "next/image";

const CONFETTI_CONFIG = {
  particleCount: 35,
  durationSeconds: 1.1,
  gravity: 7.8,
  startOffsetMin: 0.01,
  startOffsetMax: 0.08,
  speedMin: 7.2,
  speedMax: 15.2,
  sizeMin: 20,
  sizeMax: 30,
  halfHeightMin: 0.09,
  halfHeightMax: 0.2,
  halfWidth: 0.8,
  spinMaxAbs: 2.0,
  hueMin: 0.0,
  hueMax: 1.0,
  saturation: 1.0,
  lightness: 0.5,
  pointScale: 400.0,
};


const VERT_SHADER = `
attribute vec3 aVelocity;
attribute vec3 aColor;
attribute float aSize;
attribute float aAngle;
attribute float aSpin;
attribute float aHalfHeight;
uniform float uTime;
uniform float uGravity;
uniform float uDuration;
uniform float uPointScale;
varying vec3 vColor;
varying float vFade;
varying float vAngle;
varying float vHalfHeight;

void main() {
    float t = max(0.0, uTime);
    vec3 p = position + aVelocity * t + vec3(0.0, -0.5 * uGravity * t * t, 0.0);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    gl_PointSize = aSize * (uPointScale / -mvPosition.z);
    vFade = max(0.0, 1.0 - t / max(0.0001, uDuration));
    vColor = aColor;
    vAngle = aAngle + aSpin * t;
    vHalfHeight = aHalfHeight;
}
`;

const FRAG_SHADER = `
varying vec3 vColor;
varying float vFade;
varying float vAngle;
varying float vHalfHeight;
uniform float uHalfWidth;

void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float c = cos(vAngle);
    float s = sin(vAngle);
    vec2 ruv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

    float halfWidth = uHalfWidth;
    float halfHeight = clamp(vHalfHeight, 0.08, 0.28);
    if (abs(ruv.x) > halfWidth || abs(ruv.y) > halfHeight) discard;

    float alpha = vFade;
    gl_FragColor = vec4(vColor, alpha);
}
`;

export function WebGLHeroBanner() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    // Transparent background

    // Camera
    const camera = new THREE.PerspectiveCamera(15, width / height, 0.1, 100);
    camera.position.z = 60;
    camera.position.x = -3;
    camera.position.y = -2.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (mountRef.current) {
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00ffaa, 20, 50);
    pointLight.position.set(-10, 5, 5);
    scene.add(pointLight);

    const rimLight = new THREE.PointLight(0xff0055, 15, 50);
    rimLight.position.set(10, -5, -5);
    scene.add(rimLight);

    // Balls
    interface BallData {
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      offsetX: number;
      offsetY: number;
      velocity: THREE.Vector3;
      isDragging: boolean;
      targetPos: THREE.Vector3;
      isRespawning: boolean;
      respawnProgress: number;
      easterEggPos?: THREE.Vector3;
      baseScale: number;
    }

    const balls: BallData[] = [];
    const geometry = new THREE.SphereGeometry(1, 48, 48); // Smoother spheres
    const colors = ["#ff0055", "#00ffaa", "#00f7ff", "#0004ff", "#ff00bf", "#00ff08", "#ff0077", "#0084ff", "#ffcc00", "#ff6a00"];

    const createBall = (isInitial = false) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 1.0,
        metalness: 0.1,
        // emissive: new THREE.Color(color),
        // emissiveIntensity: 2.5,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Final target position (reduced boundary by 20%)
      const baseX = (Math.random() - 0.5) * 24;
      const baseY = (Math.random() - 0.5) * 16;
      const baseZ = (Math.random() - 0.5) * 8;

      // Start position: if initial, random within view. If respawn, far away.
      if (isInitial) {
        mesh.position.set(baseX, baseY, baseZ);
      } else {
        // Spawn far back and to the side
        mesh.position.set(
          baseX + (Math.random() - 0.5) * 50,
          baseY + (Math.random() - 0.5) * 50,
          -60 // Start far behind
        );
      }

      const scale = 1 + Math.random();
      mesh.scale.set(scale, scale, scale);

      scene.add(mesh);

      balls.push({
        mesh,
        baseX,
        baseY,
        baseZ,
        offsetX: Math.random() * Math.PI * 2,
        offsetY: Math.random() * Math.PI * 2,
        velocity: new THREE.Vector3(),
        isDragging: false,
        targetPos: new THREE.Vector3(),
        isRespawning: !isInitial,
        respawnProgress: 0,
        baseScale: scale,
      });
    };

    for (let i = 0; i < 10; i++) {
      createBall(true);
    }

    // Raycaster for clicking and dragging
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let draggedBall: typeof balls[0] | null = null;
    let dragStartPos = new THREE.Vector2();
    let isClicking = false;
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectionPoint = new THREE.Vector3();

    const getMousePosition = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in event) {
        clientX = (event as TouchEvent).touches[0].clientX;
        clientY = (event as TouchEvent).touches[0].clientY;
      } else {
        clientX = (event as MouseEvent).clientX;
        clientY = (event as MouseEvent).clientY;
      }
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return { clientX, clientY };
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      // If clicking UI, don't try to drag balls
      if (event.target instanceof HTMLElement && (event.target.closest('button') || event.target.closest('a') || event.target.closest('.pointer-events-auto'))) {
        return;
      }

      const { clientX, clientY } = getMousePosition(event);

      // Only left click for mouse
      if (event instanceof MouseEvent && event.button !== 0) return;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(balls.map((b) => b.mesh));

      if (intersects.length > 0) {
        // Hit a ball! Prevent the click from reaching UI elements below
        event.stopPropagation();

        const hitMesh = intersects[0].object as THREE.Mesh;
        const ball = balls.find(b => b.mesh === hitMesh);
        if (ball) {
          draggedBall = ball;
          draggedBall.isDragging = true;
          // Initialize targetPos to the ball's CURRENT position so there's
          // zero force applied until the user actually moves the mouse
          draggedBall.targetPos.copy(draggedBall.mesh.position);
          dragPlane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 0, 1),
            draggedBall.mesh.position
          );
          dragStartPos.set(clientX, clientY);
          isClicking = true;
        }
      }
    };

    const onPointerMove = (event: MouseEvent | TouchEvent) => {
      const { clientX, clientY } = getMousePosition(event);
      raycaster.setFromCamera(mouse, camera);

      if (draggedBall) {
        if (event.cancelable) event.preventDefault();

        if (isClicking && dragStartPos.distanceTo(new THREE.Vector2(clientX, clientY)) > 5) {
          isClicking = false;
        }

        if (raycaster.ray.intersectPlane(dragPlane, intersectionPoint)) {
          draggedBall.targetPos.copy(intersectionPoint);
        }
      } else {
        // Change cursor when hovering over a ball
        const intersects = raycaster.intersectObjects(balls.map((b) => b.mesh));
        if (intersects.length > 0) {
          document.body.style.cursor = 'grab';
        } else {
          document.body.style.cursor = '';
        }
      }
    };

    const popBall = (ball: BallData) => {
      scene.remove(ball.mesh);
      const idx = balls.indexOf(ball);
      if (idx > -1) balls.splice(idx, 1);

      createExplosion(ball.mesh.position, ball.mesh.scale.x);

      // Cleanup GPU resources
      if (ball.mesh.material instanceof THREE.Material) {
        ball.mesh.material.dispose();
      }

      // Respawn a new one after a short delay
      setTimeout(() => {
        if (balls.length < 10) createBall(false);
      }, 500);
    };

    const onPointerUp = () => {
      if (draggedBall) {
        if (isClicking) {
          popBall(draggedBall);
        } else {
          draggedBall.isDragging = false;
        }
        draggedBall = null;
      }
    };

    window.addEventListener("mousedown", onPointerDown, { capture: true });
    window.addEventListener("mousemove", onPointerMove, { capture: true });
    window.addEventListener("mouseup", onPointerUp, { capture: true });

    window.addEventListener("touchstart", onPointerDown, { passive: false, capture: true });
    window.addEventListener("touchmove", onPointerMove, { passive: false, capture: true });
    window.addEventListener("touchend", onPointerUp, { capture: true });

    let easterEggActive = false;
    let easterEggTimer = 0;

    const handleEasterEgg = () => {
      if (easterEggActive) return;
      easterEggActive = true;
      easterEggTimer = 0;

      const coords = [
        { x: 0, y: 2 },
        { x: 0, y: 1 }, { x: 1, y: 1 },
        { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: -1, y: -1 }, { x: 0, y: -1 },
        { x: 0, y: -2 }
      ];
      const spacing = 4;

      // Ensure we have exactly 10 balls for the pattern
      while (balls.length < 10) {
        createBall(true);
      }

      for (let i = 0; i < 10; i++) {
        if (balls[i]) {
          balls[i].easterEggPos = new THREE.Vector3(coords[i].x * spacing, coords[i].y * spacing, -20);
        }
      }
    };

    window.addEventListener('trigger-easter-egg', handleEasterEgg);

    // Confetti systems
    const confettiSystems: { points: THREE.Points; material: THREE.ShaderMaterial; startTime: number; duration: number }[] = [];

    const createExplosion = (position: THREE.Vector3, radius: number) => {
      const particleCount = CONFETTI_CONFIG.particleCount;
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const angles = new Float32Array(particleCount);
      const spins = new Float32Array(particleCount);
      const halfHeights = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const x = (Math.random() - 0.5) * 2;
        const y = (Math.random() - 0.5) * 2;
        const z = (Math.random() - 0.5) * 2;
        const len = Math.hypot(x, y, z) || 1;
        const nx = x / len;
        const ny = y / len;
        const nz = z / len;

        const startOffset = CONFETTI_CONFIG.startOffsetMin + Math.random() * (CONFETTI_CONFIG.startOffsetMax - CONFETTI_CONFIG.startOffsetMin);
        positions[i3] = nx * startOffset;
        positions[i3 + 1] = ny * startOffset;
        positions[i3 + 2] = nz * startOffset;

        const speed = CONFETTI_CONFIG.speedMin + Math.random() * (CONFETTI_CONFIG.speedMax - CONFETTI_CONFIG.speedMin);
        velocities[i3] = nx * speed * radius * 0.4;
        velocities[i3 + 1] = ny * speed * radius * 0.4;
        velocities[i3 + 2] = nz * speed * radius * 0.4;

        const hue = Math.random(); // Full rainbow range
        const c = new THREE.Color().setHSL(hue, 1.0, 0.5);
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;

        sizes[i] = CONFETTI_CONFIG.sizeMin + Math.random() * (CONFETTI_CONFIG.sizeMax - CONFETTI_CONFIG.sizeMin);
        angles[i] = Math.random() * 6.283185307;
        spins[i] = (Math.random() - 0.5) * (2 * CONFETTI_CONFIG.spinMaxAbs);
        halfHeights[i] = CONFETTI_CONFIG.halfHeightMin + Math.random() * (CONFETTI_CONFIG.halfHeightMax - CONFETTI_CONFIG.halfHeightMin);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));
      geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geom.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
      geom.setAttribute('aSpin', new THREE.BufferAttribute(spins, 1));
      geom.setAttribute('aHalfHeight', new THREE.BufferAttribute(halfHeights, 1));

      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT_SHADER,
        fragmentShader: FRAG_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uGravity: { value: CONFETTI_CONFIG.gravity },
          uDuration: { value: CONFETTI_CONFIG.durationSeconds },
          uPointScale: { value: CONFETTI_CONFIG.pointScale },
          uHalfWidth: { value: CONFETTI_CONFIG.halfWidth },
        },
      });

      const points = new THREE.Points(geom, mat);
      points.position.copy(position);
      points.frustumCulled = false;
      scene.add(points);

      confettiSystems.push({
        points,
        material: mat,
        startTime: performance.now(),
        duration: CONFETTI_CONFIG.durationSeconds
      });
    };

    // Animation Loop
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 16; // approx 60fps delta

      if (easterEggActive) {
        easterEggTimer += 16;
        if (easterEggTimer > 8000) {
          easterEggActive = false;
        }
      } else {
        // Randomly trigger the easter egg (approx every ~45-90 seconds)
        if (Math.random() < 0.00025) {
          handleEasterEgg();
        }
      }

      // Ball collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const b1 = balls[i];
          const b2 = balls[j];
          const dist = b1.mesh.position.distanceTo(b2.mesh.position);
          const r1 = b1.mesh.scale.x;
          const r2 = b2.mesh.scale.x;
          if (dist < r1 + r2) {
            const normal = new THREE.Vector3().subVectors(b1.mesh.position, b2.mesh.position).normalize();
            const relativeVelocity = new THREE.Vector3().subVectors(b1.velocity, b2.velocity);
            const velocityAlongNormal = relativeVelocity.dot(normal);

            if (velocityAlongNormal < 0) {
              const restitution = 0.7;
              const impulseScalar = -(1 + restitution) * velocityAlongNormal;
              const impulse = normal.clone().multiplyScalar(impulseScalar / 2);
              b1.velocity.add(impulse);
              b2.velocity.sub(impulse);

              // Move apart to prevent sticking
              const overlap = (r1 + r2 - dist) * 0.5;
              b1.mesh.position.add(normal.clone().multiplyScalar(overlap));
              b2.mesh.position.sub(normal.clone().multiplyScalar(overlap));
            }
          }
        }
      }

      // Float and drag balls
      balls.forEach((ball) => {
        // Low chance of random explosion (approx 0.005% per frame)
        if (!ball.isDragging && !ball.isRespawning && !easterEggActive && Math.random() < 0.00005) {
          popBall(ball);
          return;
        }

        if (ball.isDragging) {
          const force = new THREE.Vector3().subVectors(ball.targetPos, ball.mesh.position);
          force.multiplyScalar(0.1);
          ball.velocity.add(force);
          ball.velocity.multiplyScalar(0.8);
        } else if (ball.isRespawning) {
          // Smooth transition from off-screen
          ball.respawnProgress += 0.01;
          const target = new THREE.Vector3(ball.baseX, ball.baseY, ball.baseZ);
          ball.mesh.position.lerp(target, 0.02);

          if (ball.mesh.position.distanceTo(target) < 0.1 || ball.respawnProgress > 1.0) {
            ball.isRespawning = false;
          }
          ball.velocity.set(0, 0, 0);
        } else if (easterEggActive && ball.easterEggPos) {
          const force = new THREE.Vector3().subVectors(ball.easterEggPos, ball.mesh.position);
          force.multiplyScalar(0.015);
          ball.velocity.add(force);
          ball.velocity.multiplyScalar(0.92);
        } else {
          // Space floating (slow wander, very low friction)
          const wanderForceX = Math.cos(time * 0.0001 + ball.offsetX) * 0.0003;
          const wanderForceY = Math.sin(time * 0.0001 + ball.offsetY) * 0.0003;
          ball.velocity.x += wanderForceX;
          ball.velocity.y += wanderForceY;

          const springX = (ball.baseX - ball.mesh.position.x) * 0.00015;
          const springY = (ball.baseY - ball.mesh.position.y) * 0.00015;
          const springZ = (ball.baseZ - ball.mesh.position.z) * 0.00015;
          ball.velocity.x += springX;
          ball.velocity.y += springY;
          ball.velocity.z += springZ;

          ball.velocity.multiplyScalar(0.995);
        }

        ball.mesh.position.add(ball.velocity);

        // Rotation based on movement
        const speedSq = ball.velocity.lengthSq();
        ball.mesh.rotation.x += 0.001 + speedSq * 0.05;
        ball.mesh.rotation.y += 0.001 + speedSq * 0.05;

        // Scale lerping for easter egg
        const targetScale = (easterEggActive && ball.easterEggPos) ? 1.4 : ball.baseScale;
        const s = THREE.MathUtils.lerp(ball.mesh.scale.x, targetScale, 0.03);
        ball.mesh.scale.setScalar(s);
      });

      // Update confetti
      const now = performance.now();
      for (let i = confettiSystems.length - 1; i >= 0; i--) {
        const sys = confettiSystems[i];
        const elapsed = (now - sys.startTime) / 1000;
        sys.material.uniforms.uTime.value = elapsed;

        if (elapsed >= sys.duration) {
          scene.remove(sys.points);
          sys.points.geometry.dispose();
          confettiSystems.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", onPointerDown, { capture: true });
      window.removeEventListener("mousemove", onPointerMove, { capture: true });
      window.removeEventListener("mouseup", onPointerUp, { capture: true });
      window.removeEventListener("touchstart", onPointerDown, { capture: true });
      window.removeEventListener("touchmove", onPointerMove, { capture: true });
      window.removeEventListener("touchend", onPointerUp, { capture: true });
      window.removeEventListener('trigger-easter-egg', handleEasterEgg as EventListener);
      document.body.style.cursor = '';

      confettiSystems.forEach((sys) => {
        scene.remove(sys.points);
        sys.points.geometry.dispose();
        if (sys.points.material instanceof THREE.Material) {
          sys.points.material.dispose();
        }
      });

      balls.forEach(ball => {
        scene.remove(ball.mesh);
        if (ball.mesh.material instanceof THREE.Material) {
          ball.mesh.material.dispose();
        }
      });
      geometry.dispose();

      cancelAnimationFrame(animationFrameId);
      renderer.forceContextLoss();
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentElement === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial check
    setDarkMode(document.documentElement.classList.contains("dark"));

    // Observe changes to the 'dark' class on <html>
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);


  return (
    <>
      <div className="fixed inset-0 w-full h-full z-[-1] pointer-events-none overflow-hidden">
        <div ref={mountRef} className="absolute inset-0 w-full h-full opacity-60" style={{ filter: 'blur(26px) saturate(2) brightness(2)' }} />
      </div>

      <div className="relative w-full py-24 px-4 flex flex-col items-center justify-center text-center pointer-events-none select-none">
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out fill-mode-forwards">
          {/* Adaptive Glass Badge Move this down */}
          <div className="relative z-10 translate-y-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/40">Directional Air Lab v2.0</span>
          </div>
          <div
            className="flex justify-center items-center mt-0 mb-8 w-full px-4 pointer-events-auto "
          >
            <Image
              src={darkMode ? "/icons/logo-white.png" : "/icons/logo-black.png"}
              alt="airdribble logo"
              width={1000}
              height={300}
              className="w-full max-w-[850px] h-auto object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] dark:drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              priority
            />
          </div>

          {/* Adaptive Divider */}
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent mx-auto mb-2 mt-[-1rem]" />

          <p className="max-w-xl mx-auto text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8">
            The next generation of high-fidelity target practice.
            <br />
            <span className="text-zinc-800 dark:text-zinc-200">Interact with the environment to begin.</span>
          </p>
        </div>
      </div>
    </>
  );
}
