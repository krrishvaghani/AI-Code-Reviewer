import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds — LLM can be slow
});

/**
 * Send code to the backend for AI review.
 * @param {string} code - Source code string
 * @param {string} language - One of: python | javascript | java | cpp
 * @returns {Promise<{bugs: string[], optimizations: string[], improved_code: string, explanation: string}>}
 */
export async function reviewCode(code, language) {
  const response = await api.post('/api/review', { code, language });
  return response.data;
}
