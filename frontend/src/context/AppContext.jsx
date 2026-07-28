import React, { createContext, useContext, useState } from 'react';
import { candidates as initialCandidates } from '../data/candidates';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [candidates, setCandidates] = useState(initialCandidates);

  function setCandidateStatus(id, status) {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, status } : c))
    );
  }

  return (
    <AppContext.Provider value={{ candidates, setCandidateStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
