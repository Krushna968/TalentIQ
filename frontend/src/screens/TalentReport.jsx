import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/TopNav.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';

const statusStyles = {
  hired: { color: '#92f1b1', label: 'Hired' },
  hold: { color: '#ffdd80', label: 'On hold' },
  rejected: { color: '#ff9da2', label: 'Rejected' },
};

function MetricCard({ metric, index }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(metric.score), 180 + index * 100);
    return () => window.clearTimeout(timer);
  }, [index, metric.score]);

  return (
    <article className="glass-panel glass-panel--interactive metric-card" style={{ animationDelay: index * 100 + 'ms' }}>
      <div className="metric-card-top">
        <span className="metric-icon" style={{ color: metric.color }}><span className="material-symbols-outlined">{metric.icon}</span></span>
        <strong className="metric-number" style={{ color: metric.color }}>{metric.score}</strong>
      </div>
      <h3>{metric.label}</h3>
      <div className="score-bar"><span style={{ width: width + '%', background: metric.color, boxShadow: '0 0 12px ' + metric.color }} /></div>
      <p>{metric.description}</p>
    </article>
  );
}

export default function TalentReport() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { candidates, setCandidateStatus } = useApp();
  const candidateId = location.state?.candidateId || id;
  const candidate = candidates.find((item) => item.id === candidateId) || candidates.find((item) => item.id === id);
  const returnTo = location.state?.returnTo || '/recruiter';

  if (!candidate) {
    return (
      <div className="space-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="glass-panel empty-state" style={{ maxWidth: 450 }}>
          <span className="material-symbols-outlined">person_off</span>
          This candidate dossier is unavailable.
          <br /><Link className="button button-primary" to="/recruiter" style={{ marginTop: 20 }}>Return to talent search</Link>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'GitHub repositories', icon: 'code', score: candidate.githubScore, color: '#00e5ff', description: candidate.githubDesc },
    { label: 'Hackathon performance', icon: 'emoji_events', score: candidate.hackathonScore, color: '#ffd54f', description: candidate.hackathonDesc },
    { label: 'Certifications', icon: 'workspace_premium', score: candidate.certScore, color: '#b7c6db', description: candidate.certDesc },
    { label: 'Public presentations', icon: 'co_present', score: candidate.presentationScore, color: '#00e5ff', description: candidate.presentationDesc },
    { label: 'Open-source impact', icon: 'public', score: candidate.openSourceScore, color: '#ffd54f', description: candidate.openSourceDesc },
    { label: 'Community standing', icon: 'forum', score: candidate.socialScore, color: '#b7c6db', description: candidate.socialDesc },
  ];
  const status = candidate.status ? statusStyles[candidate.status] : null;

  return (
    <div className="space-page">
      <SpaceFabric className="page-fabric" />
      <TopNav role="recruiter" />
      <main className="content-wrap dossier">
        <button className="back-link" onClick={() => navigate(returnTo)} type="button"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_back</span>Back to talent search</button>

        <section className="glass-panel dossier-banner">
          <div className="dossier-main">
            <div className="avatar dossier-avatar" style={{ background: candidate.avatarColor }}>{candidate.initials}<span className="verified-dot"><span className="material-symbols-outlined" style={{ fontSize: 11 }}>check</span></span></div>
            <div>
              <div className="eyebrow">Classified · verified intelligence dossier</div>
              <h1>{candidate.name}</h1>
              <p className="dossier-title">{candidate.title} {status && <span className="status-badge" style={{ marginLeft: 8, verticalAlign: 'middle', color: status.color }}>{status.label}</span>}</p>
              <div className="dossier-skills">{candidate.skills.map((skill, index) => <span className={'chip ' + (index % 3 === 2 ? 'chip-gold' : '')} key={skill}>{skill}</span>)}</div>
            </div>
          </div>
          <div className="dossier-score"><strong>{candidate.talentScore}</strong><span>OVERALL TALENT SCORE / 100</span></div>
        </section>

        <section className="dossier-meta">
          <div><div className="eyebrow">Evidence map</div><h2>Validated strength signals</h2></div>
          <span className="eyebrow" style={{ color: '#ffd54f' }}>Confidence model active</span>
        </section>

        <section className="metric-grid">
          {metrics.map((metric, index) => <MetricCard key={metric.label} metric={metric} index={index} />)}
        </section>
      </main>

      <footer className="decision-bar">
        <div className="decision-bar-inner">
          <button className="button button-danger" onClick={() => setCandidateStatus(candidate.id, 'rejected')}>Reject</button>
          <button className="button button-ghost" onClick={() => setCandidateStatus(candidate.id, 'hold')}>Hold</button>
          <button className="button button-primary" onClick={() => setCandidateStatus(candidate.id, 'hired')}><span className="material-symbols-outlined" style={{ fontSize: 17 }}>handshake</span>Hire candidate</button>
        </div>
      </footer>
    </div>
  );
}
