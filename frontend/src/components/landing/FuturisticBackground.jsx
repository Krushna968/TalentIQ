import React, { useEffect, useRef } from 'react';

export default function FuturisticBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = 0;
    let height = 0;

    let particles = [];
    let mouse = { x: -1000, y: -1000, active: false };

    const init = () => {
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Create neural particles
      const count = Math.floor(Math.min((width * height) / 11000, 110));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.6,
        color: Math.random() > 0.35 ? '#00d8ff' : '#8b5cff',
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      }));
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);

      // Render Aurora Background Gradient
      const auroraTime = time * 0.0005;
      const g1X = width * 0.5 + Math.sin(auroraTime) * (width * 0.2);
      const g1Y = height * 0.3 + Math.cos(auroraTime * 0.8) * (height * 0.15);
      const gradient1 = ctx.createRadialGradient(g1X, g1Y, 10, g1X, g1Y, width * 0.45);
      gradient1.addColorStop(0, 'rgba(0, 216, 255, 0.12)');
      gradient1.addColorStop(0.5, 'rgba(139, 92, 255, 0.06)');
      gradient1.addColorStop(1, 'rgba(5, 8, 22, 0)');
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, width, height);

      const g2X = width * 0.7 - Math.cos(auroraTime * 0.6) * (width * 0.25);
      const g2Y = height * 0.65 + Math.sin(auroraTime * 0.5) * (height * 0.2);
      const gradient2 = ctx.createRadialGradient(g2X, g2Y, 10, g2X, g2Y, width * 0.4);
      gradient2.addColorStop(0, 'rgba(139, 92, 255, 0.10)');
      gradient2.addColorStop(0.6, 'rgba(0, 216, 255, 0.04)');
      gradient2.addColorStop(1, 'rgba(5, 8, 22, 0)');
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, width, height);

      // Render Cyber Mesh Grid Lines
      ctx.strokeStyle = 'rgba(0, 216, 255, 0.025)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update & Draw Neural Network Particles & Lines
      const maxDistance = 140;
      const mouseRadius = 180;

      particles.forEach((p, idx) => {
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < mouseRadius) {
            const force = (1 - dist / mouseRadius) * 0.6;
            p.vx += (dx / dist) * force * 0.15;
            p.vy += (dy / dist) * force * 0.15;
          }
        }

        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color.includes('00d8ff')
              ? `rgba(0, 216, 255, ${alpha})`
              : `rgba(139, 92, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        p.phase += p.pulseSpeed;
        const glow = 0.6 + Math.sin(p.phase) * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (0.8 + glow * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    init();
    window.addEventListener('resize', init);
    const parent = canvas.parentElement || document.body;
    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', init);
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="futuristic-background-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
