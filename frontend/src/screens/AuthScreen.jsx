import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SpaceFabric from '../components/SpaceFabric.jsx';

export default function AuthScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(location.state?.role === 'recruiter' ? 'recruiter' : 'candidate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const email = role === 'recruiter' ? 'recruiter@acme.com' : 'aditi@dev.io';

  function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    window.setTimeout(() => navigate(role === 'recruiter' ? '/recruiter' : '/candidate'), 650);
  }

  return (
    <div className="auth-layout">
      <section className="auth-story">
        <SpaceFabric />
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>TalentIQ</span>
        </Link>
        <div className="auth-story-content">
          <div className="eyebrow">Verified talent network</div>
          <h1 className="gradient-text">Verified once.<br />Recognized everywhere.</h1>
          <p>Connect your proof of work to an intelligence layer recruiters can trust—without asking anyone to take your word for it.</p>
        </div>
        <div className="auth-system">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>
          Secure connection established
        </div>
      </section>

      <main className="auth-form-side">
        <Link className="brand auth-mobile-brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>TalentIQ</span>
        </Link>

        <form className="glass-panel auth-card" onSubmit={submit}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Identity gateway</div>
            <h2 className="font-space" style={{ margin: '12px 0 7px', fontSize: 28, letterSpacing: '-.04em' }}>Welcome to TalentIQ</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>Choose your workspace to continue.</p>
          </div>

          <div className="role-toggle" role="tablist" aria-label="Workspace type">
            {['candidate', 'recruiter'].map((nextRole) => (
              <button key={nextRole} className={role === nextRole ? 'active' : ''} type="button" role="tab" aria-selected={role === nextRole} onClick={() => setRole(nextRole)}>
                {nextRole === 'candidate' ? 'Candidate' : 'Recruiter'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 17, marginTop: 25 }}>
            <label>
              <span className="form-label">Email address</span>
              <span className="input-wrap">
                <span className="material-symbols-outlined">mail</span>
                <input className="form-input" type="email" defaultValue={email} key={email} aria-label="Email address" />
              </span>
            </label>
            <label>
              <span className="form-label">Password</span>
              <span className="input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input className="form-input" type="password" defaultValue="password123" aria-label="Password" />
              </span>
            </label>
            <button className="button button-primary" type="submit" disabled={isSubmitting} style={{ marginTop: 5 }}>
              {isSubmitting ? <><span className="loading-spinner" /> Authenticating</> : <>Continue as {role === 'recruiter' ? 'Recruiter' : 'Candidate'}<span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_forward</span></>}
            </button>
          </div>

          <p className="muted" style={{ margin: '21px 0 0', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.09)', textAlign: 'center', fontSize: 12 }}>
            New to TalentIQ? <Link to="/" style={{ color: '#86f5ff', fontWeight: 700 }}>Explore the network</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
