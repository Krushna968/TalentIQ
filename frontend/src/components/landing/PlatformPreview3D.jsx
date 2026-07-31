import React, { useState } from 'react';
import { ShieldCheck, GitBranch, Cpu, CheckCircle2, Search, ArrowUpRight, BarChart3, Award, Sparkles } from 'lucide-react';
import RadarChart from '../RadarChart.jsx';
import ScoreRing from '../ScoreRing.jsx';

export default function PlatformPreview3D() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 14, y: -y * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="platform-preview-section">
      <div className="preview-header">
        <div className="eyebrow">Live Platform Showcase</div>
        <h2 className="section-heading">Experience TalentIQ In Action</h2>
        <p className="preview-sub">Real-time candidate profile analysis, multi-signal verification feeds, and recruiter decision intelligence.</p>
      </div>

      <div
        className="preview-stage-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Floating 3D Laptop Frame */}
        <div
          className="laptop-container 3d-card"
          style={{
            transform: `perspective(1200px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          }}
        >
          <div className="laptop-screen-bezel">
            <div className="laptop-webcam" />
            <div className="laptop-screen-glass">
              <div className="screen-reflection" />
              
              {/* Dashboard Content Mockup */}
              <div className="laptop-dashboard-content">
                <header className="mock-top-bar">
                  <div className="mock-brand">
                    <span className="brand-dot" />
                    <span className="brand-title">TalentIQ OS</span>
                    <span className="live-pill">LIVE VERIFICATION</span>
                  </div>
                  <div className="mock-search">
                    <Search size={13} />
                    <span>Search candidate vector graph...</span>
                  </div>
                  <div className="mock-user">
                    <span className="user-badge">AR</span>
                  </div>
                </header>

                <div className="mock-body-grid">
                  {/* Left Column: Candidate Profile */}
                  <div className="mock-profile-card">
                    <div className="profile-header-row">
                      <div className="profile-avatar">
                        <span>AR</span>
                        <CheckCircle2 size={12} className="check-badge" />
                      </div>
                      <div>
                        <h4>Alex Rivera</h4>
                        <p>Senior AI Systems Engineer</p>
                        <div className="proof-tag"><ShieldCheck size={11} /> Cryptographically Verified</div>
                      </div>
                    </div>

                    <div className="score-summary-box">
                      <div className="score-item">
                        <ScoreRing score={96} size={54} strokeWidth={5} />
                        <div>
                          <span className="score-label">TalentIQ Index</span>
                          <span className="score-val">96 / 100</span>
                        </div>
                      </div>
                      <div className="score-item">
                        <ScoreRing score={98} size={54} strokeWidth={5} color="#8b5cff" />
                        <div>
                          <span className="score-label">Code Signal</span>
                          <span className="score-val">98% Match</span>
                        </div>
                      </div>
                    </div>

                    {/* Radar Chart Component */}
                    <div className="mock-radar-wrapper">
                      <RadarChart
                        data={[
                          { label: 'System Design', value: 95 },
                          { label: 'Code Depth', value: 98 },
                          { label: 'Architecture', value: 92 },
                          { label: 'Reasoning', value: 96 },
                          { label: 'Execution', value: 94 },
                        ]}
                        size={160}
                      />
                    </div>
                  </div>

                  {/* Right Column: Live Proof Stream */}
                  <div className="mock-feed-card">
                    <div className="feed-header">
                      <h5>Attributable Verification Stream</h5>
                      <span className="pulse-chip">6 AI Evaluators Active</span>
                    </div>

                    <div className="feed-list">
                      <div className="feed-item">
                        <GitBranch size={16} className="feed-icon cyan" />
                        <div className="feed-text">
                          <h6>GitHub Vector Analysis Verified</h6>
                          <p>1,420 commits analyzed across 14 rust & TS repositories. 98.4% signal integrity.</p>
                        </div>
                        <span className="time-tag">Just now</span>
                      </div>

                      <div className="feed-item">
                        <Award size={16} className="feed-icon purple" />
                        <div className="feed-text">
                          <h6>ETH Global Hackathon 1st Place</h6>
                          <p>Smart contract verification cryptographically confirmed via ENS & GitHub repo release.</p>
                        </div>
                        <span className="time-tag">2m ago</span>
                      </div>

                      <div className="feed-item">
                        <Cpu size={16} className="feed-icon gold" />
                        <div className="feed-text">
                          <h6>Adaptive Interview Reasoning Test</h6>
                          <p>Evaluated system design tradeoffs, async loops & memory management under concurrency.</p>
                        </div>
                        <span className="time-tag">5m ago</span>
                      </div>
                    </div>

                    <div className="explainable-rationale-box">
                      <span className="rat-title"><Sparkles size={13} /> Explainable AI Rationale:</span>
                      <p>"Candidate exhibits exceptional low-level systems engineering depth with verified production code across distributed consensus protocols."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="laptop-keyboard-base">
            <div className="keyboard-notch" />
          </div>
        </div>

        {/* Floating Mobile Preview Overlay */}
        <div
          className="mobile-container 3d-card"
          style={{
            transform: `perspective(1000px) rotateY(${tilt.x * 1.2}deg) rotateX(${tilt.y * 1.2}deg) translateY(-20px)`,
          }}
        >
          <div className="mobile-bezel">
            <div className="mobile-speaker" />
            <div className="mobile-screen">
              <div className="mobile-header">
                <span>TalentIQ Mobile</span>
                <span className="live-dot" />
              </div>
              <div className="mobile-card-content">
                <div className="mobile-badge">
                  <ShieldCheck size={16} color="#00d8ff" />
                  <span>Verified Identity</span>
                </div>
                <h3>Alex Rivera</h3>
                <p className="mobile-role">Principal AI Engineer</p>
                <div className="mobile-stat-row">
                  <div>
                    <strong>96</strong>
                    <span>IQ Score</span>
                  </div>
                  <div>
                    <strong>98%</strong>
                    <span>Code Quality</span>
                  </div>
                  <div>
                    <strong>12K+</strong>
                    <span>Commits</span>
                  </div>
                </div>
                <button className="mobile-cta-btn">View Full Graph <ArrowUpRight size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
