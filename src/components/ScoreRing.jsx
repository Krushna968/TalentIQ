import React, { useEffect, useState } from 'react';

export default function ScoreRing({ score = 0, size = 128, strokeWidth = 7, color = '#ffd54f', label = 'Overall' }) {
  const [shownScore, setShownScore] = useState(0);
  const radius = size / 2 - strokeWidth - 2;
  const circumference = Math.PI * 2 * radius;

  useEffect(() => {
    const timer = window.setTimeout(() => setShownScore(score), 100);
    return () => window.clearTimeout(timer);
  }, [score]);

  return (
    <div className="score-ring" style={{ width: size, height: size, position: 'relative', flex: '0 0 auto' }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - shownScore / 100 * circumference} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)', filter: 'drop-shadow(0 0 6px ' + color + ')' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
        <span style={{ color: '#93a3b5', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, fontWeight: 600, letterSpacing: '.11em', textTransform: 'uppercase' }}>{label}</span>
        <strong style={{ color, fontFamily: "'Space Grotesk', sans-serif", fontSize: size * .29, letterSpacing: '-.07em', lineHeight: 1 }}>{shownScore}</strong>
      </div>
    </div>
  );
}
