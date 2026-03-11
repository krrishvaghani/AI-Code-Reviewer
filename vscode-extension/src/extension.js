'use strict';

const vscode  = require('vscode');
const api     = require('./apiClient');
const { showReviewPanel } = require('./reviewPanel');
const { showChatPanel }   = require('./chatPanel');

// ---------------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------------

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('aiCodeReviewer.reviewSelection', () => handleReview(context, false)),
    vscode.commands.registerCommand('aiCodeReviewer.reviewFile',      () => handleReview(context, true)),
    vscode.commands.registerCommand('aiCodeReviewer.chatWithCode',    () => handleChat(context)),
    vscode.commands.registerCommand('aiCodeReviewer.setBackendUrl',   handleSetBackendUrl),
  );
}

function deactivate() {}

// ---------------------------------------------------------------------------
// Command: Review Selection / Review File
// ---------------------------------------------------------------------------

async function handleReview(context, reviewFullFile) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('AI Code Reviewer: Open a file to review.');
    return;
  }

  const selection = editor.selection;
  const useSelection = !reviewFullFile && !selection.isEmpty;
  const code = useSelection
    ? editor.document.getText(selection)
    : editor.document.getText();

  if (!code.trim()) {
    vscode.window.showWarningMessage('AI Code Reviewer: The file or selection is empty.');
    return;
  }

  const languageId = editor.document.languageId;
  const fileName   = shortName(editor.document.fileName);
  const label      = useSelection
    ? `lines ${selection.start.line + 1}–${selection.end.line + 1} of ${fileName}`
    : fileName;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title:    `AI Code Reviewer: analysing ${label}…`,
      cancellable: false,
    },
    async () => {
      try {
        const result = await api.reviewCode(code, languageId);
        showReviewPanel(context, result, label);

        if (result._exact === false) {
          vscode.window.showInformationMessage(
            `Note: ${languageId} is not directly supported — reviewed as JavaScript.`
          );
        }
      } catch (err) {
        vscode.window.showErrorMessage(`AI Code Reviewer: ${err.message}`);
      }
    }
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
// Helpers
// ---------------------------------------------------------------------------

function shortName(fullPath) {
  return fullPath.replace(/\\/g, '/').split('/').pop() || 'untitled';
}

module.exports = { activate, deactivate };
