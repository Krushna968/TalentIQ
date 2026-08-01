import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import SpaceFabric from '../components/SpaceFabric.jsx';
import { useApp } from '../context/AppContext.jsx';
import './AuthScreen.css';

export default function AuthScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated, role: currentRole } = useApp();
  const [role, setRole] = useState(location.state?.role === 'recruiter' ? 'recruiter' : 'candidate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailInput, setEmailInput] = useState(role === 'recruiter' ? 'recruiter@acme.com' : 'aditi@dev.io');
  const [passwordInput, setPasswordInput] = useState('password123');

  useEffect(() => {
    if (isAuthenticated) {
      const target = currentRole === 'RECRUITER' ? '/recruiter' : '/candidate';
      const fromPath = location.state?.from?.pathname;
      navigate(fromPath || target, { replace: true });
    }
  }, [isAuthenticated, currentRole, navigate, location]);

  async function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(emailInput, passwordInput, role);
      navigate(role === 'recruiter' ? '/recruiter' : '/candidate');
    } catch (err) {
      const msg = err?.message || 'Authentication failed. Invalid email or password.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-story">
        <div className="auth-story-orb"></div>
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
          <Lock size={15} />
          Secure connection established
        </div>
      </section>

      <main className="auth-form-side">
        <div className="auth-form-side-grid"></div>
        <Link className="brand auth-mobile-brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>TalentIQ</span>
        </Link>

        <form className="glass-panel auth-card auth-card-animated" onSubmit={submit}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="eyebrow" style={{ justifyContent: 'center' }}>Identity gateway</div>
            <h2 className="font-space" style={{ margin: '12px 0 7px', fontSize: 28, letterSpacing: '-.04em' }}>Welcome to TalentIQ</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>Choose your workspace to continue.</p>
          </div>

          <div className="role-toggle role-toggle-enhanced" role="tablist" aria-label="Workspace type">
            {['candidate', 'recruiter'].map((nextRole) => (
              <button key={nextRole} className={role === nextRole ? 'active' : ''} type="button" role="tab" aria-selected={role === nextRole} onClick={() => {
                setRole(nextRole);
                setEmailInput(nextRole === 'recruiter' ? 'recruiter@acme.com' : 'aditi@dev.io');
              }}>
                {nextRole === 'candidate' ? 'Candidate' : 'Recruiter'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 17, marginTop: 25 }}>
            <button type="button" className="btn-social-github">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Continue with GitHub
            </button>

            <div className="divider">or continue with email</div>

            <label className="floating-input-group">
              <input className="form-input" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} aria-label="Email address" placeholder=" " />
              <span className="form-label">Email address</span>
              <Mail size={18} className="input-icon" />
            </label>
            
            <label className="floating-input-group">
              <input className="form-input" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} aria-label="Password" placeholder=" " />
              <span className="form-label">Password</span>
              <Lock size={18} className="input-icon" />
            </label>

            {errorMessage && (
              <div className="auth-error-alert" style={{ background: 'rgba(255, 77, 77, 0.15)', border: '1px solid rgba(255, 77, 77, 0.4)', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 13, textAlign: 'center', fontWeight: 500 }}>
                {errorMessage}
              </div>
            )}

            <button className="button button-primary" type="submit" disabled={isSubmitting} style={{ marginTop: 5 }}>
              {isSubmitting ? (
                <><span className="loading-spinner" /> Authenticating</>
              ) : (
                <>
                  Continue as {role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                  <ArrowRight size={17} />
                </>
              )}
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
