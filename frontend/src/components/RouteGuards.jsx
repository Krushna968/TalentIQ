import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

/**
 * RequireAuth Guard
 * Ensures only authenticated users can access protected routes.
 * Displays a non-exposing loading state while restoring authentication status.
 * Redirects unauthenticated users to /auth.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="auth-loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0d14', color: '#86f5ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 16px', border: '3px solid rgba(134,245,255,0.2)', borderTopColor: '#86f5ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Verifying Authentication...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * RequireRole Guard
 * Enforces Role-Based Access Control (CANDIDATE, RECRUITER, ADMIN).
 * Prevents users from manually entering unauthorized role URLs.
 * ADMIN users bypass specific role checks according to Owner 1 RBAC architecture.
 */
export function RequireRole({ allowedRoles, children }) {
  const { role, isAuthenticated, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="auth-loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0d14', color: '#86f5ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, margin: '0 auto 16px', border: '3px solid rgba(134,245,255,0.2)', borderTopColor: '#86f5ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Verifying Authorization...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const normalizedAllowed = allowedRoles.map(r => String(r).toUpperCase());
  const currentRole = role ? String(role).toUpperCase() : '';

  // ADMIN bypasses specific role restrictions
  if (currentRole === 'ADMIN' || normalizedAllowed.includes(currentRole)) {
    return children;
  }

  // Redirect unauthorized users to their own authorized workspace
  const redirectTarget = currentRole === 'RECRUITER' ? '/recruiter' : '/candidate';
  return <Navigate to={redirectTarget} replace />;
}
