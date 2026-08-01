import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { evidenceApi, githubApi, linkedInApi } from '../lib/api.js';
import TopNav from '../components/TopNav.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import RadarChart from '../components/RadarChart.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';

const tabs = ['Overview', 'GitHub', 'LinkedIn', 'Evidence', 'Commits', 'Skills', 'Network'];
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

function Overview({ candidate }) {
  return (
    <>
      <section className="glass-panel competency-panel">
        <div className="panel-heading">
          <div><div className="eyebrow">Live telemetry</div><h2>Competency Matrix</h2></div>
          <span className="chip chip-gold">Evidence weighted</span>
        </div>
        <div className="hologram"><RadarChart data={candidate.radar} /></div>
      </section>
      <section className="verified-grid">
        {[['code', 'GitHub', 'Connected'], ['workspace_premium', 'Credentials', 'Verified'], ['emoji_events', 'Hackathons', 'Scored'], ['groups', 'Network', 'Mapped']].map(([icon, label, status]) => (
          <div className="glass-panel glass-panel--interactive verified-card" key={label}>
            <span className="material-symbols-outlined">{icon}</span><strong>{label}</strong><span className="muted" style={{ display: 'block', marginTop: 4, fontSize: 11 }}>{status}</span>
          </div>
        ))}
      </section>
    </>
  );
}

function GitHubTab({ candidateId, onScore }) {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [talentScore, setTalentScore] = useState(null);

  useEffect(() => {
    githubApi.checkConnection(candidateId)
      .then((data) => {
        if (data.connected) {
          setStatus('connected');
          setProfile(data.profile);
          return Promise.all([githubApi.getProfile(candidateId), githubApi.getTalentScore(candidateId)])
            .then(([p, score]) => { setProfile(p); setTalentScore(score); onScore?.(score); });
        }
        setStatus('disconnected');
      })
      .catch(() => setStatus('disconnected'));
  }, [candidateId]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const data = await githubApi.getOAuthUrl(candidateId);
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
      const [p, score] = await Promise.all([githubApi.getProfile(candidateId), githubApi.getTalentScore(candidateId)]);
      setProfile(p);
      setTalentScore(score);
      onScore?.(score);
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

          {talentScore && (
            <div style={{ marginBottom: 24, padding: 16, borderRadius: 10, background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.18)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div><div className="eyebrow">Evidence-calculated</div><strong>Talent Score</strong></div>
                <strong style={{ color: '#00e5ff', fontSize: 28 }}>{talentScore.score}<span className="muted" style={{ fontSize: 13 }}>/100</span></strong>
              </div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>Confidence: {talentScore.confidence}% · based on {talentScore.evidence.repositories} repositories, {talentScore.evidence.commits} sampled commits, and {talentScore.evidence.languages} languages.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 8 }}>
                {talentScore.components.map((component) => <div key={component.key} style={{ fontSize: 12 }}><span className="muted">{component.label}</span><strong style={{ display: 'block' }}>{component.score}/{component.max}</strong></div>)}
              </div>
            </div>
          )}

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

function LinkedInTab({ candidateId }) {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    linkedInApi.checkConnection(candidateId)
      .then(({ connected, profile: data }) => { setStatus(connected ? 'connected' : 'disconnected'); setProfile(data); })
      .catch(() => setStatus('disconnected'));
  }, [candidateId]);

  const connect = async () => {
    setConnecting(true);
    try {
      const { url, mode } = await linkedInApi.getOAuthUrl(candidateId);
      if (mode === 'preview') {
        const result = await linkedInApi.createPreviewConnection(candidateId);
        setProfile(result.profile);
        setStatus('connected');
        setMessage('Professional profile connected.');
        return;
      }
      window.location.href = url;
    } catch (error) {
      setConnecting(false);
      setMessage(error.message || 'LinkedIn connection is unavailable.');
    }
  };

  if (status === 'loading') return <section className="glass-panel" style={{ padding: 32, textAlign: 'center' }}><p className="muted">Checking LinkedIn connection...</p></section>;

  return <section className="glass-panel" style={{ padding: 32, textAlign: 'center' }}>
    <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12, color: '#79c7ff' }}>badge</span>
    <div className="eyebrow">Professional identity</div>
    <h2 style={{ margin: '8px 0' }}>{status === 'connected' ? 'LinkedIn verified' : 'Connect LinkedIn'}</h2>
    {status === 'connected' ? <>
      {profile?.avatarUrl && <img src={profile.avatarUrl} alt="" style={{ width: 58, height: 58, borderRadius: '50%', margin: '10px auto' }} />}
      <p className="muted">{profile?.name || 'Professional identity'}{profile?.email ? ` · ${profile.email}` : ''}</p>
      <p className="muted" style={{ fontSize: 12 }}>Connected {profile?.connectedAt ? new Date(profile.connectedAt).toLocaleDateString() : ''}. Identity evidence is included in score confidence.</p>
      {profile?.syncStatus === 'preview' && <span className="chip" style={{ marginTop: 8 }}>Connection preview</span>}
    </> : <>
      <p className="muted" style={{ maxWidth: 470, margin: '0 auto 20px' }}>Verify your professional identity with LinkedIn. TalentIQ only requests basic profile and email permissions.</p>
      <button className="btn btn-primary" onClick={connect} disabled={connecting} style={{ opacity: connecting ? 0.7 : 1 }}>
        {connecting ? 'Redirecting to LinkedIn...' : 'Connect LinkedIn Account'}
      </button>
    </>}
    {message && <p className="muted" style={{ marginTop: 12 }}>{message}</p>}
  </section>;
}

function EvidenceTab({ candidateId }) {
  const [evidence, setEvidence] = useState([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ source: 'credential', title: '', issuer: '', referenceUrl: '' });

  const loadEvidence = () => evidenceApi.list(candidateId).then(({ evidence: records }) => setEvidence(records)).catch(() => setMessage('Unable to load evidence.'));
  useEffect(() => { loadEvidence(); }, [candidateId]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setMessage('');
    try {
      await evidenceApi.submit(candidateId, form);
      setForm({ source: 'credential', title: '', issuer: '', referenceUrl: '' });
      setMessage('Evidence submitted for verification. It will affect your score only after approval.');
      await loadEvidence();
    } catch (error) { setMessage(error.message || 'Unable to submit evidence.'); }
    finally { setSaving(false); }
  };

  return <section className="glass-panel" style={{ padding: 28 }}>
    <div className="panel-heading"><div><div className="eyebrow">Verified evidence</div><h2>Credentials, achievements & assessments</h2></div></div>
    <p className="muted" style={{ margin: '0 0 18px', fontSize: 13 }}>Add a public proof URL for credentials, hackathons, presentations, assessments, or interview results. Only verified records contribute to your Talent Score.</p>
    <form onSubmit={submit} style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
      <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
        <option value="credential">Credential</option><option value="hackathon">Hackathon</option><option value="assessment">Assessment</option><option value="interview">Interview</option><option value="presentation">Presentation</option>
      </select>
      <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title or achievement" />
      <input value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} placeholder="Issuer or organiser" />
      <input type="url" value={form.referenceUrl} onChange={(event) => setForm({ ...form, referenceUrl: event.target.value })} placeholder="Public verification URL" />
      <button className="btn btn-primary" type="submit" disabled={saving} style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>{saving ? 'Submitting...' : 'Submit for verification'}</button>
    </form>
    {message && <p className="muted" style={{ marginTop: 14 }}>{message}</p>}
    <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
      {evidence.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>No submitted evidence yet.</p> : evidence.map((item) => <div key={item.id} style={{ padding: '11px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><strong>{item.title}</strong><p className="muted" style={{ fontSize: 11 }}>{item.source}{item.issuer ? ` · ${item.issuer}` : ''}</p></div><span className="chip">{item.status}</span></div>)}
    </div>
  </section>;
}

function CommitsView() {
  return <section className="glass-panel alternate-view"><div className="eyebrow">Proof of work</div><h2 className="section-heading" style={{ fontSize: 26 }}>Recent verified commits</h2>{commits.map(([title, detail, time], index) => <div className="commit-row" key={title}><i className={'timeline-dot ' + (index === 0 ? 'active' : '')} style={{ position: 'static', marginTop: 4 }} /><div><h3>{title}</h3><p>{detail}</p></div><time>{time}</time></div>)}</section>;
}

function SkillsView({ candidate }) {
  return <section className="glass-panel alternate-view"><div className="eyebrow">Skill distribution</div><h2 className="section-heading" style={{ fontSize: 26 }}>Demonstrated technical depth</h2><div className="skill-bars">{candidate.radar.map((item, index) => <div key={item.axis}><div className="skill-label"><span>{item.axis}</span><b>{item.value}%</b></div><div className="skill-track"><div className="skill-fill" style={{ width: item.value + '%', animationDelay: index * 90 + 'ms' }} /></div></div>)}</div></section>;
}

function NetworkView() {
  const nodes = [['Aditi', 'central', '45%', '42%'], ['GraphQL', '', '17%', '21%'], ['React', '', '75%', '18%'], ['Node', '', '78%', '68%'], ['AWS', '', '22%', '73%'], ['tRPC', '', '50%', '80%']];
  return <section className="glass-panel alternate-view"><div className="eyebrow">Neo4j talent graph</div><h2 className="section-heading" style={{ fontSize: 26 }}>Your connected skill network</h2><div className="network-view"><i className="network-line" style={{ left: '49%', top: '50%', width: '35%', transform: 'rotate(-31deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '33%', transform: 'rotate(-143deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '34%', transform: 'rotate(36deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '32%', transform: 'rotate(146deg)' }} />{nodes.map(([label, cls, left, top]) => <span key={label} className={cls} style={{ left, top }}>{label}</span>)}</div></section>;
}

export default function CandidateDashboard() {
  const { candidates } = useApp();
  const candidate = candidates[0];
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchParams] = useSearchParams();
  const [notification, setNotification] = useState('');
  const [liveScore, setLiveScore] = useState(null);

  useEffect(() => {
    githubApi.getTalentScore(candidate.id).then(setLiveScore).catch(() => undefined);
  }, [candidate.id]);

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
    const linkedIn = searchParams.get('linkedin');
    if (linkedIn === 'connected') {
      setNotification('LinkedIn identity connected and verified.');
      setActiveTab('LinkedIn');
      window.history.replaceState({}, '', '/candidate');
    } else if (linkedIn === 'error') {
      setNotification('LinkedIn connection failed. Please try again.');
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
            <ScoreRing score={liveScore?.score ?? candidate.talentScore} size={138} label="Talent score" />
          </header>
          <div className="tab-list" role="tablist" aria-label="Candidate dashboard views">
            {tabs.map((tab) => <button className={'tab ' + (activeTab === tab ? 'active' : '')} role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          {activeTab === 'Overview' && <Overview candidate={candidate} />}
          {activeTab === 'GitHub' && <GitHubTab candidateId={candidate.id} onScore={setLiveScore} />}
          {activeTab === 'LinkedIn' && <LinkedInTab candidateId={candidate.id} />}
          {activeTab === 'Evidence' && <EvidenceTab candidateId={candidate.id} />}
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
