import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, readSession } from '../lib/api.js';

const AuthContext = createContext(null);

/**
 * Holds the signed-in session. The session lives in localStorage so a page
 * reload keeps the user signed in; a `talentiq:session` event keeps every tab
 * and the API client in step.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setSession(readSession());
    window.addEventListener('talentiq:session', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('talentiq:session', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Confirm the stored token is still valid before trusting it.
  useEffect(() => {
    let cancelled = false;
    if (!session?.token) {
      setLoading(false);
      return undefined;
    }
    authApi
      .me()
      .catch(() => null)
      .then(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only re-validate when the token itself changes.
  }, [session?.token]);

  const login = useCallback(async (email, password) => {
    const next = await authApi.login(email, password);
    setSession(next);
    return next;
  }, []);

  const register = useCallback(async (payload) => {
    const next = await authApi.register(payload);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.user?.role ?? null,
      candidateId: session?.user?.candidateId ?? null,
      isAuthenticated: Boolean(session?.token),
      loading,
      login,
      register,
      logout,
    }),
    [session, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
