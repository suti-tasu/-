import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

// 3D Hexagon Layout Constants
const HEX_RADIUS = 1.0; // Circumradius of hexagon
const BLOCK_HEIGHT = 0.75; // Thickness of ice block
const BOARD_RADIUS = 3; // q, r range: -3 to +3

// Axial (q, r) to 3D (X, Z) coordinate transformation
// Pointy-topped hexagon: vertices at 30, 90, 150, 210, 270, 330 deg
export const hexTo3D = (q, r) => {
  const x = HEX_RADIUS * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const z = HEX_RADIUS * (1.5 * r);
  return { x, z };
};

export const CrashIce3DCanvas = ({
  board, // G.board: { "q,r": { color } }
  penguinPos, // G.penguinPos: "0,0" or null
  winner, // G.winner
  selectedBlockKey, // "q,r" or null
  onSelectBlock, // (key) => void
  onMovePenguin, // (key) => void
  strikeTarget, // { key, power, id } trigger for hammer swing animation
  lastDroppedKeys, // string[]
  canInteract, // boolean
  allowedColor, // 'white' | 'blue' | 'any' | 'penguin' | null
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Three.js and Cannon refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cannonWorldRef = useRef(null);

  // Mesh registries
  const blocksMeshMapRef = useRef(new Map()); // key -> THREE.Mesh
  const fallingBodiesRef = useRef([]); // { mesh, body, startTime }
  const penguinGroupRef = useRef(null);
  const penguinBodyRef = useRef(null);
  const hammerMeshRef = useRef(null);
  const particlesRef = useRef([]); // ice shards

  // Hover state
  const hoveredBlockKeyRef = useRef(null);
  const [hoveredKey, setHoveredKey] = useState(null);

  // Default camera position
  const defaultCamPos = new THREE.Vector3(0, 15, 13);
  const defaultCamTarget = new THREE.Vector3(0, 0, 0);

  // Camera presets
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    
    // Smooth transition
    let progress = 0;
    const startPos = cam.position.clone();
    const startTarget = ctrl.target.clone();

    const anim = () => {
      progress += 0.05;
      cam.position.lerpVectors(startPos, defaultCamPos, progress);
      ctrl.target.lerpVectors(startTarget, defaultCamTarget, progress);
      ctrl.update();
      if (progress < 1) {
        requestAnimationFrame(anim);
      }
    };
    anim();
  }, []);

  const setCameraView = useCallback((type) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    ctrl.target.set(0, 0, 0);

    if (type === 'top') {
      cam.position.set(0, 20, 0.01);
    } else if (type === 'iso') {
      cam.position.set(10, 13, 10);
    } else if (type === 'front') {
      cam.position.set(0, 8, 16);
    }
    ctrl.update();
  }, []);

  // 1. Initialize Three.js Scene, Cannon World, Lights, Table Frame
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 520;

    // --- Three.js Scene ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0c192c); // Deep icy arctic atmosphere
    scene.fog = new THREE.FogExp2(0x0c192c, 0.025);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultCamTarget);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 6;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Allow viewing slightly from below rim
    controls.target.copy(defaultCamTarget);
    controlsRef.current = controls;

    // --- Cannon.js Physics World ---
    const world = new CANNON.World();
    world.gravity.set(0, -32, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    cannonWorldRef.current = world;

    // --- Lighting ---
    // Ambient / Hemisphere light (Ice reflections)
    const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x1e293b, 0.7);
    scene.add(hemiLight);

    // Main Directional Sun Light (Casts crisp shadows)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(12, 22, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 10;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Blue Rim/Accent Light from opposite side
    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueRimLight.position.set(-10, 10, -12);
    scene.add(blueRimLight);

    // Soft Point Light over the center ice
    const pointLight = new THREE.PointLight(0xe0f2fe, 0.8, 15);
    pointLight.position.set(0, 4, 0);
    scene.add(pointLight);

    // --- Environment / Snug Table Frame Construction ---
    const tableGroup = createSnugTableGroup();
    scene.add(tableGroup);

    // --- 3D Penguin Model Construction ---
    const penguinGroup = createPenguinMesh();
    penguinGroup.position.set(0, BLOCK_HEIGHT / 2, 0);
    scene.add(penguinGroup);
    penguinGroupRef.current = penguinGroup;

    // --- 3D Hammer Model Construction ---
    const hammer = createHammerMesh();
    hammer.visible = false;
    scene.add(hammer);
    hammerMeshRef.current = hammer;

    // --- Resize Handler ---
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Animation & Physics Loop ---
    let reqId;
    let lastTime = performance.now();

    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const time = performance.now();
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const elapsedTime = clock.getElapsedTime();

      // Step Cannon Physics
      world.step(1 / 60, dt, 3);

      // Update Falling Blocks
      for (let i = fallingBodiesRef.current.length - 1; i >= 0; i--) {
        const item = fallingBodiesRef.current[i];
        item.mesh.position.copy(item.body.position);
        item.mesh.quaternion.copy(item.body.quaternion);

        // Despawn once deep in abyss
        if (item.mesh.position.y < -15 || (time - item.startTime > 3500)) {
          scene.remove(item.mesh);
          world.removeBody(item.body);
          fallingBodiesRef.current.splice(i, 1);
        }
      }

      // Update Falling Penguin if active
      if (penguinBodyRef.current && penguinGroupRef.current) {
        penguinGroupRef.current.position.copy(penguinBodyRef.current.position);
        penguinGroupRef.current.quaternion.copy(penguinBodyRef.current.quaternion);
      } else if (penguinGroupRef.current) {
        // Cute subtle idle wobble when standing safely
        penguinGroupRef.current.rotation.y = Math.sin(elapsedTime * 2.5) * 0.08;
        penguinGroupRef.current.position.y = BLOCK_HEIGHT / 2 + Math.abs(Math.sin(elapsedTime * 4)) * 0.03;
      }

      // Update Ice Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.mesh.position.add(p.velocity);
        p.velocity.y -= 0.015; // Gravity
        p.mesh.rotation.x += p.rotSpeed.x;
        p.mesh.rotation.y += p.rotSpeed.y;
        p.mesh.scale.multiplyScalar(0.96); // Fade shrink

        if (p.mesh.scale.x < 0.02 || p.mesh.position.y < -4) {
          scene.remove(p.mesh);
          particlesRef.current.splice(i, 1);
        }
      }

      // Highlight pulse on hovered/selected block
      blocksMeshMapRef.current.forEach((mesh, key) => {
        const isHovered = key === hoveredBlockKeyRef.current;
        const isSelected = key === selectedBlockKey;

        if (isSelected) {
          const pulse = (Math.sin(elapsedTime * 8) + 1) * 0.5;
          mesh.material.emissive.setHex(0xf59e0b); // Golden amber
          mesh.material.emissiveIntensity = 0.4 + pulse * 0.4;
          mesh.position.y = 0.12 + Math.sin(elapsedTime * 6) * 0.04;
        } else if (isHovered) {
          mesh.material.emissive.setHex(0x38bdf8); // Bright cyan glow
          mesh.material.emissiveIntensity = 0.5;
          mesh.position.y = 0.08;
        } else {
          mesh.material.emissive.setHex(mesh.userData.baseEmissive);
          mesh.material.emissiveIntensity = mesh.userData.baseEmissiveIntensity;
          mesh.position.y = 0;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // 2. Synchronize Ice Blocks with `board`
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Cylinder geometry with 6 segments, naturally oriented for pointy-topped axial grid
    const hexGeo = new THREE.CylinderGeometry(
      HEX_RADIUS * 0.988,
      HEX_RADIUS * 0.988,
      BLOCK_HEIGHT,
      6
    );

    const currentKeys = new Set(Object.keys(board));
    const existingKeys = new Set(blocksMeshMapRef.current.keys());

    // Check newly fallen blocks (keys in existingKeys but not in currentKeys)
    existingKeys.forEach(key => {
      if (!currentKeys.has(key)) {
        const mesh = blocksMeshMapRef.current.get(key);
        if (mesh) {
          // Convert mesh to Cannon.js dynamic rigid body for physical fall
          spawnPhysicsFallingBlock(mesh, strikeTarget?.power || 50);
          blocksMeshMapRef.current.delete(key);
        }
      }
    });

    // Check added or updated blocks
    currentKeys.forEach(key => {
      const blockData = board[key];
      const [q, r] = key.split(',').map(Number);
      const { x, z } = hexTo3D(q, r);

      let mesh = blocksMeshMapRef.current.get(key);

      if (!mesh) {
        // Create new 3D ice block
        const isBlue = blockData.color === 'blue';
        const mat = new THREE.MeshStandardMaterial({
          color: isBlue ? 0x38bdf8 : 0xf0fdfa,
          roughness: isBlue ? 0.12 : 0.28,
          metalness: 0.08,
          transparent: true,
          opacity: isBlue ? 0.90 : 0.95,
        });

        mesh = new THREE.Mesh(hexGeo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
          key,
          q,
          r,
          color: blockData.color,
          baseEmissive: isBlue ? 0x0284c7 : 0xccfbf1,
          baseEmissiveIntensity: 0.12
        };

        mesh.position.set(x, 0, z);
        scene.add(mesh);
        blocksMeshMapRef.current.set(key, mesh);
      } else {
        // Update position if needed
        mesh.position.set(x, 0, z);
      }
    });
  }, [board]);

  // 3. Handle Penguin Position & Fall
  useEffect(() => {
    const scene = sceneRef.current;
    const world = cannonWorldRef.current;
    const penguin = penguinGroupRef.current;
    if (!scene || !penguin) return;

    if (penguinPos) {
      // Standing safely on ice
      const [q, r] = penguinPos.split(',').map(Number);
      const { x, z } = hexTo3D(q, r);
      penguin.position.set(x, BLOCK_HEIGHT / 2, z);
      penguin.rotation.set(0, 0, 0);

      // Clean up physics body if reset
      if (penguinBodyRef.current && world) {
        world.removeBody(penguinBodyRef.current);
        penguinBodyRef.current = null;
      }
    } else {
      // Penguin has FALLEN! Convert to Cannon rigid body for tumbling plunge
      if (!penguinBodyRef.current && world) {
        const body = new CANNON.Body({
          mass: 2.0,
          shape: new CANNON.Sphere(0.45),
          position: new CANNON.Vec3(penguin.position.x, penguin.position.y, penguin.position.z),
          velocity: new CANNON.Vec3((Math.random() - 0.5) * 2, -6, (Math.random() - 0.5) * 2),
          angularVelocity: new CANNON.Vec3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 8
          )
        });
        world.addBody(body);
        penguinBodyRef.current = body;

        // Burst ice shards at penguin's location
        spawnIceParticles(penguin.position.x, penguin.position.y, penguin.position.z, 20);
      }
    }
  }, [penguinPos]);

  // 4. Hammer Swing Animation on Strike
  useEffect(() => {
    if (!strikeTarget || !strikeTarget.key) return;
    const [q, r] = strikeTarget.key.split(',').map(Number);
    const { x, z } = hexTo3D(q, r);
    const hammer = hammerMeshRef.current;
    if (!hammer) return;

    hammer.visible = true;
    hammer.position.set(x + 0.8, 4.0, z + 0.8);
    hammer.rotation.set(-0.6, 0.4, 0.5);

    const startTime = performance.now();
    const duration = 280; // Fast impact swing

    const swingAnim = () => {
      const now = performance.now();
      const progress = Math.min((now - startTime) / duration, 1.0);

      if (progress < 0.75) {
        // Downward swing
        const p = progress / 0.75;
        hammer.position.set(
          THREE.MathUtils.lerp(x + 0.8, x + 0.1, p),
          THREE.MathUtils.lerp(4.0, BLOCK_HEIGHT + 0.3, p * p),
          THREE.MathUtils.lerp(z + 0.8, z + 0.1, p)
        );
        hammer.rotation.set(
          THREE.MathUtils.lerp(-0.6, 0.2, p),
          THREE.MathUtils.lerp(0.4, 0.0, p),
          THREE.MathUtils.lerp(0.5, -0.4, p)
        );
      } else {
        // Recoil and fade
        const p = (progress - 0.75) / 0.25;
        hammer.position.y = BLOCK_HEIGHT + 0.3 + p * 0.8;
        if (p === 0) {
          // Impact burst scales with applied force!
          const powerRatio = (strikeTarget?.power || 50) / 100;
          const count = Math.round(8 + powerRatio * 20);
          spawnIceParticles(x, BLOCK_HEIGHT / 2, z, count);
        }
      }

      if (progress < 1.0) {
        requestAnimationFrame(swingAnim);
      } else {
        hammer.visible = false;
      }
    };

    swingAnim();
  }, [strikeTarget]);

  // Spawn Physics Rigid Body for Falling Ice Block
  const spawnPhysicsFallingBlock = (mesh, power) => {
    const world = cannonWorldRef.current;
    if (!world) return;

    // Calculate initial downward velocity and random tumble based on hit power
    const powerRatio = power / 100;
    const vy = -6 - powerRatio * 10;
    const body = new CANNON.Body({
      mass: 1.0,
      shape: new CANNON.Cylinder(HEX_RADIUS * 0.95, HEX_RADIUS * 0.95, BLOCK_HEIGHT, 6),
      position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
      velocity: new CANNON.Vec3(
        (Math.random() - 0.5) * 3 * (powerRatio + 0.3),
        vy,
        (Math.random() - 0.5) * 3 * (powerRatio + 0.3)
      ),
      angularVelocity: new CANNON.Vec3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 12
      )
    });

    world.addBody(body);
    fallingBodiesRef.current.push({
      mesh,
      body,
      startTime: performance.now()
    });
  };

  // Spawn Sparkling Ice Particles
  const spawnIceParticles = (x, y, z, count = 12) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const shardGeo = new THREE.DodecahedronGeometry(0.08);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.3
    });

    for (let i = 0; i < count; i++) {
      const pMesh = new THREE.Mesh(shardGeo, shardMat);
      pMesh.position.set(
        x + (Math.random() - 0.5) * 0.4,
        y + 0.2 + Math.random() * 0.3,
        z + (Math.random() - 0.5) * 0.4
      );
      scene.add(pMesh);

      particlesRef.current.push({
        mesh: pMesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.16,
          0.12 + Math.random() * 0.18,
          (Math.random() - 0.5) * 0.16
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )
      });
    }
  };

  // 5. Raycasting for Mouse/Touch Interaction
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const getIntersectedBlockKey = (event) => {
    if (!cameraRef.current || !rendererRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return null;

    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const meshes = Array.from(blocksMeshMapRef.current.values());
    const intersects = raycaster.current.intersectObjects(meshes);

    if (intersects.length > 0) {
      return intersects[0].object.userData.key;
    }
    return null;
  };

  const handlePointerMove = (e) => {
    const key = getIntersectedBlockKey(e);
    if (key !== hoveredBlockKeyRef.current) {
      hoveredBlockKeyRef.current = key;
      setHoveredKey(key);
    }
  };

  const handlePointerLeave = () => {
    hoveredBlockKeyRef.current = null;
    setHoveredKey(null);
  };

  const handlePointerDown = (e) => {
    if (!canInteract) return;
    const key = getIntersectedBlockKey(e);
    if (!key) return;

    const blockData = board[key];
    if (!blockData) return;

    // Check penguin interaction mode
    if (allowedColor === 'penguin') {
      if (onMovePenguin) onMovePenguin(key);
      return;
    }

    // Check color restriction
    if (allowedColor === 'white' && blockData.color !== 'white') return;
    if (allowedColor === 'blue' && blockData.color !== 'blue') return;

    // Cannot hit block directly underneath penguin
    if (penguinPos === key) return;

    if (onSelectBlock) {
      onSelectBlock(key);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '520px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.7), 0 8px 32px rgba(12, 25, 44, 0.5)',
        background: '#0c192c',
        touchAction: 'none',
        userSelect: 'none'
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* 3D Camera Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <button
          onClick={resetCamera}
          title="初期視点にリセット"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#e0f2fe',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🔄 視点リセット
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setCameraView('top')}
            title="真上からの見下ろし"
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#94a3b8',
              padding: '4px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            真上
          </button>
          <button
            onClick={() => setCameraView('iso')}
            title="斜め見下ろし"
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#94a3b8',
              padding: '4px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            斜め
          </button>
          <button
            onClick={() => setCameraView('front')}
            title="正面アングル"
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#94a3b8',
              padding: '4px 6px',
              borderRadius: '6px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            正面
          </button>
        </div>
      </div>

      {/* Floating 3D Interaction Guide */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94a3b8',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          pointerEvents: 'none',
          display: 'flex',
          gap: '8px'
        }}
      >
        <span>🖱️ ドラッグ: 360°回転</span>
        <span>🔍 ホイール: ズーム</span>
        <span>🎯 クリック: 氷を選択</span>
      </div>

      {/* Selected Block Info Indicator */}
      {selectedBlockKey && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '12px',
            background: 'rgba(245, 158, 11, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#000',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none'
          }}
        >
          🔨 選択中: [{selectedBlockKey}]
        </div>
      )}
    </div>
  );
};

// Helper: Procedural 3D Low-Poly Cute Penguin
function createPenguinMesh() {
  const group = new THREE.Group();

  // 1. Chubby Body (Black)
  const bodyGeo = new THREE.SphereGeometry(0.38, 20, 20);
  bodyGeo.scale(1.0, 1.35, 0.95);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.35,
    metalness: 0.05
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);

  // 2. White Belly
  const bellyGeo = new THREE.SphereGeometry(0.28, 16, 16);
  bellyGeo.scale(0.9, 1.15, 0.45);
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3
  });
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.position.set(0, 0.42, 0.24);
  group.add(belly);

  // 3. Head (Black)
  const headGeo = new THREE.SphereGeometry(0.26, 18, 18);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(0, 0.92, 0.05);
  head.castShadow = true;
  group.add(head);

  // 4. Cute Eyes
  const eyeWhiteGeo = new THREE.SphereGeometry(0.065, 12, 12);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const pupilGeo = new THREE.SphereGeometry(0.035, 10, 10);
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 });

  [-0.09, 0.09].forEach(eyeX => {
    const eyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    eyeWhite.position.set(eyeX, 0.96, 0.24);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(eyeX, 0.96, 0.28);
    group.add(eyeWhite);
    group.add(pupil);
  });

  // 5. Orange Beak
  const beakGeo = new THREE.ConeGeometry(0.08, 0.22, 10);
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.90, 0.34);
  group.add(beak);

  // 6. Orange Feet
  const footGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.06, 10);
  footGeo.scale(0.8, 1.0, 1.4);
  const footMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
  [-0.14, 0.14].forEach(footX => {
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(footX, 0.03, 0.12);
    foot.rotation.y = footX > 0 ? 0.15 : -0.15;
    foot.castShadow = true;
    group.add(foot);
  });

  // 7. Flippers (Wings)
  const flipperGeo = new THREE.SphereGeometry(0.12, 12, 12);
  flipperGeo.scale(0.35, 1.6, 0.7);
  [-0.36, 0.36].forEach(flipperX => {
    const flipper = new THREE.Mesh(flipperGeo, bodyMat);
    flipper.position.set(flipperX, 0.46, 0.04);
    flipper.rotation.z = flipperX > 0 ? -0.35 : 0.35;
    flipper.castShadow = true;
    group.add(flipper);
  });

  // 8. Red Winter Scarf
  const scarfGeo = new THREE.TorusGeometry(0.24, 0.065, 8, 16);
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
  const scarf = new THREE.Mesh(scarfGeo, scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 0.76, 0.05);
  group.add(scarf);

  // Scarf tail
  const tailGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.22, 8);
  const tail = new THREE.Mesh(tailGeo, scarfMat);
  tail.position.set(0.14, 0.65, 0.25);
  tail.rotation.z = -0.25;
  group.add(tail);

  return group;
}

// Helper: 3D Toy Hammer Mesh
function createHammerMesh() {
  const group = new THREE.Group();

  // Handle
  const handleGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.9, 12);
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Wooden amber handle
    roughness: 0.4
  });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.y = 0.95;
  handle.castShadow = true;
  group.add(handle);

  // Hammer Head (Red / Blue Toy Plastic)
  const headGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.75, 14);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xef4444, // Toy red
    roughness: 0.3,
    metalness: 0.1
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.rotation.z = Math.PI / 2;
  head.position.y = 1.85;
  head.castShadow = true;
  group.add(head);

  // Striking face caps
  const capGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 14);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
  [-0.38, 0.38].forEach(capX => {
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.z = Math.PI / 2;
    cap.position.set(capX, 1.85, 0);
    group.add(cap);
  });

  return group;
}

// Helper: Snug Molded Table Frame with Exact Interlocking Cutout for 37 Hexes
function createSnugTableGroup() {
  const tableGroup = new THREE.Group();

  // 1. Table Floor / Abyss ground
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x07111e,
    roughness: 0.9,
    metalness: 0.1
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -6.0;
  floorMesh.receiveShadow = true;
  tableGroup.add(floorMesh);

  // 2. Compute 42-point outer border of the 37 hexes
  const HEX_DIRECTIONS = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  const allBlocks = new Set();
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
    const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
    const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
    for (let r = r1; r <= r2; r++) {
      allBlocks.add(`${q},${r}`);
    }
  }

  const dirAngles = [
    { a1: -30, a2: 30 },
    { a1: 270, a2: 330 },
    { a1: 210, a2: 270 },
    { a1: 150, a2: 210 },
    { a1: 90, a2: 150 },
    { a1: 30, a2: 90 },
  ];

  const segments = [];
  allBlocks.forEach(key => {
    const [q, r] = key.split(',').map(Number);
    const { x, z } = hexTo3D(q, r);

    HEX_DIRECTIONS.forEach((dir, dirIdx) => {
      const nKey = `${q + dir.q},${r + dir.r}`;
      if (!allBlocks.has(nKey)) {
        const a1 = (dirAngles[dirIdx].a1 * Math.PI) / 180;
        const a2 = (dirAngles[dirIdx].a2 * Math.PI) / 180;
        const FIT_R = HEX_RADIUS * 1.008;
        const p1 = {
          x: Number((x + FIT_R * Math.cos(a1)).toFixed(4)),
          y: Number((z + FIT_R * Math.sin(a1)).toFixed(4))
        };
        const p2 = {
          x: Number((x + FIT_R * Math.cos(a2)).toFixed(4)),
          y: Number((z + FIT_R * Math.sin(a2)).toFixed(4))
        };
        segments.push({ p1, p2 });
      }
    });
  });

  const loop = [segments[0].p1, segments[0].p2];
  const used = new Set([0]);

  while (loop.length <= segments.length) {
    const last = loop[loop.length - 1];
    let found = false;
    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue;
      const s = segments[i];
      const d1 = Math.hypot(s.p1.x - last.x, s.p1.y - last.y);
      const d2 = Math.hypot(s.p2.x - last.x, s.p2.y - last.y);
      if (d1 < 0.001) {
        loop.push(s.p2);
        used.add(i);
        found = true;
        break;
      } else if (d2 < 0.001) {
        loop.push(s.p1);
        used.add(i);
        found = true;
        break;
      }
    }
    if (!found) break;
  }

  // 3. Molded Outer Table Frame with Interlocking Hex Notch Hole
  const outerRadius = 7.4;
  const frameShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = ((i * 60 + 30) * Math.PI) / 180;
    const ox = outerRadius * Math.cos(angle);
    const oy = outerRadius * Math.sin(angle);
    if (i === 0) frameShape.moveTo(ox, oy);
    else frameShape.lineTo(ox, oy);
  }
  frameShape.closePath();

  // Hole matching the exact 42 outer edges of the 37 blocks
  const holePath = new THREE.Path();
  holePath.moveTo(loop[0].x, loop[0].y);
  for (let i = 1; i < loop.length; i++) {
    holePath.lineTo(loop[i].x, loop[i].y);
  }
  holePath.closePath();
  frameShape.holes.push(holePath);

  const frameDepth = BLOCK_HEIGHT + 0.18;
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: frameDepth,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 2
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.06
  });

  const frameMesh = new THREE.Mesh(frameGeo, frameMat);
  frameMesh.rotation.x = Math.PI / 2;
  frameMesh.position.y = BLOCK_HEIGHT / 2 + 0.08;
  frameMesh.castShadow = true;
  frameMesh.receiveShadow = true;
  tableGroup.add(frameMesh);

  // 4. Sturdy White Plastic Table Legs at Outer Frame Corners
  const legRadius = 0.32;
  const legHeight = 5.8;
  const legGeo = new THREE.CylinderGeometry(legRadius * 0.85, legRadius, legHeight, 16);
  const legPositions = [
    { x: 5.9, z: 3.4 },
    { x: -5.9, z: 3.4 },
    { x: -5.9, z: -3.4 },
    { x: 5.9, z: -3.4 }
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(pos.x, -legHeight / 2 - 0.1, pos.z);
    leg.rotation.z = pos.x > 0 ? -0.06 : 0.06;
    leg.rotation.x = pos.z > 0 ? 0.06 : -0.06;
    leg.castShadow = true;
    leg.receiveShadow = true;

    // Leg rubber foot pad (cyan accent)
    const footGeo = new THREE.CylinderGeometry(legRadius * 1.15, legRadius * 1.25, 0.25, 16);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 });
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.y = -legHeight / 2;
    leg.add(foot);

    tableGroup.add(leg);
  });

  return tableGroup;
}

