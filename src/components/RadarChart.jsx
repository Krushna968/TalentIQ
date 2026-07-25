import React from 'react';

// 6-axis SVG radar chart — no external dependency needed
const AXES = ['Tech Depth', 'Innovation', 'Leadership', 'Velocity', 'Collab', 'Comms'];
const NUM_RINGS = 4;
const SIZE = 200;
const CX = 100;
const CY = 100;
const MAX_R = 72;

function angleForAxis(i, total) {
  // Start at top (-90deg), go clockwise
  return (Math.PI * 2 * i) / total - Math.PI / 2;
}

function polarToXY(angle, r) {
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

function buildRingPoints(r) {
  return AXES.map((_, i) => {
    const { x, y } = polarToXY(angleForAxis(i, AXES.length), r);
    return `${x},${y}`;
  }).join(' ');
}

function buildDataPoints(data) {
  return AXES.map((axis, i) => {
    const item = data.find(d => d.axis === axis);
    const val = item ? item.value : 0;
    const r = (val / 100) * MAX_R;
    const { x, y } = polarToXY(angleForAxis(i, AXES.length), r);
    return `${x},${y}`;
  }).join(' ');
}

export default function RadarChart({ data = [] }) {
  const rings = Array.from({ length: NUM_RINGS }, (_, i) => ((i + 1) / NUM_RINGS) * MAX_R);

  return (
    <div className="relative w-full flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full max-h-[280px]">
        {/* Ring grid */}
        {rings.map((r, i) => (
          <polygon
            key={i}
            points={buildRingPoints(r)}
            fill="none"
            stroke="#30353a"
            strokeWidth="1"
          />
        ))}
        {/* Axis lines */}
        {AXES.map((_, i) => {
          const outer = polarToXY(angleForAxis(i, AXES.length), MAX_R);
          return (
            <line
              key={i}
              x1={CX} y1={CY}
              x2={outer.x} y2={outer.y}
              stroke="#30353a"
              strokeWidth="1"
            />
          );
        })}
        {/* Data polygon */}
        <polygon
          points={buildDataPoints(data)}
          fill="rgba(85,216,231,0.18)"
          stroke="#55d8e7"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 5px rgba(85,216,231,0.4))' }}
        />
        {/* Data points */}
        {AXES.map((axis, i) => {
          const item = data.find(d => d.axis === axis);
          const val = item ? item.value : 0;
          const r = (val / 100) * MAX_R;
          const { x, y } = polarToXY(angleForAxis(i, AXES.length), r);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#e8b84b" />;
        })}
      </svg>
      {/* Axis labels */}
      {AXES.map((axis, i) => {
        const angle = angleForAxis(i, AXES.length);
        const labelR = MAX_R + 16;
        const { x, y } = polarToXY(angle, labelR);
        const dx = x < CX - 5 ? '-100%' : x > CX + 5 ? '0%' : '-50%';
        return (
          <span
            key={axis}
            className="absolute font-mono text-[9px] text-surface-variant-text tracking-wide uppercase whitespace-nowrap"
            style={{
              left: `${(x / SIZE) * 100}%`,
              top: `${(y / SIZE) * 100}%`,
              transform: `translate(${dx}, -50%)`,
              pointerEvents: 'none',
            }}
          >
            {axis}
          </span>
        );
      })}
    </div>
  );
}
