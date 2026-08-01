import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav.jsx';
import { passportApi } from '../lib/api.js';
import './PassportScreen.css';

export default function PassportScreen() {
  const [passport, setPassport] = useState(null);
  const [error, setError] = useState('');
  const [queued, setQueued] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  useEffect(() => {
    passportApi.getFeatured().then(setPassport).catch(() => setError('The Passport service is unavailable. Start the backend and sign in as a recruiter to inspect the seeded demo.'));
  }, []);

  const queueInterview = async () => {
    try {
      await passportApi.queueTargetedInterview(passport.candidate.id);
      setQueued(true);
    } catch {
      setError('The interview could not be queued. Please try again when the API is available.');
    }
  };

  return <div className="passport-page"><TopNav role="recruiter" />
    <main className="passport-shell">
      {error && <div className="passport-alert" role="alert">{error}</div>}
      {!passport && !error && <div className="passport-loading">Building decision-ready evidence brief…</div>}
      {passport && <>
        <section className="passport-hero">
          <div><p className="passport-eyebrow">ROLE-SPECIFIC PROOF-TO-HIRE PASSPORT</p><h1>{passport.candidate.name}</h1><p className="passport-headline">{passport.candidate.headline}</p><p className="passport-muted">{passport.candidate.location} · Evidence collected with candidate consent</p></div>
          <div className="passport-decision"><span>Recommendation</span><strong>{passport.recommendation}</strong><p>Human review required</p></div>
        </section>
        <section className="passport-metrics">
          <Metric label="Role readiness" value={`${passport.metrics.readiness}%`} help={`for ${passport.role.title}`} />
          <Metric label="Evidence confidence" value={`${passport.metrics.evidenceConfidence}%`} help="source quality + consistency" />
          <Metric label="Trust risk" value={`${passport.metrics.trustRisk}/100`} help="items requiring review" risk />
          <Metric label="Evidence sources" value={passport.metrics.evidenceCount} help="independent proof cards" />
        </section>
        <section className="passport-grid">
          <article className="passport-panel"><div className="passport-section-title"><div><p className="passport-eyebrow">EXPLAINABILITY</p><h2>Competency proof graph</h2></div><span className="passport-pill">{passport.role.title}</span></div>
            {passport.competencyResults.map((item) => <div className="passport-competency" key={item.id}><div><strong>{item.label}</strong><span>{item.score}%</span></div><i><b style={{ width: `${item.score}%` }} /></i><p>{item.evidenceIds.map((id) => passport.evidence.find((evidence) => evidence.id === id)?.type).join(' · ')}</p></div>)}
          </article>
          <aside className="passport-panel passport-next"><p className="passport-eyebrow">NEXT BEST EVALUATION</p><h2>Close the {passport.nextBestEvaluation.competency.toLowerCase()} gap</h2><p>{passport.nextBestEvaluation.prompt}</p><button onClick={queueInterview} disabled={queued}>{queued ? 'Interview queued ✓' : 'Move to targeted interview'}</button></aside>
        </section>
        <section className="passport-panel passport-evidence"><div className="passport-section-title"><div><p className="passport-eyebrow">SOURCE-LINKED PROOF</p><h2>Evidence trail</h2></div><span className="passport-muted">Inspect each source before deciding</span></div><div className="passport-evidence-list">
          {passport.evidence.map((item) => <button className="passport-card" onClick={() => setSelectedEvidence(item)} key={item.id}><span>{item.type}</span><strong>{item.label}</strong><p>{item.summary}</p><footer><small>{item.source}</small><b>{item.confidence}% confidence</b></footer></button>)}
        </div></section>
        <section className="passport-grid passport-lower"><article className="passport-panel"><p className="passport-eyebrow">TRUST & UNCERTAINTY</p><h2>What still needs review</h2><ul>{passport.risks.map((risk) => <li key={risk.label}><i className={risk.severity} /><div><strong>{risk.label}</strong><p>{risk.detail}</p></div></li>)}</ul></article><article className="passport-panel"><p className="passport-eyebrow">CANDIDATE CONTROL</p><h2>Consented evidence only</h2><p>Every proof item is source-linked, time-stamped, versionable, and visible to the candidate. Recruiter access is auditable and can be revoked.</p><small>{passport.disclosure}</small></article></section>
      </>}
    </main>
    {selectedEvidence && <div className="passport-modal-wrap" role="presentation" onClick={() => setSelectedEvidence(null)}><section className="passport-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button aria-label="Close evidence" onClick={() => setSelectedEvidence(null)}>×</button><p className="passport-eyebrow">EVIDENCE INSPECTION</p><h2>{selectedEvidence.label}</h2><p>{selectedEvidence.summary}</p><dl><dt>Source</dt><dd>{selectedEvidence.source}</dd><dt>Collected</dt><dd>{selectedEvidence.collectedAt}</dd><dt>Verification</dt><dd>{selectedEvidence.verificationStatus}</dd></dl></section></div>}
  </div>;
}

function Metric({ label, value, help, risk }) { return <article><span>{label}</span><strong className={risk ? 'risk' : ''}>{value}</strong><small>{help}</small></article>; }
