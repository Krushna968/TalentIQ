import React, { useEffect, useMemo, useState } from 'react';
import PageShell, { Section, Stat } from '../components/PageShell.jsx';
import DataState, { ErrorNote, SuccessNote } from '../components/DataState.jsx';
import { useApi, useAction } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { candidateApi, evidenceApi, githubApi, linkedInApi, intelligenceApi } from '../lib/api.js';

const EVIDENCE_SOURCES = [
  { value: 'credential', label: 'Certificate or credential' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'presentation', label: 'Talk or presentation' },
  { value: 'project', label: 'Project' },
  { value: 'assessment', label: 'Assessment' },
];

const STATUS_TONE = {
  VERIFIED: 'ok',
  REJECTED: 'bad',
  EXPIRED: 'bad',
  UNDER_REVIEW: 'warn',
  SUBMITTED: 'warn',
  DRAFT: 'muted',
};

/**
 * Digital Talent Identity: the candidate's profile, connected accounts, and the
 * evidence behind every claim.
 */
export default function CandidateProfile() {
  const { candidateId } = useAuth();

  const profile = useApi(() => candidateApi.profile(), [candidateId]);
  const evidence = useApi(() => (candidateId ? evidenceApi.list(candidateId, { pageSize: 100 }) : Promise.resolve(null)), [candidateId]);
  const github = useApi(() => (candidateId ? githubApi.checkConnection(candidateId) : Promise.resolve(null)), [candidateId]);
  const linkedin = useApi(() => (candidateId ? linkedInApi.checkConnection(candidateId) : Promise.resolve(null)), [candidateId]);
  const agents = useApi(() => (candidateId ? intelligenceApi.agents(candidateId) : Promise.resolve(null)), [candidateId]);

  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!profile.data) return;
    const { candidate, profile: details } = profile.data;
    setForm({
      name: candidate.name || '',
      title: candidate.title || '',
      location: candidate.location || '',
      bio: candidate.bio || '',
      headline: details.headline || '',
      website: details.website || '',
      visibility: details.visibility || 'RECRUITERS',
    });
  }, [profile.data]);

  const save = useAction(async () => {
    await candidateApi.updateProfile(form);
    await profile.reload({ silent: true });
  });

  const connectGithub = useAction(async () => {
    const { url, mode } = await githubApi.getOAuthUrl();
    if (url) window.location.href = url;
    else throw new Error(mode === 'preview' ? 'GitHub OAuth is not configured on this server.' : 'GitHub is unavailable.');
  });

  const syncGithub = useAction(async () => {
    await githubApi.triggerSync(candidateId);
    await github.reload({ silent: true });
    await agents.reload({ silent: true });
  });

  const disconnectGithub = useAction(async () => {
    await githubApi.disconnect(candidateId);
    await github.reload({ silent: true });
  });

  const connectLinkedIn = useAction(async () => {
    const { url, mode } = await linkedInApi.getOAuthUrl();
    if (url) window.location.href = url;
    else if (mode === 'preview') {
      await linkedInApi.createPreviewConnection(candidateId);
      await linkedin.reload({ silent: true });
    }
  });

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const records = evidence.data?.evidence ?? [];
  const grouped = useMemo(() => {
    const map = new Map();
    for (const record of records) map.set(record.source, [...(map.get(record.source) || []), record]);
    return [...map.entries()];
  }, [records]);

  const verifiedCount = records.filter((record) => record.status === 'VERIFIED').length;

  return (
    <PageShell
      role="candidate"
      eyebrow="Digital talent identity"
      title="Your verified professional signal."
      description="Everything a recruiter sees is traceable to a source. Connect accounts and submit evidence to strengthen it."
    >
      <div className="stat-row">
        <Stat label="Evidence records" value={records.length} />
        <Stat label="Verified" value={verifiedCount} tone={verifiedCount ? 'ok' : undefined} />
        <Stat label="GitHub" value={github.data?.connected ? 'Connected' : 'Not connected'} tone={github.data?.connected ? 'ok' : 'muted'} />
        <Stat label="LinkedIn" value={linkedin.data?.connected ? 'Connected' : 'Not connected'} tone={linkedin.data?.connected ? 'ok' : 'muted'} />
      </div>

      <Section title="Profile" description="Shown to recruiters alongside your evidence.">
        <DataState loading={profile.loading} error={profile.error} onRetry={profile.reload}>
          {form ? (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                save.run();
              }}
            >
              <label>
                <span className="form-label">Name</span>
                <input className="form-input" value={form.name} onChange={set('name')} required />
              </label>
              <label>
                <span className="form-label">Title</span>
                <input className="form-input" value={form.title} onChange={set('title')} placeholder="Full-Stack Engineer" />
              </label>
              <label>
                <span className="form-label">Location</span>
                <input className="form-input" value={form.location} onChange={set('location')} placeholder="Bengaluru, India" />
              </label>
              <label>
                <span className="form-label">Website</span>
                <input className="form-input" value={form.website} onChange={set('website')} placeholder="https://" />
              </label>
              <label className="form-grid-wide">
                <span className="form-label">Headline</span>
                <input className="form-input" value={form.headline} onChange={set('headline')} placeholder="One line that describes what you build" />
              </label>
              <label className="form-grid-wide">
                <span className="form-label">About</span>
                <textarea className="form-input" rows={4} value={form.bio} onChange={set('bio')} />
              </label>
              <label>
                <span className="form-label">Visible to</span>
                <select className="form-input" value={form.visibility} onChange={set('visibility')}>
                  <option value="PRIVATE">Only me</option>
                  <option value="RECRUITERS">Recruiters</option>
                  <option value="PUBLIC">Anyone with the link</option>
                </select>
              </label>
              <div className="form-grid-wide form-actions">
                <button className="button button-primary" type="submit" disabled={save.pending}>
                  {save.pending ? 'Saving…' : 'Save profile'}
                </button>
                <ErrorNote error={save.error} />
                {save.done ? <SuccessNote>Profile saved.</SuccessNote> : null}
              </div>
            </form>
          ) : null}
        </DataState>
      </Section>

      <Section title="Connected accounts" description="Connected sources are synced and scored automatically.">
        <div className="connection-grid">
          <article className="connection-card">
            <div className="connection-head">
              <span className="material-symbols-outlined" aria-hidden="true">code</span>
              <div>
                <strong>GitHub</strong>
                <p className="muted">
                  {github.data?.connected
                    ? `@${github.data.profile.githubUsername} · ${github.data.profile.publicRepos ?? 0} public repos · sync ${github.data.profile.syncStatus}`
                    : 'Proof of work from your repositories, commits and languages.'}
                </p>
              </div>
            </div>
            <div className="connection-actions">
              {github.data?.connected ? (
                <>
                  <button className="button button-ghost" type="button" onClick={() => syncGithub.run()} disabled={syncGithub.pending}>
                    {syncGithub.pending ? 'Syncing…' : 'Sync now'}
                  </button>
                  <button className="button button-danger" type="button" onClick={() => disconnectGithub.run()} disabled={disconnectGithub.pending}>
                    Disconnect
                  </button>
                </>
              ) : (
                <button className="button button-primary" type="button" onClick={() => connectGithub.run()} disabled={connectGithub.pending}>
                  Connect GitHub
                </button>
              )}
            </div>
            <ErrorNote error={connectGithub.error || syncGithub.error || disconnectGithub.error} />
          </article>

          <article className="connection-card">
            <div className="connection-head">
              <span className="material-symbols-outlined" aria-hidden="true">badge</span>
              <div>
                <strong>LinkedIn</strong>
                <p className="muted">
                  {linkedin.data?.connected ? `${linkedin.data.profile.name || 'Connected'} · verified identity` : 'Verifies your professional identity.'}
                </p>
              </div>
            </div>
            <div className="connection-actions">
              {linkedin.data?.connected ? (
                <span className="chip chip-gold">Connected</span>
              ) : (
                <button className="button button-primary" type="button" onClick={() => connectLinkedIn.run()} disabled={connectLinkedIn.pending}>
                  Connect LinkedIn
                </button>
              )}
            </div>
            <ErrorNote error={connectLinkedIn.error} />
          </article>
        </div>
      </Section>

      <EvidenceSection candidateId={candidateId} evidence={evidence} />

      <Section title="What each agent found" description="Seven specialist agents read your evidence independently.">
        <DataState
          loading={agents.loading}
          error={agents.error}
          empty={!Object.keys(agents.data?.agents || {}).length}
          emptyMessage="No agent has run yet. Connect a source or submit evidence, then recalculate from your overview."
          emptyIcon="smart_toy"
          onRetry={agents.reload}
        >
          <div className="agent-grid">
            {Object.entries(agents.data?.agents || {}).map(([name, result]) => (
              <article key={name} className="agent-card">
                <header>
                  <strong>{name}</strong>
                  <span className="agent-score">{result.score}</span>
                </header>
                <p className="muted">{result.summary}</p>
                <footer>
                  <span className="chip">{result.engine}</span>
                  <span className="muted">confidence {result.confidence}</span>
                </footer>
              </article>
            ))}
          </div>
        </DataState>
      </Section>
    </PageShell>
  );
}

/** Evidence list plus the add-evidence form. */
function EvidenceSection({ candidateId, evidence }) {
  const blank = { source: 'credential', title: '', issuer: '', referenceUrl: '', referenceId: '', issuedAt: '', description: '' };
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);

  const create = useAction(async () => {
    const payload = { ...form };
    if (!payload.issuedAt) delete payload.issuedAt;
    if (!payload.referenceUrl) delete payload.referenceUrl;
    const { evidence: created } = await evidenceApi.create(candidateId, payload);
    await evidenceApi.submit(candidateId, created.id);
    setForm(blank);
    setOpen(false);
    await evidence.reload({ silent: true });
  });

  const remove = useAction(async (id) => {
    await evidenceApi.remove(candidateId, id);
    await evidence.reload({ silent: true });
  });

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const records = evidence.data?.evidence ?? [];

  return (
    <Section
      title="Evidence"
      description="Each record is checked by the verification layer before it counts toward your score."
      actions={
        <button className="button button-primary" type="button" onClick={() => setOpen((value) => !value)}>
          {open ? 'Cancel' : 'Add evidence'}
        </button>
      }
    >
      {open ? (
        <form
          className="form-grid evidence-form"
          onSubmit={(event) => {
            event.preventDefault();
            create.run();
          }}
        >
          <label>
            <span className="form-label">Type</span>
            <select className="form-input" value={form.source} onChange={set('source')}>
              {EVIDENCE_SOURCES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">Title</span>
            <input className="form-input" required value={form.title} onChange={set('title')} placeholder="AWS Certified Developer" />
          </label>
          <label>
            <span className="form-label">Issuer or event</span>
            <input className="form-input" value={form.issuer} onChange={set('issuer')} placeholder="Amazon Web Services" />
          </label>
          <label>
            <span className="form-label">Issued on</span>
            <input className="form-input" type="date" value={form.issuedAt} onChange={set('issuedAt')} />
          </label>
          <label>
            <span className="form-label">Verification link</span>
            <input className="form-input" type="url" value={form.referenceUrl} onChange={set('referenceUrl')} placeholder="https://issuer.example/verify/ID" />
          </label>
          <label>
            <span className="form-label">Credential ID</span>
            <input className="form-input" value={form.referenceId} onChange={set('referenceId')} />
          </label>
          <label className="form-grid-wide">
            <span className="form-label">What did you do?</span>
            <textarea className="form-input" rows={3} value={form.description} onChange={set('description')} placeholder="Describe your own contribution, not the team's." />
          </label>
          <div className="form-grid-wide form-actions">
            <button className="button button-primary" type="submit" disabled={create.pending}>
              {create.pending ? 'Submitting…' : 'Submit for verification'}
            </button>
            <ErrorNote error={create.error} />
          </div>
        </form>
      ) : null}

      <DataState
        loading={evidence.loading}
        error={evidence.error}
        empty={!records.length}
        emptyMessage="No evidence submitted yet. Add a credential, hackathon or project to get scored."
        emptyIcon="workspace_premium"
        onRetry={evidence.reload}
      >
        <ul className="evidence-list">
          {records.map((record) => (
            <li key={record.id} className="evidence-row">
              <div className="evidence-main">
                <div className="evidence-title">
                  <strong>{record.title}</strong>
                  <span className={`status-pill status-pill--${STATUS_TONE[record.status] || 'muted'}`}>{record.status.replace('_', ' ').toLowerCase()}</span>
                </div>
                <p className="muted">
                  {record.source}
                  {record.issuer ? ` · ${record.issuer}` : ''}
                  {record.issuedAt ? ` · ${new Date(record.issuedAt).getFullYear()}` : ''}
                  {record.score !== null && record.score !== undefined ? ` · scored ${record.score}` : ''}
                </p>
                {record.reviews?.[0]?.reason ? <p className="evidence-reason">Reviewer: {record.reviews[0].reason}</p> : null}
              </div>
              <div className="evidence-actions">
                {record.referenceUrl ? (
                  <a className="button button-ghost" href={record.referenceUrl} target="_blank" rel="noreferrer">Verify</a>
                ) : null}
                {['DRAFT', 'REJECTED'].includes(record.status) ? (
                  <button className="button button-danger" type="button" onClick={() => remove.run(record.id)} disabled={remove.pending}>
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </DataState>
      <ErrorNote error={remove.error} />
    </Section>
  );
}
