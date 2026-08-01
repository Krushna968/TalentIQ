import React, { useState } from 'react';
import TopNav from '../components/TopNav.jsx';
import { interviewApi } from '../lib/api.js';

const initialScores = { technical: 0, communication: 0, problemSolving: 0, overall: 0 };

export default function AIInterview() {
  const [role, setRole] = useState('Full-Stack Engineer');
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState(initialScores);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const { questions } = await interviewApi.getQuestion(role, 'React, Node.js, TypeScript, system design');
      setQuestion(questions[0]); setHistory([]); setScores(initialScores);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!question || !answer.trim()) return;
    setLoading(true); setError('');
    try {
      const evaluation = await interviewApi.evaluate({ role, question: question.question, answer });
      setScores(evaluation.scores); setResult(evaluation);
      setHistory((current) => [...current, { question: question.question, answer, feedback: evaluation.feedback }]);
      setQuestion(evaluation.nextQuestion); setAnswer('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return <div className="space-page" style={{ minHeight: '100vh' }}><TopNav role="candidate" />
    <main className="content-wrap" style={{ paddingTop: 36, paddingBottom: 48, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20 }}>
      <section className="glass-panel" style={{ padding: 28 }}>
        <div className="eyebrow">Groq-powered practice</div><h1 style={{ marginTop: 8 }}>AI interview coach</h1>
        <p className="muted">Practice with adaptive technical questions and receive evidence-based feedback. Scores are coaching signals, not hiring decisions.</p>
        <div style={{ display: 'flex', gap: 10, margin: '20px 0' }}><input value={role} onChange={(event) => setRole(event.target.value)} aria-label="Target role" placeholder="Target role" /><button className="btn btn-primary" onClick={start} disabled={loading}>{loading ? 'Preparing�' : question ? 'New question' : 'Start practice'}</button></div>
        {error && <p role="alert" style={{ color: '#ff9da2' }}>{error}</p>}
        {question && <article style={{ padding: 20, borderRadius: 12, background: 'rgba(85,216,231,.08)', border: '1px solid rgba(85,216,231,.2)' }}><span className="chip">{question.category}</span><h2 style={{ fontSize: 20, marginTop: 12 }}>{question.question}</h2><p className="muted">Listen for: {question.rubric?.join(' � ')}</p></article>}
        {question && <><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={8} placeholder="Write a specific answer, including context, tradeoffs, and outcomes�" style={{ width: '100%', marginTop: 16, boxSizing: 'border-box' }} /><button className="btn btn-primary" style={{ marginTop: 12 }} onClick={submit} disabled={loading || !answer.trim()}>{loading ? 'Evaluating�' : 'Submit answer'}</button></>}
        {result && <article style={{ marginTop: 20, padding: 18, borderRadius: 12, background: 'rgba(255,255,255,.035)' }}><h3>Coach feedback</h3><p>{result.feedback}</p><strong>Strengths</strong><p className="muted">{result.strengths?.join(' � ')}</p><strong>Improve next</strong><p className="muted">{result.improvements?.join(' � ')}</p></article>}
      </section>
      <aside className="glass-panel" style={{ padding: 24, height: 'fit-content' }}><div className="eyebrow">Live coaching</div><h2 style={{ fontSize: 20, margin: '8px 0 20px' }}>Performance signals</h2>{Object.entries(scores).map(([label, value]) => <div key={label} style={{ marginBottom: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'capitalize' }}><span>{label.replace(/([A-Z])/g, ' $1')}</span><b>{value}</b></div><div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 9, marginTop: 6 }}><div style={{ width: `${value}%`, height: '100%', borderRadius: 9, background: '#55d8e7', transition: 'width .4s ease' }} /></div></div>)}<p className="muted" style={{ fontSize: 12 }}>{history.length} answer{history.length === 1 ? '' : 's'} reviewed in this session.</p></aside>
    </main></div>;
}