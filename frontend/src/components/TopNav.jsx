import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths.js';

const linksByRole = {
  candidate: [
    { label: 'Overview', to: ROUTES.CANDIDATE_OVERVIEW },
    { label: 'Practice', to: ROUTES.INTERVIEW },
    { label: 'My Identity', to: ROUTES.CANDIDATE_PROFILE },
  ],
  recruiter: [
    { label: 'Talent Search', to: ROUTES.RECRUITER_SEARCH },
    { label: 'Pipeline', to: ROUTES.RECRUITER_PIPELINE },
    { label: 'Compare', to: ROUTES.RECRUITER_COMPARE },
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
            <NavLink key={link.to} to={link.to} end={link.to === ROUTES.CANDIDATE_OVERVIEW || link.to === ROUTES.RECRUITER_SEARCH} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
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
          <button className="profile-avatar" type="button" title="Open dashboard" onClick={() => navigate(role === 'recruiter' ? ROUTES.RECRUITER_SEARCH : ROUTES.CANDIDATE_OVERVIEW)}>
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
}
