const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_URL = `${API_BASE}/api`;

let memoryToken = null;
try {
  memoryToken = localStorage.getItem('talentiq_access_token') || null;
} catch (e) {
  // Ignore storage errors
}

export function getAccessToken() {
  return memoryToken;
}

export function setAccessToken(token) {
  memoryToken = token;
  try {
    if (token) {
      localStorage.setItem('talentiq_access_token', token);
    } else {
      localStorage.removeItem('talentiq_access_token');
    }
  } catch (e) {
    // Ignore storage errors
  }
}

export function clearAccessToken() {
  setAccessToken(null);
}

async function request(path, options = {}, isRetry = false) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Automatically send HttpOnly cookies like talentiq_refresh
  });

  // Handle transparent refresh retry on 401 Unauthenticated error
  if (res.status === 401 && !isRetry && path !== '/auth/login' && path !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const newToken = refreshJson.data?.accessToken || refreshJson.data?.token || refreshJson.token;
        if (newToken) {
          setAccessToken(newToken);
          // Re-attempt original request once with new token
          return request(path, options, true);
        }
      }
    } catch (refreshErr) {
      clearAccessToken();
    }
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({ error: res.statusText }));
    const errorObj = errJson.error;
    const message = typeof errorObj === 'object' ? errorObj.message : (errorObj || `HTTP ${res.status}`);
    const error = new Error(message);
    error.status = res.status;
    error.code = typeof errorObj === 'object' ? errorObj.code : undefined;
    error.details = typeof errorObj === 'object' ? errorObj.details : undefined;
    throw error;
  }

  const json = await res.json().catch(() => ({}));
  // Return the inner data object if using our standardized API envelope, otherwise raw response
  return json && json.success !== undefined && json.data !== undefined ? json.data : json;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', ...(body ? { body: JSON.stringify(body) } : {}) }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', ...(body ? { body: JSON.stringify(body) } : {}) }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export const candidateApi = {
  getAll: () => api.get('/candidates'),
  getById: (id) => api.get(`/candidates/${id}`),
  updateStatus: (id, status) => api.patch(`/candidates/${id}/status`, { status }),
};

export const authApi = {
  login: async (email, password, role) => {
    const data = await api.post('/auth/login', { email, password, role });
    if (data && (data.accessToken || data.token)) {
      setAccessToken(data.accessToken || data.token);
    }
    return data;
  },
  register: async (userData) => {
    const data = await api.post('/auth/register', userData);
    if (data && (data.accessToken || data.token)) {
      setAccessToken(data.accessToken || data.token);
    }
    return data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
    }
  },
  getMe: () => api.get('/auth/me'),
  refreshToken: async () => {
    const data = await api.post('/auth/refresh');
    if (data && (data.accessToken || data.token)) {
      setAccessToken(data.accessToken || data.token);
    }
    return data;
  },
};

export const githubApi = {
  getOAuthUrl: () => api.get('/auth/github'),
  checkConnection: (candidateId) => api.get(`/candidates/${candidateId}/github/check`),
  getProfile: (candidateId) => api.get(`/candidates/${candidateId}/github/profile`),
  triggerSync: (candidateId) => api.post(`/candidates/${candidateId}/github/sync`),
};

export const privacyApi = {
  getConsents: () => api.get('/privacy/consent'),
  updateConsent: (consentType, status, version) => api.post('/privacy/consent', { consentType, status, version }),
  getPreferences: () => api.get('/privacy/preferences'),
  updatePreferences: (visibility) => api.put('/privacy/preferences', { visibility }),
  exportData: () => api.get('/privacy/export'),
  deleteAccount: () => api.delete('/privacy/account'),
  getAuditLogs: () => api.get('/privacy/audit-logs'),
};
