import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { githubApi } from '../lib/api.js';
import TopNav from '../components/TopNav.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import RadarChart from '../components/RadarChart.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';
import './CandidateDashboard.css';

const tabs = ['Overview', 'GitHub', 'Commits', 'Skills', 'Network'];
const activities = [
  ['Merged data-validation improvements into the contributor graph.', '2 hours ago', 'active'],
  ['AWS Solutions Architect certification was verified at source.', 'Yesterday', 'gold'],
  ['Completed the advanced graph algorithms learning path.', '3 days ago', ''],
];
const commits = [
  ['feat: add graph signal normalization', 'talentiq/verification-engine · 28 files changed', '2h ago'],
  ['fix: resolve edge-case in confidence model', 'talentiq/skill-graph · 11 files changed', '1d ago'],
  ['docs: publish contributor-quality rubric', 'aditi/engineering-notes · 1 file changed', '3d ago'],
];
const roadmap = [
  ['Distributed systems', 'Strengthen systems design signal'],
  ['Web3 architecture', 'Connect protocol-level proof of work'],
  ['Applied ML', 'Expand model evaluation fluency'],
];

// Custom hook for count-up animations
function useCountUp(endValue, duration = 1500, delay = 0) {
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
      // easeOutExpo
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

function ActivityTimeline() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const update = () => setActiveIndex(Math.min(activities.length - 1, Math.floor(window.scrollY / 220)));
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return activities.map(([copy, time, accent], index) => (
    <div className="roadmap-item" key={copy} onMouseEnter={() => setActiveIndex(index)}>
      <i className={'timeline-dot ' + (accent === 'gold' ? 'gold' : '') + (activeIndex === index ? ' active' : '')} />
      <div><strong>{copy}</strong><span>{time}</span></div>
    </div>
  ));
}

function StatCard({ icon, label, value, subtitle, delay = 0 }) {
  const count = useCountUp(value, 1500, delay);
  return (
    <div className="stat-card">
      <span className="material-symbols-outlined stat-icon">{icon}</span>
      <div className="stat-card-header">
        <span className="material-symbols-outlined stat-card-icon">{icon}</span>
        <span className="stat-card-title">{label}</span>
      </div>
      <div className="stat-card-value">{count}</div>
      <span className="stat-card-subtitle">{subtitle}</span>
    </div>
  );
}

function Overview({ candidate }) {
  return (
    <>
      <section className="glass-panel competency-panel">
        <div className="panel-heading">
          <div><div className="eyebrow">Live telemetry</div><h2>Competency Matrix</h2></div>
          <span className="chip chip-gold">Evidence weighted</span>
        </div>
        <div className="hologram-upgraded">
          <div className="hologram-scanner"></div>
          <RadarChart data={candidate.radar} />
        </div>
      </section>
      <section className="stat-card-grid">
        <StatCard icon="code" label="GitHub" value={34} subtitle="Verified Repos" delay={0} />
        <StatCard icon="workspace_premium" label="Credentials" value={4} subtitle="Active Certs" delay={150} />
        <StatCard icon="emoji_events" label="Hackathons" value={12} subtitle="Wins & Podiums" delay={300} />
        <StatCard icon="groups" label="Network" value={86} subtitle="Graph Connections" delay={450} />
      </section>
    </>
  );
}

function GitHubTab({ candidateId }) {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    githubApi.checkConnection(candidateId)
      .then((data) => {
        if (data.connected) {
          setStatus('connected');
          setProfile(data.profile);
          return githubApi.getProfile(candidateId).then((p) => setProfile(p));
        }
        setStatus('disconnected');
      })
      .catch(() => setStatus('disconnected'));
  }, [candidateId]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await githubApi.getOAuthUrl();
      window.location.href = data.url;
    } catch (err) {
      setConnecting(false);
      setMessage('Failed to initiate GitHub connection');
    }
  };

  const handleSync = async () => {
    setMessage('Syncing...');
    try {
      await githubApi.triggerSync(candidateId);
      const p = await githubApi.getProfile(candidateId);
      setProfile(p);
      setMessage('Sync completed');
    } catch (err) {
      console.error('Sync error:', err);
      setMessage('Sync failed: ' + err.message);
    }
  };

  if (status === 'loading') {
    return <section className="glass-panel" style={{ padding: 32, textAlign: 'center' }}><p className="muted">Checking GitHub connection...</p></section>;
  }

  if (status === 'disconnected') {
    return (
      <section className="glass-panel" style={{ padding: 32, textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>code</span>
        <h2 style={{ marginBottom: 8 }}>Connect GitHub</h2>
        <p className="muted" style={{ marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
          Link your GitHub account to automatically surface your repos, commits, and language data as verified signals on your talent profile.
        </p>
        <button className="btn btn-primary" onClick={handleConnect} disabled={connecting} style={{ opacity: connecting ? 0.7 : 1, cursor: connecting ? 'wait' : 'pointer' }}>
          {connecting ? (
            <><span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 1s linear infinite' }}>sync</span> Redirecting to GitHub...</>
          ) : (
            <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Connect GitHub Account</>
          )}
        </button>
        {message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}
      </section>
    );
  }

  return (
    <section className="glass-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Connected source</div>
          <h2>GitHub Profile</h2>
        </div>
        <button className="btn btn-secondary" onClick={handleSync} style={{ fontSize: 12, padding: '6px 14px' }}>
          Re-sync
        </button>
      </div>

      {profile && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {profile.avatarUrl && <img src={profile.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(255,215,0,0.3)' }} />}
            <div>
              <strong style={{ fontSize: 18 }}>{profile.name || profile.githubUsername}</strong>
              <p className="muted">@{profile.githubUsername}</p>
              {profile.bio && <p style={{ fontSize: 13, marginTop: 4 }}>{profile.bio}</p>}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 24, textAlign: 'center' }}>
              <div><strong>{profile.publicRepos ?? '-'}</strong><p className="muted" style={{ fontSize: 11 }}>Repos</p></div>
              <div><strong>{profile.followers ?? '-'}</strong><p className="muted" style={{ fontSize: 11 }}>Followers</p></div>
              <div><strong>{profile.following ?? '-'}</strong><p className="muted" style={{ fontSize: 11 }}>Following</p></div>
            </div>
          </div>

          {profile.languageSummary?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, marginBottom: 12, opacity: 0.7 }}>Languages</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {profile.languageSummary.map((lang) => (
                  <span className="chip" key={lang.language}>
                    {lang.language} {lang.percentage ? `${lang.percentage}%` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.repos?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, marginBottom: 12, opacity: 0.7 }}>Top Repositories</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {profile.repos.slice(0, 10).map((repo) => (
                  <div key={repo.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.5 }}>folder</span>
                    <div style={{ flex: 1 }}>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                        <strong>{repo.name}</strong>
                      </a>
                      {repo.description && <p className="muted" style={{ fontSize: 12 }}>{repo.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, opacity: 0.6 }}>
                      {repo.language && <span>{repo.language}</span>}
                      <span>★ {repo.stars}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {message && <p className="muted" style={{ marginTop: 12, textAlign: 'center' }}>{message}</p>}
    </section>
  );
}

function CommitsView() {
  return <section className="glass-panel alternate-view"><div className="eyebrow">Proof of work</div><h2 className="section-heading" style={{ fontSize: 26 }}>Recent verified commits</h2>{commits.map(([title, detail, time], index) => <div className="commit-row" key={title}><i className={'timeline-dot ' + (index === 0 ? 'active' : '')} style={{ position: 'static', marginTop: 4 }} /><div><h3>{title}</h3><p>{detail}</p></div><time>{time}</time></div>)}</section>;
}

function SkillsView({ candidate }) {
  return <section className="glass-panel alternate-view"><div className="eyebrow">Skill distribution</div><h2 className="section-heading" style={{ fontSize: 26 }}>Demonstrated technical depth</h2><div className="skill-bars">{candidate.radar.map((item, index) => <div key={item.axis}><div className="skill-label"><span>{item.axis}</span><b>{item.value}%</b></div><div className="skill-track"><div className="skill-fill" style={{ width: item.value + '%', animationDelay: index * 90 + 'ms' }} /></div></div>)}</div></section>;
}

function NetworkView() {
  const nodes = [
    { label: 'Aditi', type: 'central', cx: '50%', cy: '50%', r: 35 },
    { label: 'GraphQL', type: 'node', cx: '20%', cy: '25%', r: 24 },
    { label: 'React', type: 'node', cx: '80%', cy: '22%', r: 24 },
    { label: 'Node', type: 'node', cx: '82%', cy: '72%', r: 24 },
    { label: 'AWS', type: 'node', cx: '25%', cy: '78%', r: 24 },
    { label: 'tRPC', type: 'node', cx: '55%', cy: '85%', r: 24 }
  ];

  return (
    <section className="glass-panel alternate-view">
      <div className="eyebrow">Neo4j talent graph</div>
      <h2 className="section-heading" style={{ fontSize: 26, marginBottom: 20 }}>Your connected skill network</h2>
      <div className="network-hologram">
        <svg className="network-svg" width="100%" height="100%">
          {nodes.filter(n => n.type !== 'central').map((node, i) => (
             <line key={i} x1="50%" y1="50%" x2={node.cx} y2={node.cy} className="network-edge" />
          ))}
        </svg>
        {nodes.map(node => (
          <div 
            key={node.label} 
            className={`network-node ${node.type}`} 
            style={{ left: node.cx, top: node.cy, width: node.r * 2, height: node.r * 2 }}
          >
            {node.label}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CandidateDashboard() {
  const { candidates } = useApp();
  const candidate = candidates[0];
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchParams] = useSearchParams();
  const [notification, setNotification] = useState('');

  const activeTabIndex = tabs.indexOf(activeTab);

  useEffect(() => {
    const gh = searchParams.get('github');
    if (gh === 'connected') {
      setNotification(`GitHub connected as ${searchParams.get('user') || ''}`);
      setActiveTab('GitHub');
      window.history.replaceState({}, '', '/candidate');
    } else if (gh === 'error') {
      setNotification('GitHub connection failed. Please try again.');
      window.history.replaceState({}, '', '/candidate');
    }
  }, [searchParams]);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(''), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  return (
    <div className="space-page">
      <SpaceFabric className="page-fabric" />
      <TopNav role="candidate" />
      <main className="content-wrap dashboard-layout">
        <section>
          {notification && (
            <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: 16, borderLeft: '3px solid rgb(255,215,0)' }}>
              {notification}
            </div>
          )}
          <header className="glass-panel dashboard-hero">
            <div>
              <div className="eyebrow">Personal telemetry center</div>
              <h1>{candidate.name}</h1>
              <p>{candidate.title} · Your verified proof-of-work cockpit.</p>
              <div className="dossier-skills">{candidate.skills.slice(0, 4).map((skill) => <span className="chip" key={skill}>{skill}</span>)}</div>
            </div>
            <ScoreRing score={candidate.talentScore} size={138} label="Talent score" />
          </header>
          
          <div className="tab-list" role="tablist" aria-label="Candidate dashboard views">
            <div 
              className="tab-indicator" 
              style={{ 
                left: `calc(${activeTabIndex} * (100% / ${tabs.length}) + 5px)`, 
                width: `calc((100% - 10px) / ${tabs.length})` 
              }} 
            />
            {tabs.map((tab) => (
              <button 
                className={'tab ' + (activeTab === tab ? 'active' : '')} 
                role="tab" 
                aria-selected={activeTab === tab} 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ zIndex: 2 }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Overview' && <Overview candidate={candidate} />}
          {activeTab === 'GitHub' && <GitHubTab candidateId={candidate.id} />}
          {activeTab === 'Commits' && <CommitsView />}
          {activeTab === 'Skills' && <SkillsView candidate={candidate} />}
          {activeTab === 'Network' && <NetworkView />}
        </section>

        <aside className="side-stack">
          <section className="glass-panel side-card">
            <div className="panel-heading"><div><div className="eyebrow">Growth signal</div><h2>Career Roadmap</h2></div><Link to="/interview" className="icon-button" aria-label="Practice for your next assessment"><span className="material-symbols-outlined">arrow_outward</span></Link></div>
            <div style={{ marginTop: 12 }}>{roadmap.map(([name, detail], index) => <div className="roadmap-item" key={name}><i className={'timeline-dot ' + (index === 0 ? 'active' : '')} /><div><strong>{name}</strong><span>{detail}</span></div></div>)}</div>
          </section>
          <section className="glass-panel side-card">
            <div className="eyebrow">Activity stream</div>
            <h2 className="font-space" style={{ margin: '10px 0 9px', fontSize: 20, letterSpacing: '-.03em' }}>Recent activity</h2>
            <div>{<ActivityTimeline />}</div>
          </section>
        </aside>
      </main>
    </div>
  );
}
