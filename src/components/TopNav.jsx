import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

const linksByRole = {
  candidate: [
    { label: 'Overview', to: '/candidate' },
    { label: 'Practice', to: '/interview' },
    { label: 'Talent Explorer', to: '/recruiter' },
  ],
  recruiter: [
    { label: 'Talent Search', to: '/recruiter' },
    { label: 'Candidate Cockpit', to: '/candidate' },
    { label: 'Featured Dossier', to: '/report/elena-rodriguez' },
  ],
};

export default function TopNav({ role = 'candidate' }) {
  const navigate = useNavigate();
  const links = linksByRole[role] || linksByRole.candidate;
  const initials = role === 'recruiter' ? 'RC' : 'AR';

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link className="brand" to="/" aria-label="TalentIQ home">
          <span className="brand-mark" aria-hidden="true" />
          <span>TalentIQ</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/candidate' || link.to === '/recruiter'} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-button" type="button" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="icon-button" type="button" aria-label="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button className="profile-avatar" type="button" title="Open dashboard" onClick={() => navigate(role === 'recruiter' ? '/recruiter' : '/candidate')}>
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
}
