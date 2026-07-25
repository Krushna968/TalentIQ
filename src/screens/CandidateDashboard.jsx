import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/TopNav.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import RadarChart from '../components/RadarChart.jsx';
import VerificationStamp from '../components/VerificationStamp.jsx';

const card = {
  background: '#171D22', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, padding: 24, transition: 'background 0.2s'
};

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { candidates } = useApp();
  const me = candidates[0]; // Aditi Rao

  return (
    <div style={{ minHeight: '100vh', background: '#0f1418', color: '#dfe3e9' }}>
      <TopNav role="candidate" />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>

        {/* Hero row */}
        <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32, paddingBottom: 8 }}>
          <ScoreRing score={me.talentScore} size={140} strokeWidth={8} label="TALENT SCORE" />
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(24px,4vw,40px)', color: '#dfe3e9', margin: 0, marginBottom: 8 }}>
              {me.name} — {me.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 16 }}>psychology</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600, color: '#55d8e7', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Talent Score</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {me.skills.map(s => (
                <span key={s} style={{
                  background: '#1E262C', border: '1px solid rgba(78,70,54,0.4)',
                  borderRadius: 9999, padding: '4px 12px',
                  fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600,
                  color: '#dfe3e9', letterSpacing: '0.08em', textTransform: 'uppercase'
                }}>{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Main + Sidebar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 24 }}>

          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Radar card */}
            <div style={card}
              onMouseEnter={e => e.currentTarget.style.background = '#1E262C'}
              onMouseLeave={e => e.currentTarget.style.background = '#171D22'}
            >
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 20, color: '#dfe3e9', marginBottom: 20 }}>Competency Matrix</h2>
              <div style={{
                background: '#0a0f13', border: '1px solid rgba(78,70,54,0.3)',
                borderRadius: 8, padding: 24, position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <RadarChart data={me.radar} />
              </div>
            </div>

            {/* Verification stamps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
              {[
                { icon: 'code', label: 'GitHub' },
                { icon: 'work', label: 'LinkedIn' },
                { icon: 'workspace_premium', label: 'Certs' },
                { icon: 'emoji_events', label: 'Hackathons' },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  ...card, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 12, padding: 20, position: 'relative'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1E262C'}
                  onMouseLeave={e => e.currentTarget.style.background = '#171D22'}
                >
                  <span className="material-symbols-outlined" style={{ color: '#d2c5b0', fontSize: 28 }}>{icon}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600, color: '#dfe3e9', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                  <VerificationStamp size={28} className="absolute top-2 right-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Career Roadmap */}
            <div style={card}
              onMouseEnter={e => e.currentTarget.style.background = '#1E262C'}
              onMouseLeave={e => e.currentTarget.style.background = '#171D22'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 18, color: '#dfe3e9', margin: 0 }}>Career Roadmap</h2>
                <button onClick={() => navigate('/interview')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55d8e7' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: 'hub', label: 'Distributed Systems' },
                  { icon: 'view_in_ar', label: 'Web3 Architecture' },
                  { icon: 'memory', label: 'Advanced ML Models' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{
                    background: '#0a0f13', border: '1px solid rgba(78,70,54,0.3)',
                    borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(85,216,231,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(78,70,54,0.3)'}
                  >
                    <div style={{ width: 36, height: 36, background: 'rgba(85,216,231,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 18 }}>{icon}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, fontWeight: 600, color: '#dfe3e9' }}>{label}</div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600, color: '#d2c5b0', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Next Skill Target</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={card}
              onMouseEnter={e => e.currentTarget.style.background = '#1E262C'}
              onMouseLeave={e => e.currentTarget.style.background = '#171D22'}
            >
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 18, color: '#dfe3e9', marginBottom: 16, margin: '0 0 16px' }}>Recent Activity</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { dot: '#55d8e7', glow: true, text: 'Merged PR #4592 to Core Repository', time: '2 HOURS AGO' },
                  { dot: '#e8b84b', text: 'AWS Solutions Architect Cert Verified', time: '1 DAY AGO' },
                  { dot: '#30353a', border: true, text: 'Completed Data Structures Module', time: '3 DAYS AGO' },
                ].map(({ dot, glow, text, time, border }, i) => (
                  <div key={i} style={{ position: 'relative', paddingLeft: 20, paddingBottom: i < 2 ? 20 : 0, borderLeft: i < 2 ? '1px solid rgba(78,70,54,0.3)' : '1px solid transparent' }}>
                    <div style={{
                      position: 'absolute', left: -5, top: 4, width: 10, height: 10,
                      borderRadius: '50%', background: dot,
                      border: border ? '1px solid rgba(78,70,54,0.4)' : 'none',
                      boxShadow: glow ? '0 0 8px rgba(85,216,231,0.6)' : 'none'
                    }} />
                    <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#dfe3e9' }}>{text}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600, color: '#d2c5b0', letterSpacing: '0.1em', marginTop: 4, textTransform: 'uppercase' }}>{time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(78,70,54,0.2)', marginTop: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#d2c5b0', letterSpacing: '0.1em' }}>© 2024 TalentIQ. AI · VALIDATED</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Terms', 'Privacy', 'Documentation', 'Support'].map(l => (
              <a key={l} href="#" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#d2c5b0', textDecoration: 'none', letterSpacing: '0.08em' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          main > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
