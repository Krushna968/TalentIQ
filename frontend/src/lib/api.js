const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
};

export const githubApi = {
  getOAuthUrl: (candidateId) => api.get(`/auth/github?candidateId=${encodeURIComponent(candidateId)}`),
  checkConnection: (candidateId) => api.get(`/candidates/${candidateId}/github/check`),
  getProfile: (candidateId) => api.get(`/candidates/${candidateId}/github/profile`),
  triggerSync: (candidateId) => api.post(`/candidates/${candidateId}/github/sync`),
  getTalentScore: (candidateId) => api.get(`/candidates/${candidateId}/talent-score`),
};

export const linkedInApi = {
  getOAuthUrl: (candidateId) => api.get(`/auth/linkedin?candidateId=${encodeURIComponent(candidateId)}`),
  createPreviewConnection: (candidateId) => api.post('/auth/linkedin/preview', { candidateId }),
  checkConnection: (candidateId) => api.get(`/candidates/${candidateId}/linkedin/check`),
};

export const evidenceApi = {
  list: (candidateId) => api.get(`/candidates/${candidateId}/evidence`),
  submit: (candidateId, evidence) => api.post(`/candidates/${candidateId}/evidence`, evidence),
};
