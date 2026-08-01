import React, { createContext, useContext, useState } from 'react';
import { candidates as initialCandidates } from '../data/candidates';

const AppContext = createContext(null);

// Holds the static demo candidate list used by search/report/pipeline pickers
// until Owner 3 item #2 replaces it with server-side search. Hire/Hold/Reject
// decisions are NO LONGER kept here — they are persisted per-requisition via the
// pipeline API (survive refresh, recorded with actor + immutable timeline).
export function AppProvider({ children }) {
  const [candidates] = useState(initialCandidates);

  return (
    <AppContext.Provider value={{ candidates }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
