import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths.js';
import { useAuth } from '../context/AuthContext.jsx';

const linksByRole = {
  candidate: [
    { label: 'Overview', to: ROUTES.CANDIDATE_OVERVIEW },
    { label: 'My Identity', to: ROUTES.CANDIDATE_PROFILE },
    { label: 'Roadmap', to: ROUTES.CANDIDATE_ROADMAP },
    { label: 'Jobs', to: ROUTES.CANDIDATE_JOBS },
    { label: 'Practice', to: ROUTES.INTERVIEW },
  ],
  recruiter: [
    { label: 'Talent Search', to: ROUTES.RECRUITER_SEARCH },
    { label: 'Pipeline', to: ROUTES.RECRUITER_PIPELINE },
    { label: 'Jobs', to: ROUTES.RECRUITER_JOBS },
    { label: 'Compare', to: ROUTES.RECRUITER_COMPARE },
    { label: 'Analytics', to: ROUTES.ANALYTICS },
  ],
  reviewer: [
    { label: 'Review queue', to: ROUTES.REVIEW_QUEUE },
    { label: 'Trust', to: ROUTES.TRUST },
  ],
  admin: [
    { label: 'Talent Search', to: ROUTES.RECRUITER_SEARCH },
    { label: 'Review queue', to: ROUTES.REVIEW_QUEUE },
    { label: 'Trust', to: ROUTES.TRUST },
    { label: 'Analytics', to: ROUTES.ANALYTICS },
  ],
};

const initialsOf = (name) =>
  String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

export default function TopNav({ role }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const activeRole = user?.role || role || 'candidate';
  const links = linksByRole[activeRole] || linksByRole.candidate;

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [menuOpen]);

  async function signOut() {
    await logout();
    navigate(ROUTES.AUTH, { replace: true });
  }

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link className="brand" to="/" aria-label="TalentIQ home">
          <span className="brand-mark" aria-hidden="true" />
          <span>TalentIQ</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === ROUTES.CANDIDATE_OVERVIEW || link.to === ROUTES.RECRUITER_SEARCH}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-menu" ref={menuRef}>
              <button
                className="profile-avatar"
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`Account menu for ${user?.name || 'you'}`}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {initialsOf(user?.name)}
              </button>
              {menuOpen ? (
                <div className="nav-menu-panel" role="menu">
                  <div className="nav-menu-identity">
                    <strong>{user?.name}</strong>
                    <span className="muted">{user?.email}</span>
                    <span className="chip">{activeRole}</span>
                  </div>
                  <button className="nav-menu-item" type="button" role="menuitem" onClick={signOut}>
                    <span className="material-symbols-outlined" aria-hidden="true">logout</span>
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link className="button button-primary" to={ROUTES.AUTH}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
