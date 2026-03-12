'use strict';

const vscode = require('vscode');
const crypto = require('node:crypto');

/**
 * WebviewViewProvider for the "AI Code Review" panel in the Explorer sidebar.
 * Displays the explanation, complexity, and issue summary from the latest review.
 * Auto-updates whenever a new review completes.
 */
class ExplanationPanelProvider {
  static VIEW_ID = 'aiCodeReviewer.explanationView';

  constructor() {
    /** @type {vscode.WebviewView | undefined} */
    this._view       = undefined;
    /** @type {object | null} */
    this._lastResult = null;
    /** @type {string} */
    this._lastTitle  = '';
  }

  // ---------------------------------------------------------------------------
  // WebviewViewProvider implementation
  // ---------------------------------------------------------------------------

  /**
   * Called by VS Code once when the view is first shown.
   * @param {vscode.WebviewView} webviewView
   */
  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    this._render();

    webviewView.onDidDispose(() => { this._view = undefined; });
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) this._render();
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Push a new review result into the panel.
   * @param {object} result  Normalised review result.
   * @param {string} title   Short label (e.g. file name or line range).
   */
  update(result, title) {
    this._lastResult = result;
    this._lastTitle  = title;
    if (this._view?.visible) {
      this._render();
    }
    // Bring the view to focus so users see the update
    this._view?.show?.(/* preserveFocus */ true);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  _render() {
    if (!this._view) return;
    const nonce = crypto.randomBytes(16).toString('hex');
    this._view.webview.html = this._lastResult
      ? buildResultHtml(nonce, this._lastResult, this._lastTitle)
      : buildEmptyHtml(nonce);
  }
}

// ---------------------------------------------------------------------------
// HTML: empty state
// ---------------------------------------------------------------------------

function buildEmptyHtml(nonce) {
  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'nonce-${nonce}';"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style nonce="${nonce}">
    body {
      margin: 0; padding: 28px 16px;
      font-family: var(--vscode-font-family, system-ui, sans-serif);
      color: var(--vscode-descriptionForeground, #6b7280);
      background: var(--vscode-sideBar-background, #1a1d27);
    }
    .wrap { text-align: center; margin-top: 24px; }
    .icon { font-size: 38px; display: block; margin-bottom: 14px; }
    p { font-size: 12px; line-height: 1.65; margin: 0; }
    strong { color: var(--vscode-editor-foreground, #d4d4d8); }
    kbd {
      display: inline-block; font-size: 10.5px;
      background: var(--vscode-keybindingLabel-background, rgba(255,255,255,.08));
      border: 1px solid var(--vscode-keybindingLabel-border, #4b5563);
      border-radius: 3px; padding: 1px 5px;
      font-family: var(--vscode-editor-font-family, monospace);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <span class="icon">🤖</span>
    <p><strong>No review yet.</strong><br/><br/>
       Open a file and press <kbd>Ctrl+Shift+R</kbd><br/>
       or run <em>AI Review Current File</em><br/>
       from the Command Palette&nbsp;(<kbd>Ctrl+Shift+P</kbd>).</p>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// HTML: review result
// ---------------------------------------------------------------------------

function buildResultHtml(nonce, result, title) {
  const {
    explanation        = '',
    complexity         = null,
    issues             = [],
    security_issues    = [],
    performance_issues = [],
    suggestions        = [],
    static_analysis    = [],
    _language          = '',
  } = result;

  const totalIssues = issues.length + security_issues.length + performance_issues.length;
  const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const makeSection = (label, color, items) => {
    if (!items.length) return '';
    return `
    <div class="section">
      <div class="section-title" style="color:${color}">${esc(label)}</div>
      ${items.map((t, i) => `
        <div class="row">
          <span class="num">${i + 1}</span>
          <span>${esc(t)}</span>
        </div>`).join('')}
    </div>`;
  };

  const staticHtml = static_analysis.length === 0 ? '' : `
    <div class="section">
      <div class="section-title" style="color:#a78bfa">Static Analysis</div>
      ${static_analysis.map((f) => `
        <div class="row">
          <span class="num num-${esc((f.severity || 'info').toLowerCase())}"
                title="${esc(f.severity || '')} line ${f.line || '?'}">${f.line || '?'}</span>
          <span>${esc(f.message)}</span>
        </div>`).join('')}
    </div>`;

  const complexHtml = complexity ? `
    <div class="section">
      <div class="section-title" style="color:#a78bfa">Complexity</div>
      <div class="chips">
        <div class="chip">
          <div class="chip-l">Time</div>
          <div class="chip-v">${esc(complexity.time_complexity || '?')}</div>
        </div>
        <div class="chip">
          <div class="chip-l">Space</div>
          <div class="chip-v">${esc(complexity.space_complexity || '?')}</div>
        </div>
        ${complexity.has_nested_loops ? `
        <div class="chip chip-warn">
          <div class="chip-l">Nested Loops</div>
          <div class="chip-v chip-v-warn">Yes ⚠</div>
        </div>` : ''}
      </div>
      ${complexity.optimization_hint ? `<div class="hint">${esc(complexity.optimization_hint)}</div>` : ''}
    </div>` : '';

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'nonce-${nonce}';"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style nonce="${nonce}">
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:      var(--vscode-sideBar-background, #1a1d27);
      --surface: var(--vscode-editor-background, #0f1117);
      --border:  var(--vscode-panel-border, #2d3148);
      --text:    var(--vscode-editor-foreground, #d4d4d8);
      --muted:   var(--vscode-descriptionForeground, #6b7280);
      --red:     #f87171; --yellow: #fbbf24; --green: #34d399;
      --purple:  #a78bfa; --blue:   #60a5fa; --orange: #fb923c;
      --mono:    var(--vscode-editor-font-family, 'Consolas', monospace);
    }
    body {
      background: var(--bg); color: var(--text);
      font-family: var(--vscode-font-family, system-ui, sans-serif);
      font-size: 12px; line-height: 1.6; padding-bottom: 32px;
    }
    /* ── header ── */
    .header {
      background: var(--surface); border-bottom: 1px solid var(--border);
      padding: 10px 12px; position: sticky; top: 0; z-index: 5;
    }
    .header-title {
      font-size: 12.5px; font-weight: 700;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .header-sub { font-size: 10.5px; color: var(--muted); margin-top: 2px; }
    /* ── pills ── */
    .pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
    .pill {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 10.5px; font-weight: 600; padding: 1px 7px;
      border-radius: 99px; border: 1px solid transparent;
    }
    .pill-r { background: rgba(248,113,113,.15); color: var(--red);    border-color: rgba(248,113,113,.3); }
    .pill-y { background: rgba(251,191,36,.15);  color: var(--yellow); border-color: rgba(251,191,36,.3);  }
    .pill-g { background: rgba(52,211,153,.15);  color: var(--green);  border-color: rgba(52,211,153,.3);  }
    /* ── section ── */
    .section { padding: 10px 12px; border-bottom: 1px solid var(--border); }
    .section-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--muted); margin-bottom: 7px;
    }
    /* ── explain ── */
    .explain-text { font-size: 12px; white-space: pre-wrap; line-height: 1.7; }
    /* ── rows ── */
    .row  { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 5px; font-size: 11.5px; }
    .num  {
      flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%;
      background: #dc2626; display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; color: #fff; margin-top: 1px;
    }
    .num-warning { background: #d97706; }
    .num-information, .num-info { background: #2563eb; }
    /* ── complexity chips ── */
    .chips { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 7px; }
    .chip {
      background: rgba(255,255,255,.04); border: 1px solid var(--border);
      border-radius: 6px; padding: 5px 9px; text-align: center; min-width: 60px;
    }
    .chip-warn { background: rgba(251,146,60,.08); border-color: rgba(251,146,60,.3); }
    .chip-l { font-size: 9.5px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
    .chip-v { font-size: 13px; font-weight: 700; font-family: var(--mono); color: var(--purple); }
    .chip-v-warn { color: var(--orange); }
    .hint {
      background: rgba(167,139,250,.08); border: 1px solid rgba(167,139,250,.2);
      border-radius: 5px; padding: 6px 9px; font-size: 11.5px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-title">💡 ${esc(title)}</div>
    <div class="header-sub">AI Analysis · ${esc(_language || 'unknown')}</div>
    <div class="pills">
      ${totalIssues > 0
        ? `<span class="pill pill-r">🐛 ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}</span>`
        : `<span class="pill pill-g">✓ Clean</span>`}
      ${suggestions.length > 0
        ? `<span class="pill pill-y">⚡ ${suggestions.length} suggestion${suggestions.length !== 1 ? 's' : ''}</span>`
        : ''}
    </div>
  </div>

  <!-- Explanation -->
  <div class="section">
    <div class="section-title" style="color:var(--blue)">Explanation</div>
    <p class="explain-text">${
      explanation.trim()
        ? esc(explanation)
        : '<em style="color:var(--muted)">No explanation provided.</em>'
    }</p>
  </div>

  ${complexHtml}
  ${makeSection('Bugs / Issues',        'var(--red)',    issues)}
  ${makeSection('Security Issues',      'var(--orange)', security_issues)}
  ${makeSection('Performance Issues',   'var(--yellow)', performance_issues)}
  ${makeSection('Suggestions',          'var(--yellow)', suggestions)}
  ${staticHtml}

</body>
</html>`;
}

module.exports = ExplanationPanelProvider;
