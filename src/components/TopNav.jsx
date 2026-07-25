import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TopNav({ role = 'candidate' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const candidateLinks = [
    { label: 'Dashboard', path: '/candidate' },
    { label: 'Interview', path: '/interview' },
    { label: 'Reports', path: '#' },
    { label: 'Verify', path: '#' },
  ];

  const recruiterLinks = [
    { label: 'Dashboard', path: '/candidate' },
    { label: 'Talent Search', path: '/recruiter' },
    { label: 'Reports', path: '#' },
    { label: 'Verify', path: '#' },
  ];

  const links = role === 'recruiter' ? recruiterLinks : candidateLinks;

  return (
    <header className="bg-surface/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto h-16">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate('/')}
            className="font-bold text-primary text-xl tracking-tight font-space"
          >
            TalentIQ
          </button>
          <nav className="hidden md:flex gap-1">
            {links.map(link => (
              <button
                key={link.label}
                onClick={() => link.path !== '#' && navigate(link.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide font-plex transition-all ${
                  isActive(link.path)
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-surface-variant-text hover:text-primary hover:bg-surface-high'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-surface-variant-text hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-high">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button className="text-surface-variant-text hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-high">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-container/30 border border-primary-container/50 flex items-center justify-center text-primary text-xs font-bold">
            {role === 'recruiter' ? 'RC' : 'AR'}
          </div>
        </div>
      </div>
    </header>
  );
}
