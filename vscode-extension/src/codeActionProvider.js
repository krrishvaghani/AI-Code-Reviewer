'use strict';

const vscode = require('vscode');

// ---------------------------------------------------------------------------
// ReviewStore — shared in-memory state
// ---------------------------------------------------------------------------

/**
 * Stores the most-recent review result per document URI so code actions and
 * the apply-code command can access them without re-running the AI.
 */
class ReviewStore {
  constructor() {
    /** @type {Map<string, { result: object, range: vscode.Range }>} */
    this._map = new Map();
  }

  /**
   * @param {vscode.Uri}    uri
   * @param {object}        result  Normalised review result.
   * @param {vscode.Range}  range   Range that was reviewed.
   */
  set(uri, result, range) {
    this._map.set(uri.toString(), { result, range });
  }

  /** @returns {{ result: object, range: vscode.Range } | null} */
  get(uri) {
    return this._map.get(uri.toString()) ?? null;
  }

  delete(uri) {
    this._map.delete(uri.toString());
  }

  clear() {
    this._map.clear();
  }
}

// ---------------------------------------------------------------------------
// AICodeActionProvider
// ---------------------------------------------------------------------------

/**
 * Provides lightbulb quick-fixes when the cursor is inside a reviewed range:
 *   1. ✨ Apply AI Improved Code  (QuickFix — replaces reviewed range)
 *   2. 💡 Show Explanation Panel  (opens sidebar panel)
 *   3. 🗑  Clear AI Warnings       (clears diagnostic collection)
 */
class AICodeActionProvider {
  /** @param {ReviewStore} store */
  constructor(store) {
    this._store = store;
  }

  /**
   * @param {vscode.TextDocument} document
   * @param {vscode.Range|vscode.Selection} range
   * @returns {vscode.CodeAction[]}
   */
  provideCodeActions(document, range) {
    const entry = this._store.get(document.uri);
    if (!entry) return [];

    // Only show actions when the cursor / selection overlaps the reviewed range
    if (!entry.range.intersection(range)) return [];

    const { result, range: reviewedRange } = entry;
    const actions = [];

    // ── 1. Apply improved code ─────────────────────────────────────────────
    if (result.improved_code?.trim()) {
      const action = new vscode.CodeAction(
        '$(sparkle) Apply AI Improved Code',
        vscode.CodeActionKind.QuickFix,
      );
      action.isPreferred = true;
      action.command = {
        command:   'aiCodeReviewer.applyImprovedCode',
        title:     'Apply AI Improved Code',
        arguments: [document.uri, reviewedRange, result.improved_code],
      };
      actions.push(action);
    }

    // ── 2. Show explanation panel ──────────────────────────────────────────
    const explain = new vscode.CodeAction(
      '$(lightbulb) Show AI Explanation',
      vscode.CodeActionKind.Empty,
    );
    explain.command = {
      command: 'aiCodeReviewer.showExplanation',
      title:   'Show AI Explanation Panel',
    };
    actions.push(explain);

    // ── 3. Clear warnings ──────────────────────────────────────────────────
    const clear = new vscode.CodeAction(
      '$(trash) Clear AI Warnings',
      vscode.CodeActionKind.Empty,
    );
    clear.command = {
      command: 'aiCodeReviewer.clearDiagnostics',
      title:   'Clear AI Warnings',
    };
    actions.push(clear);

    return actions;
  }
}

module.exports = { ReviewStore, AICodeActionProvider };
