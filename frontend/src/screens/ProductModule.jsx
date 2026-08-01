import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Fingerprint,
  GitBranch,
  FolderTree,
  ArrowRightLeft,
  ShieldCheck,
  Cpu,
  BarChart3,
  ClipboardCheck,
  FileText,
  Briefcase,
  Users,
  Presentation,
  Trophy,
  Shield,
  LayoutDashboard,
  Mic,
  Compass,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle,
  Clock,
  Terminal as TerminalIcon
} from 'lucide-react';
import SpaceFabric from '../components/SpaceFabric.jsx';
import TopNav from '../components/TopNav.jsx';
import './ProductModule.css';

// Crisp vector icon mapping system to eliminate text-fallback font bugs
function ModuleIcon({ name, size = 24, className = '' }) {
  const iconMap = {
    fingerprint: Fingerprint,
    route: GitBranch,
    account_tree: FolderTree,
    compare_arrows: ArrowRightLeft,
    verified_user: ShieldCheck,
    hub: Cpu,
    query_stats: BarChart3,
    fact_check: ClipboardCheck,
    description: FileText,
    work: Briefcase,
    groups: Users,
    slideshow: Presentation,
    emoji_events: Trophy,
    shield: Shield,
    space_dashboard: LayoutDashboard,
    record_voice_over: Mic,
    travel_explore: Compass
  };

  const IconComponent = iconMap[name] || Sparkles;
  return <IconComponent size={size} className={className} />;
}

// Interactive AI Sandbox Terminal Component
function SandboxSimulator({ sandbox, accent }) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [completed, setCompleted] = useState(false);
  const terminalBottomRef = useRef(null);

  useEffect(() => {
    // Scroll terminal on log insertion
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!sandbox || !sandbox.btnText) return null;

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setCompleted(false);
    setLogs([]);

    const simulationLogs = sandbox.logs || [
      { time: '0.2s', text: 'Initializing cryptographic stream protocol...', type: 'info' },
      { time: '0.6s', text: 'Verifying AST complexity weights and commit signatures...', type: 'info' },
      { time: '1.2s', text: 'Confidence metric verified: 99.4% attributable proof.', type: 'highlight' },
      { time: '1.5s', text: '✓ Simulation complete: Signal appended to live identity.', type: 'success' }
    ];

    simulationLogs.forEach((item, idx) => {
      setTimeout(() => {
        setLogs(prev => [...prev, item]);
        if (idx === simulationLogs.length - 1) {
          setIsRunning(false);
          setCompleted(true);
        }
      }, (idx + 1) * 650);
    });
  };

  return (
    <section className="sandbox-section-card" aria-label="Interactive AI Simulator">
      <div className="sandbox-info-panel">
        <div className="sandbox-eyebrow">
          <Sparkles size={14} style={{ color: '#ffd54f' }} />
          <span>Interactive AI Sandbox</span>
        </div>
        <h2 className="sandbox-title">{sandbox.title || 'Live Intelligence Simulation'}</h2>
        <p className="sandbox-desc">
          {sandbox.desc || 'Experience in real-time how TalentIQ processes raw developer telemetry into institutional-grade verified talent signals.'}
        </p>
      </div>

      <div className="sandbox-terminal-container">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="t-dot t-dot-red"></span>
            <span className="t-dot t-dot-yellow"></span>
            <span className="t-dot t-dot-green"></span>
          </div>
          <span className="terminal-tab-name">talentiq-engine-xai.exe</span>
          <span className="terminal-status-pill" style={{
            color: isRunning ? '#ffbd2e' : completed ? '#27c93f' : '#8b9bb4',
            borderColor: isRunning ? '#ffbd2e55' : completed ? '#27c93f55' : '#8b9bb444',
            background: isRunning ? '#ffbd2e15' : completed ? '#27c93f15' : 'transparent'
          }}>
            {isRunning ? '● ACTIVE STREAM...' : completed ? '✓ VERIFIED OUTPUT' : '● READY'}
          </span>
        </div>

        <div className="terminal-body" role="log" aria-live="polite">
          {logs.length === 0 && !isRunning && (
            <div style={{ opacity: 0.4, textAlign: 'center', padding: '36px 0', fontStyle: 'italic' }}>
              Click button below to simulate neural execution engine...
            </div>
          )}

          {logs.map((l, index) => (
            <div className={`log-line log-${l.type}`} key={index}>
              <span className="log-time">[{l.time}]</span>
              <span>{l.text}</span>
            </div>
          ))}

          {isRunning && (
            <div className="log-line log-info" style={{ opacity: 0.7 }}>
              <span className="log-time">[{((logs.length + 1) * 0.4).toFixed(1)}s]</span>
              <span>Processing matrix vectors...</span>
            </div>
          )}
          <div ref={terminalBottomRef} />
        </div>

        <div className="sandbox-controls">
          <span style={{ fontSize: '11px', color: '#637a9a' }}>
            {completed ? 'Simulation verified at source.' : 'Instant browser emulation mode'}
          </span>
          <button
            type="button"
            className="btn-run-simulation"
            onClick={runSimulation}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <div className="spinner"></div>
                <span>Executing Engine...</span>
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" />
                <span>{completed ? 'Replay Simulation' : sandbox.btnText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

// Main Product Module Page Component
export default function ProductModule({ module }) {
  const navigate = useNavigate();

  // Handle fallback or missing module data safely
  if (!module) return null;

  const accentColor = module.accent || '#00e5ff';
  const customStyleVars = {
    '--module-accent': accentColor,
    '--module-glow': `${accentColor}28`
  };

  return (
    <div className="module-showcase-page" style={customStyleVars}>
      {/* Background Atmosphere */}
      <div className="module-ambient-glow" />
      <div className="module-ambient-glow-secondary" />
      <SpaceFabric className="page-fabric" />
      <TopNav role={module.role} />

      <main className="module-content-grid">
        {/* Breadcrumb Navigation */}
        <nav className="module-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">TalentIQ</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to={module.role === 'recruiter' ? '/recruiter' : '/candidate'}>
            {module.role === 'recruiter' ? 'Recruiter Copilot' : 'Candidate Cockpit'}
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{module.eyebrow}</span>
        </nav>

        {/* 1. Hero Showcase Card */}
        <section className="module-hero-card">
          <div className="module-hero-header">
            <div>
              <div className="module-icon-wrapper">
                <ModuleIcon name={module.icon} size={36} />
              </div>
              
              <div className="module-badge-pill">
                <span className="module-badge-dot" />
                <span>{module.badge || 'VERIFIED INTELLIGENCE MODULE'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ 
                fontFamily: 'IBM Plex Mono', fontSize: '10px', color: '#687e9d',
                letterSpacing: '0.12em', display: 'block', textTransform: 'uppercase', marginBottom: 4 
              }}>
                Module Class
              </span>
              <span style={{ 
                fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: 700, 
                color: accentColor, letterSpacing: '-0.02em', textTransform: 'capitalize' 
              }}>
                {module.role} Tier-1
              </span>
            </div>
          </div>

          <h1 className="module-title">{module.title}</h1>
          <p className="module-subtitle">{module.description}</p>

          <div className="module-hero-actions">
            <button
              type="button"
              className="btn-module-primary"
              onClick={() => navigate(module.role === 'recruiter' ? '/recruiter' : '/candidate')}
            >
              <span>Launch {module.role === 'recruiter' ? 'Copilot Search' : 'Talent Cockpit'}</span>
              <ArrowRight size={17} />
            </button>
            
            <Link to="/auth" className="btn-module-secondary" state={{ role: module.role }}>
              <ShieldCheck size={16} style={{ color: accentColor }} />
              <span>Request Custom Enterprise Verification</span>
            </Link>
          </div>
        </section>

        {/* 2. Live Telemetry Metrics Row */}
        {module.metrics && module.metrics.length > 0 && (
          <section className="module-metrics-row" aria-label="Module live statistics">
            {module.metrics.map((m, idx) => {
              // Support both array formats [label, val] and enhanced objects
              const isObj = typeof m === 'object' && !Array.isArray(m);
              const label = isObj ? m.label : m[0];
              const val = isObj ? m.value : m[1];
              const chip = isObj ? m.chip : 'LIVE TELEMETRY';
              const progress = isObj ? m.progress : 85;

              return (
                <article className="metric-telemetry-card" key={label}>
                  <div>
                    <div className="metric-top-row">
                      <span className="metric-lbl">{label}</span>
                      <span className="metric-chip">
                        <Sparkles size={11} />
                        <span>{chip}</span>
                      </span>
                    </div>
                    <div className="metric-val">{val}</div>
                  </div>

                  <div className="metric-progress-track">
                    <div className="metric-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* 3. Interactive AI Sandbox Simulator */}
        {module.sandbox && <SandboxSimulator sandbox={module.sandbox} accent={accentColor} />}

        {/* 4. Interactive Workflow Timeline */}
        {module.steps && module.steps.length > 0 && (
          <section className="module-workflow-section" aria-label="Execution Workflow">
            <div className="workflow-header">
              <div className="workflow-header-left">
                <div className="sandbox-eyebrow" style={{ color: accentColor }}>
                  <TerminalIcon size={13} />
                  <span>Defensible Execution Flow</span>
                </div>
                <h2>Engineered for defensible next steps.</h2>
              </div>
              <span style={{ fontSize: '13px', color: '#7a8fae', maxWidth: '340px' }}>
                Every transition across this module produces attributable evidence auditable by technical hiring committees.
              </span>
            </div>

            <div className="timeline-grid">
              {module.steps.map((step, index) => {
                const isObj = typeof step === 'object';
                const title = isObj ? step.title : step;
                const desc = isObj ? step.desc : 'Verifiable execution phase processing high-signal proof points.';
                const tag = isObj ? step.tag : 'Automated Step';

                return (
                  <div className="timeline-step-card" key={title}>
                    <div className="step-num-badge">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="step-content">
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                    <div className="step-footer-tag">
                      <CheckCircle size={13} style={{ color: '#50e3c2' }} />
                      <span>{tag} · Zero Fluff</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Action Links Grid */}
        {module.links && module.links.length > 0 && (
          <section className="module-links-grid" aria-label="Explore connected modules">
            {module.links.map((item) => {
              const isObj = typeof item === 'object' && !Array.isArray(item);
              const label = isObj ? item.label : item[0];
              const to = isObj ? item.to : item[1];
              const icon = isObj ? item.icon : item[2];
              const desc = isObj ? item.desc : 'Navigate to interactive platform tool';

              return (
                <Link className="action-navigate-card" to={to} key={label}>
                  <div className="action-card-left">
                    <div className="action-icon-box">
                      <ModuleIcon name={icon} size={22} />
                    </div>
                    <div className="action-text-box">
                      <strong>{label}</strong>
                      <span>{desc}</span>
                    </div>
                  </div>
                  <ArrowRight size={20} className="action-arrow" />
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
