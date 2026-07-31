import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Play,
  ShieldCheck,
  Cpu,
  GitBranch,
  Network,
  RefreshCw,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const GithubIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

import FuturisticBackground from '../components/landing/FuturisticBackground.jsx';
import AICore3D from '../components/landing/AICore3D.jsx';
// FeatureOrbit replaced by inline left/right card columns
import AIPipeline from '../components/landing/AIPipeline.jsx';
import PlatformPreview3D from '../components/landing/PlatformPreview3D.jsx';
import CustomCursor from '../components/landing/CustomCursor.jsx';
import DemoModal from '../components/landing/DemoModal.jsx';

import '../components/landing/landing.css';

const whyTalentIQCards = [
  {
    icon: ShieldCheck,
    title: 'Verified Skills',
    desc: 'Proof of work verified directly against GitHub commits, hackathons, credentials, and code executions.',
    chip: 'Attributable Proof',
  },
  {
    icon: Cpu,
    title: 'Explainable AI',
    desc: 'No black-box scores. Every match decision includes detailed line-item rationale and underlying evidence.',
    chip: 'Transparent XAI',
  },
  {
    icon: GitBranch,
    title: 'GitHub Intelligence',
    desc: 'Deep AST analysis evaluating algorithmic complexity, architecture patterns, and contribution depth.',
    chip: 'Code Mining',
  },
  {
    icon: Network,
    title: 'Knowledge Graph',
    desc: 'Multi-dimensional skill taxonomy mapping interdisciplinary competencies into a unified vector space.',
    chip: 'Neural Graph',
  },
  {
    icon: RefreshCw,
    title: 'Continuous Learning',
    desc: 'Talent identities update in real-time as candidates ship pull requests, build projects, and pass assessments.',
    chip: 'Real-Time Sync',
  },
  {
    icon: UserCheck,
    title: 'Smart Hiring',
    desc: 'Empowers engineering leaders to discover top 1% verified talent with defensible hiring confidence.',
    chip: 'High Signal',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [isDemoOpen, setIsDemoOpen] = useState(false);


  // Smooth scroll handler
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-page dark-landing-theme">
      {/* 3D Visual Atmosphere */}
      <FuturisticBackground />
      <CustomCursor />

      {/* Demo Walkthrough Modal */}
      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />

      {/* Top Glass Navigation */}
      <header className="top-nav">
        <div className="top-nav-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true" />
            <span>TalentIQ</span>
          </Link>
          <nav className="nav-links" aria-label="Landing navigation">
            <button className="nav-link" type="button" onClick={() => scrollToSection('features')}>
              Features
            </button>
            <button className="nav-link" type="button" onClick={() => scrollToSection('pipeline')}>
              AI Workflow
            </button>
            <button className="nav-link" type="button" onClick={() => scrollToSection('preview')}>
              Live Platform
            </button>
            <button className="nav-link" type="button" onClick={() => scrollToSection('why')}>
              Why TalentIQ
            </button>
            <Link className="nav-link" to="/recruiter">
              For Recruiters
            </Link>
            <Link className="nav-link" to="/candidate">
              For Candidates
            </Link>
          </nav>
          <div className="nav-actions">
            <Link className="button button-ghost" to="/auth">
              Log in
            </Link>
            <Link className="button button-primary" to="/auth" state={{ role: 'candidate' }}>
              Get Verified
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION WITH 3D AI CORE */}
        <section className="hero-3d-stage">
          <div className="hero-3d-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Verified AI Talent Intelligence Platform</span>
            </div>

            <h1 className="hero-3d-title">
              <span className="glow-cyan">Verified AI Talent</span>
              <br />
              <span className="glow-purple">Intelligence Platform</span>
            </h1>

            <p className="hero-3d-subtitle">
              Building Trusted Digital Talent Identities using Multi-Agent AI, Knowledge Graphs and Explainable Intelligence.
            </p>

            <div className="hero-cta-group">
              <button
                className="button-neon-primary"
                type="button"
                onClick={() => scrollToSection('preview')}
              >
                Explore Platform <ArrowRight size={17} />
              </button>

              <button
                className="button-neon-secondary"
                type="button"
                onClick={() => setIsDemoOpen(true)}
              >
                <Play size={15} fill="currentColor" /> Watch Demo
              </button>

              <a
                className="button-neon-ghost"
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
              >
                <GithubIcon size={16} /> GitHub Repository
              </a>
            </div>
          </div>

          {/* 3D AI Core Showcase — Left Cards | Model | Right Cards */}
          <div className="core-orbit-stage" id="features">
            {/* Left column — first 3 features */}
            <div className="orbit-column-left">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Skill Verification',
                  subtitle: 'Cryptographic Code Proof',
                  desc: 'Automated static & dynamic code verification directly from commit trees and pull request evidence.',
                  tag: 'Proof Engine',
                },
                {
                  icon: GitBranch,
                  title: 'GitHub Intelligence',
                  subtitle: 'Deep Repo Analysis',
                  desc: 'Extracts code complexity, algorithmic depth, language breadth, and open-source contribution weight.',
                  tag: 'Signal Mining',
                },
                {
                  icon: Network,
                  title: 'Knowledge Graph',
                  subtitle: 'Connected Skill Graph',
                  desc: 'Maps thousands of interconnected technologies, domain competencies, and cross-discipline expertise.',
                  tag: 'Graph Neural Net',
                },
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="orbit-feature-card"
                    style={{ animationDelay: `${idx * 0.5}s` }}
                  >
                    <div className="card-top-row">
                      <div className="feature-icon-badge">
                        <Icon size={18} />
                      </div>
                      <span className="orbit-chip">{feat.tag}</span>
                    </div>
                    <h4 className="card-title">{feat.title}</h4>
                    <p className="card-subtitle">{feat.subtitle}</p>
                    <p className="card-desc">{feat.desc}</p>
                    <div className="card-footer">
                      <span>Explore Signal</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center — 3D AI Core */}
            <div className="core-center-wrapper">
              <AICore3D />
            </div>

            {/* Right column — last 3 features */}
            <div className="orbit-column-right">
              {[
                {
                  icon: Cpu,
                  title: 'Explainable AI',
                  subtitle: 'Transparent Scoring',
                  desc: 'Every match score and skill level provides clear line-item rationale and attributable evidence.',
                  tag: 'XAI Engine',
                },
                {
                  icon: UserCheck,
                  title: 'Digital Talent Identity',
                  subtitle: 'Unified Passport',
                  desc: 'A dynamic, living talent identity replacing static PDFs with tamper-proof verified work history.',
                  tag: 'Living Identity',
                },
                {
                  icon: RefreshCw,
                  title: 'Continuous Intelligence',
                  subtitle: 'Real-Time Sync',
                  desc: 'Automatically updates talent metrics as candidates ship code, complete projects, and earn credentials.',
                  tag: 'Real-time Vector',
                },
              ].map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="orbit-feature-card"
                    style={{ animationDelay: `${(idx + 3) * 0.5}s` }}
                  >
                    <div className="card-top-row">
                      <div className="feature-icon-badge">
                        <Icon size={18} />
                      </div>
                      <span className="orbit-chip">{feat.tag}</span>
                    </div>
                    <h4 className="card-title">{feat.title}</h4>
                    <p className="card-subtitle">{feat.subtitle}</p>
                    <p className="card-desc">{feat.desc}</p>
                    <div className="card-footer">
                      <span>Explore Signal</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* LIVE STATS COUNTER ROW */}
        <section className="stats-counter-row content-wrap" aria-label="TalentIQ Platform Statistics">
          <div className="stat-counter-card glass-panel">
            <div className="stat-val">12,450+</div>
            <span className="stat-lbl">Verified Profiles</span>
          </div>

          <div className="stat-counter-card glass-panel">
            <div className="stat-val">1.84M+</div>
            <span className="stat-lbl">Repositories Analysed</span>
          </div>

          <div className="stat-counter-card glass-panel">
            <div className="stat-val">450K+</div>
            <span className="stat-lbl">Skills Verified</span>
          </div>

          <div className="stat-counter-card glass-panel">
            <div className="stat-val">99.4%</div>
            <span className="stat-lbl">AI Matching Accuracy</span>
          </div>

          <div className="stat-counter-card glass-panel">
            <div className="stat-val">850+</div>
            <span className="stat-lbl">Recruiters Supported</span>
          </div>
        </section>

        {/* AI WORKFLOW PIPELINE SECTION */}
        <section id="pipeline">
          <AIPipeline />
        </section>

        {/* LIVE PLATFORM PREVIEW SECTION */}
        <section id="preview">
          <PlatformPreview3D />
        </section>

        {/* WHY TALENTIQ 3D GLASS CARDS */}
        <section className="why-talentiq-section" id="why">
          <div className="pipeline-header">
            <div className="eyebrow">Defensible Evidence</div>
            <h2 className="section-heading">Why Leading Tech Companies Trust TalentIQ</h2>
            <p className="pipeline-sub">Eliminate resume inflation with attributable code evidence and multi-modal skill verification.</p>
          </div>

          <div className="why-grid">
            {whyTalentIQCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="why-card glass-panel">
                  <div className="why-icon-badge">
                    <Icon size={24} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <span className="chip" style={{ marginTop: '16px' }}>
                    {card.chip}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL TRANSITION CTA SECTION */}
        <section className="final-cta-section">
          <div className="final-cta-card glass-panel">
            <div className="eyebrow" style={{ marginBottom: '16px' }}>
              <Lock size={12} /> Institutional Grade Verification
            </div>
            <h2>Ready to Experience the Future of AI Hiring?</h2>
            <p>Step into the next-generation AI talent intelligence platform. Create your digital talent identity or explore verified candidates.</p>
            <button
              className="button-neon-primary"
              type="button"
              style={{ fontSize: '16px', height: '56px', padding: '0 36px' }}
              onClick={() => navigate('/auth', { state: { role: 'candidate' } })}
            >
              Enter TalentIQ Platform <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
