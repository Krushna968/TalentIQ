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
  getOAuthUrl: () => api.get('/auth/github'),
  checkConnection: (candidateId) => api.get(`/candidates/${candidateId}/github/check`),
  getProfile: (candidateId) => api.get(`/candidates/${candidateId}/github/profile`),
  triggerSync: (candidateId) => api.post(`/candidates/${candidateId}/github/sync`),
};