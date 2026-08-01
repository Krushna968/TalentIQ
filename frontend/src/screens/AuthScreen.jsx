import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import SpaceFabric from '../components/SpaceFabric.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROUTES } from '../routes/paths.js';
import { ErrorNote } from '../components/DataState.jsx';

const roleContent = {
  candidate: {
    label: 'For candidates and students',
    title: 'Turn your work into a trusted talent identity.',
    description: 'Connect projects, credentials, interviews, and real proof of work so your skills can speak for themselves.',
    button: 'Enter candidate workspace',
    icon: UserRound,
    demoEmail: 'aditi@talentiq.ai',
    landing: ROUTES.CANDIDATE_OVERVIEW,
  },
  recruiter: {
    label: 'For recruiters and hiring teams',
    title: 'Hire with evidence, not guesswork.',
    description: 'Discover high-signal candidates through explainable skill matches and attributable proof of work.',
    button: 'Open recruiter workspace',
    icon: BriefcaseBusiness,
    demoEmail: 'recruiter@talentiq.ai',
    landing: ROUTES.RECRUITER_SEARCH,
  },
};

const landingFor = (role) =>
  role === 'recruiter' ? ROUTES.RECRUITER_SEARCH : role === 'reviewer' ? ROUTES.REVIEW_QUEUE : role === 'admin' ? ROUTES.RECRUITER_SEARCH : ROUTES.CANDIDATE_OVERVIEW;

export default function AuthScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [role, setRole] = useState(location.state?.role === 'recruiter' ? 'recruiter' : 'candidate');
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', title: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const content = roleContent[role];
  const RoleIcon = content.icon;
  const isRegister = mode === 'register';

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  function selectRole(nextRole) {
    setRole(nextRole);
    setError(null);
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const session = isRegister
        ? await register({
            name: form.name,
            email: form.email,
            password: form.password,
            role,
            ...(role === 'recruiter' ? { company: form.company, title: form.title } : { title: form.title }),
          })
        : await login(form.email, form.password);

      // Land on the workspace matching the role the server actually issued.
      navigate(location.state?.from || landingFor(session.user.role), { replace: true });
    } catch (caught) {
      setError(caught.message || 'Could not sign in');
    } finally {
      setSubmitting(false);
    }
  }

  /** Fills the demo credentials so the platform can be explored immediately. */
  function useDemo() {
    setMode('signin');
    setForm((current) => ({ ...current, email: content.demoEmail, password: 'talentiq2026' }));
    setError(null);
  }

  return (
    <div className={`auth-layout auth-layout--${role}`}>
      <SpaceFabric variant="auth" className="auth-fabric" />
      <section className="auth-story">
        <Link className="brand auth-story-brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>TalentIQ</span>
        </Link>
        <div className="auth-story-content">
          <div className="eyebrow">{content.label}</div>
          <h1 className="gradient-text">{content.title}</h1>
          <p>{content.description}</p>
          <div className="auth-story-proof">
            <ShieldCheck size={16} />
            <span>Evidence-backed. Explainable. Built for real careers.</span>
          </div>
        </div>
        <div className="auth-system">
          <LockKeyhole size={14} /> Secure connection established
        </div>
      </section>

      <main className="auth-form-side">
        <div className="auth-card">
          <form className="auth-form-content" onSubmit={submit}>
            <div className="auth-form-heading">
              <div className="auth-role-icon"><RoleIcon size={18} /></div>
              <div className="eyebrow">Identity gateway</div>
              <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
              <p>{isRegister ? 'Set up a workspace in under a minute.' : 'Sign in to continue to your TalentIQ workspace.'}</p>
            </div>

            <div className="role-toggle" role="tablist" aria-label="Workspace type">
              <button
                className={role === 'candidate' ? 'active' : ''}
                type="button"
                role="tab"
                aria-selected={role === 'candidate'}
                onClick={() => selectRole('candidate')}
              >
                Candidate / Student
              </button>
              <button
                className={role === 'recruiter' ? 'active' : ''}
                type="button"
                role="tab"
                aria-selected={role === 'recruiter'}
                onClick={() => selectRole('recruiter')}
              >
                Recruiter
              </button>
            </div>

            <div className="auth-fields">
              {isRegister ? (
                <label>
                  <span className="form-label">Full name</span>
                  <span className="input-wrap">
                    <UserRound size={17} aria-hidden="true" />
                    <input className="form-input" required value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your name" />
                  </span>
                </label>
              ) : null}

              <label>
                <span className="form-label">Email address</span>
                <span className="input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input className="form-input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
                </span>
              </label>

              <label>
                <span className="form-label">Password</span>
                <span className="input-wrap">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <input
                    className="form-input"
                    type="password"
                    required
                    minLength={isRegister ? 8 : undefined}
                    value={form.password}
                    onChange={set('password')}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    placeholder={isRegister ? 'At least 8 characters, with a number' : '••••••••'}
                  />
                </span>
              </label>

              {isRegister ? (
                <>
                  <label>
                    <span className="form-label">{role === 'recruiter' ? 'Job title' : 'Current title'}</span>
                    <span className="input-wrap">
                      <BriefcaseBusiness size={17} aria-hidden="true" />
                      <input className="form-input" value={form.title} onChange={set('title')} placeholder={role === 'recruiter' ? 'Talent Partner' : 'Full-Stack Engineer'} />
                    </span>
                  </label>
                  {role === 'recruiter' ? (
                    <label>
                      <span className="form-label">Company</span>
                      <span className="input-wrap">
                        <BriefcaseBusiness size={17} aria-hidden="true" />
                        <input className="form-input" value={form.company} onChange={set('company')} placeholder="Acme Inc." />
                      </span>
                    </label>
                  ) : null}
                </>
              ) : null}
            </div>

            <ErrorNote error={error} />

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? (
                <><span className="loading-spinner" /> {isRegister ? 'Creating account' : 'Signing in'}</>
              ) : (
                <>{isRegister ? 'Create account' : content.button}<ArrowRight size={17} /></>
              )}
            </button>

            <div className="auth-alt-actions">
              <button className="link-button" type="button" onClick={() => { setMode(isRegister ? 'signin' : 'register'); setError(null); }}>
                {isRegister ? 'I already have an account' : 'Create a new account'}
              </button>
              <button className="link-button" type="button" onClick={useDemo}>
                Use demo {role} account
              </button>
            </div>

            <p className="auth-form-footer">
              New to TalentIQ? <Link to="/">Explore the platform</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
