import React, { useState } from 'react';
import TopNav from '../components/TopNav.jsx';
import { aiApi } from '../lib/api.js';

const joinItems = (items) => items.join(' / ');
const maxUploadBytes = 5 * 1024 * 1024;

function draftAsText(value) {
  return [value.headline, value.summary, 'Skills', ...(value.keySkills || []), 'Experience', ...(value.experienceBullets || []), 'Projects', ...(value.projects || [])].filter(Boolean).join('\n\n');
}

function ResumeUpload({ file, onFileChange, onUpload, uploading, disabled }) {
  return <div style={{ marginTop: 20, padding: 16, border: '1px dashed rgba(0,229,255,.35)', borderRadius: 12, background: 'rgba(0,229,255,.035)' }}>
    <div className="eyebrow">Upload and score</div>
    <h2 style={{ margin: '7px 0' }}>Score an existing resume</h2>
    <p className="muted" style={{ marginTop: 0 }}>Upload a PDF, DOCX, or TXT file up to 5 MB. It is read in memory for this score and is not stored.</p>
    <label style={{ display: 'block', cursor: 'pointer' }}>Resume file
      <input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => onFileChange(event.target.files?.[0] || null)} style={{ display: 'block', marginTop: 7 }} />
    </label>
    {file && <p className="muted" style={{ marginBottom: 0 }}>Selected: <strong>{file.name}</strong> ({Math.ceil(file.size / 1024)} KB)</p>}
    <button className="btn btn-primary" onClick={onUpload} disabled={disabled || !file || uploading} style={{ marginTop: 14 }}>{uploading ? 'Reading and scoring...' : 'Upload and score resume'}</button>
  </div>;
}

function Scorecard({ scorecard }) {
  if (!scorecard) return null;
  return <section className="glass-panel" style={{ marginTop: 20, padding: 22 }} aria-live="polite">
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' }}>
      <div>
        <div className="eyebrow">Evidence-led resume score</div>
        <h2 style={{ margin: '7px 0' }}>Fit for {scorecard.targetRole}</h2>
        <p className="muted" style={{ margin: 0 }}>Each point is calculated only from extracted resume text.</p>
        {scorecard.uploadedFile && <p className="muted" style={{ marginBottom: 0 }}>Scored upload: {scorecard.uploadedFile.name} ({scorecard.uploadedFile.extractedWordCount} words extracted)</p>}
      </div>
      <div className="dossier-score" style={{ minWidth: 90 }}><strong>{scorecard.score}</strong><span>/ 100</span></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 20 }}>
      {scorecard.components.map((component) => <article key={component.key} style={{ padding: 13, borderRadius: 10, background: 'rgba(255,255,255,.035)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{component.label}</strong><span className="chip">{component.score}/{component.max}</span></div>
        <div className="score-bar" style={{ marginTop: 10 }}><span style={{ width: `${(component.score / component.max) * 100}%`, background: 'linear-gradient(90deg, #00e5ff, #8b5cf6)' }} /></div>
        <p className="muted" style={{ margin: '9px 0 0', fontSize: 12 }}>{component.detail}</p>
      </article>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 20 }}>
      <div><h3>Matched skills</h3><p className="muted">{scorecard.matchedSkills.length ? joinItems(scorecard.matchedSkills) : 'No recognised technical skills found yet.'}</p></div>
      <div><h3>Evidence found</h3><p className="muted">{scorecard.evidence.wordCount} words / {scorecard.evidence.metrics} measurable outcomes / {scorecard.evidence.actionVerbs} action verbs / {scorecard.evidence.headings} standard sections</p></div>
    </div>
    {scorecard.suggestions.length > 0 && <><h3 style={{ marginBottom: 7 }}>Best next improvements</h3><ul style={{ marginTop: 0 }}>{scorecard.suggestions.map((item) => <li key={item}>{item}</li>)}</ul></>}
    <p className="muted" style={{ marginBottom: 0, fontSize: 12 }}>{scorecard.disclaimer}</p>
  </section>;
}

function Result({ value, onScore, scoreLoading }) {
  if (!value) return null;
  const resumeDraft = Boolean(value.keySkills);
  return <section className="glass-panel" style={{ marginTop: 20, padding: 22 }}>
    <div className="eyebrow">Generated draft</div>
    {value.summary && <><h2>{value.headline || 'Career roadmap'}</h2><p>{value.summary}</p></>}
    {value.strengths && <><h3>Strengths</h3><p className="muted">{joinItems(value.strengths)}</p><h3>Skill gaps</h3><p className="muted">{joinItems(value.gaps)}</p></>}
    {value.plan?.map((item) => <article key={item.title} style={{ marginTop: 14, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,.035)' }}><span className="chip">{item.timeframe}</span><h3 style={{ margin: '9px 0' }}>{item.title}</h3><p className="muted">{joinItems(item.actions)}</p><small>{item.evidence}</small></article>)}
    {resumeDraft && <><h3>Key skills</h3><p className="muted">{joinItems(value.keySkills)}</p><h3>Experience bullets</h3><ul>{value.experienceBullets.map((item) => <li key={item}>{item}</li>)}</ul><h3>Projects</h3><ul>{value.projects.map((item) => <li key={item}>{item}</li>)}</ul><button className="btn btn-primary" onClick={onScore} disabled={scoreLoading} style={{ marginTop: 8 }}>{scoreLoading ? 'Scoring resume...' : 'Score this draft'}</button></>}
  </section>;
}

export default function AiCareerStudio({ mode = 'roadmap' }) {
  const resume = mode === 'resume';
  const [targetRole, setTargetRole] = useState('Senior Full-Stack Engineer');
  const [context, setContext] = useState('I have experience with React, Node.js, TypeScript, GitHub projects, and cloud deployment.');
  const [result, setResult] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const value = resume
        ? await aiApi.resumeDraft({ targetRole, profile: context, evidence: ['Use only the facts supplied by the candidate.'] })
        : await aiApi.careerRoadmap({ currentRole: 'Candidate', targetRole, skills: context.split(/[,\n]/).map((item) => item.trim()).filter(Boolean), goals: context });
      setResult(value); setScorecard(null);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const scoreDraft = async () => {
    if (!result || !resume) return;
    setScoreLoading(true); setError('');
    try { setScorecard(await aiApi.resumeScore({ targetRole, resumeText: draftAsText(result) })); }
    catch (err) { setError(err.message); } finally { setScoreLoading(false); }
  };

  const selectResume = (file) => {
    setScorecard(null);
    if (file && file.size > maxUploadBytes) { setResumeFile(null); setError('Resume files must be 5 MB or smaller.'); return; }
    setResumeFile(file); setError('');
  };

  const scoreUpload = async () => {
    if (!resumeFile || !resume) return;
    setUploadLoading(true); setError('');
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('targetRole', targetRole);
    try { setScorecard(await aiApi.resumeUploadScore(formData)); setResult(null); }
    catch (err) { setError(err.message); } finally { setUploadLoading(false); }
  };

  return <div className="space-page" style={{ minHeight: '100vh' }}><TopNav role="candidate" /><main className="content-wrap" style={{ maxWidth: 900, paddingTop: 36, paddingBottom: 48 }}><section className="glass-panel" style={{ padding: 28 }}><div className="eyebrow">Groq-powered career intelligence</div><h1 style={{ marginTop: 8 }}>{resume ? 'Upload and score your resume' : 'Career roadmap assistant'}</h1><p className="muted">{resume ? 'Upload a resume for an explainable, evidence-based score or draft one from your verified facts.' : 'The assistant builds a roadmap only from what you provide. Review every recommendation before using it.'}</p><label>Target role<input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} /></label>{resume && <ResumeUpload file={resumeFile} onFileChange={selectResume} onUpload={scoreUpload} uploading={uploadLoading} disabled={!targetRole.trim()} />}<label style={{ display: 'block', marginTop: 20 }}>{resume ? 'Or draft resume content from your work, projects, skills, and results' : 'Your experience, goals, projects, and skills'}<textarea rows={8} value={context} onChange={(event) => setContext(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', marginTop: 6 }} /></label><button className="btn btn-primary" onClick={generate} disabled={loading || !targetRole.trim() || !context.trim()} style={{ marginTop: 16 }}>{loading ? 'Generating...' : resume ? 'Draft resume content' : 'Create 90-day roadmap'}</button>{error && <p role="alert" style={{ color: '#ff9da2', marginTop: 12 }}>{error}</p>}</section><Result value={result} onScore={scoreDraft} scoreLoading={scoreLoading} /><Scorecard scorecard={scorecard} /></main></div>;
}