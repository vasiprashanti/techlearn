import { auth } from '../config/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_DELAY_MS = 250;
const requestCache = new Map();
const SESSION_CACHE_PREFIX = 'techlearn-admin-cache:';

const getToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

let sessionRenewalPromise = null;

const renewFirebaseSession = async () => {
  if (!auth) return false;

  if (!sessionRenewalPromise) {
    sessionRenewalPromise = (async () => {
      try {
        if (typeof auth.authStateReady === 'function') {
          await auth.authStateReady();
        }

        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return false;

        const idToken = await firebaseUser.getIdToken(true);
        const response = await fetch(`${API_BASE}/auth/firebase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload.token || !payload.user) return false;

        localStorage.setItem('token', payload.token);
        localStorage.setItem('userData', JSON.stringify(payload.user));
        localStorage.setItem('isAdmin', payload.user.role === 'admin' ? 'true' : 'false');
        return true;
      } catch (error) {
        console.warn('Unable to renew the admin session silently:', error.message);
        return false;
      } finally {
        sessionRenewalPromise = null;
      }
    })();
  }

  return sessionRenewalPromise;
};

const withCurrentAuth = (options = {}) => {
  const headers = { ...(options.headers || {}) };
  const token = getToken();

  if (token) headers.Authorization = `Bearer ${token}`;
  else delete headers.Authorization;

  return { ...options, headers };
};

const adminFetch = async (url, options = {}) => {
  let response = await fetch(url, withCurrentAuth(options));

  if (response.status === 401) {
    if (await renewFirebaseSession()) {
      response = await fetch(url, withCurrentAuth(options));
    }

    if (response.status === 401) {
      // Clear invalid credentials and force re-authentication
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('isAdmin');
      window.location.href = '/';
    }
  }

  return response;
};

const getErrorMessage = (payload, fallback) =>
  payload?.error || payload?.message || fallback;

const buildHeaders = (extraHeaders = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extraHeaders,
});

const buildAuthHeaders = (extraHeaders = {}) => ({
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

const invalidateAdminSessionCache = (keys = []) => {
  if (typeof window === 'undefined') return;
  for (const key of keys) {
    try {
      window.sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${key}`);
    } catch {
      // Ignore session storage errors and continue.
    }
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

const invalidateAdminSessionCacheForPath = (path) => {
  const basePath = path.split('?')[0];

  if (basePath.startsWith('/admin/batches')) {
    invalidateAdminSessionCache([
      'batches',
      'batches-colleges',
      'batches-track-options',
      'students-batches',
      'colleges',
    ]);
    return;
  }

  if (basePath.startsWith('/admin/colleges')) {
    invalidateAdminSessionCache([
      'colleges',
      'batches-colleges',
      'students-colleges',
    ]);
    return;
  }

  if (basePath.startsWith('/admin/students')) {
    invalidateAdminSessionCache([
      'students',
      'students-batches',
      'students-colleges',
      'colleges',
      'batches',
    ]);
  }
};

async function request(path, options = {}) {
  const method = normalizeMethod(options);
  const isGet = method === 'GET';
  const maxAttempts = isGet ? GET_RETRY_ATTEMPTS : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await adminFetch(`${API_BASE}${path}`, {
        headers: options.body instanceof FormData ? buildAuthHeaders(options.headers) : buildHeaders(options.headers),
        ...options,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const errorMessage = getErrorMessage(errorPayload, `Request failed with status ${response.status}`);
        const error = new Error(errorMessage);
        error.code = errorPayload?.code;
        error.data = errorPayload?.data;
        error.status = response.status;

        if (isGet && isRetriableStatus(response.status) && attempt < maxAttempts) {
          await delay(GET_RETRY_DELAY_MS);
          continue;
        }

        if (isGet && isRetriableStatus(response.status) && !options.noCache && requestCache.has(path)) {
          return requestCache.get(path);
        }

        throw error;
      }

      if (response.status === 204) {
        if (!isGet) {
          invalidateCacheForPath(path);
          invalidateAdminSessionCacheForPath(path);
        }
        return null;
      }

      const payload = await response.json().catch(() => null);
      const unwrapped = unwrapData(payload);

      if (isGet && !options.noCache) {
        requestCache.set(path, unwrapped);
      } else {
        invalidateCacheForPath(path);
        invalidateAdminSessionCacheForPath(path);
      }

      return unwrapped;
    } catch (error) {
      lastError = error;

      if (isGet && attempt < maxAttempts) {
        await delay(GET_RETRY_DELAY_MS);
        continue;
      }

      if (isGet && !options.noCache && requestCache.has(path)) {
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
  bulkDeleteColleges: (collegeIds) => request('/admin/colleges/bulk-delete', { method: 'POST', body: JSON.stringify({ collegeIds }) }),

  getBatches: () => request('/admin/batches'),
  getBatch: (batchId) => request(`/admin/batches/${batchId}`, { noCache: true }),
  createBatch: (body) => request('/admin/batches', { method: 'POST', body: JSON.stringify(body) }),
  updateBatch: (batchId, body) => request(`/admin/batches/${batchId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBatch: (batchId) => request(`/admin/batches/${batchId}`, { method: 'DELETE' }),
  bulkDeleteBatches: (batchIds) => request('/admin/batches/bulk-delete', { method: 'POST', body: JSON.stringify({ batchIds }) }),

  getStudents: () => request('/admin/students'),
  searchExistingStudents: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/admin/students/search?${query.toString()}`);
  },
  getStudent: (studentId) => request(`/admin/students/${studentId}`),
  createStudent: (body) => request('/admin/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (studentId, body) => request(`/admin/students/${studentId}`, { method: 'PUT', body: JSON.stringify(body) }),
  removeStudentFromBatch: (studentId, batchId) => request(`/admin/students/${studentId}/remove-batch`, { method: 'PATCH', body: JSON.stringify({ batchId }) }),
  deleteStudent: (studentId) => request(`/admin/students/${studentId}`, { method: 'DELETE' }),
  bulkUploadStudents: async ({ file, collegeId, batchId, primaryTrack, status = 'Active' }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collegeId', collegeId);
    formData.append('batchId', batchId);
    formData.append('primaryTrack', primaryTrack || 'General Track');
    formData.append('status', status);

    const response = await adminFetch(`${API_BASE}/admin/students/bulk-upload`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(getErrorMessage(payload, 'Bulk student import failed.'));
    }

    invalidateCacheForPath('/admin/students');
    invalidateAdminSessionCacheForPath('/admin/students');
    return unwrapData(payload);
  },

  getQuestionCategories: () => request('/admin/questions/categories'),
  createQuestionCategory: (body) => request('/admin/questions/categories', { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  updateQuestionCategory: (categoryId, body) => request(`/admin/questions/categories/${categoryId}`, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  getQuestionCategoryUsage: (categoryId) => request(`/admin/questions/categories/${categoryId}/usage`),
  deleteQuestionCategory: (categoryId) => request(`/admin/questions/categories/${categoryId}`, { method: 'DELETE' }),
  bulkDeleteQuestionCategories: (categoryIds) => request('/admin/questions/categories/bulk-delete', { method: 'POST', body: JSON.stringify({ categoryIds }) }),
  getQuestions: (params = {}) => {
    const query = new URLSearchParams(params);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/questions${suffix}`);
  },
  createQuestion: (body) => request('/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
  bulkCreateQuestions: (body) => request('/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (questionId, body) => request(`/admin/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestion: (questionId) => request(`/admin/questions/${questionId}`, { method: 'DELETE' }),
  moveQuestions: (body) => request('/admin/questions/move', { method: 'POST', body: JSON.stringify(body) }),

  getTrackTemplates: () => request('/admin/track-templates'),
  getTrackTemplate: (templateId) => request(`/admin/track-templates/${templateId}`),
  createTrackTemplate: (body) => request('/admin/track-templates', { method: 'POST', body: JSON.stringify(body) }),
  duplicateTrackTemplate: (templateId) => request(`/admin/track-templates/${templateId}/duplicate`, { method: 'POST' }),
  updateTrackTemplate: (templateId, body) => request(`/admin/track-templates/${templateId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTrackTemplate: (templateId) => request(`/admin/track-templates/${templateId}`, { method: 'DELETE' }),
  bulkDeleteTrackTemplates: (templateIds) => request('/admin/track-templates/bulk-delete', { method: 'POST', body: JSON.stringify({ templateIds }) }),
  assignTrackTemplateDay: (templateId, body) => request(`/admin/track-templates/${templateId}/days`, { method: 'POST', body: JSON.stringify(body) }),
  removeTrackTemplateDay: (templateId, dayNumber, questionId) => {
    const query = questionId ? `?questionId=${questionId}` : '';
    return request(`/admin/track-templates/${templateId}/days/${dayNumber}${query}`, { method: 'DELETE' });
  },
  reorderTrackTemplate: (templateId, body) => request(`/admin/track-templates/${templateId}/reorder`, { method: 'PUT', body: JSON.stringify(body) }),
  updateTrackTemplateDayOverride: (templateId, dayNumber, body) => request(`/admin/track-templates/${templateId}/days/${dayNumber}/override`, { method: 'PUT', body: JSON.stringify(body) }),

  getResources: () => request('/admin/resources'),
  createResource: async (body) => {
    if (body instanceof FormData) {
      const response = await adminFetch(`${API_BASE}/admin/resources`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, 'Failed to create resource.'));
      invalidateCacheForPath('/admin/resources');
      return unwrapData(payload);
    }
    return request('/admin/resources', { method: 'POST', body: JSON.stringify(body) });
  },
  updateResource: async (resourceId, body) => {
    if (body instanceof FormData) {
      const response = await adminFetch(`${API_BASE}/admin/resources/${resourceId}`, {
        method: 'PUT',
        headers: buildAuthHeaders(),
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, 'Failed to update resource.'));
      invalidateCacheForPath('/admin/resources');
      return unwrapData(payload);
    }
    return request(`/admin/resources/${resourceId}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  deleteResource: (resourceId) => request(`/admin/resources/${resourceId}`, { method: 'DELETE' }),
  recordResourceView: (resourceId) => request(`/admin/resources/${resourceId}/view`, { method: 'POST' }),
  getRoadmaps: () => request('/admin/roadmaps'),
  createRoadmap: (body) => request('/admin/roadmaps', { method: 'POST', body: JSON.stringify(body) }),
  updateRoadmap: (roadmapId, body) => request(`/admin/roadmaps/${roadmapId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRoadmap: (roadmapId) => request(`/admin/roadmaps/${roadmapId}`, { method: 'DELETE' }),

  getCourses: () => request('/courses'),
  createCourse: (body) => request('/admin/course-initiate', { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  updateCourse: (courseId, body) => request(`/admin/${courseId}`, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  deleteCourse: (courseId) => request(`/admin/${courseId}`, { method: 'DELETE' }),

  getCertificates: () => request('/admin/certificates'),
  issueCertificate: (body) => request('/admin/certificates/issued', { method: 'POST', body: JSON.stringify(body) }),
  revokeCertificate: (certificateId) => request(`/admin/certificates/issued/${certificateId}/revoke`, { method: 'PATCH' }),
  restoreCertificate: (certificateId) => request(`/admin/certificates/issued/${certificateId}/restore`, { method: 'PATCH' }),

  getCertificates: () => request('/admin/certificates'),
  issueCertificate: (body) => request('/admin/certificates/issued', { method: 'POST', body: JSON.stringify(body) }),
  revokeCertificate: (certificateId) => request(`/admin/certificates/issued/${certificateId}/revoke`, { method: 'PATCH' }),
  restoreCertificate: (certificateId) => request(`/admin/certificates/issued/${certificateId}/restore`, { method: 'PATCH' }),
  saveFinalTest: (testId, body) => request(testId ? `/admin/certificates/final-tests/${testId}` : '/admin/certificates/final-tests', {
    method: testId ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  }),

  getSubmissions: () => request('/admin/submissions'),
  getStudentSubmissions: (studentId) => request(`/admin/submissions?studentId=${studentId}`, { noCache: true }),
  getSubmission: (submissionId) => request(`/admin/submissions/${submissionId}`),
  updateSubmissionScore: (submissionId, body) => request(`/admin/submissions/${submissionId}/score`, { method: 'PUT', body: JSON.stringify(body) }),
  getNotifications: () => request('/admin/notifications'),
  createNotification: (body) => request('/admin/notifications', { method: 'POST', body: JSON.stringify(body) }),
  deleteNotification: (notificationId) => request(`/admin/notifications/${notificationId}`, { method: 'DELETE' }),

  getAuditLogs: (search = '') => request(`/admin/audit-logs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getReports: () => request('/admin/reports'),
  exportReportUrl: (type, format = 'CSV') => `${API_BASE}/admin/reports/${type}/export?format=${encodeURIComponent(format)}`,

  // ==========================================
  // PROJECTS MANAGEMENT MVP ENDPOINTS
  // ==========================================
  getProjects: () => request('/admin/projects'),
  getProject: (id) => request(`/admin/projects/${id}`),
  getProjectMetrics: () => request('/admin/projects/summary'),
  getProjectAnalytics: (projectId) => request(`/admin/projects/${projectId}/analytics`),
  createProject: async (body) => {
    if (body instanceof FormData) {
      const response = await adminFetch(`${API_BASE}/admin/projects`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, 'Failed to create project.'));
      invalidateCacheForPath('/admin/projects');
      return unwrapData(payload);
    }
    return request('/admin/projects', { method: 'POST', body: JSON.stringify(body) });
  },
  updateProject: async (id, body) => {
    if (body instanceof FormData) {
      const response = await adminFetch(`${API_BASE}/admin/projects/${id}`, {
        method: 'PUT',
        headers: buildAuthHeaders(),
        body,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(getErrorMessage(payload, 'Failed to update project.'));
      invalidateCacheForPath('/admin/projects');
      return unwrapData(payload);
    }
    return request(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  deleteProject: (id) => request(`/admin/projects/${id}`, { method: 'DELETE' }),
  archiveProject: (id) => request(`/admin/projects/${id}/archive`, { method: 'PUT' }),

  // Days & Tasks
  createProjectDay: (body) => request('/admin/projects/days', { method: 'POST', body: JSON.stringify(body) }),
  updateProjectDay: (id, body) => request(`/admin/projects/days/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getProjectDays: (projectId) => request(`/admin/projects/${projectId}/days`),
  deleteProjectDay: (id) => request(`/admin/projects/days/${id}`, { method: 'DELETE' }),
  duplicateProjectDay: (id) => request(`/admin/projects/days/${id}/duplicate`, { method: 'POST' }),

  createProjectTask: (body) => request('/admin/projects/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateProjectTask: (id, body) => request(`/admin/projects/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProjectTask: (id) => request(`/admin/projects/tasks/${id}`, { method: 'DELETE' }),
  getProjectTasksByDay: (dayId) => request(`/admin/projects/days/${dayId}/tasks`),

  // Phase 2
  searchStudents: (projectId, query = '', batchId = '') => {
    const params = new URLSearchParams({ projectId, query });
    if (batchId) params.set('batchId', batchId);
    return request(`/admin/projects/students/search?${params.toString()}`);
  },
  assignStudents: (projectId, studentIds) => request(`/admin/projects/${projectId}/assign`, { method: 'POST', body: JSON.stringify({ studentIds }) }),
  getAssignedStudents: (projectId) => request(`/admin/projects/${projectId}/students`),
  getProjectAssignmentHealth: (projectId) => request(`/admin/projects/${projectId}/assignment-health`),
  removeStudent: (projectId, studentId) => request(`/admin/projects/${projectId}/students/${studentId}/remove`, { method: 'PUT' }),
  getProjectDayDetails: (dayId) => request(`/admin/projects/days/${dayId}/details`),
  getProjectProgress: (projectId) => request(`/admin/projects/${projectId}/progress`),
};
