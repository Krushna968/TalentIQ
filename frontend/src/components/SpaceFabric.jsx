import React, { useEffect, useRef } from 'react';

export default function SpaceFabric({ className = '', variant = 'default' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas.parentElement;
    const context = canvas.getContext('2d');
    let raf;
    let width = 0;
    let height = 0;
    let points = [];
    const cursor = { x: -500, y: -500, active: false };

    function createPoints() {
      const count = Math.max(32, Math.min(92, Math.round((width * height) / 14500)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.19,
        vy: (Math.random() - 0.5) * 0.19,
        radius: Math.random() * 1.35 + 0.45,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      createPoints();
    }

    function move(event) {
      const rect = canvas.getBoundingClientRect();
      cursor.x = event.clientX - rect.left;
      cursor.y = event.clientY - rect.top;
      cursor.active = true;
    }

    function leave() {
      cursor.active = false;
      cursor.x = -500;
      cursor.y = -500;
    }

    function render(time) {
      context.clearRect(0, 0, width, height);
      const radius = 160;

      points.forEach((point) => {
        if (cursor.active) {
          const dx = point.x - cursor.x;
          const dy = point.y - cursor.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < radius) {
            const strength = (1 - distance / radius) * 0.42;
            point.vx += (dx / distance) * strength;
            point.vy += (dy / distance) * strength;
          }
        }

        point.vx *= 0.985;
        point.vy *= 0.985;
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < -10 || point.x > width + 10) point.vx *= -1;
        if (point.y < -10 || point.y > height + 10) point.vy *= -1;
        point.x = Math.max(-8, Math.min(width + 8, point.x));
        point.y = Math.max(-8, Math.min(height + 8, point.y));
      });

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const first = points[i];
          const second = points[j];
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          if (distance < 135) {
            const proximity = 1 - distance / 135;
            context.beginPath();
            context.moveTo(first.x, first.y);
            context.lineTo(second.x, second.y);
            context.strokeStyle = 'rgba(0, 229, 255, ' + (proximity * 0.18) + ')';
            context.lineWidth = 0.7;
            context.stroke();
          }
        }
      }

      points.forEach((point, index) => {
        const twinkle = 0.55 + Math.sin(time / 900 + point.phase) * 0.3;
        const authPalette = variant === 'auth';
        const gold = !authPalette && index % 13 === 0;
        const authColor = index % 3 === 0 ? '#3FE6FF' : index % 3 === 1 ? '#4FD1C5' : '#7DD3FC';
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fillStyle = authPalette
          ? 'rgba(' + (index % 3 === 0 ? '63, 230, 255' : index % 3 === 1 ? '79, 209, 197' : '125, 211, 252') + ', ' + twinkle + ')'
          : gold
            ? 'rgba(255, 213, 79, ' + twinkle + ')'
            : 'rgba(120, 245, 255, ' + twinkle + ')';
        context.shadowBlur = gold ? 10 : 7;
        context.shadowColor = authPalette ? authColor : gold ? '#ffb800' : '#00e5ff';
        context.fill();
        context.shadowBlur = 0;
      });

      raf = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    host.addEventListener('mousemove', move);
    host.addEventListener('mouseleave', leave);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      host.removeEventListener('mousemove', move);
      host.removeEventListener('mouseleave', leave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
