import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AICore3D({ onHoverCore }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId;
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8.5;

    // 2. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x050816, 2);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00d8ff, 3, 20);
    cyanLight.position.set(2, 2, 4);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x8b5cff, 3, 20);
    purpleLight.position.set(-2, -2, 4);
    scene.add(purpleLight);

    const centerGlow = new THREE.PointLight(0x00d8ff, 4, 10);
    centerGlow.position.set(0, 0, 0);
    scene.add(centerGlow);

    // 4. Core Object Group
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Central Holographic Processor (Dual Inner Core)
    const coreGeo = new THREE.OctahedronGeometry(1.2, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00d8ff,
      wireframe: true,
      emissive: 0x00d8ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const innerCore = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(innerCore);

    const innerSolidGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const innerSolidMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cff,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x8b5cff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7,
    });
    const innerSolidCore = new THREE.Mesh(innerSolidGeo, innerSolidMat);
    coreGroup.add(innerSolidCore);

    // Rotating Energy Rings
    const ringGroup = new THREE.Group();
    coreGroup.add(ringGroup);

    // Ring 1 (Cyan Outer)
    const ring1Geo = new THREE.TorusGeometry(2.2, 0.035, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x00d8ff,
      emissive: 0x00d8ff,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ringGroup.add(ring1);

    // Ring 2 (Purple Middle)
    const ring2Geo = new THREE.TorusGeometry(2.7, 0.03, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x8b5cff,
      emissive: 0x8b5cff,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ringGroup.add(ring2);

    // Ring 3 (Gold/White Equator Ring)
    const ring3Geo = new THREE.TorusGeometry(3.2, 0.02, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00d8ff,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.8,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = -Math.PI / 4;
    ring3.rotation.z = Math.PI / 6;
    ringGroup.add(ring3);

    // Floating Neural Nodes Particle Cloud
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const cyanColor = new THREE.Color(0x00d8ff);
    const purpleColor = new THREE.Color(0x8b5cff);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);

      const mixedColor = Math.random() > 0.5 ? cyanColor : purpleColor;
      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particleCloud = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particleCloud);

    // Floating Holographic Cubes
    const cubesGroup = new THREE.Group();
    const cubeCount = 8;
    const cubeGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x00d8ff,
      wireframe: true,
      emissive: 0x00d8ff,
      emissiveIntensity: 0.8,
    });

    const cubeInstances = [];
    for (let i = 0; i < cubeCount; i++) {
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      const angle = (i / cubeCount) * Math.PI * 2;
      const dist = 3.6;
      cube.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 1.5, Math.sin(angle) * dist);
      cubesGroup.add(cube);
      cubeInstances.push({ mesh: cube, speed: 0.01 + Math.random() * 0.02, angle });
    }
    coreGroup.add(cubesGroup);

    // Mouse Interaction
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      targetRotationY = x * 0.45;
      targetRotationX = y * 0.35;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Continuous rotation
      innerCore.rotation.y = elapsedTime * 0.4;
      innerCore.rotation.x = elapsedTime * 0.2;
      innerSolidCore.rotation.y = -elapsedTime * 0.6;

      ring1.rotation.z = elapsedTime * 0.3;
      ring2.rotation.x = elapsedTime * 0.25;
      ring3.rotation.y = elapsedTime * 0.2;

      particleCloud.rotation.y = elapsedTime * 0.08;

      // Rotate orbiting cubes
      cubeInstances.forEach((c) => {
        c.angle += c.speed;
        c.mesh.position.x = Math.cos(c.angle) * 3.6;
        c.mesh.position.z = Math.sin(c.angle) * 3.6;
        c.mesh.rotation.x += 0.02;
        c.mesh.rotation.y += 0.02;
      });

      // Pulsating central light glow
      centerGlow.intensity = 3 + Math.sin(elapsedTime * 3) * 1.5;

      // Mouse Parallax Smooth Lerp
      coreGroup.rotation.y += (targetRotationY - coreGroup.rotation.y) * 0.05;
      coreGroup.rotation.x += (targetRotationX - coreGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="ai-core-3d-wrapper"
      onMouseEnter={() => onHoverCore && onHoverCore(true)}
      onMouseLeave={() => onHoverCore && onHoverCore(false)}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    />
  );
}
