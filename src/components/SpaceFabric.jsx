import React, { useRef, useEffect } from 'react';

/**
 * A canvas mesh grid that behaves like a fabric being pulled toward the
 * cursor — points near the pointer get tugged inward, with a subtle
 * cyan -> gold color shift near the pull point, over a faint twinkling
 * starfield. Fully self-contained: tracks the mouse relative to its
 * parent element, so drop it in as the first child of any
 * position:relative / overflow:hidden container.
 *
 * Tune the feel with the three constants below:
 *   spacing         - grid cell size in px (smaller = denser mesh)
 *   influenceRadius - how far the cursor's pull reaches, in px
 *   pullStrength    - how hard points get dragged toward the cursor
 */
export default function SpaceFabric({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');

    const spacing = 46;
    const influenceRadius = 190;
    const pullStrength = 34;

    let width = 0;
    let height = 0;
    let points = [];
    let raf = null;
    let t = 0;

    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.2,
    }));

    function resize() {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      points = [];
      for (let iy = 0; iy <= rows; iy++) {
        const row = [];
        for (let ix = 0; ix <= cols; ix++) {
          const baseX = ix * spacing;
          const baseY = iy * spacing;
          row.push({ baseX, baseY, x: baseX, y: baseY });
        }
        points.push(row);
      }
    }

    function handleMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    }
    function handleLeave() {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    }

    function draw() {
      t += 0.016;
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      ctx.clearRect(0, 0, width, height);

      // faint twinkling starfield behind the mesh
      stars.forEach(s => {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(223,227,233,${0.28 * twinkle})`;
        ctx.fill();
      });

      // pull grid points toward the cursor like fabric being tugged
      for (const row of points) {
        for (const p of row) {
          const dx = p.baseX - mouse.x;
          const dy = p.baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < influenceRadius) {
            const force = 1 - dist / influenceRadius;
            const pull = force * force * pullStrength;
            const angle = Math.atan2(dy, dx);
            p.x = p.baseX - Math.cos(angle) * pull;
            p.y = p.baseY - Math.sin(angle) * pull;
          } else {
            p.x += (p.baseX - p.x) * 0.15;
            p.y += (p.baseY - p.y) * 0.15;
          }
        }
      }

      // draw the mesh — color shifts gold near the cursor, cyan elsewhere
      for (let iy = 0; iy < points.length; iy++) {
        for (let ix = 0; ix < points[iy].length; ix++) {
          const p = points[iy][ix];
          const dx = p.baseX - mouse.x;
          const dy = p.baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const near = Math.max(0, 1 - dist / influenceRadius);
          const alpha = 0.05 + near * 0.35;
          const color = near > 0.5
            ? `rgba(255,213,126,${alpha})`
            : `rgba(85,216,231,${alpha})`;

          const right = points[iy][ix + 1];
          if (right) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
          }
          const down = points[iy + 1] && points[iy + 1][ix];
          if (down) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(down.x, down.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    parent.addEventListener('mousemove', handleMove);
    parent.addEventListener('mouseleave', handleLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      parent.removeEventListener('mousemove', handleMove);
      parent.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  );
}