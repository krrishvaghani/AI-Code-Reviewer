'use strict';

/**
 * HTTP client for the AI Code Reviewer backend API.
 * Uses Node's built-in `https` / `http` modules — no npm packages required.
 */

const https = require('node:https');
const http  = require('node:http');
const vscode = require('vscode');

// ---------------------------------------------------------------------------
// VS Code languageId → backend language enum
// ---------------------------------------------------------------------------

const LANGUAGE_MAP = {
  python:     'python',
  javascript: 'javascript',
  javascriptreact: 'javascript',
  typescript: 'javascript',   // best-effort — backend doesn't have TS
  typescriptreact: 'javascript',
  java:       'java',
  cpp:        'cpp',
  c:          'cpp',
};

const SUPPORTED_LANGUAGES = new Set(Object.keys(LANGUAGE_MAP));

/**
 * Map a VS Code languageId to a backend Language enum value.
 * Falls back to 'python' if unknown.
 * @param {string} vscodeLanguageId
 * @returns {{ language: string, exact: boolean }}
 */
function mapLanguage(vscodeLanguageId) {
  const mapped = LANGUAGE_MAP[vscodeLanguageId?.toLowerCase()];
  return {
    language: mapped ?? 'python',
    exact: !!mapped,
  };
}


// ---------------------------------------------------------------------------
// Core HTTP helper
// ---------------------------------------------------------------------------

/**
 * Make a JSON POST request.
 * @param {string} url         Full URL to POST to.
 * @param {any}    body        Request body (will be JSON-serialized).
 * @param {number} timeoutMs  Abort if no response after this many ms.
 * @returns {Promise<any>}     Parsed JSON response body.
 */
function postJson(url, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed  = new URL(url);
    const useHttps = parsed.protocol === 'https:';
    const transport = useHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (useHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept':         'application/json',
      },
      timeout: timeoutMs,
    };

    const req = transport.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error(`Non-JSON response from server: ${raw.slice(0, 200)}`));
          }
        } else {
          // Try to surface FastAPI's detail message
          let detail = `HTTP ${res.statusCode}`;
          try {
            const data = JSON.parse(raw);
            if (data.detail) {
              detail = typeof data.detail === 'string'
                ? data.detail
                : JSON.stringify(data.detail);
            }
          } catch { /* ignore */ }
          reject(new Error(detail));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs / 1000}s. The AI may be under load — please try again.`));
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        reject(new Error('Cannot connect to the backend. Make sure the server is running.'));
      } else {
        reject(err);
      }
    });

    req.write(payload);
    req.end();
  });
}


// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Get config values from VS Code settings.
 * @returns {{ baseUrl: string, timeoutMs: number }}
 */
function getConfig() {
  const cfg = vscode.workspace.getConfiguration('aiCodeReviewer');
  const baseUrl = (cfg.get('backendUrl') || 'http://localhost:8000').replace(/\/+$/, '');
  const timeoutMs = (cfg.get('requestTimeoutSeconds') || 90) * 1000;
  return { baseUrl, timeoutMs };
}

/**
 * Send code to /api/review and return the ReviewResponse.
 * @param {string} code
 * @param {string} vscodeLanguageId
 * @returns {Promise<{
 *   issues: string[],
 *   suggestions: string[],
 *   improved_code: string,
 *   explanation: string,
 *   complexity: object | null,
 *   _language: string,
 *   _exact: boolean
 * }>}
 */
async function reviewCode(code, vscodeLanguageId) {
  const { baseUrl, timeoutMs } = getConfig();
  const { language, exact } = mapLanguage(vscodeLanguageId);
  const result = await postJson(`${baseUrl}/api/review`, { code, language }, timeoutMs);
  return { ...result, _language: language, _exact: exact };
}

/**
 * Send code + question to /api/chat-with-code.
 * @param {string} code
 * @param {string} question
 * @param {string} vscodeLanguageId
 * @returns {Promise<{ answer: string }>}
 */
async function chatWithCode(code, question, vscodeLanguageId) {
  const { baseUrl, timeoutMs } = getConfig();
  const { language } = mapLanguage(vscodeLanguageId);
  return postJson(`${baseUrl}/api/chat-with-code`, { code, question, language }, timeoutMs);
}

/**
 * Ping the /health endpoint.
 * @returns {Promise<{ status: string, ai_provider: string, mock_mode: boolean }>}
 */
async function checkHealth() {
  const { baseUrl } = getConfig();
  return new Promise((resolve, reject) => {
    const parsed     = new URL(`${baseUrl}/health`);
    const useHttps   = parsed.protocol === 'https:';
    const transport  = useHttps ? https : http;

    const req = transport.get(
      { hostname: parsed.hostname, port: parsed.port || (useHttps ? 443 : 80), path: '/health', timeout: 5000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
          catch { reject(new Error('Non-JSON health response')); }
        });
      }
    );
    req.on('timeout', () => { req.destroy(); reject(new Error('Health check timed out')); });
    req.on('error', reject);
  });
}

module.exports = { reviewCode, chatWithCode, checkHealth, mapLanguage, SUPPORTED_LANGUAGES };
