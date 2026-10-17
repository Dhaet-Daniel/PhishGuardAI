import { clampScore, getPredictionLabel, getRiskLabel } from '../utils/analysis';

export const getBaseUrl = () => {
  const savedUrl = localStorage.getItem('API_BASE_URL') || 'http://localhost:8000';
  return savedUrl.replace(/\/+$/, '');
};

const BASE_URL = getBaseUrl();

const toNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const toPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const normalizeValidationIssues = (detail) => {
  if (!Array.isArray(detail)) {
    return [];
  }

  return detail.map((item) => ({
    path: Array.isArray(item?.loc) ? item.loc : [],
    message: item?.msg || 'Invalid value.',
    type: item?.type || null,
  }));
};

const formatErrorDetail = (detail) => {
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg && Array.isArray(item?.loc)) {
          return `${item.loc.join('.')} - ${item.msg}`;
        }
        return item?.msg || JSON.stringify(item);
      })
      .join('; ');
  }

  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return 'Internal Server Error';
};

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 422) {
      const issues = normalizeValidationIssues(errorData.detail);
      const error = new Error(formatErrorDetail(errorData.detail || 'Validation Error'));
      error.status = 422;
      error.validationIssues = issues;
      throw error;
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(formatErrorDetail(errorData.detail || 'Request failed'));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeBreakdown = (value) => {
  const entries = Object.entries(toPlainObject(value))
    .map(([key, currentValue]) => [key, toNumber(currentValue)])
    .filter(([, currentValue]) => currentValue !== null);

  return Object.fromEntries(entries);
};

const normalizeAnalysisResult = (value) => {
  const result = toPlainObject(value);
  const rawScore = toNumber(result.score);
  const score = rawScore === null ? 0 : clampScore(rawScore);
  const prediction = getPredictionLabel(result.prediction, score);
  const fallbackConfidence = prediction === 'Safe' ? 1 - score : score;
  const confidence = toNumber(result.confidence) ?? fallbackConfidence;
  const recordId = result.record_id ?? result.id ?? null;

  return {
    ...result,
    id: result.id ?? recordId,
    record_id: recordId,
    prediction,
    confidence: clampScore(confidence),
    score,
    risk_level: getRiskLabel(result.risk_level, score),
    category: result.category || 'uncategorized',
    summary:
      result.summary ||
      result.reason ||
      'No summary was provided by the backend for this analysis.',
    reason:
      result.reason ||
      result.summary ||
      'No detailed reasoning was returned for this analysis.',
    matched_keywords: toArray(result.matched_keywords),
    risk_signals: toArray(result.risk_signals),
    trust_signals: toArray(result.trust_signals),
    recommended_actions: toArray(result.recommended_actions),
    analysis_breakdown: normalizeBreakdown(result.analysis_breakdown),
    sender: result.sender || result.sender_info?.email || result.email || '',
    subject: result.subject || '',
  };
};

const normalizeBatchResults = (value) => {
  const batch = Array.isArray(value)
    ? value
    : Array.isArray(value?.results)
      ? value.results
      : Array.isArray(value?.items)
        ? value.items
        : [];

  return batch.map(normalizeAnalysisResult);
};

const normalizeHistoryItem = (value) => {
  const item = toPlainObject(value);
  const score = clampScore(toNumber(item.score) ?? 0);
  const prediction = getPredictionLabel(item.prediction, score);
  const recordId = item.id ?? item.record_id ?? null;

  return {
    ...item,
    id: recordId,
    record_id: recordId,
    prediction,
    score,
    category: item.category || 'uncategorized',
    confidence: toNumber(item.confidence),
    sender: item.sender || item.sender_info?.email || '',
    subject: item.subject || '',
    timestamp: item.timestamp || item.created_at || item.updated_at || null,
  };
};

const normalizeHistoryResponse = (value) => {
  if (Array.isArray(value)) {
    const results = value.map(normalizeHistoryItem);
    return { results, total: results.length };
  }

  const response = toPlainObject(value);
  const results = toArray(response.results).map(normalizeHistoryItem);

  return {
    ...response,
    results,
    total: toNumber(response.total) ?? results.length,
  };
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(response);
};

export const getApi = (url) =>
  fetch(`${getBaseUrl()}/api/v1${url}`, { headers: authHeaders() }).then(handleResponse);

export const postApi = (url, data) =>
  fetch(`${getBaseUrl()}/api/v1${url}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const putApi = (url, data) =>
  fetch(`${getBaseUrl()}/api/v1${url}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const deleteApi = (url) =>
  fetch(`${getBaseUrl()}/api/v1${url}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse);

// Feature request & per-user overrides

export const requestFeature = async (featureName) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${getBaseUrl()}/api/v1/settings/feature-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ feature_name: featureName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorData.detail || 'Request failed');
  }

  return response.json();
};

// Fetch per-user overrides (admin only)
export const getUserFeatures = () => getApi('/admin/user-features');

// Assign a feature to a specific user (admin only)
export const assignUserFeature = (userEmail, featureName) =>
  postApi('/admin/user-features', { user_email: userEmail, feature_name: featureName });

// Remove a per-user override (admin only)
export const removeUserFeature = (userEmail, featureName) =>
  deleteApi(`/admin/user-features?user_email=${encodeURIComponent(userEmail)}&feature_name=${encodeURIComponent(featureName)}`);

// Get effective features for the current user
export const getMyFeatures = () => getApi('/settings/my-features');

export const getFeatureRequests = () => getApi('/admin/feature-requests');

export const resolveFeatureRequest = (requestId) =>
  putApi(`/admin/feature-requests/${requestId}/resolve`);

export const dismissFeatureRequest = (requestId) =>
  putApi(`/admin/feature-requests/${requestId}/dismiss`);

export const scanEmail = async (emailData) => {
  const response = await fetch(`${BASE_URL}/api/v1/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(emailData),
  });
  const data = await handleResponse(response);
  return normalizeAnalysisResult(data);
};

export const batchScanEmails = async (emailsArray) => {
  const response = await fetch(`${BASE_URL}/api/v1/batch-predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(emailsArray),
  });
  const data = await handleResponse(response);
  return normalizeBatchResults(data);
};

export const getRecentResults = async (limit = 20) => {
  const response = await fetch(`${BASE_URL}/api/v1/results/recent?limit=${limit}`, {
    headers: authHeaders(),
  });
  const data = await handleResponse(response);
  return normalizeHistoryResponse(data);
};

export const getResultById = async (id) => {
  const response = await fetch(`${BASE_URL}/api/v1/results/${id}`, {
    headers: authHeaders(),
  });
  const data = await handleResponse(response);
  return normalizeAnalysisResult(data);
};

export const submitSignupRequest = async (full_name, email, password, organization) => {
  const response = await fetch(`${getBaseUrl()}/api/v1/auth/signup-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password, organization }),
  });

  return handleResponse(response);
};
