import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import SpaceFabric from '../components/SpaceFabric.jsx';

const roleContent = {
  candidate: {
    label: 'For candidates and students',
    title: 'Turn your work into a trusted talent identity.',
    description: 'Connect projects, credentials, interviews, and real proof of work so your skills can speak for themselves.',
    button: 'Enter candidate workspace',
    icon: UserRound,
    email: 'aditi@dev.io',
  },
  recruiter: {
    label: 'For recruiters and hiring teams',
    title: 'Hire with evidence, not guesswork.',
    description: 'Discover high-signal candidates through explainable skill matches and attributable proof of work.',
    button: 'Open recruiter workspace',
    icon: BriefcaseBusiness,
    email: 'recruiter@acme.com',
  },
};

export default function AuthScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState(location.state?.role === 'recruiter' ? 'recruiter' : 'candidate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = roleContent[role];
  const RoleIcon = content.icon;

  function selectRole(nextRole) {
    setRole(nextRole);
    setIsSubmitting(false);
  }

  function submit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    window.setTimeout(() => navigate(role === 'recruiter' ? '/recruiter' : '/candidate'), 650);
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
              <h2>Welcome back</h2>
              <p>Sign in to continue to your TalentIQ workspace.</p>
            </div>

            <div className="role-toggle" role="tablist" aria-label="Workspace type">
              <button className={role === 'candidate' ? 'active' : ''} type="button" role="tab" aria-selected={role === 'candidate'} onClick={() => selectRole('candidate')}>
                Candidate / Student
              </button>
              <button className={role === 'recruiter' ? 'active' : ''} type="button" role="tab" aria-selected={role === 'recruiter'} onClick={() => selectRole('recruiter')}>
                Recruiter
              </button>
            </div>

            <div className="auth-fields">
              <label>
                <span className="form-label">Email address</span>
                <span className="input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input className="form-input" type="email" defaultValue={content.email} key={content.email} autoComplete="email" aria-label="Email address" />
                </span>
              </label>
              <label>
                <span className="form-label">Password</span>
                <span className="input-wrap">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <input className="form-input" type="password" defaultValue="password123" autoComplete="current-password" aria-label="Password" />
                </span>
              </label>
            </div>

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><span className="loading-spinner" /> Signing in</> : <>{content.button}<ArrowRight size={17} /></>}
            </button>

            <p className="auth-form-footer">
              New to TalentIQ? <Link to="/">Explore the platform</Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
