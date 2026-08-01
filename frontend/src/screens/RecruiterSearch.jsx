import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Sparkles, Check, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/TopNav.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';
import './RecruiterSearch.css';

const skillFilters = ['Backend engineering', 'System architecture', 'Machine learning'];
const categorySkills = {
  'Backend engineering': ['node.js', 'go', 'rust', 'python', 'graphql', 'postgresql', 'redis'],
  'System architecture': ['kubernetes', 'aws', 'terraform', 'distributed systems', 'system design', 'kafka', 'grpc'],
  'Machine learning': ['machine learning', 'pytorch', 'mlops', 'spark', 'scala'],
};
const statusStyles = {
  hired: { color: '#92f1b1', label: 'Hired' },
  hold: { color: '#ffdd80', label: 'On hold' },
  rejected: { color: '#ff9da2', label: 'Rejected' },
};

function MatchRing({ score }) {
  const [shown, setShown] = useState(0);
  const radius = 20;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = window.setTimeout(() => setShown(score), 120);
    return () => window.clearTimeout(timer);
  }, [score]);

  return (
    <div className="match-ring" aria-label={score + '% match'}>
      <svg viewBox="0 0 50 50">
        <circle className="track" cx="25" cy="25" r={radius} />
        <circle className="progress" cx="25" cy="25" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - shown / 100 * circumference} />
      </svg>
      <b>{shown}%</b>
    </div>
  );
}

function candidateMatch(candidate, query) {
  if (!query.trim()) return Math.min(99, candidate.talentScore + 5);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const source = [candidate.name, candidate.title, ...candidate.skills].join(' ').toLowerCase();
  const signal = terms.reduce((score, term) => score + (source.includes(term) ? 21 : 0), 38);
  return Math.min(99, Math.max(0, signal + Math.round(candidate.talentScore / 3)));
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', gap: '13px', alignItems: 'center' }}>
        <div className="skel-avatar" />
        <div>
          <div className="skel-line title" />
          <div className="skel-line subtitle" />
        </div>
      </div>
      <div>
        <span className="skel-chip" />
        <span className="skel-chip" />
        <span className="skel-chip" />
      </div>
      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="skel-line subtitle" style={{ marginBottom: 4 }} />
          <div className="skel-line title" style={{ width: 40, height: 24, margin: 0 }} />
        </div>
      </div>
    </div>
  );
}

export default function RecruiterSearch() {
  const { candidates } = useApp();
  const [query, setQuery] = useState('');
  const [minimumScore, setMinimumScore] = useState(70);
  const [selectedSkills, setSelectedSkills] = useState(['Backend engineering', 'System architecture']);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  
  // Loading state simulation
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the query to trigger a small loading state
  useEffect(() => {
    setIsSearching(true);
    const t = setTimeout(() => setIsSearching(false), 400);
    return () => clearTimeout(t);
  }, [query, minimumScore, selectedSkills, verifiedOnly]);

  const results = useMemo(() => candidates
    .map((candidate) => ({ ...candidate, match: candidateMatch(candidate, query) }))
    .filter((candidate) => {
      const normalizedSkills = candidate.skills.map((skill) => skill.toLowerCase());
      const hasSelectedSkill = selectedSkills.length === 0 || selectedSkills.some((filter) => categorySkills[filter].some((skill) => normalizedSkills.includes(skill)));
      return candidate.talentScore >= minimumScore && hasSelectedSkill && (!verifiedOnly || candidate.certScore >= 70) && candidate.match > 0;
    })
    .sort((a, b) => b.match - a.match), [candidates, minimumScore, query, selectedSkills, verifiedOnly]);

  function toggleSkill(skill) {
    setSelectedSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  }

  return (
    <div className="space-page">
      <SpaceFabric className="page-fabric" />
      <TopNav role="recruiter" />
      <main className="content-wrap search-layout">
        <aside className="glass-panel filter-panel" aria-label="Talent filters">
          <div className="eyebrow">Signal filters</div>
          
          <div className="filter-group">
            <h2 className="filter-title">Specialism</h2>
            {skillFilters.map((skill) => (
              <label className="checkbox-row-custom" key={skill}>
                <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => toggleSkill(skill)} />
                <div className="checkbox-custom">
                  <Check size={14} strokeWidth={3} />
                </div>
                {skill}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="range-meta"><span>Minimum talent score</span><b>{minimumScore}</b></div>
            <input className="range-custom" type="range" min="55" max="95" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))} />
          </div>

          <div className="filter-group">
            <label className="checkbox-row-custom">
              <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} />
              <div className="checkbox-custom">
                <Check size={14} strokeWidth={3} />
              </div>
              Verified evidence only
            </label>
          </div>
        </aside>

        <section>
          <div className="search-head">
            <div>
              <div className="eyebrow">Recruiter copilot</div>
              <h1>Navigate the talent constellation.</h1>
            </div>
            <Link className="button button-ghost" to="/report/elena-rodriguez" state={{ candidateId: 'elena-rodriguez', returnTo: '/recruiter' }}>
              Open featured dossier <ExternalLink size={17} style={{ marginLeft: 4 }} />
            </Link>
          </div>

          <form className="copilot-search" onSubmit={(event) => event.preventDefault()}>
            <Sparkles size={22} className="text-cyan" color="#00e5ff" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask Copilot: backend engineers with hackathon wins and Kubernetes depth…" aria-label="Search verified talent" />
            <button className="button button-primary" type="submit">Search</button>
          </form>

          <div className="results-meta">
            <span>{results.length} verified candidate{results.length === 1 ? '' : 's'} matched to your signals</span>
            <span className="high-confidence-text"><span className="pulse-dot" /> HIGH-CONFIDENCE MODE</span>
          </div>

          {isSearching ? (
            <div className="candidate-grid">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : results.length ? (
            <div className="candidate-grid">
              {results.map((candidate) => {
                const status = candidate.status ? statusStyles[candidate.status] : null;
                return (
                  <Link key={candidate.id} to={'/report/' + candidate.id} state={{ candidateId: candidate.id, returnTo: '/recruiter' }} className="glass-panel glass-panel--interactive candidate-card" aria-label={'Open report for ' + candidate.name}>
                    <MatchRing score={candidate.match} />
                    {status && <span className="status-badge" style={{ position: 'absolute', top: 19, left: 19, color: status.color, background: 'rgba(5, 5, 10, 0.8)', padding: '4px 10px' }}>{status.label}</span>}
                    <div className="candidate-top" style={{ paddingTop: status ? 23 : 0 }}>
                      <div className="avatar-enhanced" style={{ width: 52, height: 52, background: candidate.avatarColor }}>
                        {candidate.initials}
                        <span className="verified-badge-enhanced"><Check size={12} strokeWidth={3} /></span>
                      </div>
                      <div>
                        <h2 className="candidate-name">{candidate.name}</h2>
                        <p className="candidate-role">{candidate.title}</p>
                      </div>
                    </div>
                    <div className="candidate-skills">
                      {candidate.skills.slice(0, 4).map((skill) => <span className="chip" key={skill}>{skill}</span>)}
                    </div>
                    <div className="candidate-bottom">
                      <div><small>Talent score</small><strong>{candidate.talentScore}<span style={{ color: '#5a7187', fontSize: 15 }}>.0</span></strong></div>
                      <ArrowRight size={20} className="card-arrow" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel empty-state-enhanced">
              <div className="empty-icon-wrapper">
                <Search size={48} strokeWidth={1.5} />
              </div>
              <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: 18, fontFamily: 'Space Grotesk, sans-serif' }}>No matches found</h3>
              <p style={{ margin: '0 0 24px', maxWidth: 400 }}>No candidates match this specific combination. Try widening the score or specialism filters.</p>
              <button className="button button-ghost" onClick={() => { setMinimumScore(55); setSelectedSkills([]); }}>
                <SlidersHorizontal size={16} /> Clear Filters
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
