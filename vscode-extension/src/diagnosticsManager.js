'use strict';

const vscode = require('vscode');

/**
 * Manages a VS Code DiagnosticCollection and an inline "after-text" decoration
 * that shows a compact issue summary on the first reviewed line.
 */
class DiagnosticsManager {
  constructor() {
    /** @type {vscode.DiagnosticCollection} */
    this._collection = vscode.languages.createDiagnosticCollection('aiCodeReviewer');

    /** @type {vscode.TextEditorDecorationType} */
    this._inlineDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 16px',
        fontStyle: 'italic',
        fontSize: '11px',
        color: new vscode.ThemeColor('editorCodeLens.foreground'),
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Apply AI review diagnostics and inline hint to a document.
   *
   * @param {vscode.TextDocument} document
   * @param {vscode.Range}        reviewedRange   Range that was actually reviewed.
   * @param {{
   *   issues:             string[],
   *   security_issues:    string[],
   *   performance_issues: string[],
   *   static_analysis:    Array<{ message: string, severity: string, line: number }>
   * }} result
   */
  update(document, reviewedRange, result) {
    const {
      issues             = [],
      security_issues    = [],
      performance_issues = [],
      static_analysis    = [],
    } = result;

    const diagnostics = [];

    for (const msg of issues) {
      diagnostics.push(this._make(document, reviewedRange, msg, vscode.DiagnosticSeverity.Error, 'Bug'));
    }
    for (const msg of security_issues) {
      diagnostics.push(this._make(document, reviewedRange, msg, vscode.DiagnosticSeverity.Warning, 'Security'));
    }
    for (const msg of performance_issues) {
      diagnostics.push(this._make(document, reviewedRange, msg, vscode.DiagnosticSeverity.Information, 'Performance'));
    }

    // Static analysis findings include explicit line numbers
    for (const finding of static_analysis) {
      const line  = Math.max(0, (finding.line ?? 1) - 1);
      const safe  = Math.min(line, document.lineCount - 1);
      const range = new vscode.Range(safe, 0, safe, document.lineAt(safe).text.length);
      const sev   = finding.severity === 'error'   ? vscode.DiagnosticSeverity.Error
                  : finding.severity === 'warning' ? vscode.DiagnosticSeverity.Warning
                  : vscode.DiagnosticSeverity.Information;
      const diag  = new vscode.Diagnostic(range, finding.message, sev);
      diag.source = 'AI Code Reviewer (Static)';
      diagnostics.push(diag);
    }

    this._collection.set(document.uri, diagnostics);
    this._applyInlineHint(document, reviewedRange, issues, security_issues, performance_issues);
  }

  /**
   * Remove diagnostics and inline decoration for a single document (or all).
   * @param {vscode.Uri} [uri]  Omit to clear all documents.
   */
  clear(uri) {
    if (uri) {
      this._collection.delete(uri);
    } else {
      this._collection.clear();
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.setDecorations(this._inlineDecoration, []);
    }
  }

  /** Free resources. */
  dispose() {
    this._collection.dispose();
    this._inlineDecoration.dispose();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  _make(document, fallbackRange, text, severity, source) {
    const range = this._extractLineRange(document, text) ?? fallbackRange;
    const diag  = new vscode.Diagnostic(range, text, severity);
    diag.source = `AI Code Reviewer (${source})`;
    return diag;
  }

  /**
   * Try to parse a line reference like "Line 5:" or "lines 3-7" from the text.
   * Returns null if no line number found.
   * @param {vscode.TextDocument} document
   * @param {string}              text
   * @returns {vscode.Range | null}
   */
  _extractLineRange(document, text) {
    const m = text.match(/\blines?\s+(\d+)(?:\s*[-–]\s*(\d+))?/i);
    if (!m) return null;
    const start = Math.max(0, parseInt(m[1], 10) - 1);
    const end   = m[2] ? Math.max(start, parseInt(m[2], 10) - 1) : start;
    if (start >= document.lineCount) return null;
    const safeEnd = Math.min(end, document.lineCount - 1);
    return new vscode.Range(start, 0, safeEnd, document.lineAt(safeEnd).text.length);
  }

  /**
   * Place an after-text decoration on the first line of the reviewed range
   * summarising how many issues were found.
   */
  _applyInlineHint(document, reviewedRange, issues, security_issues, performance_issues) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== document.uri.toString()) return;

    const total = issues.length + security_issues.length + performance_issues.length;
    if (total === 0) {
      editor.setDecorations(this._inlineDecoration, []);
      return;
    }

    const parts = [];
    if (issues.length)              parts.push(`🐛 ${issues.length} bug${issues.length !== 1 ? 's' : ''}`);
    if (security_issues.length)     parts.push(`🔒 ${security_issues.length} security`);
    if (performance_issues.length)  parts.push(`⚡ ${performance_issues.length} perf`);

    const firstLine = reviewedRange.start.line;
    const lineLen   = document.lineAt(firstLine).text.length;

    editor.setDecorations(this._inlineDecoration, [{
      range: new vscode.Range(firstLine, lineLen, firstLine, lineLen),
      renderOptions: {
        after: { contentText: `  ${parts.join('  ')}` },
      },
    }]);
  }
}

module.exports = DiagnosticsManager;
