import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { 
  Code, Trophy, Award, Presentation, Globe, MessageCircle, 
  UserX, ArrowLeft, Check, Handshake, ShieldAlert
} from 'lucide-react';
import TopNav from '../components/TopNav.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';
import './TalentReport.css';

const statusStyles = {
  hired: { color: '#92f1b1', label: 'Hired' },
  hold: { color: '#ffdd80', label: 'On hold' },
  rejected: { color: '#ff9da2', label: 'Rejected' },
};

function useCountUp(endValue, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime - delay;
      if (progress < 0) {
        animationFrame = requestAnimationFrame(tick);
        return;
      }
      const percentage = Math.min(progress / duration, 1);
      const easeProgress = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setValue(Math.floor(easeProgress * endValue));

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration, delay]);

  return value;
}

function MetricCard({ metric, index }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setWidth(metric.score), 250 + index * 100);
    return () => window.clearTimeout(timer);
  }, [index, metric.score]);

  return (
    <article className="glass-panel glass-panel--interactive metric-card metric-card-enhanced" style={{ animationDelay: index * 80 + 'ms' }}>
      <div className="metric-card-top">
        <span className="metric-icon" style={{ color: metric.color }}>{metric.icon}</span>
        <strong className="metric-number" style={{ color: metric.color }}>{metric.score}</strong>
      </div>
      <h3>{metric.label}</h3>
      <div className="score-bar">
        <span className="metric-bar-fill" style={{ width: width + '%', background: metric.color, boxShadow: '0 0 12px ' + metric.color }} />
      </div>
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

  const [toast, setToast] = useState({ visible: false, type: '', message: '' });

  const animatedScore = useCountUp(candidate?.talentScore || 0, 1500, 300);

  const handleDecision = (status, message) => {
    setCandidateStatus(candidate.id, status);
    setToast({ visible: true, type: status, message });
    setTimeout(() => setToast({ visible: false, type: '', message: '' }), 4000);
  };

  if (!candidate) {
    return (
      <div className="space-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="glass-panel empty-state" style={{ maxWidth: 450 }}>
          <UserX size={45} style={{ marginBottom: 12, color: '#668095' }} />
          This candidate dossier is unavailable.
          <br /><Link className="button button-primary" to="/recruiter" style={{ marginTop: 20 }}>Return to talent search</Link>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'GitHub repositories', icon: <Code size={20} />, score: candidate.githubScore, color: '#00e5ff', description: candidate.githubDesc },
    { label: 'Hackathon performance', icon: <Trophy size={20} />, score: candidate.hackathonScore, color: '#ffd54f', description: candidate.hackathonDesc },
    { label: 'Certifications', icon: <Award size={20} />, score: candidate.certScore, color: '#b7c6db', description: candidate.certDesc },
    { label: 'Public presentations', icon: <Presentation size={20} />, score: candidate.presentationScore, color: '#00e5ff', description: candidate.presentationDesc },
    { label: 'Open-source impact', icon: <Globe size={20} />, score: candidate.openSourceScore, color: '#ffd54f', description: candidate.openSourceDesc },
    { label: 'Community standing', icon: <MessageCircle size={20} />, score: candidate.socialScore, color: '#b7c6db', description: candidate.socialDesc },
  ];
  
  const status = candidate.status ? statusStyles[candidate.status] : null;

  return (
    <div className="space-page">
      <SpaceFabric className="page-fabric" />
      <TopNav role="recruiter" />
      <main className="content-wrap dossier">
        <button className="back-link" onClick={() => navigate(returnTo)} type="button">
          <ArrowLeft size={16} /> Back to talent search
        </button>

        <section className="glass-panel dossier-banner dossier-banner-enhanced">
          <div className="dossier-orbit">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" />
              <circle cx="50" cy="50" r="35" className="orbit-glow" />
              <circle cx="50" cy="50" r="25" />
            </svg>
          </div>

          <div className="dossier-main">
            <div className="avatar dossier-avatar" style={{ background: candidate.avatarColor }}>
              {candidate.initials}
              <span className="verified-dot"><Check size={14} strokeWidth={3} /></span>
            </div>
            <div>
              <div className="eyebrow">Classified · verified intelligence dossier</div>
              <h1>{candidate.name}</h1>
              <p className="dossier-title">
                {candidate.title} 
                {status && <span className="status-badge" style={{ marginLeft: 8, verticalAlign: 'middle', color: status.color, border: `1px solid ${status.color}` }}>{status.label}</span>}
              </p>
              <div className="dossier-skills">
                {candidate.skills.map((skill, index) => <span className={'chip ' + (index % 3 === 2 ? 'chip-gold' : '')} key={skill}>{skill}</span>)}
              </div>
            </div>
          </div>
          <div className="dossier-score dossier-score-glow">
            <strong>{animatedScore}</strong>
            <span>OVERALL TALENT SCORE / 100</span>
          </div>
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
          <button className="button button-danger" onClick={() => handleDecision('rejected', 'Candidate marked as Rejected')}>Reject</button>
          <button className="button button-ghost" onClick={() => handleDecision('hold', 'Candidate placed on Hold')}>Hold</button>
          <button className="button button-primary" onClick={() => handleDecision('hired', 'Candidate successfully Hired!')}>
            <Handshake size={17} /> Hire candidate
          </button>
        </div>
      </footer>

      <div className={`decision-toast ${toast.type} ${toast.visible ? 'show' : ''}`}>
        <span className="toast-icon">
          {toast.type === 'hired' && <Check size={18} />}
          {toast.type === 'hold' && <ShieldAlert size={18} />}
          {toast.type === 'rejected' && <UserX size={18} />}
        </span>
        {toast.message}
      </div>
    </div>
  );
}
