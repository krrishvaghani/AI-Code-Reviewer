'use strict';

const vscode = require('vscode');
const crypto = require('node:crypto');
const { chatWithCode } = require('./apiClient');

// ---------------------------------------------------------------------------
// Singleton chat panel — one open at a time
// ---------------------------------------------------------------------------

/** @type {vscode.WebviewPanel | undefined} */
let _panel;

/**
 * Open (or reveal) the chat panel, injecting the initial code context.
 *
 * @param {vscode.ExtensionContext} context
 * @param {string} code          Selected code snippet to discuss
 * @param {string} languageId    VS Code language ID (used for label only)
 * @param {string} fileName      File name shown in header
 */
function showChatPanel(context, code, languageId, fileName) {
  if (_panel) {
    // Update existing panel with new code context
    _panel.reveal(vscode.ViewColumn.Two);
    _panel.webview.postMessage({ type: 'reset', code, languageId, fileName });
    return;
  }

  const nonce = crypto.randomBytes(16).toString('hex');

  _panel = vscode.window.createWebviewPanel(
    'aiCodeChat',
    `AI Chat — ${fileName}`,
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [],
    }
  );

  _panel.webview.html = buildHtml(_panel.webview, nonce, code, languageId, fileName);

  // Handle messages from the webview
  _panel.webview.onDidReceiveMessage(
    async (message) => {
      if (message.type === 'ask') {
        try {
          const result = await chatWithCode(message.code, message.question, message.languageId);
          _panel && _panel.webview.postMessage({ type: 'answer', answer: result.answer || result });
        } catch (err) {
          _panel && _panel.webview.postMessage({ type: 'error', message: err.message });
        }
      }
    },
    undefined,
    context.subscriptions
  );

  _panel.onDidDispose(() => { _panel = undefined; }, null, context.subscriptions);
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

function buildHtml(_webview, nonce, initialCode, languageId, fileName) {
  const safeCode     = JSON.stringify(initialCode);
  const safeLang     = JSON.stringify(languageId);
  const safeFile     = escapeHtml(fileName);

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Chat</title>
  <style nonce="${nonce}">
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:         var(--vscode-editor-background, #0f1117);
      --surface:    var(--vscode-sideBar-background, #1a1d27);
      --surface2:   rgba(255,255,255,.035);
      --border:     var(--vscode-panel-border, #2d3148);
      --text:       var(--vscode-editor-foreground, #d4d4d8);
      --text-muted: var(--vscode-descriptionForeground, #6b7280);
      --accent:     #5865f2;
      --accent-hover:#4752c4;
      --ai-bg:      rgba(88,101,242,.12);
      --ai-border:  rgba(88,101,242,.3);
      --user-bg:    rgba(52,211,153,.10);
      --user-border:rgba(52,211,153,.3);
      --font-mono:  var(--vscode-editor-font-family, 'Consolas', monospace);
      --radius:     10px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--vscode-font-family, system-ui, sans-serif);
      font-size: 13px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    /* ---- header ---- */
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 16px;
      flex-shrink: 0;
    }
    .header-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* ---- code snippet ---- */
    .code-context {
      flex-shrink: 0;
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,.015);
      max-height: 120px;
      overflow: hidden;
      position: relative;
    }
    .code-context pre {
      margin: 0;
      padding: 10px 14px;
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: #a0aec0;
      white-space: pre;
      overflow-x: auto;
      max-height: 120px;
    }
    .code-context-label {
      position: absolute;
      top: 4px;
      right: 8px;
      font-size: 10px;
      color: var(--text-muted);
      background: var(--bg);
      padding: 0 4px;
      border-radius: 4px;
    }

    /* ---- chips ---- */
    .chips {
      flex-shrink: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
    }
    .chip {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 99px;
      padding: 3px 10px;
      font-size: 11px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all .15s;
    }
    .chip:hover {
      background: rgba(88,101,242,.15);
      border-color: rgba(88,101,242,.4);
      color: var(--text);
    }

    /* ---- messages ---- */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
    }
    .messages::-webkit-scrollbar { width: 6px; }
    .messages::-webkit-scrollbar-track { background: transparent; }
    .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }

    .bubble-row {
      display: flex;
      flex-direction: column;
      max-width: 92%;
    }
    .bubble-row.user { align-self: flex-end; align-items: flex-end; }
    .bubble-row.ai   { align-self: flex-start; align-items: flex-start; }

    .bubble-sender {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 3px;
      padding: 0 4px;
    }

    .bubble {
      padding: 9px 13px;
      border-radius: var(--radius);
      font-size: 12.5px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .bubble.user {
      background: var(--user-bg);
      border: 1px solid var(--user-border);
      border-bottom-right-radius: 3px;
    }
    .bubble.ai {
      background: var(--ai-bg);
      border: 1px solid var(--ai-border);
      border-bottom-left-radius: 3px;
    }
    .bubble.error {
      background: rgba(248,113,113,.1);
      border: 1px solid rgba(248,113,113,.3);
      color: #f87171;
    }

    /* typing indicator */
    .typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 9px 13px;
      background: var(--ai-bg);
      border: 1px solid var(--ai-border);
      border-radius: var(--radius);
      border-bottom-left-radius: 3px;
      width: fit-content;
    }
    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: pulse 1.2s infinite;
    }
    .dot:nth-child(2) { animation-delay: .2s; }
    .dot:nth-child(3) { animation-delay: .4s; }
    @keyframes pulse {
      0%, 80%, 100% { opacity: .3; transform: scale(.8); }
      40%           { opacity: 1;  transform: scale(1); }
    }

    /* ---- input row ---- */
    .input-row {
      flex-shrink: 0;
      display: flex;
      gap: 8px;
      padding: 10px 14px 14px;
      background: var(--surface);
      border-top: 1px solid var(--border);
    }
    .msg-input {
      flex: 1;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      font-family: inherit;
      font-size: 13px;
      padding: 8px 12px;
      resize: none;
      outline: none;
      transition: border-color .15s;
      max-height: 100px;
      overflow-y: auto;
    }
    .msg-input:focus { border-color: var(--accent); }
    .msg-input::placeholder { color: var(--text-muted); }

    .send-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      background: var(--accent);
      border: none;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: flex-end;
      transition: background .15s;
    }
    .send-btn:hover:not(:disabled) { background: var(--accent-hover); }
    .send-btn:disabled { opacity: .5; cursor: not-allowed; }
  </style>
</head>
<body>

  <!-- header -->
  <div class="header">
    <div class="header-title">
      <span>💬</span>
      <span>Chat with AI</span>
    </div>
    <div class="header-sub" id="header-sub">Discussing: <strong>${safeFile}</strong></div>
  </div>

  <!-- code snippet -->
  <div class="code-context">
    <span class="code-context-label" id="lang-label">${escapeHtml(languageId)}</span>
    <pre id="code-display"></pre>
  </div>

  <!-- quick chips -->
  <div class="chips">
    <span class="chip" onclick="sendChip('What does this code do?')">What does this do?</span>
    <span class="chip" onclick="sendChip('Explain this step by step.')">Explain step by step</span>
    <span class="chip" onclick="sendChip('How can I optimize this for better performance?')">How to optimize?</span>
    <span class="chip" onclick="sendChip('What is the time complexity of this code?')">Time complexity?</span>
    <span class="chip" onclick="sendChip('Are there any security vulnerabilities here?')">Security issues?</span>
    <span class="chip" onclick="sendChip('Write unit tests for this code.')">Write unit tests</span>
  </div>

  <!-- messages -->
  <div class="messages" id="messages">
    <div class="bubble-row ai">
      <div class="bubble-sender">🤖 AI Assistant</div>
      <div class="bubble ai">Hello! I've loaded your code. Ask me anything about it — I can explain logic, suggest improvements, analyze complexity, or write tests.</div>
    </div>
  </div>

  <!-- input -->
  <div class="input-row">
    <textarea
      class="msg-input"
      id="msg-input"
      rows="1"
      placeholder="Ask a question about the code…"
      maxlength="2000"
    ></textarea>
    <button class="send-btn" id="send-btn" title="Send (Enter)" onclick="sendMessage()">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
      </svg>
    </button>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    let currentCode     = ${safeCode};
    let currentLangId   = ${safeLang};
    let isLoading       = false;

    // Init code display (truncated to first 30 lines for readability)
    const codeLines = currentCode.split('\\n').slice(0, 30);
    document.getElementById('code-display').textContent =
      codeLines.join('\\n') + (currentCode.split('\\n').length > 30 ? '\\n… (truncated)' : '');

    // Auto-resize textarea
    const input = document.getElementById('msg-input');
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });

    // Send on Enter (Shift+Enter = newline)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    function sendChip(text) {
      input.value = text;
      sendMessage();
    }

    function sendMessage() {
      const question = input.value.trim();
      if (!question || isLoading) return;

      addBubble('user', question);
      input.value = '';
      input.style.height = 'auto';
      setLoading(true);

      vscode.postMessage({
        type: 'ask',
        question,
        code: currentCode,
        languageId: currentLangId,
      });
    }

    function addBubble(role, text) {
      const row = document.createElement('div');
      row.className = 'bubble-row ' + role;
      row.innerHTML =
        '<div class="bubble-sender">' + (role === 'user' ? '👤 You' : '🤖 AI Assistant') + '</div>' +
        '<div class="bubble ' + role + '">' + escapeHtml(text) + '</div>';
      document.getElementById('messages').appendChild(row);
      scrollBottom();
    }

    function addErrorBubble(text) {
      const row = document.createElement('div');
      row.className = 'bubble-row ai';
      row.innerHTML =
        '<div class="bubble-sender">🤖 AI Assistant</div>' +
        '<div class="bubble error">⚠ ' + escapeHtml(text) + '</div>';
      document.getElementById('messages').appendChild(row);
      scrollBottom();
    }

    let typingEl = null;
    function setLoading(on) {
      isLoading = on;
      document.getElementById('send-btn').disabled = on;
      if (on) {
        const row = document.createElement('div');
        row.className = 'bubble-row ai';
        row.id = 'typing-row';
        row.innerHTML = '<div class="bubble-sender">🤖 AI Assistant</div>' +
          '<div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
        document.getElementById('messages').appendChild(row);
        scrollBottom();
      } else {
        const el = document.getElementById('typing-row');
        if (el) el.remove();
      }
    }

    function scrollBottom() {
      const msgs = document.getElementById('messages');
      msgs.scrollTop = msgs.scrollHeight;
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // Messages from extension host
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'answer') {
        setLoading(false);
        const text = typeof msg.answer === 'string'
          ? msg.answer
          : (msg.answer.answer || JSON.stringify(msg.answer, null, 2));
        addBubble('ai', text);
      } else if (msg.type === 'error') {
        setLoading(false);
        addErrorBubble(msg.message || 'An error occurred.');
      } else if (msg.type === 'reset') {
        currentCode   = msg.code;
        currentLangId = msg.languageId;
        const lines = currentCode.split('\\n').slice(0, 30);
        document.getElementById('code-display').textContent =
          lines.join('\\n') + (currentCode.split('\\n').length > 30 ? '\\n… (truncated)' : '');
        document.getElementById('lang-label').textContent = msg.languageId;
        addBubble('ai', 'Code context updated! Ask me anything about the new snippet.');
      }
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { showChatPanel };
