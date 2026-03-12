'use strict';

const vscode  = require('vscode');
const api     = require('./apiClient');
const { showReviewPanel }                  = require('./reviewPanel');
const { showChatPanel }                    = require('./chatPanel');
const DiagnosticsManager                   = require('./diagnosticsManager');
const { ReviewStore, AICodeActionProvider } = require('./codeActionProvider');
const ExplanationPanelProvider             = require('./explanationPanel');

// ---------------------------------------------------------------------------
// Module-level singletons (initialised in activate)
// ---------------------------------------------------------------------------

/** @type {DiagnosticsManager} */
let diagnosticsManager;
/** @type {ReviewStore} */
let reviewStore;
/** @type {ExplanationPanelProvider} */
let explanationProvider;

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  diagnosticsManager  = new DiagnosticsManager();
  reviewStore         = new ReviewStore();
  explanationProvider = new ExplanationPanelProvider();

  context.subscriptions.push({ dispose: () => diagnosticsManager.dispose() });

  // ── Sidebar explanation panel ─────────────────────────────────────────────
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ExplanationPanelProvider.VIEW_ID,
      explanationProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  // ── Code action provider (quick-fix lightbulb) ────────────────────────────
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ['python', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'java', 'cpp', 'c'],
      new AICodeActionProvider(reviewStore),
      {
        providedCodeActionKinds: [
          vscode.CodeActionKind.QuickFix,
          vscode.CodeActionKind.Empty,
        ],
      },
    ),
  );

  // ── Commands ──────────────────────────────────────────────────────────────
  context.subscriptions.push(
    // Existing
    vscode.commands.registerCommand('aiCodeReviewer.reviewSelection',   () => handleReview(context, false)),
    vscode.commands.registerCommand('aiCodeReviewer.reviewFile',        () => handleReview(context, true)),
    vscode.commands.registerCommand('aiCodeReviewer.chatWithCode',      () => handleChat(context)),
    vscode.commands.registerCommand('aiCodeReviewer.setBackendUrl',     handleSetBackendUrl),
    // New
    vscode.commands.registerCommand('aiCodeReviewer.reviewCurrentFile', () => handleReview(context, true)),
    vscode.commands.registerCommand('aiCodeReviewer.clearDiagnostics',  handleClearDiagnostics),
    vscode.commands.registerCommand('aiCodeReviewer.showExplanation',   handleShowExplanation),
    vscode.commands.registerCommand('aiCodeReviewer.applyImprovedCode', handleApplyImprovedCode),
  );

  // Clear stale data when a file is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticsManager.clear(doc.uri);
      reviewStore.delete(doc.uri);
    }),
  );
}

function deactivate() {}

// ---------------------------------------------------------------------------
// Command: Review Selection / Review File / Review Current File
// ---------------------------------------------------------------------------

async function handleReview(context, reviewFullFile) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('AI Code Reviewer: Open a file to review.');
    return;
  }

  const selection    = editor.selection;
  const useSelection = !reviewFullFile && !selection.isEmpty;
  const code         = useSelection
    ? editor.document.getText(selection)
    : editor.document.getText();

  if (!code.trim()) {
    vscode.window.showWarningMessage('AI Code Reviewer: The file or selection is empty.');
    return;
  }

  const lastLine      = editor.document.lineCount - 1;
  const reviewedRange = useSelection
    ? new vscode.Range(selection.start, selection.end)
    : new vscode.Range(0, 0, lastLine, editor.document.lineAt(lastLine).text.length);

  const languageId = editor.document.languageId;
  const fileName   = shortName(editor.document.fileName);
  const label      = useSelection
    ? `lines ${selection.start.line + 1}–${selection.end.line + 1} of ${fileName}`
    : fileName;

  await vscode.window.withProgress(
    {
      location:    vscode.ProgressLocation.Notification,
      title:       `AI Code Reviewer: analysing ${label}…`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await api.reviewCode(code, languageId);

        // 1 ── Review panel (full side-by-side view)
        showReviewPanel(context, result, label, (improvedCode) => {
          handleApplyImprovedCode(editor.document.uri, reviewedRange, improvedCode);
        });

        // 2 ── Inline diagnostics (squiggles + after-text hint)
        diagnosticsManager.update(editor.document, reviewedRange, result);

        // 3 ── Store for code-action lightbulb
        reviewStore.set(editor.document.uri, result, reviewedRange);

        // 4 ── Explanation sidebar
        explanationProvider.update(result, label);

        if (result._exact === false) {
          vscode.window.showInformationMessage(
            `Note: ${languageId} is not directly supported — reviewed as JavaScript.`,
          );
        }

        // 5 ── Actionable notification when issues were found
        const totalIssues =
          (result.issues?.length ?? 0) +
          (result.security_issues?.length ?? 0) +
          (result.performance_issues?.length ?? 0);

        if (totalIssues > 0) {
          vscode.window
            .showWarningMessage(
              `AI Code Reviewer: ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found in ${fileName}.`,
              'Apply Improved Code',
              'Show Explanation',
            )
            .then((choice) => {
              if (choice === 'Apply Improved Code') {
                handleApplyImprovedCode(editor.document.uri, reviewedRange, result.improved_code);
              } else if (choice === 'Show Explanation') {
                handleShowExplanation();
              }
            });
        }
      } catch (err) {
        vscode.window.showErrorMessage(`AI Code Reviewer: ${err.message}`);
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Command: Chat with Code
// ---------------------------------------------------------------------------

async function handleChat(context) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('AI Code Reviewer: Open a file to chat about.');
    return;
  }

  const selection  = editor.selection;
  const hasSelect  = !selection.isEmpty;
  const code       = hasSelect
    ? editor.document.getText(selection)
    : editor.document.getText();

  if (!code.trim()) {
    vscode.window.showWarningMessage('AI Code Reviewer: Nothing to chat about — file is empty.');
    return;
  }

  const languageId = editor.document.languageId;
  const fileName   = shortName(editor.document.fileName);

  // Health-check first so the panel doesn't open if backend is unreachable
  try {
    await api.checkHealth();
  } catch {
    vscode.window.showErrorMessage(
      'AI Code Reviewer: cannot reach the backend. Check your URL in settings.'
    );
    return;
  }

  showChatPanel(context, code, languageId, fileName);
}

// ---------------------------------------------------------------------------
// Command: Set Backend URL
// ---------------------------------------------------------------------------

async function handleSetBackendUrl() {
  const config  = vscode.workspace.getConfiguration('aiCodeReviewer');
  const current = config.get('backendUrl', 'http://localhost:8000');

  const newUrl = await vscode.window.showInputBox({
    title:       'AI Code Reviewer – Backend URL',
    prompt:      'Enter the FastAPI backend base URL (no trailing slash)',
    value:       current,
    placeHolder: 'http://localhost:8000',
    validateInput(val) {
      if (!val || !val.trim()) return 'URL cannot be empty.';
      try { new URL(val); return null; }
      catch { return 'Enter a valid URL (e.g. http://localhost:8000)'; }
    },
  });

  if (newUrl === undefined) return; // user cancelled

  await config.update('backendUrl', newUrl.trim(), vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`AI Code Reviewer: backend URL saved → ${newUrl.trim()}`);
}

// ---------------------------------------------------------------------------
// Command: Clear Diagnostics
// ---------------------------------------------------------------------------

function handleClearDiagnostics() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    diagnosticsManager.clear(editor.document.uri);
    reviewStore.delete(editor.document.uri);
  } else {
    diagnosticsManager.clear();
    reviewStore.clear();
  }
  vscode.window.showInformationMessage('AI Code Reviewer: warnings cleared.');
}

// ---------------------------------------------------------------------------
// Command: Show Explanation Panel
// ---------------------------------------------------------------------------

function handleShowExplanation() {
  // Focus the registered WebviewView by its built-in focus command
  vscode.commands.executeCommand('aiCodeReviewer.explanationView.focus');
}

// ---------------------------------------------------------------------------
// Command: Apply Improved Code
// ---------------------------------------------------------------------------

/**
 * Replace the reviewed range in a document with the AI-improved version.
 * @param {vscode.Uri}    uri
 * @param {vscode.Range}  range
 * @param {string}        improvedCode
 */
async function handleApplyImprovedCode(uri, range, improvedCode) {
  if (!uri || !range || !improvedCode?.trim()) {
    vscode.window.showWarningMessage('AI Code Reviewer: No improved code available to apply.');
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(uri, range, improvedCode);
  const ok = await vscode.workspace.applyEdit(edit);

  if (ok) {
    vscode.window.showInformationMessage('AI Code Reviewer: Improved code applied ✓');
    // Stale diagnostics no longer apply — clear them
    diagnosticsManager.clear(uri);
    reviewStore.delete(uri);
  } else {
    vscode.window.showErrorMessage('AI Code Reviewer: Failed to apply the improved code.');
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortName(fullPath) {
  return fullPath.replace(/\\/g, '/').split('/').pop() || 'untitled';
}

module.exports = { activate, deactivate };
