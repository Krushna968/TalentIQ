import React, { useEffect, useState } from 'react';

export default function ScoreRing({ score = 0, size = 128, strokeWidth = 6, color = '#e8b84b', label = 'OVERALL' }) {
  const [animScore, setAnimScore] = useState(0);
  const r = (size / 2) - (strokeWidth + 2);
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (animScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#30353a"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 6px ${color}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="font-mono text-[9px] text-surface-variant-text tracking-widest uppercase">{label}</span>
        )}
        <span
          className="font-space font-bold leading-none"
          style={{ fontSize: size * 0.28, color: '#e8b84b' }}
        >
          {animScore}
        </span>
      </div>
    </div>
  );
}
