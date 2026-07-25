import React from 'react';

export default function VerificationStamp({ size = 32, className = '' }) {
  const r = size * 0.45;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Static gold check circle */}
      <div
        className="absolute inset-0 rounded-full border border-primary-container flex items-center justify-center"
        style={{ boxShadow: '0 0 8px rgba(232,184,75,0.25)' }}
      >
        <span
          className="material-symbols-outlined text-primary-container"
          style={{ fontSize: size * 0.45 + 'px', fontVariationSettings: "'FILL' 1, 'wght' 700" }}
        >
          check
        </span>
      </div>
      {/* Rotating text ring */}
      <svg
        className="absolute inset-0 animate-spin"
        width={size}
        height={size}
        style={{ animationDuration: '12s' }}
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <path
            id={`stamp-circle-${size}`}
            d={`M ${cx},${cy} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`}
          />
        </defs>
        <text
          fill="#e8b84b"
          fontSize={size * 0.16}
          fontFamily="IBM Plex Mono"
          fontWeight="600"
          letterSpacing={size * 0.055}
          textAnchor="middle"
        >
          <textPath href={`#stamp-circle-${size}`} startOffset="0%">
            AI · VALIDATED · 
          </textPath>
        </text>
      </svg>
    </div>
  );
}
