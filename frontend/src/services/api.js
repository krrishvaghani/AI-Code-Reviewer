import axios from 'axios';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds — LLM can be slow on first call
});

// ---------------------------------------------------------------------------
// Request interceptor — attach a request timestamp for latency tracking
// ---------------------------------------------------------------------------

api.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — normalize error messages across all endpoints
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => {
    // Attach latency to the response for optional debugging
    if (response.config.metadata) {
      response.latencyMs = Date.now() - response.config.metadata.startTime;
    }
    return response;
  },
  (error) => {
    // Normalize timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.userMessage =
        'The request timed out. The AI may be under heavy load — please try again.';
      return Promise.reject(error);
    }

    // Normalize network / connection refused errors
    if (!error.response) {
      error.userMessage =
        'Cannot connect to the backend server. Make sure the FastAPI server is running on port 8000.';
      return Promise.reject(error);
    }

    // Surface detail messages from FastAPI error responses
    const detail = error.response?.data?.detail;
    if (detail) {
      error.userMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
    }

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Send source code to the backend for AI review.
 *
 * @param {string} code     - Source code to review
 * @param {string} language - One of: python | javascript | java | cpp
 * @returns {Promise<{
 *   issues: string[],
 *   suggestions: string[],
 *   improved_code: string,
 *   explanation: string
 * }>}
 */
export async function reviewCode(code, language) {
  const response = await api.post('/api/review', { code, language });
  return response.data;
}

/**
 * Ping the backend health endpoint.
 * @returns {Promise<{ status: string, ai_provider: string, ai_mode: string }>}
 */
export async function checkHealth() {
  const response = await api.get('/health', { timeout: 5000 });
  return response.data;
}
