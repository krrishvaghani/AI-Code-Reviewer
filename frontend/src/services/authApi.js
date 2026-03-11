import axios from 'axios';

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Normalize FastAPI error messages
authApi.interceptors.response.use(
  (r) => r,
  (err) => {
    const detail = err.response?.data?.detail;
    err.userMessage = typeof detail === 'string' ? detail : (err.message || 'Something went wrong.');
    return Promise.reject(err);
  }
);

export async function signup({ name, email, password }) {
  const { data } = await authApi.post('/auth/signup', { name, email, password });
  return data; // { access_token, token_type, user }
}

export async function login({ email, password }) {
  const { data } = await authApi.post('/auth/login', { email, password });
  return data;
}

export async function getMe(token) {
  const { data } = await authApi.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

// History helpers

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchHistory(token, { skip = 0, limit = 30 } = {}) {
  const { data } = await authApi.get('/api/history', {
    headers: authHeaders(token),
    params: { skip, limit },
  });
  return data;
}

export async function saveHistory(token, { language, code, result, review_type, title }) {
  const { data } = await authApi.post(
    '/api/history',
    { language, code, result, review_type, title },
    { headers: authHeaders(token) }
  );
  return data;
}

export async function deleteHistory(token, itemId) {
  await authApi.delete(`/api/history/${itemId}`, {
    headers: authHeaders(token),
  });
}
