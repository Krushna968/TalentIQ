import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthScreen() {
  const navigate = useNavigate();
  const [role, setRole] = useState('candidate');

  function handleContinue() {
    if (role === 'recruiter') {
      navigate('/recruiter');
    } else {
      navigate('/candidate');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1418', color: '#dfe3e9', display: 'flex' }}>
      {/* Left panel — branding */}
      <div className="node-network" style={{
        display: 'none', flex: 1,
        background: '#0a0f13',
        borderRight: '1px solid rgba(78,70,54,0.2)',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: 40,
      }}
        id="auth-left"
      >
        <div>
          {/* Logo + stamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 80 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#ffd57e' }}>TalentIQ</span>
            <div style={{ position: 'relative', width: 36, height: 36 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(232,184,75,0.3)', background: '#0a0f13', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#e8b84b', fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
              <svg style={{ position: 'absolute', inset: 0, animation: 'spin 10s linear infinite' }} width="36" height="36" viewBox="0 0 36 36">
                <defs>
                  <path id="stamp-path-auth" d="M 18,18 m -14,0 a 14,14 0 1,1 28,0 a 14,14 0 1,1 -28,0" />
                </defs>
                <text fill="#e8b84b" fontSize="4.5" fontFamily="IBM Plex Mono" fontWeight="600" letterSpacing="2.5">
                  <textPath href="#stamp-path-auth" startOffset="0%">AI · VALIDATED · </textPath>
                </text>
              </svg>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(28px,3vw,42px)', lineHeight: 1.2, letterSpacing: '-0.02em', color: '#dfe3e9' }}>
            Verified once.<br />Recognized everywhere.
          </h1>
          <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 15, color: '#d2c5b0', lineHeight: 1.6, marginTop: 16, maxWidth: 380 }}>
            Access the most rigorously validated talent pool, powered by institutional-grade AI intelligence.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#d2c5b0', opacity: 0.6 }}>
          <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>terminal</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em' }}>SYSTEM_READY // SECURE_CONNECTION</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', background: '#0f1418', position: 'relative'
      }}>
        {/* Mobile logo */}
        <div style={{ position: 'absolute', top: 32, left: 32 }}>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: '#ffd57e' }}>TalentIQ</span>
        </div>

        <div style={{
          width: '100%', maxWidth: 420,
          background: '#171D22', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 32,
          boxShadow: '0 8px 32px -12px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 22, color: '#dfe3e9', margin: 0, marginBottom: 6 }}>Welcome Back</h2>
            <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, color: '#d2c5b0', margin: 0 }}>Select your operational clearance to continue.</p>
          </div>

          {/* Role toggle */}
          <div style={{
            display: 'flex', background: '#262b2f', borderRadius: 9999,
            padding: 4, marginBottom: 28, border: '1px solid rgba(78,70,54,0.2)'
          }}>
            {['candidate', 'recruiter'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{
                flex: 1, padding: '8px 16px', borderRadius: 9999,
                border: role === r ? '1px solid rgba(78,70,54,0.2)' : '1px solid transparent',
                background: role === r ? '#1E262C' : 'transparent',
                color: role === r ? '#dfe3e9' : '#d2c5b0',
                fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s'
              }}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'IBM Plex Sans', fontSize: 11, fontWeight: 600, color: '#d2c5b0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(210,197,176,0.5)', fontSize: 18 }}>mail</span>
                <input
                  type="email"
                  placeholder="user@domain.com"
                  defaultValue={role === 'recruiter' ? 'recruiter@acme.com' : 'aditi@dev.io'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#171D22', border: '1px solid rgba(78,70,54,0.35)',
                    borderRadius: 8, padding: '12px 12px 12px 40px',
                    fontFamily: 'IBM Plex Sans', fontSize: 15, color: '#dfe3e9',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#55d8e7'}
                  onBlur={e => e.target.style.borderColor = 'rgba(78,70,54,0.35)'}
                />
              </div>
            </div>
            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontFamily: 'IBM Plex Sans', fontSize: 11, fontWeight: 600, color: '#d2c5b0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
                <a href="#" style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, color: '#55d8e7', textDecoration: 'none' }}>Forgot?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(210,197,176,0.5)', fontSize: 18 }}>lock</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  defaultValue="password123"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#171D22', border: '1px solid rgba(78,70,54,0.35)',
                    borderRadius: 8, padding: '12px 12px 12px 40px',
                    fontFamily: 'IBM Plex Sans', fontSize: 15, color: '#dfe3e9',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#55d8e7'}
                  onBlur={e => e.target.style.borderColor = 'rgba(78,70,54,0.35)'}
                />
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleContinue} style={{
              width: '100%', background: '#e8b84b', color: '#402d00', border: 'none',
              cursor: 'pointer', fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.05em', padding: '14px', borderRadius: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 8, transition: 'background 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0c052'}
              onMouseLeave={e => e.currentTarget.style.background = '#e8b84b'}
            >
              <span>Continue as {role === 'recruiter' ? 'Recruiter' : 'Candidate'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 20, textAlign: 'center', borderTop: '1px solid rgba(78,70,54,0.2)', paddingTop: 16 }}>
            <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#d2c5b0', margin: 0 }}>
              New here?{' '}
              <a href="#" style={{ color: '#55d8e7', textDecoration: 'none', fontWeight: 600 }}>Create an account</a>
            </p>
          </div>
        </div>
      </div>

      {/* Show left panel on md+ */}
      <style>{`
        @media (min-width: 768px) {
          #auth-left { display: flex !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
