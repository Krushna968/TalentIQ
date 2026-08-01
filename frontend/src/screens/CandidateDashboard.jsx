import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { aiApi, evidenceApi, githubApi, linkedInApi } from '../lib/api.js';
import TopNav from '../components/TopNav.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import RadarChart from '../components/RadarChart.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';

const tabs = ['Overview', 'GitHub', 'Resume', 'LinkedIn', 'Evidence', 'Commits', 'Skills', 'Network'];
const activities = [
  ['Merged data-validation improvements into the contributor graph.', '2 hours ago', 'active'],
  ['AWS Solutions Architect certification was verified at source.', 'Yesterday', 'gold'],
  ['Completed the advanced graph algorithms learning path.', '3 days ago', ''],
];

const roadmap = [
  { phase: '01', timeframe: 'Now / weeks 1–2', title: 'Systems design proof', detail: 'Ship one architecture case study with clear trade-offs.', evidence: 'Design brief + repository', progress: 72, state: 'active', icon: 'account_tree' },
  { phase: '02', timeframe: 'Build / weeks 3–6', title: 'Web3 architecture', detail: 'Connect protocol-level work to a deployable project.', evidence: 'Demo + verified commits', progress: 36, state: 'next', icon: 'token' },
  { phase: '03', timeframe: 'Show / weeks 7–12', title: 'Applied ML signal', detail: 'Publish an evaluation-led AI feature with outcomes.', evidence: 'Case study + presentation', progress: 0, state: 'planned', icon: 'neurology' },
];

function RoadmapPreview() {
  const completed = roadmap.filter((step) => step.progress >= 100).length;
  const active = roadmap.find((step) => step.state === 'active');
  return <section className="glass-panel roadmap-card">
    <div className="roadmap-card-glow" />
    <div className="roadmap-card-header"><div><div className="eyebrow">90-day growth plan</div><h2>Career Roadmap</h2></div><Link to="/candidate/roadmap" className="roadmap-open-link">Open AI roadmap <span className="material-symbols-outlined">arrow_outward</span></Link></div>
    <p className="roadmap-lede">Build stronger proof for your next full-stack opportunity, one verified outcome at a time.</p>
    <div className="roadmap-overview"><div><span>PLAN PROGRESS</span><strong>{active.progress}%</strong></div><div className="roadmap-progress-track"><i style={{ width: `${active.progress}%` }} /></div><small>{completed} of {roadmap.length} stages complete / next review in 5 days</small></div>
    <div className="roadmap-stages">{roadmap.map((step) => <article className={`roadmap-stage ${step.state}`} key={step.phase}>
      <div className="roadmap-stage-marker"><span>{step.phase}</span><i className="material-symbols-outlined">{step.icon}</i></div>
      <div className="roadmap-stage-copy"><div><span>{step.timeframe}</span><b>{step.state === 'active' ? 'In progress' : step.state === 'next' ? 'Up next' : 'Planned'}</b></div><h3>{step.title}</h3><p>{step.detail}</p><small><span className="material-symbols-outlined">verified</span>{step.evidence}</small>{step.progress > 0 && <div className="roadmap-mini-progress"><i style={{ width: `${step.progress}%` }} /></div>}</div>
    </article>)}</div>
  </section>;
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
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
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

  useEffect(() => {
    if (!syncing) return undefined;
    let active = true;
    const poll = async () => {
      try {
        const { job } = await githubApi.getSyncStatus(candidateId);
        if (!active || !job) return;
        if (job.status === 'COMPLETED') {
          const [nextProfile, score] = await Promise.all([githubApi.getProfile(candidateId), githubApi.getTalentScore(candidateId)]);
          if (!active) return;
          setProfile(nextProfile);
          setTalentScore(score);
          onScore?.(score);
          setMessage('Sync completed. Your verified GitHub signals are up to date.');
          setSyncing(false);
        } else if (job.status === 'FAILED' || job.status === 'DEAD_LETTER') {
          setMessage('GitHub sync needs attention. Please try again shortly.');
          setSyncing(false);
        }
      } catch {
        if (active) setMessage('Unable to read GitHub sync status.');
      }
    };
    void poll();
    const intervalId = window.setInterval(() => void poll(), 3_000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, [candidateId, onScore, syncing]);
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
    setSyncing(true);
    setMessage('GitHub sync queued...');
    try {
      await githubApi.triggerSync(candidateId);
      setMessage('GitHub sync queued. We will refresh your profile when it finishes.');
    } catch (err) {
      setSyncing(false);
      console.error('Sync error:', err);
      setMessage('Unable to queue GitHub sync: ' + err.message);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setMessage('Disconnecting GitHub...');
    try {
      await githubApi.disconnect(candidateId);
      setProfile(null);
      setTalentScore(null);
      onScore?.(null);
      setStatus('disconnected');
      setMessage('GitHub account disconnected.');
    } catch (err) {
      setMessage('Unable to disconnect GitHub: ' + err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  if (status === 'loading') {
    return <section className="glass-panel integration-panel" style={{ padding: 32, textAlign: 'center' }}><p className="muted">Checking GitHub connection...</p></section>;
  }

  if (status === 'disconnected') {
    return (
      <section className="glass-panel integration-panel" style={{ padding: 32, textAlign: 'center' }}>
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
    <section className="glass-panel integration-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Connected source</div>
          <h2>GitHub Profile</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleSync} disabled={disconnecting || syncing} style={{ fontSize: 12, padding: '6px 14px' }}>{syncing ? 'Syncing...' : 'Re-sync'}</button>
          <button className="btn btn-secondary" onClick={handleDisconnect} disabled={disconnecting} style={{ fontSize: 12, padding: '6px 14px', color: '#ff9da2' }}>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</button>
        </div>
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

function ResumeTab({ candidate, onScore }) {
  const [targetRole, setTargetRole] = useState(candidate.title);
  const [resumeFile, setResumeFile] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selectFile = (event) => {
    const file = event.target.files?.[0] || null;
    setReport(null);
    if (file && file.size > 5 * 1024 * 1024) {
      setResumeFile(null);
      setMessage('Resume files must be 5 MB or smaller.');
      return;
    }
    setResumeFile(file);
    setMessage('');
  };

  const scoreResume = async (event) => {
    event.preventDefault();
    if (!resumeFile || !targetRole.trim()) return;
    setLoading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('targetRole', targetRole.trim());
    try {
      const result = await aiApi.resumeUploadScore(formData);
      setReport(result);
      onScore(result.score);
      setMessage('Resume analysis added to your overall score.');
    } catch (error) {
      setMessage(error.message || 'Unable to score this resume.');
    } finally {
      setLoading(false);
    }
  };

  return <section className="glass-panel integration-panel resume-panel">
    <div className="panel-heading"><div><div className="eyebrow">Resume intelligence</div><h2>Upload & score your resume</h2></div><span className="chip chip-gold">PDF / DOCX / TXT</span></div>
    <p className="muted">Choose a role, upload your resume, and receive an explainable score. The file is read in memory only and is not stored.</p>
    <form onSubmit={scoreResume} className="integration-form">
      <label>Target role<input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} required /></label>
      <label className="file-picker"><span className="file-picker-button"><span className="material-symbols-outlined">upload_file</span> Choose resume file</span><input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={selectFile} /></label>
      <div className="file-status">{resumeFile ? <><span className="material-symbols-outlined">description</span><span>{resumeFile.name} ({Math.ceil(resumeFile.size / 1024)} KB)</span></> : 'No file selected yet'}</div>
      <button className="btn btn-primary" type="submit" disabled={!resumeFile || !targetRole.trim() || loading}>{loading ? 'Reading and scoring...' : 'Upload and score resume'}</button>
    </form>
    {message && <p className="integration-message" role="status">{message}</p>}
    {report && <div className="resume-report">
      <div className="resume-report-score"><div><div className="eyebrow">Resume analysis</div><strong>{report.score}<small>/100</small></strong><span>Scored for {report.targetRole}</span></div><div className="resume-average-note">Overall score now averages your TalentIQ evidence score and this resume score.</div></div>
      <div className="resume-component-grid">{report.components.map((component) => <article key={component.key}><div><strong>{component.label}</strong><span>{component.score}/{component.max}</span></div><div className="score-bar"><span style={{ width: `${(component.score / component.max) * 100}%`, background: 'linear-gradient(90deg, #00e5ff, #ffd54f)' }} /></div><p>{component.detail}</p></article>)}</div>
      <div className="resume-evidence"><span>{report.evidence.wordCount} words extracted</span><span>{report.evidence.metrics} measurable outcomes</span><span>{report.evidence.actionVerbs} action verbs</span></div>
      {report.suggestions.length > 0 && <div className="resume-suggestions"><strong>Best improvements</strong><ul>{report.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul></div>}
    </div>}
  </section>;
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
    setMessage('');
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

  if (status === 'loading') return <section className="glass-panel integration-panel"><p className="muted">Checking LinkedIn connection...</p></section>;

  return <section className="glass-panel integration-panel linkedin-panel">
    <span className="material-symbols-outlined integration-icon">badge</span>
    <div className="eyebrow">Professional identity</div>
    <h2>{status === 'connected' ? 'LinkedIn verified' : 'Connect LinkedIn'}</h2>
    {status === 'connected' ? <>
      {profile?.avatarUrl && <img src={profile.avatarUrl} alt="" className="integration-avatar" />}
      <p className="muted">{profile?.name || 'Professional identity'}{profile?.email ? ` / ${profile.email}` : ''}</p>
      <p className="muted integration-copy">Connected {profile?.connectedAt ? new Date(profile.connectedAt).toLocaleDateString() : ''}. Identity evidence is included in score confidence.</p>
      {profile?.syncStatus === 'preview' && <span className="chip">Connection preview</span>}
    </> : <>
      <p className="muted integration-copy">Verify your professional identity with LinkedIn. TalentIQ requests only basic profile and email permissions.</p>
      <button className="btn btn-primary" onClick={connect} disabled={connecting}>{connecting ? 'Redirecting to LinkedIn...' : 'Connect LinkedIn account'}</button>
    </>}
    {message && <p className="integration-message" role="status">{message}</p>}
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

  return <section className="glass-panel integration-panel" style={{ padding: 28 }}>
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

function formatCommitTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function CommitsView({ candidateId, onOpenGitHub }) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    githubApi.getProfile(candidateId)
      .then((data) => { if (active) { setProfile(data); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('empty'); });
    return () => { active = false; };
  }, [candidateId]);

  if (status === 'loading') return <section className="glass-panel alternate-view commit-evidence-panel"><p className="muted">Loading verified commit evidence...</p></section>;
  const records = profile?.repos?.flatMap((repo) => (repo.commits || []).map((commit) => ({ ...commit, repoName: repo.name, repoUrl: repo.url, key: `${repo.id}-${commit.id}` }))).sort((a, b) => new Date(b.committedAt) - new Date(a.committedAt)).slice(0, 10) || [];

  if (records.length === 0) return <section className="glass-panel alternate-view commit-evidence-panel empty-evidence"><div className="eyebrow">GitHub evidence</div><h2 className="section-heading" style={{ fontSize: 26 }}>No synced commits yet</h2><p className="muted">Connect GitHub or run a re-sync to show real repository activity here. TalentIQ never invents commit evidence.</p><button className="btn btn-primary" onClick={onOpenGitHub}>Open GitHub connection</button></section>;

  const uniqueRepos = new Set(records.map((record) => record.repoName)).size;
  return <section className="glass-panel alternate-view commit-evidence-panel"><div className="panel-heading"><div><div className="eyebrow">GitHub evidence</div><h2 className="section-heading" style={{ fontSize: 26 }}>Recent verified commits</h2></div><span className="chip chip-gold">{records.length} sampled commits</span></div><p className="muted commit-intro">Synced directly from connected public repositories. Each record remains attributable to its repository and commit SHA.</p><div className="commit-summary"><div><strong>{uniqueRepos}</strong><span>repositories represented</span></div><div><strong>{records.length}</strong><span>recent commit records</span></div><div><strong>{profile?.languageSummary?.length || 0}</strong><span>languages in evidence</span></div></div><div className="commit-evidence-list">{records.map((record, index) => <article className={`commit-evidence-row ${index === 0 ? 'latest' : ''}`} key={record.key}><i className="timeline-dot active" style={{ position: 'static' }} /><div className="commit-evidence-main"><div className="commit-evidence-meta"><a href={record.repoUrl} target="_blank" rel="noopener noreferrer">{record.repoName}</a><span>{record.sha?.slice(0, 7) || 'verified'}</span></div><h3>{record.message?.split('\n')[0] || 'Commit message unavailable'}</h3>{record.authorName && <p>Committed by {record.authorName}</p>}</div><time>{formatCommitTime(record.committedAt)}</time></article>)}</div></section>;
}
function SkillsView({ candidate }) {
  return <section className="glass-panel alternate-view"><div className="eyebrow">Skill distribution</div><h2 className="section-heading" style={{ fontSize: 26 }}>Demonstrated technical depth</h2><div className="skill-bars">{candidate.radar.map((item, index) => <div key={item.axis}><div className="skill-label"><span>{item.axis}</span><b>{item.value}%</b></div><div className="skill-track"><div className="skill-fill" style={{ width: item.value + '%', animationDelay: index * 90 + 'ms' }} /></div></div>)}</div></section>;
}

function NetworkView() {
  const nodes = [['Krushna', 'central', '45%', '42%'], ['GraphQL', '', '17%', '21%'], ['React', '', '75%', '18%'], ['Node', '', '78%', '68%'], ['AWS', '', '22%', '73%'], ['tRPC', '', '50%', '80%']];
  return <section className="glass-panel alternate-view"><div className="eyebrow">Neo4j talent graph</div><h2 className="section-heading" style={{ fontSize: 26 }}>Your connected skill network</h2><div className="network-view"><i className="network-line" style={{ left: '49%', top: '50%', width: '35%', transform: 'rotate(-31deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '33%', transform: 'rotate(-143deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '34%', transform: 'rotate(36deg)' }} /><i className="network-line" style={{ left: '49%', top: '50%', width: '32%', transform: 'rotate(146deg)' }} />{nodes.map(([label, cls, left, top]) => <span key={label} className={cls} style={{ left, top }}>{label}</span>)}</div></section>;
}

export default function CandidateDashboard() {
  const { candidates } = useApp();
  const candidate = candidates[0];
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchParams] = useSearchParams();
  const [notification, setNotification] = useState('');
  const [liveScore, setLiveScore] = useState(null);
  const [resumeScore, setResumeScore] = useState(null);
  const evidenceScore = liveScore?.score ?? candidate.talentScore;
  const overallScore = resumeScore === null ? evidenceScore : Math.round((evidenceScore + resumeScore) / 2);

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
            <div className="dashboard-score"><ScoreRing score={overallScore} size={138} label="Overall score" />
              <span>{resumeScore === null ? 'Upload a resume to add its analysis.' : `Average: evidence ${evidenceScore} + resume ${resumeScore}`}</span></div>
          </header>
          <div className="tab-list" role="tablist" aria-label="Candidate dashboard views">
            {tabs.map((tab) => <button className={'tab ' + (activeTab === tab ? 'active' : '')} role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          {activeTab === 'Overview' && <Overview candidate={candidate} />}
          {activeTab === 'GitHub' && <GitHubTab candidateId={candidate.id} onScore={setLiveScore} />}
          {activeTab === 'Resume' && <ResumeTab candidate={candidate} onScore={setResumeScore} />}
          {activeTab === 'LinkedIn' && <LinkedInTab candidateId={candidate.id} />}
          {activeTab === 'Evidence' && <EvidenceTab candidateId={candidate.id} />}
          {activeTab === 'Commits' && <CommitsView candidateId={candidate.id} onOpenGitHub={() => setActiveTab('GitHub')} />}
          {activeTab === 'Skills' && <SkillsView candidate={candidate} />}
          {activeTab === 'Network' && <NetworkView />}
        </section>

        <aside className="side-stack">
          <RoadmapPreview />
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
