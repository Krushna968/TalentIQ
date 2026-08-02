const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE}/api`;

async function request(path, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    headers: isFormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: (path, body) => request(path, { method: 'POST', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export const githubApi = {
  getOAuthUrl: (candidateId) => api.get(`/auth/github?candidateId=${encodeURIComponent(candidateId)}`),
  checkConnection: (candidateId) => api.get(`/candidates/${candidateId}/github/check`),
  getProfile: (candidateId) => api.get(`/candidates/${candidateId}/github/profile`),
  triggerSync: (candidateId) => api.post(`/candidates/${candidateId}/github/sync`),
  getSyncStatus: (candidateId) => api.get(`/candidates/${candidateId}/github/sync-status`),
  disconnect: (candidateId) => api.delete(`/candidates/${candidateId}/github`),
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

export const interviewApi = {
  getQuestion: (role, skills, sessionId) => api.get(`/interviews/questions?role=${encodeURIComponent(role)}&skills=${encodeURIComponent(skills)}${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`),
  evaluate: (payload) => api.post('/interviews/submit', payload),
};

export const aiApi = {
  status: () => api.get('/ai/status'),
  careerRoadmap: (payload) => api.post('/ai/career-roadmap', payload),
  resumeDraft: (payload) => api.post('/ai/resume-draft', payload),
  resumeScore: (payload) => api.post('/ai/resume-score', payload),
  resumeUploadScore: (formData) => api.postForm('/ai/resume-score/upload', formData),
  trustReview: (payload) => api.post('/ai/trust-review', payload),
  match: (payload) => api.post('/matching/match', payload),
  analyzePresentation: (payload) => api.post('/presentations/analyze', payload),
};
