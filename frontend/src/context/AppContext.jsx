import React, { createContext, useContext, useEffect, useState } from 'react';
import { candidates as initialCandidates } from '../data/candidates';
import { candidateApi, authApi, clearAccessToken } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [loading, setLoading] = useState(true);

  // Restore session on startup using getMe()
  useEffect(() => {
    async function restoreSession() {
      try {
        const userData = await authApi.getMe();
        if (userData && (userData.id || userData.email)) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    candidateApi.getAll()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCandidates(data);
        }
      })
      .catch(() => {
        // Fallback to static demo data if API is offline
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(email, password, role) {
    const loginRes = await authApi.login(email, password, role);
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      return userData;
    } catch {
      if (loginRes && loginRes.user) {
        setUser(loginRes.user);
        return loginRes.user;
      }
      throw new Error('Failed to retrieve user profile after login');
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }

  function setCandidateStatus(id, status) {
    // Optimistic UI update
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, status } : c))
    );

    // Sync with backend API
    candidateApi.updateStatus(id, status).catch(() => {
      // Ignore API errors in dev/fallback mode
    });
  }

  const role = user?.role ? String(user.role).toUpperCase() : null;
  const isAuthenticated = !!user;

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      role,
      isAuthenticated,
      authLoading,
      login,
      logout,
      candidates,
      loading,
      setCandidateStatus
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

