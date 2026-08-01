const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE}/api`;

const STORAGE_KEY = 'talentiq.session';

/** Reads the persisted session. Returns null when signed out. */
export function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('talentiq:session', { detail: session }));
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let refreshInFlight = null;

/** Exchanges the refresh token for a new access token, de-duplicating concurrent calls. */
async function refreshSession() {
  const session = readSession();
  if (!session?.refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        if (!res.ok) {
          writeSession(null);
          return null;
        }
        const next = await res.json();
        writeSession(next);
        return next;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function request(path, options = {}, retry = true) {
  const session = readSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // An expired access token is refreshed once, transparently.
  if (res.status === 401 && retry && session?.refreshToken) {
    const next = await refreshSession();
    if (next) return request(path, options, false);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }

  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  return type.includes('application/json') ? res.json() : res.text();
}

const qs = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
};

export const api = {
  get: (path, params) => request(`${path}${qs(params)}`),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export const authApi = {
  login: async (email, password) => {
    const session = await api.post('/auth/login', { email, password });
    writeSession(session);
    return session;
  },
  register: async (payload) => {
    const session = await api.post('/auth/register', payload);
    writeSession(session);
    return session;
  },
  logout: async () => {
    const session = readSession();
    try {
      await api.post('/auth/logout', { refreshToken: session?.refreshToken });
    } catch {
      // Signing out locally must succeed even if the server call fails.
    } finally {
      writeSession(null);
    }
  },
  me: () => api.get('/auth/me'),
  updateMe: (payload) => api.put('/auth/me', payload),
};

// ---------------------------------------------------------------------------
// Candidate
// ---------------------------------------------------------------------------

export const candidateApi = {
  dashboard: () => api.get('/candidates'),
  profile: () => api.get('/candidates/profile'),
  updateProfile: (payload) => api.put('/candidates/profile', payload),

  roadmap: () => api.get('/candidates/roadmap'),
  addRoadmapItem: (payload) => api.post('/candidates/roadmap', payload),
  updateRoadmapItem: (id, payload) => api.patch(`/candidates/roadmap/${id}`, payload),
  deleteRoadmapItem: (id) => api.delete(`/candidates/roadmap/${id}`),

  resumes: () => api.get('/candidates/resume-builder'),
  saveResume: (payload) => api.post('/candidates/resume-builder', payload),
  generateResume: (targetRole) => api.post('/candidates/resume-builder/generate', { targetRole }),
  portfolio: () => api.get('/candidates/portfolio'),

  jobs: (params) => api.get('/candidates/jobs', params),
  applyToJob: (jobId, status, notes) => api.put(`/candidates/jobs/${jobId}/apply`, { status, notes }),

  salary: () => api.get('/candidates/salary'),
  learning: () => api.get('/candidates/learning'),
  badges: () => api.get('/candidates/badges'),

  talentScore: (refresh = false) => api.get('/candidates/me/talent-score', { refresh: refresh || undefined }),
  recalculate: () => api.post('/candidates/me/talent-score/recalculate'),
  agents: () => api.get('/candidates/me/agents'),
  timeline: () => api.get('/candidates/me/timeline'),
};

export const evidenceApi = {
  list: (candidateId, params) => api.get(`/candidates/${candidateId}/evidence`, params),
  get: (candidateId, id) => api.get(`/candidates/${candidateId}/evidence/${id}`),
  create: (candidateId, payload) => api.post(`/candidates/${candidateId}/evidence`, payload),
  update: (candidateId, id, payload) => api.patch(`/candidates/${candidateId}/evidence/${id}`, payload),
  submit: (candidateId, id) => api.post(`/candidates/${candidateId}/evidence/${id}/submit`, {}),
  remove: (candidateId, id) => api.delete(`/candidates/${candidateId}/evidence/${id}`),
  reviewQueue: (params) => api.get('/evidence/review/queue', params),
  startReview: (id) => api.post(`/evidence/${id}/review/start`, {}),
  review: (id, decision, reason, score) => api.put(`/evidence/${id}/review`, { decision, reason, score }),
};

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export const githubApi = {
  getOAuthUrl: () => api.get('/auth/github'),
  checkConnection: (candidateId) => api.get(`/candidates/${candidateId}/github/check`),
  getProfile: (candidateId) => api.get(`/candidates/${candidateId}/github/profile`),
  triggerSync: (candidateId) => api.post(`/candidates/${candidateId}/github/sync`),
  disconnect: (candidateId) => api.delete(`/candidates/${candidateId}/github`),
};

export const linkedInApi = {
  getOAuthUrl: () => api.get('/auth/linkedin'),
  createPreviewConnection: (candidateId) => api.post('/auth/linkedin/preview', { candidateId }),
  checkConnection: (candidateId) => api.get(`/candidates/${candidateId}/linkedin/check`),
};

// ---------------------------------------------------------------------------
// Intelligence, verification and trust
// ---------------------------------------------------------------------------

export const intelligenceApi = {
  talentScore: (candidateId, refresh) => api.get(`/candidates/${candidateId}/talent-score`, { refresh: refresh || undefined }),
  recalculate: (candidateId) => api.post(`/candidates/${candidateId}/talent-score/recalculate`),
  agents: (candidateId) => api.get(`/candidates/${candidateId}/agents`),
  runAgents: (candidateId, agents) => api.post(`/candidates/${candidateId}/agents/run`, { agents }),
  timeline: (candidateId) => api.get(`/candidates/${candidateId}/timeline`),
  similar: (candidateId) => api.get(`/candidates/${candidateId}/similar`),
};

export const verificationApi = {
  verifyAll: (candidateId) => api.post('/verification/all', { candidateId }),
  verify: (source, candidateId) => api.post(`/verification/${source}`, { candidateId }),
  status: (candidateId) => api.get(`/verification/status/${candidateId}`),
  authenticity: (candidateId) => api.get(`/verification/authenticity/${candidateId}`),
  badges: (candidateId) => api.get('/verification/badges', { candidateId }),
};

export const trustApi = {
  flags: (params) => api.get('/trust/flags', params),
  score: (candidateId) => api.get(`/trust/score/${candidateId}`),
  rescan: (candidateId) => api.post(`/trust/score/${candidateId}/rescan`),
  report: (payload) => api.post('/trust/report', payload),
  resolve: (id, status) => api.put(`/trust/flags/${id}/resolve`, { status }),
};

// ---------------------------------------------------------------------------
// Recruiter
// ---------------------------------------------------------------------------

export const recruiterApi = {
  search: (params) => api.get('/recruiters/search', params),
  copilot: (query, limit) => api.post('/matching/copilot', { query, limit }),

  company: () => api.get('/recruiters/company'),
  saveCompany: (payload) => api.put('/recruiters/company', payload),

  jobs: (mine = true) => api.get('/recruiters/jobs', { mine }),
  job: (jobId) => api.get(`/recruiters/jobs/${jobId}`),
  createJob: (payload) => api.post('/recruiters/jobs', payload),
  updateJob: (jobId, payload) => api.patch(`/recruiters/jobs/${jobId}`, payload),
  closeJob: (jobId) => api.delete(`/recruiters/jobs/${jobId}`),

  pipeline: (jobId) => api.get('/recruiters/pipeline', { jobId }),
  setStage: (candidateId, payload) => api.put(`/recruiters/pipeline/${candidateId}`, payload),
  removeFromPipeline: (entryId) => api.delete(`/recruiters/pipeline/entry/${entryId}`),

  compare: (ids, jobId) => api.post('/recruiters/compare', { ids, jobId }),
};

export const matchingApi = {
  match: (payload) => api.post('/matching/match', payload),
  scores: (candidateId, jobId) => api.get(`/matching/scores/${candidateId}`, { jobId }),
  recommendations: (jobId) => api.get('/matching/recommendations', { jobId }),
};

export const analyticsApi = {
  hiring: () => api.get('/analytics/hiring'),
  trends: (months) => api.get('/analytics/trends', { months }),
  skillsGap: () => api.get('/analytics/skills-gap'),
  pipelineMetrics: () => api.get('/analytics/pipeline-metrics'),
  skillGraph: () => api.get('/analytics/skill-graph'),
};

// ---------------------------------------------------------------------------
// Interviews, reports and specialist modules
// ---------------------------------------------------------------------------

export const interviewApi = {
  questions: (params) => api.get('/interviews/questions', params),
  start: (payload) => api.post('/interviews/sessions', payload),
  sessions: () => api.get('/interviews/sessions'),
  session: (id) => api.get(`/interviews/sessions/${id}`),
  answer: (id, questionId, answer) => api.post(`/interviews/sessions/${id}/answer`, { questionId, answer }),
  complete: (id) => api.post(`/interviews/sessions/${id}/complete`, {}),
  report: (sessionId) => api.get(`/interviews/report/${sessionId}`),
};

export const reportApi = {
  talent: (candidateId, refresh) => api.get(`/reports/talent/${candidateId}`, { refresh: refresh || undefined }),
  graph: (candidateId) => api.get(`/reports/talent/${candidateId}/graph`),
  share: (candidateId) => api.post(`/reports/talent/${candidateId}/share`, {}),
  exportUrl: (candidateId) => `${API_URL}/reports/talent/${candidateId}/export`,
};

export const teamApi = {
  contributions: (candidateId) => api.get(`/team-contributions/${candidateId}`),
  impact: (candidateId) => api.get(`/team-contributions/${candidateId}/impact`),
};

export const presentationApi = {
  analyze: (payload) => api.post('/presentations/analyze', payload),
  history: (candidateId) => api.get(`/presentations/${candidateId}/history`),
};

export const hackathonApi = {
  profile: (candidateId) => api.get(`/hackathons/${candidateId}`),
  achievements: (candidateId) => api.get(`/hackathons/${candidateId}/achievements`),
  leaderboard: (limit) => api.get('/hackathons/leaderboard', { limit }),
  submit: (payload) => api.post('/hackathons/verify', payload),
};
