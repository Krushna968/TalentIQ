const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    // Attach the HTTP status so callers can distinguish 409 (stale write) and
    // 403 (permission) for optimistic-update rollback and messaging.
    const error = new Error(err.error || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

function qs(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

// Owner 3 — recruiter operations. Until Owner 1's auth client lands, identity /
// tenant come from the backend's dev auth stub (defaults to the demo org).
export const orgApi = {
  list: () => api.get('/orgs'),
  create: (body) => api.post('/orgs', body),
  members: (orgId) => api.get(`/orgs/${orgId}/members`),
  addMember: (orgId, body) => api.post(`/orgs/${orgId}/members`, body),
};

export const jobApi = {
  list: (params) => api.get(`/jobs${qs(params)}`),
  get: (jobId) => api.get(`/jobs/${jobId}`),
  create: (body) => api.post('/jobs', body),
  update: (jobId, body) => api.patch(`/jobs/${jobId}`, body),
  setStatus: (jobId, status) => api.patch(`/jobs/${jobId}/status`, { status }),
  collaborators: (jobId) => api.get(`/jobs/${jobId}/collaborators`),
  addCollaborator: (jobId, body) => api.post(`/jobs/${jobId}/collaborators`, body),
};

export const pipelineApi = {
  board: (jobId) => api.get(`/jobs/${jobId}/pipeline`),
  addCandidates: (jobId, candidateIds) => api.post(`/jobs/${jobId}/pipeline`, { candidateIds }),
  moveStage: (entryId, toStageId, expectedUpdatedAt) =>
    api.patch(`/pipeline/entries/${entryId}/stage`, { toStageId, expectedUpdatedAt }),
  decide: (entryId, decision, reason) =>
    api.post(`/pipeline/entries/${entryId}/decision`, { decision, reason }),
  reopen: (entryId, toStageId) => api.post(`/pipeline/entries/${entryId}/reopen`, { toStageId }),
  assign: (entryId, assignedToUserId) =>
    api.patch(`/pipeline/entries/${entryId}/assignee`, { assignedToUserId }),
  shortlist: (entryId, shortlisted) =>
    api.patch(`/pipeline/entries/${entryId}/shortlist`, { shortlisted }),
  addNote: (entryId, body) => api.post(`/pipeline/entries/${entryId}/notes`, { body }),
  timeline: (entryId) => api.get(`/pipeline/entries/${entryId}/timeline`),
  bulk: (body) => api.post('/pipeline/bulk', body),
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
