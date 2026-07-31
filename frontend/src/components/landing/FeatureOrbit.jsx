import React, { useState } from 'react';
import { ShieldCheck, GitBranch, Share2, Cpu, UserCheck, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

const orbitFeatures = [
  {
    id: 'skill-verification',
    title: 'Skill Verification',
    subtitle: 'Cryptographic Code Proof',
    desc: 'Automated static & dynamic code verification directly from commit trees and pull request evidence.',
    icon: ShieldCheck,
    tag: 'Proof Engine',
    angle: 0,
  },
  {
    id: 'github-intelligence',
    title: 'GitHub Intelligence',
    subtitle: 'Deep Repo Analysis',
    desc: 'Extracts code complexity, algorithmic depth, language breadth, and open-source contribution weight.',
    icon: GitBranch,
    tag: 'Signal Mining',
    angle: 60,
  },
  {
    id: 'knowledge-graph',
    title: 'Knowledge Graph',
    subtitle: 'Connected Skill Graph',
    desc: 'Maps thousands of interconnected technologies, domain competencies, and cross-discipline expertise.',
    icon: Share2,
    tag: 'Graph Neural Net',
    angle: 120,
  },
  {
    id: 'explainable-ai',
    title: 'Explainable AI',
    subtitle: 'Transparent Scoring',
    desc: 'Every match score and skill level provides clear line-item rationale and attributable evidence.',
    icon: Cpu,
    tag: 'XAI Engine',
    angle: 180,
  },
  {
    id: 'digital-identity',
    title: 'Digital Talent Identity',
    subtitle: 'Unified Passport',
    desc: 'A dynamic, living talent identity replacing static PDFs with tamper-proof verified work history.',
    icon: UserCheck,
    tag: 'Living Identity',
    angle: 240,
  },
  {
    id: 'continuous-intelligence',
    title: 'Continuous Intelligence',
    subtitle: 'Real-Time Sync',
    desc: 'Automatically updates talent metrics as candidates ship code, complete projects, and earn credentials.',
    icon: RefreshCw,
    tag: 'Real-time Vector',
    angle: 300,
  },
];

export default function FeatureOrbit({ activeFeatureId, onSelectFeature }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="feature-orbit-container">
      {/* Background Neon Laser Beams */}
      <svg className="orbit-laser-canvas" aria-hidden="true">
        <defs>
          <linearGradient id="laserCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d8ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cff" stopOpacity="0.2" />
          </linearGradient>
          <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {orbitFeatures.map((feat, idx) => {
          const angleRad = (feat.angle * Math.PI) / 180;
          const radiusX = 42; // percent
          const radiusY = 38; // percent
          const cx = 50 + Math.cos(angleRad) * radiusX;
          const cy = 50 + Math.sin(angleRad) * radiusY;

          return (
            <g key={feat.id}>
              <line
                x1="50%"
                y1="50%"
                x2={`${cx}%`}
                y2={`${cy}%`}
                stroke="url(#laserCyan)"
                strokeWidth={hoveredId === feat.id ? '2.5' : '1'}
                strokeDasharray="4 4"
                filter="url(#laserGlow)"
                className="orbit-beam-line"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Cards Array */}
      <div className="orbit-cards-grid">
        {orbitFeatures.map((feat, index) => {
          const Icon = feat.icon;
          const isHovered = hoveredId === feat.id;
          const isSelected = activeFeatureId === feat.id;

          return (
            <div
              key={feat.id}
              className={`orbit-feature-card ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
              style={{ animationDelay: `${index * 0.4}s` }}
              onMouseEnter={() => setHoveredId(feat.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectFeature && onSelectFeature(feat.id)}
            >
              <div className="card-glass-glow" />
              <div className="card-top-row">
                <div className="feature-icon-badge">
                  <Icon size={18} className="feature-icon" />
                </div>
                <span className="orbit-chip">{feat.tag}</span>
              </div>
              <h4 className="card-title">{feat.title}</h4>
              <p className="card-subtitle">{feat.subtitle}</p>
              <p className="card-desc">{feat.desc}</p>
              <div className="card-footer">
                <span>Explore Signal</span>
                <ArrowRight size={13} className="arrow-icon" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
