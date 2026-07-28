import React, { useState, useRef, useEffect } from 'react';
import TopNav from '../components/TopNav.jsx';

const SCRIPT = [
  {
    question: "Let's start with system design. How would you design a globally distributed rate limiter that handles 1 million requests per second with sub-millisecond latency?",
    answer: "I'd use a token bucket algorithm with a distributed cache layer — Redis Cluster for in-region coordination, with gossip protocol for cross-region replication. Each node maintains a local counter with a configurable sync interval, trading slight over-admission for dramatically lower latency. Lua scripts in Redis make the check-and-decrement atomic.",
    deltas: { technical: 20, communication: 15, problemSolving: 18 },
  },
  {
    question: "Good. Now walk me through a concurrency bug you've actually debugged in production. What was the root cause and how did you find it?",
    answer: "We had a race condition in our payment service — two threads were reading and writing to the same order record under high load. I used async-profiler to capture thread dumps and spotted the contention on a HashMap that wasn't concurrent-safe. Fixed it by switching to ConcurrentHashMap and adding optimistic locking with versioning. Added a jitter to retry logic to prevent thundering herd.",
    deltas: { technical: 18, communication: 20, problemSolving: 16 },
  },
  {
    question: "Impressive. If you had to design a machine learning feature store from scratch, what are the key components you'd prioritize and why?",
    answer: "The three pillars: an offline store for historical features (Parquet on S3 or BigQuery), an online store for low-latency serving (Redis or Cassandra), and a feature registry with lineage tracking. I'd prioritize point-in-time correctness to prevent training-serving skew — that's the most insidious bug in ML systems. Feast or Tecton handle this well, but custom implementations need careful timestamp logic.",
    deltas: { technical: 22, communication: 17, problemSolving: 20 },
  },
  {
    question: "You've demonstrated strong technical depth. What's your approach to mentoring junior engineers? Can you give me a specific example?",
    answer: "I believe in structured autonomy. I had a junior who kept getting blocked on ambiguous tickets — I introduced rubber duck sessions and taught them to write a one-paragraph problem statement before asking for help. Within 6 weeks their blocker rate dropped 70%. I also run biweekly system design sessions where juniors present designs for critique in a safe environment.",
    deltas: { technical: 8, communication: 25, problemSolving: 12 },
  },
  {
    question: "Final question — where do you see yourself in 5 years, and how does this role fit into that vision?",
    answer: "I want to be a principal engineer specializing in platform infrastructure — the kind of engineer who shapes how entire teams build software. This role gives me exposure to large-scale distributed challenges I haven't tackled yet. I'm particularly interested in your observability stack — I think there's interesting work to do at the intersection of ML-driven anomaly detection and traditional SLO monitoring.",
    deltas: { technical: 10, communication: 22, problemSolving: 14 },
  },
];

function ScoreBar({ label, value, color, icon }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color, fontSize: 16 }}>{icon}</span>
          <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 13, color: '#d2c5b0' }}>{label}</span>
        </div>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: '#30353a', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999, background: color,
          width: `${value}%`, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 8px ${color}80`
        }} />
      </div>
    </div>
  );
}

export default function AIInterview() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [started, setStarted] = useState(false);
  const [scores, setScores] = useState({ technical: 0, communication: 0, problemSolving: 0 });
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function startInterview() {
    setStarted(true);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([{ role: 'ai', text: SCRIPT[0].question }]);
    }, 1200);
  }

  function sendMessage() {
    if (!started || isTyping || step >= SCRIPT.length) return;
    const current = SCRIPT[step];
    const userMsg = userInput.trim() || current.answer;

    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setUserInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setScores(prev => ({
        technical: Math.min(100, prev.technical + current.deltas.technical),
        communication: Math.min(100, prev.communication + current.deltas.communication),
        problemSolving: Math.min(100, prev.problemSolving + current.deltas.problemSolving),
      }));
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep < SCRIPT.length) {
        setMessages(prev => [...prev, { role: 'ai', text: SCRIPT[nextStep].question }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: "🎯 Interview complete! You've demonstrated exceptional technical depth, clear communication, and systematic problem-solving. Your responses show a senior engineering mindset with strong cross-functional awareness. Final scores are above.",
          final: true
        }]);
      }
    }, 1400);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function useScriptedAnswer() {
    if (step < SCRIPT.length) setUserInput(SCRIPT[step].answer);
  }

  const totalScore = Math.round((scores.technical + scores.communication + scores.problemSolving) / 3);

  return (
    <div style={{ minHeight: '100vh', background: '#0f1418', color: '#dfe3e9', display: 'flex', flexDirection: 'column' }}>
      <TopNav role="candidate" />

      <main style={{ flex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

        {/* Chat panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Header */}
          <div style={{ background: '#171D22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(85,216,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#4caf50', border: '2px solid #171D22' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 15, color: '#dfe3e9' }}>TalentIQ Interview Agent</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600, color: '#55d8e7', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI · LIVE SESSION</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#d2c5b0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Progress</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 600, color: '#e8b84b' }}>{Math.min(step, SCRIPT.length)}/{SCRIPT.length}</div>
            </div>
          </div>

          {/* Messages area */}
          <div ref={chatRef} style={{
            flex: 1, background: '#0a0f13', border: '1px solid rgba(78,70,54,0.3)', borderRadius: 12,
            padding: 20, minHeight: 400, maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16
          }}>
            {!started && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 20, textAlign: 'center', padding: 40 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'rgba(85,216,231,0.4)', fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 22, color: '#dfe3e9', margin: 0 }}>AI Technical Interview</h2>
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, color: '#d2c5b0', maxWidth: 380, lineHeight: 1.6 }}>
                  Answer 5 questions across system design, debugging, ML, leadership, and career growth. Your responses will be scored in real-time.
                </p>
                <button onClick={startInterview} style={{
                  background: '#55d8e7', color: '#001f23', border: 'none', cursor: 'pointer',
                  fontFamily: 'IBM Plex Sans', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
                  padding: '12px 32px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                  Start Interview
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'ai' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(85,216,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 4 }}>
                    <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 16, fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  </div>
                )}
                <div style={{
                  maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? 'rgba(232,184,75,0.12)' : (msg.final ? 'rgba(85,216,231,0.08)' : '#171D22'),
                  border: `1px solid ${msg.role === 'user' ? 'rgba(232,184,75,0.25)' : (msg.final ? 'rgba(85,216,231,0.25)' : 'rgba(255,255,255,0.08)')}`,
                  fontFamily: 'IBM Plex Sans', fontSize: 14, color: '#dfe3e9', lineHeight: 1.6
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(85,216,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 16, fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div style={{ background: '#171D22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#55d8e7',
                      animation: 'bounce 1.2s ease-in-out infinite',
                      animationDelay: `${i * 0.2}s`
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div style={{ background: '#171D22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!started || isTyping || step >= SCRIPT.length}
              placeholder={
                !started ? 'Click "Start Interview" above to begin…'
                : step >= SCRIPT.length ? 'Interview complete!'
                : 'Type your answer (or click "Use Scripted Answer" below)…'
              }
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0a0f13', border: '1px solid rgba(78,70,54,0.3)', borderRadius: 8,
                padding: '10px 14px', fontFamily: 'IBM Plex Sans', fontSize: 14, color: '#dfe3e9',
                outline: 'none', resize: 'none',
                opacity: (!started || step >= SCRIPT.length) ? 0.5 : 1
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={useScriptedAnswer}
                disabled={!started || isTyping || step >= SCRIPT.length}
                style={{
                  background: 'none', border: '1px dashed rgba(85,216,231,0.4)',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 600,
                  color: '#55d8e7', letterSpacing: '0.08em', textTransform: 'uppercase',
                  opacity: (!started || step >= SCRIPT.length) ? 0.4 : 1
                }}
              >Use Scripted Answer</button>
              <button
                onClick={sendMessage}
                disabled={!started || isTyping || step >= SCRIPT.length}
                style={{
                  background: '#e8b84b', color: '#402d00', border: 'none', cursor: 'pointer',
                  fontFamily: 'IBM Plex Sans', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                  padding: '8px 24px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 6,
                  opacity: (!started || step >= SCRIPT.length || isTyping) ? 0.5 : 1, transition: 'background 0.2s'
                }}
              >
                Send <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Score sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live scores card */}
          <div style={{ background: '#171D22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span className="material-symbols-outlined" style={{ color: '#55d8e7', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>analytics</span>
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 16, color: '#dfe3e9', margin: 0 }}>Live Performance</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ScoreBar label="Technical Accuracy" value={scores.technical} color="#55d8e7" icon="code" />
              <ScoreBar label="Communication" value={scores.communication} color="#e8b84b" icon="record_voice_over" />
              <ScoreBar label="Problem Solving" value={scores.problemSolving} color="#d7dcdd" icon="lightbulb" />
            </div>
            {/* Overall */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#d2c5b0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Overall Score</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 44, color: totalScore > 70 ? '#e8b84b' : totalScore > 40 ? '#55d8e7' : '#d2c5b0' }}>
                {totalScore}
              </div>
            </div>
          </div>

          {/* Tips card */}
          <div style={{ background: '#171D22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: '#dfe3e9', marginBottom: 14, margin: '0 0 14px' }}>Interview Tips</h3>
            {[
              { icon: 'tips_and_updates', tip: 'Be specific — cite real metrics and numbers' },
              { icon: 'timeline', tip: 'Structure answers: Situation → Action → Result' },
              { icon: 'psychology', tip: 'Show tradeoff reasoning, not just solutions' },
            ].map(({ icon, tip }) => (
              <div key={tip} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ color: '#e8b84b', fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <span style={{ fontFamily: 'IBM Plex Sans', fontSize: 12, color: '#d2c5b0', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @media (max-width: 768px) {
          main { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
