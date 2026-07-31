import React, { useState, useEffect } from 'react';
import { FileText, GitPullRequest, Award, Bot, Network, ShieldAlert, Cpu, Sparkles, LayoutDashboard, ChevronRight } from 'lucide-react';

const pipelineSteps = [
  { id: 'resume', title: 'Resume Ingestion', desc: 'Parses work history, experience timelines, and roles', icon: FileText, step: '01', color: '#00d8ff' },
  { id: 'github', title: 'GitHub Ingestion', desc: 'Analyzes commits, PR depth, code metrics & repo weight', icon: GitPullRequest, step: '02', color: '#00d8ff' },
  { id: 'certifications', title: 'Certificates', desc: 'Cryptographically verifies credentials & course origins', icon: Award, step: '03', color: '#8b5cff' },
  { id: 'ai-agents', title: 'Multi-Agent AI', desc: '6 specialized evaluators grade reasoning & code quality', icon: Bot, step: '04', color: '#8b5cff' },
  { id: 'knowledge-graph', title: 'Knowledge Graph', desc: 'Maps cross-discipline skill nodes into unified vector space', icon: Network, step: '05', color: '#00d8ff' },
  { id: 'verification', title: 'Verification Engine', desc: 'Calculates signal integrity & anti-fraud confidence scores', icon: ShieldAlert, step: '06', color: '#8b5cff' },
  { id: 'explainable-matching', title: 'Explainable Match', desc: 'Generates attributable line-item match rationale', icon: Cpu, step: '07', color: '#00d8ff' },
  { id: 'talent-identity', title: 'Digital Talent Identity', desc: 'Compiles living tamper-proof proof of work passport', icon: Sparkles, step: '08', color: '#ffd54f' },
  { id: 'hiring-dashboard', title: 'Hiring Dashboard', desc: 'Delivers high-signal candidate pipeline to recruiters', icon: LayoutDashboard, step: '09', color: '#00d8ff' },
];

export default function AIPipeline() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % pipelineSteps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ai-pipeline-section">
      <div className="pipeline-header">
        <div className="eyebrow">End-to-End Pipeline</div>
        <h2 className="section-heading">How TalentIQ Transforms Evidence Into Trust</h2>
        <p className="pipeline-sub">From raw multi-modal inputs to attributable match decisions, our multi-agent pipeline powers verifiable hiring.</p>
      </div>

      <div className="pipeline-flow-wrapper">
        {/* Animated Light Pulse Track */}
        <div className="pipeline-laser-track" />

        <div className="pipeline-grid">
          {pipelineSteps.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeStep === idx;
            const isPassed = activeStep > idx;

            return (
              <React.Fragment key={item.id}>
                <div
                  className={`pipeline-card glass-panel ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
                  onMouseEnter={() => setActiveStep(idx)}
                >
                  <div className="pipeline-card-glow" style={{ background: `radial-gradient(circle, ${item.color}22 0%, transparent 70%)` }} />
                  <div className="pipeline-step-badge" style={{ color: item.color, borderColor: `${item.color}44` }}>
                    {item.step}
                  </div>
                  <div className="pipeline-icon-box" style={{ color: item.color, borderColor: `${item.color}55` }}>
                    <Icon size={20} />
                  </div>
                  <h3 className="pipeline-title">{item.title}</h3>
                  <p className="pipeline-desc">{item.desc}</p>
                  
                  {isActive && (
                    <div className="pipeline-pulse-dot" style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}` }} />
                  )}
                </div>

                {idx < pipelineSteps.length - 1 && (
                  <div className={`pipeline-arrow-connector ${idx < activeStep ? 'active' : ''}`}>
                    <div className="beam-line" />
                    <ChevronRight size={16} className="connector-chevron" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
