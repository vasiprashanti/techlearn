const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_DELAY_MS = 250;
const requestCache = new Map();
const SESSION_CACHE_PREFIX = 'techlearn-admin-cache:';

const getToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const buildHeaders = (extraHeaders = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extraHeaders,
});

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export const hasMeaningfulAdminData = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (!isObject(value)) {
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return Boolean(value);
  }

  return Object.values(value).some((entry) => {
    if (Array.isArray(entry)) return entry.length > 0;
    if (isObject(entry)) return hasMeaningfulAdminData(entry);
    if (typeof entry === 'number') return entry > 0;
    if (typeof entry === 'string') return entry.trim().length > 0;
    return Boolean(entry);
  });
};

export const preferRemoteData = (remoteValue, fallbackValue) =>
  hasMeaningfulAdminData(remoteValue) ? remoteValue : fallbackValue;

export const readAdminSessionCache = (key, fallbackValue) => {
  if (typeof window === 'undefined') return fallbackValue;
  try {
    const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${key}`);
    if (!raw) return fallbackValue;
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
};

export const writeAdminSessionCache = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore quota/serialization errors and continue without session cache.
  }
};

const unwrapData = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableStatus = (status) => status >= 500 || status === 429;

const normalizeMethod = (options = {}) => String(options.method || 'GET').toUpperCase();

const invalidateCacheForPath = (path) => {
  const basePath = path.split('?')[0];
  const segments = basePath.split('/').filter(Boolean);

  const prefixes = new Set([basePath]);
  if (segments.length >= 2) {
    prefixes.add(`/${segments[0]}/${segments[1]}`);
  }

  for (const key of requestCache.keys()) {
    for (const prefix of prefixes) {
      if (key === prefix || key.startsWith(`${prefix}?`) || key.startsWith(`${prefix}/`)) {
        requestCache.delete(key);
        break;
      }
    }
  }
};

async function request(path, options = {}) {
  const method = normalizeMethod(options);
  const isGet = method === 'GET';
  const maxAttempts = isGet ? GET_RETRY_ATTEMPTS : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        headers: buildHeaders(options.headers),
        ...options,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const errorMessage = errorPayload.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);

        if (isGet && isRetriableStatus(response.status) && attempt < maxAttempts) {
          await delay(GET_RETRY_DELAY_MS);
          continue;
        }

        if (isGet && isRetriableStatus(response.status) && requestCache.has(path)) {
          return requestCache.get(path);
        }

        throw error;
      }

      if (response.status === 204) {
        if (!isGet) invalidateCacheForPath(path);
        return null;
      }

      const payload = await response.json().catch(() => null);
      const unwrapped = unwrapData(payload);

      if (isGet) {
        requestCache.set(path, unwrapped);
      } else {
        invalidateCacheForPath(path);
      }

      return unwrapped;
    } catch (error) {
      lastError = error;

      if (isGet && attempt < maxAttempts) {
        await delay(GET_RETRY_DELAY_MS);
        continue;
      }

      if (isGet && requestCache.has(path)) {
        return requestCache.get(path);
      }

      throw error;
    }
  }

  throw lastError || new Error('Request failed.');
}

export const adminAPI = {
  getDashboardOverview: () => request('/admin/dashboard/overview'),
  getDashboardAnalytics: () => request('/admin/dashboard/analytics'),
  getSystemHealth: () => request('/admin/dashboard/system-health'),

  getColleges: () => request('/admin/colleges'),
  getCollege: (collegeId) => request(`/admin/colleges/${collegeId}`),
  createCollege: (body) => request('/admin/colleges', { method: 'POST', body: JSON.stringify(body) }),
  updateCollege: (collegeId, body) => request(`/admin/colleges/${collegeId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCollege: (collegeId) => request(`/admin/colleges/${collegeId}`, { method: 'DELETE' }),

  getBatches: () => request('/admin/batches'),
  getBatch: (batchId) => request(`/admin/batches/${batchId}`),
  createBatch: (body) => request('/admin/batches', { method: 'POST', body: JSON.stringify(body) }),
  updateBatch: (batchId, body) => request(`/admin/batches/${batchId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBatch: (batchId) => request(`/admin/batches/${batchId}`, { method: 'DELETE' }),

  getStudents: () => request('/admin/students'),
  getStudent: (studentId) => request(`/admin/students/${studentId}`),
  createStudent: (body) => request('/admin/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (studentId, body) => request(`/admin/students/${studentId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStudent: (studentId) => request(`/admin/students/${studentId}`, { method: 'DELETE' }),

  getQuestionCategories: () => request('/admin/questions/categories'),
  createQuestionCategory: (body) => request('/admin/questions/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateQuestionCategory: (categoryId, body) => request(`/admin/questions/categories/${categoryId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestionCategory: (categoryId) => request(`/admin/questions/categories/${categoryId}`, { method: 'DELETE' }),
  getQuestions: (params = {}) => {
    const query = new URLSearchParams(params);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/questions${suffix}`);
  },
  createQuestion: (body) => request('/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (questionId, body) => request(`/admin/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestion: (questionId) => request(`/admin/questions/${questionId}`, { method: 'DELETE' }),

  getTrackTemplates: () => request('/admin/track-templates'),
  getTrackTemplate: (templateId) => request(`/admin/track-templates/${templateId}`),
  createTrackTemplate: (body) => request('/admin/track-templates', { method: 'POST', body: JSON.stringify(body) }),
  updateTrackTemplate: (templateId, body) => request(`/admin/track-templates/${templateId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTrackTemplate: (templateId) => request(`/admin/track-templates/${templateId}`, { method: 'DELETE' }),
  assignTrackTemplateDay: (templateId, body) => request(`/admin/track-templates/${templateId}/days`, { method: 'POST', body: JSON.stringify(body) }),
  removeTrackTemplateDay: (templateId, dayNumber) => request(`/admin/track-templates/${templateId}/days/${dayNumber}`, { method: 'DELETE' }),
  reorderTrackTemplate: (templateId, body) => request(`/admin/track-templates/${templateId}/reorder`, { method: 'PUT', body: JSON.stringify(body) }),

  getResources: () => request('/admin/resources'),
  createResource: (body) => request('/admin/resources', { method: 'POST', body: JSON.stringify(body) }),
  updateResource: (resourceId, body) => request(`/admin/resources/${resourceId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteResource: (resourceId) => request(`/admin/resources/${resourceId}`, { method: 'DELETE' }),
  recordResourceView: (resourceId) => request(`/admin/resources/${resourceId}/view`, { method: 'POST' }),

  getCertificates: () => request('/admin/certificates'),
  issueCertificate: (body) => request('/admin/certificates/issued', { method: 'POST', body: JSON.stringify(body) }),
  revokeCertificate: (certificateId) => request(`/admin/certificates/issued/${certificateId}/revoke`, { method: 'PATCH' }),
  restoreCertificate: (certificateId) => request(`/admin/certificates/issued/${certificateId}/restore`, { method: 'PATCH' }),
  saveFinalTest: (testId, body) => request(testId ? `/admin/certificates/final-tests/${testId}` : '/admin/certificates/final-tests', {
    method: testId ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  }),

  getSubmissions: () => request('/admin/submissions'),
  getSubmission: (submissionId) => request(`/admin/submissions/${submissionId}`),

  getNotifications: () => request('/admin/notifications'),
  createNotification: (body) => request('/admin/notifications', { method: 'POST', body: JSON.stringify(body) }),
  deleteNotification: (notificationId) => request(`/admin/notifications/${notificationId}`, { method: 'DELETE' }),

  getAuditLogs: (search = '') => request(`/admin/audit-logs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getReports: () => request('/admin/reports'),
  exportReportUrl: (type, format = 'CSV') => `${API_BASE}/admin/reports/${type}/export?format=${encodeURIComponent(format)}`,
};
