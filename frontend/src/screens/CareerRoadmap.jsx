import React, { useState } from 'react';
import PageShell, { Section, Stat, Meter } from '../components/PageShell.jsx';
import DataState, { ErrorNote } from '../components/DataState.jsx';
import { useApi, useAction } from '../hooks/useApi.js';
import { candidateApi } from '../lib/api.js';

/**
 * Career intelligence: growth trajectory, the skill gaps that matter for open
 * roles, and a checklist the candidate actually owns.
 */
export default function CareerRoadmap() {
  const roadmap = useApi(() => candidateApi.roadmap(), []);
  const learning = useApi(() => candidateApi.learning(), []);
  const timeline = useApi(() => candidateApi.timeline(), []);
  const salary = useApi(() => candidateApi.salary(), []);

  const [title, setTitle] = useState('');

  const addItem = useAction(async () => {
    if (!title.trim()) return;
    await candidateApi.addRoadmapItem({ title: title.trim() });
    setTitle('');
    await roadmap.reload({ silent: true });
  });

  const toggleItem = useAction(async (item) => {
    await candidateApi.updateRoadmapItem(item.id, { complete: !item.completedAt });
    await roadmap.reload({ silent: true });
  });

  const deleteItem = useAction(async (id) => {
    await candidateApi.deleteRoadmapItem(id);
    await roadmap.reload({ silent: true });
  });

  const items = roadmap.data?.items ?? [];
  const completed = items.filter((item) => item.completedAt).length;
  const history = timeline.data?.timeline ?? [];
  const first = history[0];
  const latest = history[history.length - 1];
  const delta = first && latest ? Math.round((latest.talentScore ?? 0) - (first.talentScore ?? 0)) : null;

  return (
    <PageShell
      role="candidate"
      eyebrow="Career intelligence"
      title="A clearer next move for your career."
      description="Prioritised from live market demand and the gaps in your own verified evidence."
    >
      <div className="stat-row">
        <Stat label="Roadmap items" value={items.length} />
        <Stat label="Completed" value={completed} tone={completed ? 'ok' : undefined} />
        <Stat
          label="Score movement"
          value={delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}`}
          tone={delta > 0 ? 'ok' : delta < 0 ? 'bad' : undefined}
          hint={history.length > 1 ? `across ${history.length} snapshots` : 'needs more history'}
        />
        <Stat
          label="Salary midpoint"
          value={salary.data ? `${salary.data.currency} ${(salary.data.range.p50 / 100000).toFixed(1)}L` : '—'}
          hint={salary.data ? `${salary.data.seniority} · ${salary.data.roleFamily}` : undefined}
        />
      </div>

      <Section title="Skill gaps worth closing" description="Ranked by how many open roles want the skill against how strongly you can evidence it.">
        <DataState
          loading={learning.loading}
          error={learning.error}
          empty={!learning.data?.gaps?.length}
          emptyMessage="No gaps found against the currently open roles. Check back as new jobs are posted."
          emptyIcon="school"
          onRetry={learning.reload}
        >
          <div className="gap-list">
            {(learning.data?.gaps ?? []).map((gap) => (
              <article key={gap.slug} className="gap-card">
                <div className="gap-head">
                  <div>
                    <strong>{gap.name}</strong>
                    <span className="muted"> · {gap.category}</span>
                  </div>
                  <span className={`chip${gap.impact === 'missing' ? '' : ' chip-gold'}`}>{gap.impact}</span>
                </div>
                <Meter label="Your evidenced level" value={gap.currentLevel} detail={`Wanted by ${gap.marketDemand} open role(s)`} />
                {gap.resources.length ? (
                  <ul className="resource-list">
                    {gap.resources.map((resource) => (
                      <li key={resource.url}>
                        <a href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a>
                        <span className="muted"> · {resource.provider}{resource.hours ? ` · ~${resource.hours}h` : ''}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No curated resource yet for this skill.</p>
                )}
              </article>
            ))}
          </div>
        </DataState>
      </Section>

      <Section title="Your plan" description="Track the concrete steps you commit to.">
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            addItem.run();
          }}
        >
          <input
            className="form-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ship one deployed case study with an architecture write-up"
            aria-label="New roadmap item"
          />
          <button className="button button-primary" type="submit" disabled={addItem.pending || !title.trim()}>
            {addItem.pending ? 'Adding…' : 'Add step'}
          </button>
        </form>
        <ErrorNote error={addItem.error || toggleItem.error || deleteItem.error} />

        <DataState
          loading={roadmap.loading}
          error={roadmap.error}
          empty={!items.length}
          emptyMessage="Your roadmap is empty. Add the first step above, or pick one from the skill gaps."
          emptyIcon="route"
          onRetry={roadmap.reload}
        >
          <ul className="roadmap-list">
            {items.map((item) => (
              <li key={item.id} className={`roadmap-row${item.completedAt ? ' roadmap-row--done' : ''}`}>
                <label className="roadmap-check">
                  <input type="checkbox" checked={Boolean(item.completedAt)} onChange={() => toggleItem.run(item)} />
                  <span>{item.title}</span>
                </label>
                <button className="icon-button" type="button" aria-label={`Delete ${item.title}`} onClick={() => deleteItem.run(item.id)}>
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                </button>
              </li>
            ))}
          </ul>
        </DataState>
      </Section>

      <Section title="Score history" description="Every recalculation is snapshotted, so growth is measured against your own past.">
        <DataState
          loading={timeline.loading}
          error={timeline.error}
          empty={history.length < 2}
          emptyMessage="Not enough history yet. Recalculate your score again after adding evidence to start the trend."
          emptyIcon="timeline"
          onRetry={timeline.reload}
        >
          <div className="spark-table">
            {history.slice(-12).map((point) => (
              <div key={point.capturedAt} className="spark-col" title={`${new Date(point.capturedAt).toLocaleString()} — ${point.talentScore}`}>
                <div className="spark-bar" style={{ height: `${Math.max(4, point.talentScore ?? 0)}%` }} />
                <span className="spark-label">{new Date(point.capturedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </DataState>
      </Section>

      {salary.data ? (
        <Section title="Indicative salary band" description={salary.data.caveat}>
          <div className="salary-band">
            <div className="salary-points">
              <span><small>p25</small><strong>{salary.data.currency} {salary.data.range.p25.toLocaleString()}</strong></span>
              <span className="salary-mid"><small>median</small><strong>{salary.data.currency} {salary.data.range.p50.toLocaleString()}</strong></span>
              <span><small>p75</small><strong>{salary.data.currency} {salary.data.range.p75.toLocaleString()}</strong></span>
            </div>
            <ul className="driver-list">
              {salary.data.drivers.map((driver) => <li key={driver}>{driver}</li>)}
            </ul>
            <p className="muted">Basis: {salary.data.basis} · confidence {salary.data.confidence}/100</p>
          </div>
        </Section>
      ) : null}
    </PageShell>
  );
}
