'use strict';

const vscode = require('vscode');
const crypto = require('node:crypto');

// ---------------------------------------------------------------------------
// Singleton panel — one review panel open at a time
// ---------------------------------------------------------------------------

/** @type {vscode.WebviewPanel | undefined} */
let _panel;

/**
 * Open (or reveal) the review panel and display a result.
 *
 * @param {vscode.ExtensionContext} context
 * @param {{
 *   issues: string[],
 *   suggestions: string[],
 *   improved_code: string,
 *   explanation: string,
 *   complexity?: object,
 *   _language: string
 * }} result
 * @param {string} title   Short title shown in panel header (e.g. "review.py")
 */
function showReviewPanel(context, result, title) {
  if (_panel) {
    _panel.reveal(vscode.ViewColumn.Two);
  } else {
    _panel = vscode.window.createWebviewPanel(
      'aiCodeReview',
      'AI Code Review',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      }
    );

    _panel.onDidDispose(() => { _panel = undefined; }, null, context.subscriptions);
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  _panel.webview.html = buildHtml(_panel.webview, nonce, result, title);
  _panel.title = `AI Review — ${title}`;
}

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

/**
 * @param {vscode.Webview} webview
 * @param {string} nonce
 * @param {object} result
 * @param {string} title
 */
function buildHtml(webview, nonce, result, title) {
  const { issues = [], suggestions = [], improved_code = '', explanation = '', complexity, _language = 'python' } = result;

  const issuesHtml        = renderList(issues, 'issue');
  const suggestionsHtml   = renderList(suggestions, 'suggestion');
  const complexityHtml    = complexity ? renderComplexity(complexity) : '';
  const improvedCodeHtml  = renderCode(improved_code, _language);
  const explanationHtml   = renderExplanation(explanation);

  const issueCount      = issues.length;
  const suggestionCount = suggestions.length;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Code Review</title>
  <style nonce="${nonce}">
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:          var(--vscode-editor-background, #0f1117);
      --surface:     var(--vscode-sideBar-background, #1a1d27);
      --border:      var(--vscode-panel-border, #2d3148);
      --text:        var(--vscode-editor-foreground, #d4d4d8);
      --text-muted:  var(--vscode-descriptionForeground, #6b7280);
      --accent:      var(--vscode-button-background, #4f46e5);
      --accent-fg:   var(--vscode-button-foreground, #ffffff);
      --red:         #f87171;
      --yellow:      #fbbf24;
      --green:       #34d399;
      --blue:        #60a5fa;
      --purple:      #a78bfa;
      --orange:      #fb923c;
      --font-mono:   var(--vscode-editor-font-family, 'Fira Code', 'Consolas', monospace);
      --font-size:   var(--vscode-editor-font-size, 13px);
      --radius:      8px;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--vscode-font-family, system-ui, sans-serif);
      font-size: 13px;
      line-height: 1.6;
      padding: 0 0 40px 0;
    }

    /* ---- header ---- */
    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 14px 20px;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-top {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .header-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .header-meta {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      border: 1px solid transparent;
    }
    .badge-red    { background: rgba(248,113,113,.15); color: var(--red);    border-color: rgba(248,113,113,.3); }
    .badge-yellow { background: rgba(251,191,36,.15);  color: var(--yellow); border-color: rgba(251,191,36,.3); }
    .badge-green  { background: rgba(52,211,153,.15);  color: var(--green);  border-color: rgba(52,211,153,.3); }
    .badge-purple { background: rgba(167,139,250,.15); color: var(--purple); border-color: rgba(167,139,250,.3); }

    /* ---- content ---- */
    .content { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }

    /* ---- card ---- */
    .card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: rgba(255,255,255,.02);
      overflow: hidden;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      cursor: pointer;
      user-select: none;
      background: rgba(255,255,255,.02);
      gap: 8px;
    }
    .card-header:hover { background: rgba(255,255,255,.05); }
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      font-size: 13px;
      font-weight: 600;
    }
    .card-chevron {
      width: 16px;
      height: 16px;
      color: var(--text-muted);
      transition: transform 0.2s;
      flex-shrink: 0;
    }
    .card-chevron.open { transform: rotate(180deg); }
    .card-body {
      padding: 12px 14px 14px;
      border-top: 1px solid var(--border);
    }

    /* ---- list items ---- */
    .item-list { display: flex; flex-direction: column; gap: 8px; }
    .item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 12.5px;
      color: var(--text);
      line-height: 1.5;
    }
    .item-num {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      margin-top: 1px;
    }
    .item-num-red    { background: #dc2626; }
    .item-num-yellow { background: #d97706; }
    .empty {
      color: var(--text-muted);
      font-size: 12px;
      font-style: italic;
      padding: 4px 0;
    }

    /* ---- complexity ---- */
    .complexity-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 12px;
    }
    .complexity-chip {
      background: rgba(255,255,255,.04);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
      text-align: center;
      min-width: 80px;
    }
    .complexity-chip.warn {
      background: rgba(251,146,60,.08);
      border-color: rgba(251,146,60,.3);
    }
    .complexity-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .complexity-value {
      font-size: 16px;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--purple);
    }
    .complexity-value.warn { color: var(--orange); }
    .bottleneck-list { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; }
    .bottleneck {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: #f5a068;
    }
    .hint-box {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: rgba(167,139,250,.08);
      border: 1px solid rgba(167,139,250,.25);
      border-radius: 6px;
      padding: 8px 10px;
      margin-top: 10px;
      font-size: 12px;
      color: var(--text);
    }

    /* ---- code block ---- */
    .code-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255,255,255,.04);
      border-bottom: 1px solid var(--border);
      padding: 5px 10px;
    }
    .code-lang { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
    .copy-btn {
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text-muted);
      font-size: 11px;
      cursor: pointer;
      padding: 2px 8px;
      transition: all .15s;
    }
    .copy-btn:hover { background: rgba(255,255,255,.06); color: var(--text); }
    .copy-btn.copied { color: var(--green); border-color: rgba(52,211,153,.4); }
    pre {
      margin: 0;
      padding: 12px;
      overflow-x: auto;
      font-family: var(--font-mono);
      font-size: var(--font-size);
      line-height: 1.6;
      color: var(--text);
      background: transparent;
      white-space: pre;
    }
    code { font-family: inherit; }

    /* ---- explanation ---- */
    .explanation-text {
      font-size: 12.5px;
      color: var(--text);
      line-height: 1.7;
      white-space: pre-wrap;
    }

    /* ---- section colours ---- */
    .issues-card     { border-left: 3px solid rgba(248,113,113,.5); }
    .suggest-card    { border-left: 3px solid rgba(251,191,36,.5); }
    .complexity-card { border-left: 3px solid rgba(167,139,250,.5); }
    .code-card       { border-left: 3px solid rgba(52,211,153,.5); }
    .explain-card    { border-left: 3px solid rgba(96,165,250,.5); }
  </style>
</head>
<body>

  <!-- ===== HEADER ===== -->
  <div class="header">
    <div class="header-top">
      <span style="font-size:18px">📋</span>
      <span class="header-title">${escapeHtml(title)}</span>
      ${issueCount > 0
        ? `<span class="badge badge-red">🐛 ${issueCount} issue${issueCount !== 1 ? 's' : ''}</span>`
        : `<span class="badge badge-green">✓ No issues</span>`}
      ${suggestionCount > 0
        ? `<span class="badge badge-yellow">⚡ ${suggestionCount} suggestion${suggestionCount !== 1 ? 's' : ''}</span>`
        : ''}
    </div>
    <div class="header-meta">Reviewed at ${timestamp} · language: ${escapeHtml(_language)}</div>
  </div>

  <!-- ===== CONTENT ===== -->
  <div class="content">

    <!-- Issues -->
    <div class="card issues-card" id="card-issues">
      <div class="card-header" onclick="toggle('issues')">
        <div class="card-title">
          <span>🐛</span>
          <span style="color:var(--red)">Detected Issues</span>
          <span class="badge badge-red">${issueCount}</span>
        </div>
        <svg class="card-chevron open" id="chev-issues" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      <div class="card-body" id="body-issues">
        ${issuesHtml}
      </div>
    </div>

    <!-- Suggestions -->
    <div class="card suggest-card" id="card-suggestions">
      <div class="card-header" onclick="toggle('suggestions')">
        <div class="card-title">
          <span>⚡</span>
          <span style="color:var(--yellow)">Optimization Suggestions</span>
          <span class="badge badge-yellow">${suggestionCount}</span>
        </div>
        <svg class="card-chevron open" id="chev-suggestions" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      <div class="card-body" id="body-suggestions">
        ${suggestionsHtml}
      </div>
    </div>

    <!-- Complexity -->
    ${complexityHtml ? `
    <div class="card complexity-card" id="card-complexity">
      <div class="card-header" onclick="toggle('complexity')">
        <div class="card-title">
          <span>🔬</span>
          <span style="color:var(--purple)">Complexity Analysis</span>
          ${complexity && complexity.has_nested_loops
            ? '<span class="badge" style="background:rgba(251,146,60,.15);color:var(--orange);border-color:rgba(251,146,60,.3)">⚠ nested loops</span>'
            : ''}
        </div>
        <svg class="card-chevron open" id="chev-complexity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      <div class="card-body" id="body-complexity">
        ${complexityHtml}
      </div>
    </div>
    ` : ''}

    <!-- Improved Code -->
    <div class="card code-card" id="card-code">
      <div class="card-header" onclick="toggle('code')">
        <div class="card-title">
          <span>✨</span>
          <span style="color:var(--green)">Improved Code</span>
        </div>
        <svg class="card-chevron open" id="chev-code" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      <div class="card-body" style="padding:0" id="body-code">
        ${improvedCodeHtml}
      </div>
    </div>

    <!-- Explanation -->
    <div class="card explain-card" id="card-explanation">
      <div class="card-header" onclick="toggle('explanation')">
        <div class="card-title">
          <span>💡</span>
          <span style="color:var(--blue)">Explanation</span>
        </div>
        <svg class="card-chevron open" id="chev-explanation" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
      <div class="card-body" id="body-explanation">
        ${explanationHtml}
      </div>
    </div>

  </div>

  <script nonce="${nonce}">
    // ----- Collapse / expand -----
    const openState = { issues: true, suggestions: true, complexity: true, code: true, explanation: true };

    function toggle(id) {
      openState[id] = !openState[id];
      const body  = document.getElementById('body-' + id);
      const chev  = document.getElementById('chev-' + id);
      if (body) body.style.display = openState[id] ? '' : 'none';
      if (chev) chev.classList.toggle('open', openState[id]);
    }

    // ----- Copy button -----
    function copyCode(id) {
      const pre = document.getElementById(id);
      if (!pre) return;
      navigator.clipboard.writeText(pre.textContent).then(() => {
        const btn = pre.closest('.card-body').querySelector('.copy-btn');
        if (btn) {
          btn.textContent = '✓ Copied';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
        }
      });
    }
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// HTML fragment builders
// ---------------------------------------------------------------------------

function renderList(items, colorKey) {
  if (!items || items.length === 0) {
    return '<p class="empty">None detected — looks good!</p>';
  }
  const numClass = colorKey === 'issue' ? 'item-num-red' : 'item-num-yellow';
  return `<div class="item-list">${
    items.map((item, i) => `
      <div class="item">
        <span class="item-num ${numClass}">${i + 1}</span>
        <span>${escapeHtml(item)}</span>
      </div>`).join('')
  }</div>`;
}

function renderComplexity(c) {
  const nested = c.has_nested_loops;
  const bottlenecks = (c.bottlenecks || []).map(b =>
    `<div class="bottleneck"><span>•</span><span>${escapeHtml(b)}</span></div>`
  ).join('');

  return `
    <div class="complexity-badges">
      <div class="complexity-chip">
        <div class="complexity-label">Time</div>
        <div class="complexity-value">${escapeHtml(c.time_complexity || 'Unknown')}</div>
      </div>
      <div class="complexity-chip">
        <div class="complexity-label">Space</div>
        <div class="complexity-value">${escapeHtml(c.space_complexity || 'Unknown')}</div>
      </div>
      <div class="complexity-chip ${nested ? 'warn' : ''}">
        <div class="complexity-label">Nested Loops</div>
        <div class="complexity-value ${nested ? 'warn' : ''}">${nested ? 'Yes ⚠' : 'No ✓'}</div>
      </div>
    </div>
    ${bottlenecks ? `<div class="bottleneck-list">${bottlenecks}</div>` : ''}
    ${c.optimization_hint ? `
      <div class="hint-box">
        <span>💡</span>
        <span>${escapeHtml(c.optimization_hint)}</span>
      </div>` : ''}`;
}

function renderCode(code, language) {
  if (!code || !code.trim()) {
    return '<p class="empty" style="padding:12px">No improved code provided.</p>';
  }
  return `
    <div class="code-toolbar">
      <span class="code-lang">${escapeHtml(language)}</span>
      <button class="copy-btn" onclick="copyCode('improved-code')">Copy</button>
    </div>
    <pre><code id="improved-code">${escapeHtml(code)}</code></pre>`;
}

function renderExplanation(text) {
  if (!text || !text.trim()) {
    return '<p class="empty">No explanation provided.</p>';
  }
  return `<p class="explanation-text">${escapeHtml(text)}</p>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { showReviewPanel };
