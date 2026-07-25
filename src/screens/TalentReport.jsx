import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/TopNav.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import VerificationStamp from '../components/VerificationStamp.jsx';

function AnimatedBar({ score, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 200);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div style={{ width: '100%', height: 4, background: '#30353a', borderRadius: 9999, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 9999,
        background: color, width: `${width}%`,
        transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 0 8px ${color}80`
      }} />
    </div>
  );
}

const statusColors = {
  hired:    { bg: 'rgba(76,175,80,0.15)', border: '#4caf50', text: '#81c784', label: '✓ Hired' },
  hold:     { bg: 'rgba(232,184,75,0.15)', border: '#e8b84b', text: '#f0c052', label: '⏸ On Hold' },
  rejected: { bg: 'rgba(229,115,115,0.15)', border: '#e57373', text: '#ef9a9a', label: '✕ Rejected' },
};

export default function TalentReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { candidates, setCandidateStatus } = useApp();
  const candidate = candidates.find(c => c.id === id);

  if (!candidate) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1418', color: '#dfe3e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#d2c5b0' }}>person_off</span>
        <p style={{ fontFamily: 'IBM Plex Sans' }}>Candidate not found.</p>
        <button onClick={() => navigate('/recruiter')} style={{ background: '#e8b84b', color: '#402d00', border: 'none', padding: '10px 24px', borderRadius: 9999, cursor: 'pointer', fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600 }}>← Back to Search</button>
      </div>
    );
  }

  const scores = [
    { label: 'GitHub Repositories', icon: 'code', score: candidate.githubScore, color: '#55d8e7', desc: candidate.githubDesc },
    { label: 'Hackathon Performance', icon: 'emoji_events', score: candidate.hackathonScore, color: '#e8b84b', desc: candidate.hackathonDesc },
    { label: 'Certifications', icon: 'school', score: candidate.certScore, color: '#dfe3e9', desc: candidate.certDesc },
    { label: 'Public Presentations', icon: 'co_present', score: candidate.presentationScore, color: '#55d8e7', desc: candidate.presentationDesc },
    { label: 'Open Source Impact', icon: 'public', score: candidate.openSourceScore, color: '#e8b84b', desc: candidate.openSourceDesc },
    { label: 'Community Standing', icon: 'forum', score: candidate.socialScore, color: '#dfe3e9', desc: candidate.socialDesc },
  ];

  const st = candidate.status ? statusColors[candidate.status] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0f1418', color: '#dfe3e9', paddingBottom: 100 }}>
      <TopNav role="recruiter" />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

        {/* Back button */}
        <button onClick={() => navigate('/recruiter')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          cursor: 'pointer', color: '#d2c5b0', fontFamily: 'IBM Plex Sans', fontSize: 13, marginBottom: 32,
          padding: 0
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Search
        </button>

        {/* Header */}
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: candidate.avatarColor,
              border: '2px solid #e8b84b', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 32, color: '#dfe3e9'
            }}>
              {candidate.initials}
            </div>
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(24px,4vw,38px)', color: '#dfe3e9', margin: 0, marginBottom: 6 }}>
                {candidate.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 18, color: '#d2c5b0' }}>{candidate.title}</span>
                <VerificationStamp size={28} />
                {/* Status badge */}
                {st && (
                  <span style={{
                    background: st.bg, border: `1px solid ${st.border}`, color: st.text,
                    fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.08em', padding: '3px 12px', borderRadius: 9999,
                    textTransform: 'uppercase'
                  }}>{st.label}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {candidate.skills.map(s => (
                  <span key={s} style={{
                    background: '#1E262C', border: '1px solid rgba(78,70,54,0.4)', borderRadius: 9999,
                    padding: '3px 10px', fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600,
                    color: '#dfe3e9', textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <ScoreRing score={candidate.talentScore} size={120} strokeWidth={7} label="OVERALL" />
        </header>

        {/* Score cards bento grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {scores.map(({ label, icon, score, color, desc }) => (
            <article key={label} style={{
              background: '#171D22', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 24, transition: 'background 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#1E262C'}
              onMouseLeave={e => e.currentTarget.style.background = '#171D22'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ color, fontSize: 22 }}>{icon}</span>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: '#dfe3e9', margin: 0 }}>{label}</h2>
                </div>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 600, color, letterSpacing: '0.02em' }}>{score}</span>
              </div>
              <AnimatedBar score={score} color={color} />
              <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#d2c5b0', lineHeight: 1.55, margin: '12px 0 0' }}>{desc}</p>
            </article>
          ))}
        </section>
      </main>

      {/* Sticky decision bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(15,20,24,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(78,70,54,0.25)',
        padding: '16px 24px', zIndex: 50,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCandidateStatus(candidate.id, 'rejected')}
            style={{
              padding: '10px 20px', borderRadius: 9999, border: '1px solid #e57373',
              background: candidate.status === 'rejected' ? 'rgba(229,115,115,0.15)' : 'transparent',
              color: '#e57373', cursor: 'pointer', fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              transition: 'background 0.2s'
            }}
          >Reject</button>
          <button
            onClick={() => setCandidateStatus(candidate.id, 'hold')}
            style={{
              padding: '10px 20px', borderRadius: 9999, border: '1px solid rgba(210,197,176,0.5)',
              background: candidate.status === 'hold' ? 'rgba(232,184,75,0.1)' : 'transparent',
              color: '#d2c5b0', cursor: 'pointer', fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              transition: 'background 0.2s'
            }}
          >Hold</button>
          <button
            onClick={() => setCandidateStatus(candidate.id, 'hired')}
            style={{
              padding: '10px 28px', borderRadius: 9999, background: '#e8b84b',
              color: '#402d00', border: 'none', cursor: 'pointer',
              fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0c052'}
            onMouseLeave={e => e.currentTarget.style.background = '#e8b84b'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>handshake</span>
            Hire Candidate
          </button>
        </div>
      </div>
    </div>
  );
}
