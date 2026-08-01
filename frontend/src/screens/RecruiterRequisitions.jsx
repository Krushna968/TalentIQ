import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';
import { ROUTES } from '../routes/paths.js';
import { jobApi } from '../lib/api.js';

const EMPTY_FORM = { title: '', department: '', location: '', employmentType: 'full_time', visibility: 'org' };

export default function RecruiterRequisitions() {
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [collabFor, setCollabFor] = useState(null); // { job, collaborators, userId, role }

  const flash = useCallback((m) => { setToast(m); window.setTimeout(() => setToast(''), 3000); }, []);

  const load = useCallback(async () => {
    setStatus('loading');
    try { setJobs((await jobApi.list()).jobs || []); setStatus('ready'); }
    catch (err) { setError(err.message); setStatus('error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function createJob(e) {
    e.preventDefault();
    if (!form.title.trim()) { flash('Title is required.'); return; }
    try {
      await jobApi.create(form);
      setCreateOpen(false); setForm(EMPTY_FORM);
      flash('Requisition created.');
      load();
    } catch (err) { flash(err.message); }
  }

  async function setStatusFor(job, next) {
    // Optimistic status flip with rollback.
    const prev = jobs;
    setJobs((js) => js.map((j) => (j.id === job.id ? { ...j, status: next } : j)));
    try { await jobApi.setStatus(job.id, next); }
    catch (err) { setJobs(prev); flash(err.message); }
  }

  async function setVisibility(job, visibility) {
    const prev = jobs;
    setJobs((js) => js.map((j) => (j.id === job.id ? { ...j, visibility } : j)));
    try { await jobApi.update(job.id, { visibility }); }
    catch (err) { setJobs(prev); flash(err.message); }
  }

  async function openCollab(job) {
    setCollabFor({ job, collaborators: [], userId: '', role: 'viewer', loading: true });
    try {
      const { collaborators } = await jobApi.collaborators(job.id);
      setCollabFor((c) => (c && c.job.id === job.id ? { ...c, collaborators, loading: false } : c));
    } catch (err) { flash(err.message); setCollabFor(null); }
  }

  async function addCollaborator() {
    const { job, userId, role } = collabFor;
    if (!userId.trim()) { flash('A user id is required.'); return; }
    try {
      await jobApi.addCollaborator(job.id, { userId: userId.trim(), role });
      const { collaborators } = await jobApi.collaborators(job.id);
      setCollabFor((c) => ({ ...c, collaborators, userId: '' }));
      flash('Collaborator added.');
    } catch (err) { flash(err.message); }
  }

  return (
    <div className="space-page">
      <SpaceFabric className="page-fabric" />
      <TopNav role="recruiter" />
      <main className="content-wrap">
        <div className="search-head">
          <div>
            <div className="eyebrow">Recruiter operations</div>
            <h1>Requisitions.</h1>
          </div>
          <button className="button button-primary" type="button" onClick={() => setCreateOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> New requisition
          </button>
        </div>

        {status === 'loading' && <div className="glass-panel empty-state">Loading requisitions…</div>}
        {status === 'error' && <div className="glass-panel empty-state">Couldn’t load: {error}</div>}
        {status === 'ready' && jobs.length === 0 && (
          <div className="glass-panel empty-state">
            <span className="material-symbols-outlined">work</span>
            No requisitions yet. Create your first one to open a hiring pipeline.
          </div>
        )}

        {status === 'ready' && jobs.length > 0 && (
          <div className="req-grid">
            {jobs.map((job) => (
              <article key={job.id} className="glass-panel req-card">
                <div className="req-card-head">
                  <div>
                    <h2 className="candidate-name" style={{ fontSize: 17 }}>{job.title}</h2>
                    <p className="candidate-role" style={{ fontSize: 13 }}>
                      {[job.department, job.location].filter(Boolean).join(' · ') || 'No details'}
                    </p>
                  </div>
                  <span className={'status-badge status-' + job.status}>{job.status}</span>
                </div>
                <div className="req-meta">
                  <span className="chip">{job._count?.entries ?? 0} in pipeline</span>
                  <span className="chip">{job._count?.collaborators ?? 0} collaborators</span>
                </div>
                <div className="req-controls">
                  <label className="req-visibility">
                    Visibility
                    <select className="pipe-select" value={job.visibility} onChange={(e) => setVisibility(job, e.target.value)}>
                      <option value="org">Whole org</option>
                      <option value="assigned">Assigned only</option>
                    </select>
                  </label>
                </div>
                <div className="req-actions">
                  {job.status === 'closed'
                    ? <button className="button button-cyan mini" type="button" onClick={() => setStatusFor(job, 'open')}>Reopen</button>
                    : <button className="button button-ghost mini" type="button" onClick={() => setStatusFor(job, 'closed')}>Close</button>}
                  <button className="button button-ghost mini" type="button" onClick={() => openCollab(job)}>Collaborators</button>
                  <Link className="button button-primary mini" to={ROUTES.RECRUITER_PIPELINE}>Open pipeline</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Create requisition modal */}
      {createOpen && (
        <div className="modal-scrim" onClick={() => setCreateOpen(false)}>
          <form className="glass-panel modal-card" onClick={(e) => e.stopPropagation()} onSubmit={createJob}>
            <div className="eyebrow">New requisition</div>
            <h2 style={{ margin: '6px 0 12px' }}>Open a role</h2>
            <label className="field-label">Title</label>
            <input className="text-input" value={form.title} autoFocus onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Backend Engineer" />
            <div className="field-row">
              <div><label className="field-label">Department</label><input className="text-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
              <div><label className="field-label">Location</label><input className="text-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <div className="field-row">
              <div>
                <label className="field-label">Employment</label>
                <select className="pipe-select wide" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                  <option value="full_time">Full-time</option><option value="part_time">Part-time</option>
                  <option value="contract">Contract</option><option value="intern">Intern</option>
                </select>
              </div>
              <div>
                <label className="field-label">Visibility</label>
                <select className="pipe-select wide" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                  <option value="org">Whole org</option><option value="assigned">Assigned only</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="button button-ghost" type="button" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="button button-primary" type="submit">Create requisition</button>
            </div>
          </form>
        </div>
      )}

      {/* Collaborators modal */}
      {collabFor && (
        <div className="modal-scrim" onClick={() => setCollabFor(null)}>
          <div className="glass-panel modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">Collaborators</div>
            <h2 style={{ margin: '6px 0 10px' }}>{collabFor.job.title}</h2>
            {collabFor.loading ? <p>Loading…</p> : (
              <div className="add-list">
                {collabFor.collaborators.map((c) => (
                  <div key={c.id} className="glass-panel add-row">
                    <span className="material-symbols-outlined">person</span>
                    <div style={{ flex: 1 }}><b>@{c.userId}</b></div>
                    <span className="chip">{c.role}</span>
                  </div>
                ))}
                {collabFor.collaborators.length === 0 && <p style={{ color: '#8aa0b6' }}>No collaborators yet.</p>}
              </div>
            )}
            <label className="field-label" style={{ marginTop: 10 }}>Add collaborator</label>
            <div className="field-row">
              <input className="text-input" placeholder="user id" value={collabFor.userId} onChange={(e) => setCollabFor({ ...collabFor, userId: e.target.value })} />
              <select className="pipe-select wide" value={collabFor.role} onChange={(e) => setCollabFor({ ...collabFor, role: e.target.value })}>
                <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="owner">Owner</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="button button-ghost" type="button" onClick={() => setCollabFor(null)}>Done</button>
              <button className="button button-primary" type="button" onClick={addCollaborator}>Add</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
