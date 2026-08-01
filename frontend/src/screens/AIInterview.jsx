import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Mic, PlayCircle, Send, BarChart2, 
  Code, Lightbulb, HelpCircle, TrendingUp, Brain 
} from 'lucide-react';
import TopNav from '../components/TopNav.jsx';
import './AIInterview.css';

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
      <div className="score-bar-container">
        <div className="score-bar-label">
          {icon}
          <span>{label}</span>
        </div>
        <span className="score-bar-value" style={{ color }}>{value}</span>
      </div>
      <div className="score-bar-track">
        <div 
          className="score-bar-fill"
          style={{
            background: color,
            width: `${value}%`,
            boxShadow: `0 0 8px ${color}80`
          }} 
        />
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
    <div className="interview-layout">
      <TopNav role="candidate" />

      <main className="interview-main">
        {/* Chat panel */}
        <div className="chat-panel">
          
          {/* Header */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={`ai-avatar ${isTyping ? 'speaking' : ''}`}>
                <Bot size={22} strokeWidth={1.5} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#4caf50', border: '2px solid #171D22' }} />
              </div>
              <div>
                <div className="chat-header-title">TalentIQ Interview Agent</div>
                <div className="chat-header-subtitle">AI · LIVE SESSION</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="chat-header-subtitle" style={{ color: '#d2c5b0' }}>Progress</div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 14, fontWeight: 600, color: '#e8b84b' }}>
                {Math.min(step, SCRIPT.length)}/{SCRIPT.length}
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="chat-window" ref={chatRef}>
            {!started && (
              <div className="chat-start-screen">
                <Mic size={56} color="rgba(85,216,231,0.4)" strokeWidth={1} />
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 22, color: '#dfe3e9', margin: 0 }}>
                  AI Technical Interview
                </h2>
                <p style={{ fontFamily: 'IBM Plex Sans', fontSize: 14, color: '#d2c5b0', maxWidth: 380, lineHeight: 1.6, margin: 0 }}>
                  Answer 5 questions across system design, debugging, ML, leadership, and career growth. Your responses will be scored in real-time.
                </p>
                <button className="btn-start-interview" onClick={startInterview}>
                  <PlayCircle size={18} />
                  Start Interview
                </button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                {msg.role === 'ai' && (
                  <div className="ai-avatar">
                    <Bot size={18} strokeWidth={1.5} />
                  </div>
                )}
                <div className={`message-bubble ${msg.role} ${msg.final ? 'final' : ''}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-row ai">
                <div className="ai-avatar speaking">
                  <Bot size={18} strokeWidth={1.5} />
                </div>
                <div className="message-bubble ai typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="input-area">
            <textarea
              className="chat-textarea"
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
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-scripted"
                onClick={useScriptedAnswer}
                disabled={!started || isTyping || step >= SCRIPT.length}
              >
                Use Scripted Answer
              </button>
              <button
                className="btn-send"
                onClick={sendMessage}
                disabled={!started || isTyping || step >= SCRIPT.length || !userInput.trim() && step < SCRIPT.length && !SCRIPT[step].answer}
              >
                Send <Send size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Score sidebar */}
        <div className="sidebar">
          
          {/* Live scores card */}
          <div className="sidebar-card">
            <h2 className="sidebar-card-title">
              <BarChart2 size={20} color="#55d8e7" />
              Live Performance
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <ScoreBar label="Technical Accuracy" value={scores.technical} color="#55d8e7" icon={<Code size={16} color="#55d8e7" />} />
              <ScoreBar label="Communication" value={scores.communication} color="#e8b84b" icon={<Mic size={16} color="#e8b84b" />} />
              <ScoreBar label="Problem Solving" value={scores.problemSolving} color="#d7dcdd" icon={<Lightbulb size={16} color="#d7dcdd" />} />
            </div>
            
            {/* Overall */}
            <div className="overall-score-container">
              <div className="overall-score-label">Overall Score</div>
              <div 
                className="overall-score-value"
                style={{ color: totalScore > 70 ? '#e8b84b' : totalScore > 40 ? '#55d8e7' : '#d2c5b0' }}
              >
                {totalScore}
              </div>
            </div>
          </div>

          {/* Tips card */}
          <div className="sidebar-card">
            <h3 className="sidebar-card-title" style={{ fontSize: 14, marginBottom: 16 }}>
              Interview Tips
            </h3>
            {[
              { icon: <HelpCircle size={16} color="#e8b84b" />, tip: 'Be specific — cite real metrics and numbers' },
              { icon: <TrendingUp size={16} color="#e8b84b" />, tip: 'Structure answers: Situation → Action → Result' },
              { icon: <Brain size={16} color="#e8b84b" />, tip: 'Show tradeoff reasoning, not just solutions' },
            ].map(({ icon, tip }, idx) => (
              <div key={idx} className="tip-row">
                {icon}
                <span className="tip-text">{tip}</span>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
