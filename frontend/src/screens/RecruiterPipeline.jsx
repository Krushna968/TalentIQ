import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/TopNav.jsx';
import SpaceFabric from '../components/SpaceFabric.jsx';
import { jobApi, pipelineApi } from '../lib/api.js';

const DECISION_LABELS = { hire: 'Hire', hold: 'Hold', reject: 'Reject' };

function initialsOf(name = '') {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function RecruiterPipeline() {
  const { candidates } = useApp();
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [board, setBoard] = useState(null); // { job, stages, entries }
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [decisionModal, setDecisionModal] = useState(null); // { entry, decision, reason }
  const [drawer, setDrawer] = useState(null); // { entry, events, loading, note }
  const [addOpen, setAddOpen] = useState(false);

  const flash = useCallback((msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3200);
  }, []);

  // Load the recruiter's requisitions once.
  useEffect(() => {
    let alive = true;
    jobApi.list()
      .then((res) => {
        if (!alive) return;
        setJobs(res.jobs || []);
        setJobId((cur) => cur || res.jobs?.[0]?.id || '');
        if (!res.jobs?.length) setStatus('empty');
      })
      .catch((err) => { if (alive) { setError(err.message); setStatus('error'); } });
    return () => { alive = false; };
  }, []);

  const loadBoard = useCallback(async (id) => {
    if (!id) return;
    setStatus('loading');
    try {
      const data = await pipelineApi.board(id);
      setBoard(data);
      setSelected(new Set());
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => { if (jobId) loadBoard(jobId); }, [jobId, loadBoard]);

  const orderedStages = useMemo(
    () => (board?.stages ? [...board.stages].sort((a, b) => a.order - b.order) : []),
    [board],
  );
  const stageById = useMemo(() => Object.fromEntries(orderedStages.map((s) => [s.id, s])), [orderedStages]);
  const entriesByStage = useMemo(() => {
    const map = Object.fromEntries(orderedStages.map((s) => [s.id, []]));
    for (const e of board?.entries || []) (map[e.currentStageId] ||= []).push(e);
    return map;
  }, [board, orderedStages]);

  // Optimistically patch one entry in local state; returns a rollback snapshot.
  function patchEntry(entryId, patch) {
    let snapshot = null;
    setBoard((b) => {
      snapshot = b;
      return { ...b, entries: b.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) };
    });
    return () => setBoard(snapshot);
  }

  async function moveEntry(entry, toStageId) {
    if (!toStageId || toStageId === entry.currentStageId) return;
    const rollback = patchEntry(entry.id, { currentStageId: toStageId });
    try {
      const { entry: updated } = await pipelineApi.moveStage(entry.id, toStageId, entry.updatedAt);
      patchEntry(entry.id, updated); // refresh updatedAt token
    } catch (err) {
      rollback();
      if (err.status === 409) { flash('This candidate changed elsewhere — refreshing.'); loadBoard(jobId); }
      else flash(err.message);
    }
  }

  function moveByOffset(entry, offset) {
    const idx = orderedStages.findIndex((s) => s.id === entry.currentStageId);
    const next = orderedStages[idx + offset];
    if (next) moveEntry(entry, next.id);
  }

  async function submitDecision() {
    const { entry, decision, reason } = decisionModal;
    if (!reason?.trim()) { flash('A decision reason is required.'); return; }
    // Optimistically move hire->Hired / reject->Rejected; hold stays put.
    const target = decision === 'hire'
      ? orderedStages.find((s) => s.name === 'Hired')
      : decision === 'reject'
        ? orderedStages.find((s) => s.name === 'Rejected')
        : null;
    const rollback = target ? patchEntry(entry.id, { currentStageId: target.id }) : () => {};
    setDecisionModal(null);
    try {
      const { entry: updated } = await pipelineApi.decide(entry.id, decision, reason.trim());
      patchEntry(entry.id, updated);
      flash(`Recorded ${DECISION_LABELS[decision]} for ${entry.candidate.name}.`);
    } catch (err) {
      rollback();
      flash(err.message);
    }
  }

  async function toggleShortlist(entry) {
    const rollback = patchEntry(entry.id, { shortlisted: !entry.shortlisted });
    try { await pipelineApi.shortlist(entry.id, !entry.shortlisted); }
    catch (err) { rollback(); flash(err.message); }
  }

  async function toggleAssignee(entry) {
    const me = 'demo-user';
    const next = entry.assignedToUserId === me ? null : me;
    const rollback = patchEntry(entry.id, { assignedToUserId: next });
    try { await pipelineApi.assign(entry.id, next); }
    catch (err) { rollback(); flash(err.message); }
  }

  async function openDrawer(entry) {
    setDrawer({ entry, events: [], loading: true, note: '' });
    try {
      const { events } = await pipelineApi.timeline(entry.id);
      setDrawer((d) => (d && d.entry.id === entry.id ? { ...d, events, loading: false } : d));
    } catch (err) { flash(err.message); setDrawer(null); }
  }

  async function submitNote() {
    const body = drawer.note?.trim();
    if (!body) return;
    try {
      await pipelineApi.addNote(drawer.entry.id, body);
      const { events } = await pipelineApi.timeline(drawer.entry.id);
      setDrawer((d) => ({ ...d, events, note: '' }));
    } catch (err) { flash(err.message); }
  }

  function toggleSelect(id) {
    setSelected((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function bulkMove(toStageId) {
    if (!toStageId || selected.size === 0) return;
    try {
      const res = await pipelineApi.bulk({ entryIds: [...selected], action: 'move', toStageId });
      flash(`Moved ${res.applied} of ${res.total} candidates.`);
      setSelected(new Set());
      loadBoard(jobId);
    } catch (err) { flash(err.message); }
  }

  const inPipeline = useMemo(
    () => new Set((board?.entries || []).map((e) => e.candidateId)),
    [board],
  );
  const addable = candidates.filter((c) => !inPipeline.has(c.id));

  async function addCandidates(ids) {
    try {
      const res = await pipelineApi.addCandidates(jobId, ids);
      flash(`Added ${res.added} candidate${res.added === 1 ? '' : 's'} to the pipeline.`);
      setAddOpen(false);
      loadBoard(jobId);
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
            <h1>Hiring pipeline.</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {jobs.length > 0 && (
              <select className="pipe-select" value={jobId} onChange={(e) => setJobId(e.target.value)} aria-label="Select requisition">
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.status === 'closed' ? ' (closed)' : ''}</option>)}
              </select>
            )}
            <button className="button button-primary" type="button" onClick={() => setAddOpen(true)} disabled={!jobId}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> Add candidates
            </button>
          </div>
        </div>

        {status === 'loading' && <div className="glass-panel empty-state">Loading pipeline…</div>}
        {status === 'error' && <div className="glass-panel empty-state">Couldn’t load the pipeline: {error}</div>}
        {status === 'empty' && (
          <div className="glass-panel empty-state">
            <span className="material-symbols-outlined">work</span>
            No requisitions yet. Create one from the Requisitions screen to start a pipeline.
          </div>
        )}

        {status === 'ready' && board && (
          <>
            {selected.size > 0 && (
              <div className="glass-panel bulk-bar">
                <span>{selected.size} selected</span>
                <select className="pipe-select" defaultValue="" onChange={(e) => { bulkMove(e.target.value); e.target.value = ''; }} aria-label="Bulk move to stage">
                  <option value="" disabled>Move all to…</option>
                  {orderedStages.filter((s) => !s.isTerminal).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button className="button button-ghost" type="button" onClick={() => setSelected(new Set())}>Clear</button>
              </div>
            )}

            <div className="pipeline-board">
              {orderedStages.map((stage) => {
                const items = entriesByStage[stage.id] || [];
                return (
                  <section key={stage.id} className={'pipeline-column' + (stage.isTerminal ? ' terminal' : '')}>
                    <header className="pipeline-col-head">
                      <span>{stage.name}</span>
                      <b>{items.length}</b>
                    </header>
                    <div className="pipeline-col-body">
                      {items.length === 0 && <p className="pipeline-empty">No candidates</p>}
                      {items.map((entry) => {
                        const stageIdx = orderedStages.findIndex((s) => s.id === entry.currentStageId);
                        return (
                          <article key={entry.id} className={'glass-panel pipeline-card' + (selected.has(entry.id) ? ' selected' : '')}>
                            <div className="pipeline-card-top">
                              <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleSelect(entry.id)} aria-label={`Select ${entry.candidate.name}`} />
                              <div className="avatar" style={{ width: 38, height: 38 }}>{initialsOf(entry.candidate.name)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 className="candidate-name" style={{ fontSize: 15 }}>{entry.candidate.name}</h3>
                                <p className="candidate-role" style={{ fontSize: 12 }}>{entry.candidate.title}</p>
                              </div>
                              <button className={'star-btn' + (entry.shortlisted ? ' on' : '')} type="button" title="Shortlist" onClick={() => toggleShortlist(entry)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{entry.shortlisted ? 'star' : 'star_outline'}</span>
                              </button>
                            </div>
                            <div className="pipeline-card-meta">
                              <span className="chip">Score {entry.candidate.talentScore ?? '—'}</span>
                              <button className="assignee-chip" type="button" onClick={() => toggleAssignee(entry)} title="Assign to me">
                                {entry.assignedToUserId ? `@${entry.assignedToUserId}` : 'Unassigned'}
                              </button>
                            </div>
                            <div className="pipeline-card-actions">
                              <button className="icon-mini" type="button" disabled={stageIdx <= 0 || stage.isTerminal} onClick={() => moveByOffset(entry, -1)} title="Move back">
                                <span className="material-symbols-outlined">chevron_left</span>
                              </button>
                              <div className="decision-group">
                                <button className="button button-cyan mini" type="button" onClick={() => setDecisionModal({ entry, decision: 'hire', reason: '' })}>Hire</button>
                                <button className="button button-ghost mini" type="button" onClick={() => setDecisionModal({ entry, decision: 'hold', reason: '' })}>Hold</button>
                                <button className="button button-danger mini" type="button" onClick={() => setDecisionModal({ entry, decision: 'reject', reason: '' })}>Reject</button>
                              </div>
                              <button className="icon-mini" type="button" disabled={stageIdx >= orderedStages.length - 1 || stage.isTerminal} onClick={() => moveByOffset(entry, 1)} title="Move forward">
                                <span className="material-symbols-outlined">chevron_right</span>
                              </button>
                            </div>
                            <button className="timeline-link" type="button" onClick={() => openDrawer(entry)}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>history</span> Timeline & notes
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Decision modal — reason required */}
      {decisionModal && (
        <div className="modal-scrim" onClick={() => setDecisionModal(null)}>
          <div className="glass-panel modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">{DECISION_LABELS[decisionModal.decision]} decision</div>
            <h2 style={{ margin: '6px 0 4px' }}>{decisionModal.entry.candidate.name}</h2>
            <p style={{ color: '#8aa0b6', marginTop: 0, fontSize: 13 }}>This is recorded permanently on the decision timeline.</p>
            <label className="field-label" htmlFor="decision-reason">Reason</label>
            <textarea
              id="decision-reason" className="text-area" rows={3} autoFocus
              value={decisionModal.reason}
              onChange={(e) => setDecisionModal((m) => ({ ...m, reason: e.target.value }))}
              placeholder="Why this decision? (required)"
            />
            <div className="modal-actions">
              <button className="button button-ghost" type="button" onClick={() => setDecisionModal(null)}>Cancel</button>
              <button className="button button-primary" type="button" onClick={submitDecision} disabled={!decisionModal.reason.trim()}>
                Record {DECISION_LABELS[decisionModal.decision]}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline & notes drawer */}
      {drawer && (
        <div className="drawer-scrim" onClick={() => setDrawer(null)}>
          <aside className="glass-panel drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">Decision timeline</div>
                <h2 style={{ margin: '4px 0 0' }}>{drawer.entry.candidate.name}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setDrawer(null)} aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="drawer-body">
              {drawer.loading ? <p>Loading…</p> : (
                <ol className="timeline">
                  {drawer.events.map((ev) => (
                    <li key={ev.id} className="timeline-item">
                      <span className={'timeline-dot ' + ev.type} />
                      <div>
                        <b>{describeEvent(ev, stageById)}</b>
                        <small>{ev.actorName} · {new Date(ev.createdAt).toLocaleString()}</small>
                        {ev.reason && <p className="timeline-reason">“{ev.reason}”</p>}
                        {ev.type === 'note' && ev.body && <p className="timeline-reason">{ev.body}</p>}
                      </div>
                    </li>
                  ))}
                  {drawer.events.length === 0 && <p>No activity yet.</p>}
                </ol>
              )}
            </div>
            <div className="drawer-foot">
              <textarea className="text-area" rows={2} placeholder="Add a note…" value={drawer.note}
                onChange={(e) => setDrawer((d) => ({ ...d, note: e.target.value }))} />
              <button className="button button-primary" type="button" onClick={submitNote} disabled={!drawer.note.trim()}>Add note</button>
            </div>
          </aside>
        </div>
      )}

      {/* Add candidates picker */}
      {addOpen && (
        <div className="modal-scrim" onClick={() => setAddOpen(false)}>
          <div className="glass-panel modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="eyebrow">Add candidates</div>
            <h2 style={{ margin: '6px 0 10px' }}>Add to this pipeline</h2>
            {addable.length === 0 ? <p>All demo candidates are already in the pipeline.</p> : (
              <div className="add-list">
                {addable.map((c) => (
                  <button key={c.id} className="glass-panel add-row" type="button" onClick={() => addCandidates([c.id])}>
                    <div className="avatar" style={{ width: 34, height: 34, background: c.avatarColor }}>{c.initials}</div>
                    <div style={{ flex: 1 }}><b>{c.name}</b><small style={{ display: 'block', color: '#8aa0b6' }}>{c.title}</small></div>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="button button-ghost" type="button" onClick={() => setAddOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function describeEvent(ev, stageById) {
  const to = ev.toStageId && stageById[ev.toStageId]?.name;
  const from = ev.fromStageId && stageById[ev.fromStageId]?.name;
  switch (ev.type) {
    case 'added': return `Added to pipeline${to ? ` · ${to}` : ''}`;
    case 'stage_change': return ev.reason === 'reopened' ? `Reopened${to ? ` → ${to}` : ''}` : `Moved ${from || '—'} → ${to || '—'}`;
    case 'decision': return `Decision: ${DECISION_LABELS[ev.decision] || ev.decision}`;
    case 'assignment': return ev.body ? `Assigned to @${ev.body}` : 'Unassigned';
    case 'note': return 'Note added';
    default: return ev.type;
  }
}
