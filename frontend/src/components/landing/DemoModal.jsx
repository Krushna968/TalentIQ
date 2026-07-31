import React, { useState } from 'react';
import { X, Play, ShieldCheck, GitBranch, Cpu, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('verification');

  if (!isOpen) return null;

  return (
    <div className="demo-modal-overlay" onClick={onClose}>
      <div className="demo-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={onClose} aria-label="Close demo">
          <X size={18} />
        </button>

        <div className="demo-header">
          <div className="eyebrow"><Play size={10} fill="currentColor" /> Interactive Platform Walkthrough</div>
          <h2>TalentIQ Evidence-Based Verification</h2>
          <p>See how multi-agent AI evaluates candidates and verifies real work history.</p>
        </div>

        <div className="demo-tabs">
          <button
            className={`demo-tab ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            <ShieldCheck size={15} /> Code Verification
          </button>
          <button
            className={`demo-tab ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            <GitBranch size={15} /> GitHub Analysis
          </button>
          <button
            className={`demo-tab ${activeTab === 'matching' ? 'active' : ''}`}
            onClick={() => setActiveTab('matching')}
          >
            <Cpu size={15} /> Explainable AI Match
          </button>
        </div>

        <div className="demo-stage-screen">
          {activeTab === 'verification' && (
            <div className="demo-pane">
              <div className="demo-video-placeholder">
                <div className="play-pulse-ring">
                  <Play size={28} color="#00d8ff" fill="#00d8ff" />
                </div>
                <div className="demo-simulated-terminal">
                  <code>[LOG 06:47:12] Fetching GitHub commits for @alexrivera...</code>
                  <code>[LOG 06:47:13] 14 Rust Repositories Parsed. AST Depth: 12.</code>
                  <code>[LOG 06:47:14] Anti-cheat verification passed (98.4% Confidence).</code>
                  <code>[SUCCESS] Digital Talent Identity Generated. score=96/100</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="demo-pane">
              <div className="demo-repo-list">
                <div className="demo-repo-card">
                  <div className="repo-top">
                    <strong>eth-consensus-light-client</strong>
                    <span className="chip">Rust • Verified</span>
                  </div>
                  <p>Production Zero-Knowledge light client for Ethereum consensus layer proof generation.</p>
                  <div className="repo-stats">
                    <span>★ 1,240 stars</span>
                    <span>142 commits</span>
                    <span>99.2% signal score</span>
                  </div>
                </div>

                <div className="demo-repo-card">
                  <div className="repo-top">
                    <strong>vector-ai-search-engine</strong>
                    <span className="chip chip-gold">C++20 • Verified</span>
                  </div>
                  <p>HNSW vector search indexing library optimized for AVX-512 vector execution.</p>
                  <div className="repo-stats">
                    <span>★ 890 stars</span>
                    <span>98 commits</span>
                    <span>97.8% signal score</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matching' && (
            <div className="demo-pane">
              <div className="demo-explain-card">
                <h4>Recruiter Search Match Rationale</h4>
                <div className="match-bar-wrap">
                  <div className="match-label">Overall Match Score</div>
                  <div className="match-bar-bg">
                    <div className="match-bar-fill" style={{ width: '96%' }} />
                  </div>
                  <span className="match-percent">96%</span>
                </div>
                <ul className="match-reasons">
                  <li>✔ Strong alignment with target role: Senior Distributed Systems Architect</li>
                  <li>✔ Verified production code in Rust & ZK-proof cryptography</li>
                  <li>✔ 100% attributable evidence linked to public Git commit hashes</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="demo-modal-footer">
          <Link to="/auth" state={{ role: 'candidate' }} className="button button-primary" onClick={onClose}>
            Get Started Now <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
