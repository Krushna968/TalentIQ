import React, { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Check if mouse is over interactive button or card
      const target = e.target;
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.glass-panel') ||
        target.closest('.orbit-feature-card') ||
        target.closest('.pipeline-card')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Primary Glow Cursor Spotlight */}
      <div
        className={`custom-cursor-glow ${isHovered ? 'hovered' : ''}`}
        style={{
          transform: `translate3d(${pos.x - 180}px, ${pos.y - 180}px, 0)`,
        }}
      />
      {/* Precision Core Dot */}
      <div
        className={`custom-cursor-dot ${isHovered ? 'hovered' : ''}`}
        style={{
          transform: `translate3d(${pos.x - 6}px, ${pos.y - 6}px, 0)`,
        }}
      />
    </>
  );
}
