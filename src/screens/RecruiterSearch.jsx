import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/TopNav.jsx';

function matchScore(candidate, query) {
  if (!query.trim()) return 100;
  const q = query.toLowerCase();
  const text = [candidate.name, candidate.title, ...candidate.skills].join(' ').toLowerCase();
  let score = 0;
  const words = q.split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (text.includes(word)) score += 30;
  }
  return Math.min(score, 99);
}

function AvatarInitials({ candidate }) {
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      background: candidate.avatarColor, border: '1px solid rgba(255,255,255,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#dfe3e9',
      flexShrink: 0, position: 'relative'
    }}>
      {candidate.initials}
      {/* Verification dot */}
      <div style={{
        position: 'absolute', bottom: -2, right: -2, width: 18, height: 18,
        borderRadius: '50%', background: '#e8b84b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid #171D22'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#402d00', fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
      </div>
    </div>
  );
}

export default function RecruiterSearch() {
  const navigate = useNavigate();
  const { candidates } = useApp();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return candidates.map(c => ({ ...c, match: 98 }));
    return candidates
      .map(c => ({ ...c, match: matchScore(c, query) }))
      .filter(c => c.match > 0)
      .sort((a, b) => b.match - a.match);
  }, [query, candidates]);

  const statusColors = {
    hired: { bg: '#1a3a20', border: '#4caf50', text: '#81c784' },
    hold: { bg: '#3a3520', border: '#e8b84b', text: '#f0c052' },
    rejected: { bg: '#3a1a1a', border: '#e57373', text: '#ef9a9a' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1418', color: '#dfe3e9' }}>
      <TopNav role="recruiter" />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 32 }}>

        {/* Sidebar filters */}
        <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h3 style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600, color: '#d2c5b0', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid rgba(78,70,54,0.3)', paddingBottom: 8, marginBottom: 20, margin: '0 0 16px' }}>Filters</h3>

            {/* Skills */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, color: '#dfe3e9', display: 'block', marginBottom: 10 }}>Skills</label>
              {['Backend Engineering', 'System Architecture', 'Machine Learning'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                  <input type="checkbox" defaultChecked={s !== 'Machine Learning'} style={{ accentColor: '#e8b84b' }} />
                  <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#d2c5b0' }}>{s}</span>
                </label>
              ))}
            </div>

            {/* Min Score */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, color: '#dfe3e9', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span>Min Talent Score</span>
                <span style={{ color: '#55d8e7', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>70</span>
              </label>
              <input type="range" min="0" max="100" defaultValue="70" style={{ width: '100%', accentColor: '#55d8e7' }} />
            </div>

            {/* Verifications */}
            <div>
              <label style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, color: '#dfe3e9', display: 'block', marginBottom: 10 }}>Verifications</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#e8b84b' }} />
                <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#d2c5b0' }}>Hackathon Wins</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: '#1b2024', border: '1px solid rgba(78,70,54,0.4)',
              borderRadius: 9999, display: 'flex', alignItems: 'center', padding: '6px 6px 6px 16px',
              transition: 'border-color 0.2s',
              boxShadow: '0 0 20px rgba(85,216,231,0.05)'
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = '#55d8e7'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(78,70,54,0.4)'}
            >
              <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 22, marginRight: 8, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Find backend engineers with hackathon wins and 3+ years experience…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'IBM Plex Sans', fontSize: 15, color: '#dfe3e9'
                }}
              />
              <button style={{
                background: '#e8b84b', color: '#402d00', border: 'none', cursor: 'pointer',
                fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                padding: '10px 28px', borderRadius: 9999, transition: 'background 0.2s', flexShrink: 0
              }}
                onMouseEnter={e => e.target.style.background = '#f0c052'}
                onMouseLeave={e => e.target.style.background = '#e8b84b'}
              >Search</button>
            </div>
          </div>

          {/* Results header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
            <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, color: '#d2c5b0' }}>
              {results.length} candidate{results.length !== 1 ? 's' : ''} match your criteria
            </span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#55d8e7', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>bolt</span>
              HIGH ACCURACY MODE
            </span>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {results.map(candidate => {
              const st = candidate.status && statusColors[candidate.status];
              return (
                <div key={candidate.id}
                  onClick={() => navigate(`/report/${candidate.id}`)}
                  style={{
                    background: '#171c20', border: '1px solid rgba(78,70,54,0.25)',
                    borderRadius: 12, padding: 24, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 16,
                    transition: 'background 0.2s, box-shadow 0.2s', position: 'relative'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1E262C'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#171c20'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Match badge */}
                  <div style={{
                    position: 'absolute', top: 16, right: 16, width: 44, height: 44,
                    borderRadius: '50%', border: '2px solid #e8b84b',
                    background: '#171c20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 600, color: '#e8b84b',
                    boxShadow: '0 0 10px rgba(232,184,75,0.15)'
                  }}>
                    {candidate.match}%
                  </div>

                  {/* Status badge if set */}
                  {candidate.status && (
                    <div style={{
                      position: 'absolute', top: 16, left: 16,
                      background: st.bg, border: `1px solid ${st.border}`,
                      borderRadius: 9999, padding: '2px 10px',
                      fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600,
                      color: st.text, textTransform: 'uppercase', letterSpacing: '0.08em'
                    }}>
                      {candidate.status}
                    </div>
                  )}

                  {/* Avatar + info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: candidate.status ? 16 : 0 }}>
                    <AvatarInitials candidate={candidate} />
                    <div style={{ paddingTop: 2 }}>
                      <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: '#dfe3e9', margin: 0, marginBottom: 3 }}>{candidate.name}</h3>
                      <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#d2c5b0', margin: 0 }}>{candidate.title}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {candidate.skills.slice(0, 4).map(s => (
                      <span key={s} style={{
                        background: '#1E262C', border: '1px solid rgba(78,70,54,0.35)',
                        borderRadius: 9999, padding: '3px 10px',
                        fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600,
                        color: '#dfe3e9', textTransform: 'uppercase', letterSpacing: '0.06em'
                      }}>{s}</span>
                    ))}
                  </div>

                  {/* Score + arrow */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600, color: '#d2c5b0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Talent Score</div>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 600, color: '#dfe3e9', letterSpacing: '0.05em' }}>
                        {candidate.talentScore}<span style={{ color: 'rgba(85,216,231,0.5)', fontSize: 13 }}>.0</span>
                      </span>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: '#d2c5b0', fontSize: 20, transition: 'color 0.2s' }}>arrow_forward</span>
                  </div>
                </div>
              );
            })}
          </div>

          {results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#d2c5b0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.4 }}>search_off</span>
              <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 15 }}>No candidates match "{query}"</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
