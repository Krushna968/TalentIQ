import React from 'react';
import { useNavigate } from 'react-router-dom';
import VerificationStamp from '../components/VerificationStamp.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f1418', color: '#dfe3e9' }}>
      {/* TopNav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,20,24,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, color: '#ffd57e' }}>TalentIQ</span>
            <nav style={{ display: 'flex', gap: 4 }}>
              {['Product', 'For Recruiters', 'For Candidates'].map(label => (
                <a key={label} href="#" style={{
                  fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                  color: '#d2c5b0', textDecoration: 'none', padding: '4px 10px', borderRadius: 8,
                  transition: 'color 0.2s'
                }}
                  onMouseEnter={e => e.target.style.color = '#ffd57e'}
                  onMouseLeave={e => e.target.style.color = '#d2c5b0'}
                >{label}</a>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/auth')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              color: '#d2c5b0'
            }}>Log in</button>
            <button onClick={() => navigate('/auth')} style={{
              background: '#e8b84b', color: '#402d00', border: 'none', cursor: 'pointer',
              fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              padding: '8px 20px', borderRadius: 9999, transition: 'background 0.2s'
            }}>Get Verified</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        position: 'relative', width: '100%', padding: '80px 40px 64px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: 560, overflow: 'hidden', background: '#0f1418'
      }}>
        <SpaceFabric />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(32px,5vw,48px)',
            lineHeight: 1.15, letterSpacing: '-0.02em', color: '#dfe3e9', marginBottom: 16
          }}>
            Your skills, verified.<br />Not just claimed.
          </h1>
          <p style={{
            fontFamily: 'IBM Plex Sans', fontSize: 16, color: '#d2c5b0', maxWidth: 600,
            lineHeight: 1.6, marginBottom: 32
          }}>
            TalentIQ turns your GitHub commits, hackathon wins, and certificates into one verified score recruiters can actually trust — no resume required.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => navigate('/auth')} style={{
              background: '#e8b84b', color: '#402d00', border: 'none', cursor: 'pointer',
              fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              padding: '14px 32px', borderRadius: 9999, transition: 'background 0.2s, transform 0.2s'
            }}
              onMouseEnter={e => { e.target.style.background = '#f0c052'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.background = '#e8b84b'; e.target.style.transform = 'translateY(0)'; }}
            >Build your profile</button>
            <button onClick={() => navigate('/auth')} style={{
              background: 'transparent', color: '#55d8e7',
              border: '1px solid #55d8e7', cursor: 'pointer',
              fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              padding: '14px 32px', borderRadius: 9999, transition: 'all 0.2s'
            }}
              onMouseEnter={e => { e.target.style.background = 'rgba(85,216,231,0.1)'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.transform = 'translateY(0)'; }}
            >I'm hiring</button>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '0 40px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { stat: '12,000+', label: 'Repositories analyzed' },
            { stat: '6', label: 'AI agents scoring every profile' },
            { stat: '40+', label: 'Verified skill signals' },
            { stat: '98%', label: 'Fraud-detection accuracy' },
          ].map(({ stat, label }) => (
            <div key={label} style={{
              background: '#171D22', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
              alignItems: 'center', textAlign: 'center', gap: 12,
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,184,75,0.12)';
                e.currentTarget.style.borderColor = 'rgba(232,184,75,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div style={{ position: 'relative', width: 48, height: 48, borderRadius: '50%', border: '1px dashed #e8b84b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#e8b84b', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check</span>
              </div>
              <p style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 20, color: '#dfe3e9', margin: 0 }}>{stat}</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600, color: '#d2c5b0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What We Verify */}
      <section style={{ background: '#0a0f13', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '64px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 24, color: '#dfe3e9', textAlign: 'center', marginBottom: 40 }}>
            What we verify
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: 'code', title: 'GitHub', desc: 'We analyze commit history, language diversity, and code quality using static analysis models.', tag: 'Code Quality' },
              { icon: 'emoji_events', title: 'Hackathon', desc: 'Automated verification of participation, project scope, and winning status across major platforms.', tag: 'Delivery & Execution' },
              { icon: 'school', title: 'Certificate', desc: 'Cryptographic verification of digital credentials and mapping to standardized skill taxonomies.', tag: 'Formal Learning' },
              { icon: 'question_answer', title: 'Interview', desc: 'AI-driven technical assessments scoring problem-solving, communication, and algorithmic thinking.', tag: 'Technical Acumen' },
            ].map(({ icon, title, desc, tag }) => (
              <div key={title} style={{
                background: '#171D22', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#1E262C';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(85,216,231,0.10)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#171D22';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ width: 40, height: 40, background: '#1b2024', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: '#d2c5b0', fontSize: 20 }}>{icon}</span>
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 18, color: '#dfe3e9', margin: 0 }}>{title}</h3>
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, color: '#d2c5b0', lineHeight: 1.5, flex: 1, margin: 0 }}>{desc}</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600, color: '#d2c5b0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Split */}
      <section style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '64px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* For Candidates */}
          <div style={{
            background: '#171D22', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 32, position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(255,213,126,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 128, height: 128, background: 'rgba(255,213,126,0.08)', borderRadius: '50%', transform: 'translate(40px, -40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,213,126,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffd57e', fontSize: 18 }}>person</span>
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 20, color: '#dfe3e9', marginBottom: 12 }}>For Candidates</h3>
              <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 15, color: '#d2c5b0', lineHeight: 1.6, marginBottom: 20 }}>
                Stop tweaking resumes. Connect your data sources once and let our AI build a verified profile that speaks for itself. Stand out based on merit.
              </p>
              <button onClick={() => navigate('/auth')} style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                cursor: 'pointer', color: '#ffd57e', fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em'
              }}>
                Claim your profile <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </button>
            </div>
          </div>
          {/* For Recruiters */}
          <div className="cyan-glow" style={{
            background: '#171D22', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: 32, position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(85,216,231,0.16)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ position: 'absolute', top: 0, right: 0, width: 128, height: 128, background: 'rgba(85,216,231,0.08)', borderRadius: '50%', transform: 'translate(40px, -40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(85,216,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 18 }}>search</span>
              </div>
              <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 20, color: '#dfe3e9', marginBottom: 12 }}>For Recruiters</h3>
              <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 15, color: '#d2c5b0', lineHeight: 1.6, marginBottom: 20 }}>
                Cut through the noise. Access a pool of candidates with mathematically verified skill scores. Reduce time-to-hire and eliminate bad technical screens.
              </p>
              <button onClick={() => navigate('/auth')} style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                cursor: 'pointer', color: '#55d8e7', fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em'
              }}>
                Start sourcing <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(78,70,54,0.2)', background: '#0f1418', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 40px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600, color: '#d2c5b0', letterSpacing: '0.1em' }}>© 2024 TalentIQ. AI · VALIDATED</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Terms', 'Privacy', 'Documentation', 'Support'].map(l => (
              <a key={l} href="#" style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 600, color: '#d2c5b0', textDecoration: 'none', letterSpacing: '0.08em', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#ffd57e'}
                onMouseLeave={e => e.target.style.color = '#d2c5b0'}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}