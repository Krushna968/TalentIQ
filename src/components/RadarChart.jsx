import React from 'react';

const axes = ['Tech Depth', 'Innovation', 'Leadership', 'Velocity', 'Collab', 'Comms'];
const size = 300;
const center = 150;
const maxRadius = 105;

function angle(index) {
  return index / axes.length * Math.PI * 2 - Math.PI / 2;
}

function point(index, radius) {
  return {
    x: center + Math.cos(angle(index)) * radius,
    y: center + Math.sin(angle(index)) * radius,
  };
}

function pointsFor(radius) {
  return axes.map((_, index) => {
    const position = point(index, radius);
    return position.x + ',' + position.y;
  }).join(' ');
}

export default function RadarChart({ data = [] }) {
  const dataPoints = axes.map((axis, index) => {
    const value = data.find((item) => item.axis === axis)?.value || 0;
    const position = point(index, value / 100 * maxRadius);
    return position.x + ',' + position.y;
  }).join(' ');

  return (
    <div style={{ position: 'relative', width: 'min(100%, 430px)', aspectRatio: '1' }}>
      <svg viewBox={'0 0 ' + size + ' ' + size} width="100%" height="100%" aria-label="Competency radar chart">
        <defs>
          <filter id="radar-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id="radar-fill"><stop offset="0%" stopColor="#00e5ff" stopOpacity=".35" /><stop offset="100%" stopColor="#00e5ff" stopOpacity=".06" /></radialGradient>
        </defs>
        {[.25, .5, .75, 1].map((multiple) => <polygon key={multiple} points={pointsFor(maxRadius * multiple)} fill="none" stroke="rgba(0,229,255,.22)" strokeWidth="1" />)}
        {axes.map((_, index) => {
          const outer = point(index, maxRadius);
          return <line key={index} x1={center} y1={center} x2={outer.x} y2={outer.y} stroke="rgba(0,229,255,.22)" strokeWidth="1" />;
        })}
        <polygon points={dataPoints} fill="url(#radar-fill)" stroke="#00e5ff" strokeWidth="2.6" filter="url(#radar-glow)" />
        {axes.map((axis, index) => {
          const value = data.find((item) => item.axis === axis)?.value || 0;
          const position = point(index, value / 100 * maxRadius);
          return <circle key={axis} cx={position.x} cy={position.y} r="4.4" fill="#ffd54f" stroke="#07121a" strokeWidth="2" />;
        })}
        <circle cx={center} cy={center} r="4" fill="#00e5ff" filter="url(#radar-glow)" />
      </svg>
      {axes.map((axis, index) => {
        const position = point(index, maxRadius + 30);
        return <span key={axis} style={{ position: 'absolute', left: position.x / size * 100 + '%', top: position.y / size * 100 + '%', transform: 'translate(-50%, -50%)', color: '#a6bdca', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '.04em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{axis}</span>;
      })}
    </div>
  );
}
