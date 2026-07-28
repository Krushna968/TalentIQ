import React from 'react';
import { Link } from 'react-router-dom';
import SpaceFabric from '../components/SpaceFabric.jsx';

const verificationTypes = [
  { icon: 'code', title: 'GitHub', description: 'We evaluate commit depth, code quality, language range, and meaningful open-source contribution.', tag: 'Code signal' },
  { icon: 'emoji_events', title: 'Hackathons', description: 'Participation, project scope, and results are verified across leading competition platforms.', tag: 'Execution signal' },
  { icon: 'workspace_premium', title: 'Certifications', description: 'Credentials are cryptographically checked and mapped to a consistent skill taxonomy.', tag: 'Learning signal' },
  { icon: 'psychology', title: 'Interviews', description: 'Adaptive technical assessments reveal reasoning, communication, and decision quality.', tag: 'Human signal' },
];

const stats = [
  ['12K+', 'Repositories analyzed'],
  ['40+', 'Verified skill signals'],
  ['6', 'AI evaluators per profile'],
  ['98%', 'Signal integrity confidence'],
];

const nodes = [
  ['12%', '43%', false], ['21%', '17%', false], ['31%', '69%', true], ['38%', '31%', false],
  ['49%', '51%', true], ['59%', '18%', false], ['68%', '66%', false], ['77%', '33%', true], ['87%', '55%', false],
];

export default function LandingPage() {
  return (
    <div className="space-page">
      <SpaceFabric className="page-fabric" />
      <header className="top-nav">
        <div className="top-nav-inner">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true" />
            <span>TalentIQ</span>
          </Link>
          <nav className="nav-links" aria-label="Landing navigation">
            <a className="nav-link" href="#verification">What we verify</a>
            <Link className="nav-link" to="/recruiter">For recruiters</Link>
            <Link className="nav-link" to="/candidate">For candidates</Link>
          </nav>
          <div className="nav-actions">
            <Link className="button button-ghost" to="/auth">Log in</Link>
            <Link className="button button-primary" to="/auth" state={{ role: 'candidate' }}>Get verified</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <SpaceFabric />
          <div className="node-cluster" aria-hidden="true">
            {[18, 49, 104, 155, 214, 270, 314].map((angle, index) => <span key={angle} className="cluster-line" style={{ transform: 'rotate(' + angle + 'deg)', width: (index % 2 ? 31 : 43) + '%' }} />)}
            {nodes.map(([left, top, gold], index) => <span key={left + top} className={'cluster-node' + (gold ? ' gold' : '')} style={{ left, top, animationDelay: '-' + (index * .55) + 's' }} />)}
          </div>
          <div className="hero-content">
            <div className="eyebrow">The verified skill intelligence network</div>
            <h1 className="gradient-text">Your skills, verified.<br />Not just claimed.</h1>
            <p>TalentIQ transforms proof of work into a living, trusted talent graph—so exceptional people stand out for what they have actually done.</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/auth" state={{ role: 'candidate' }}>Build your profile <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_forward</span></Link>
              <Link className="button button-ghost" to="/auth" state={{ role: 'recruiter' }}>I’m hiring <span className="material-symbols-outlined" style={{ fontSize: 17 }}>search</span></Link>
            </div>
          </div>
        </section>

        <section className="content-wrap signal-stats" aria-label="TalentIQ network statistics">
          {stats.map(([value, label]) => (
            <div className="glass-panel glass-panel--interactive signal-stat" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className="content-wrap verify-section" id="verification">
          <div className="verify-heading">
            <div>
              <div className="eyebrow">Verified at source</div>
              <h2 className="section-heading">Evidence that travels farther than a résumé.</h2>
            </div>
            <p>Every TalentIQ score is assembled from connected, attributable signals. We verify the work, reconcile the context, and surface the evidence that makes a hiring decision defensible.</p>
          </div>

          <div className="verify-grid">
            {verificationTypes.map((item) => (
              <article className="glass-panel glass-panel--interactive verify-card" key={item.title}>
                <div className="verify-icon"><span className="material-symbols-outlined">{item.icon}</span></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="chip">{item.tag}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
