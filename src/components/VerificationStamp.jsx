import React from 'react';

export default function VerificationStamp({ size = 32, className = '' }) {
  return (
    <span className={className} title="AI-validated signal" style={{ display: 'inline-grid', width: size, height: size, placeItems: 'center', border: '1px solid rgba(255,213,79,.72)', borderRadius: '50%', color: '#ffd54f', background: 'rgba(255,184,0,.08)', boxShadow: '0 0 13px rgba(255,184,0,.18)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: size * .54, fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
    </span>
  );
}
