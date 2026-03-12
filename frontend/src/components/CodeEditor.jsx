/**
 * CodeEditor — enhanced Monaco-based editor component.
 *
 * Features:
 *  ✓ Syntax highlighting for Python, JavaScript, Java, C++
 *  ✓ Line numbers (always on)
 *  ✓ Auto-indentation  (formatOnPaste, formatOnType, autoIndent: 'full')
 *  ✓ Bracket matching + colourised bracket pairs
 *  ✓ Dark theme ('ai-dark') and light theme ('ai-light') — custom registered
 *  ✓ VS Code keyboard shortcuts (built into Monaco):
 *      Ctrl+/          — toggle line comment
 *      Shift+Alt+F     — format document
 *      Ctrl+D          — select next occurrence
 *      Alt+↑/↓         — move lines
 *      Ctrl+Shift+K    — delete line
 *      Ctrl+]  / [     — indent / outdent
 *      F1              — command palette
 *      Ctrl+`          — open integrated terminal (no-op in browser, kept for parity)
 *  ✓ Responsive: fills flex container via automaticLayout
 *  ✓ Cursor position reported via onCursorChange prop
 */

import { useRef, useCallback } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

// ---------------------------------------------------------------------------
// Monaco CDN — use the version already bundled by @monaco-editor/react
// ---------------------------------------------------------------------------
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });

// ---------------------------------------------------------------------------
// Language meta
// ---------------------------------------------------------------------------

const LANGUAGE_MAP = {
  python:     'python',
  javascript: 'javascript',
  java:       'java',
  cpp:        'cpp',
};

const FILE_NAME = {
  python:     'main.py',
  javascript: 'index.js',
  java:       'Main.java',
  cpp:        'main.cpp',
};

const DEFAULT_CODE = {
  python: `def calculate_average(numbers):
    total = 0
    for n in numbers:
        total = total + n
    average = total / len(numbers)
    return average

result = calculate_average([10, 20, 30, 40, 50])
print("Average:", result)
`,
  javascript: `function calculateAverage(numbers) {
  var total = 0;
  for (var i = 0; i < numbers.length; i++) {
    total = total + numbers[i];
  }
  var average = total / numbers.length;
  return average;
}

const result = calculateAverage([10, 20, 30, 40, 50]);
console.log("Average:", result);
`,
  java: `public class Main {
    public static double calculateAverage(int[] numbers) {
        int total = 0;
        for (int i = 0; i < numbers.length; i++) {
            total = total + numbers[i];
        }
        double average = total / numbers.length;
        return average;
    }

    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40, 50};
        System.out.println("Average: " + calculateAverage(numbers));
    }
}
`,
  cpp: `#include <iostream>
#include <vector>

double calculateAverage(std::vector<int> numbers) {
    int total = 0;
    for (size_t i = 0; i < numbers.size(); i++) {
        total = total + numbers[i];
    }
    double average = static_cast<double>(total) / numbers.size();
    return average;
}

int main() {
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    std::cout << "Average: " << calculateAverage(numbers) << std::endl;
    return 0;
}
`,
};

// ---------------------------------------------------------------------------
// Custom Monaco themes
// ---------------------------------------------------------------------------

const AI_DARK_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',      foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword',      foreground: 'C586C0' },
    { token: 'string',       foreground: 'CE9178' },
    { token: 'number',       foreground: 'B5CEA8' },
    { token: 'type',         foreground: '4EC9B0' },
    { token: 'function',     foreground: 'DCDCAA' },
    { token: 'variable',     foreground: '9CDCFE' },
    { token: 'operator',     foreground: 'D4D4D4' },
    { token: 'delimiter',    foreground: 'D4D4D4' },
  ],
  colors: {
    'editor.background':              '#0f1117',
    'editor.foreground':              '#D4D4D4',
    'editor.lineHighlightBackground': '#1e2230',
    'editor.selectionBackground':     '#264f7880',
    'editor.inactiveSelectionBackground': '#3a3d4180',
    'editorLineNumber.foreground':    '#4a5568',
    'editorLineNumber.activeForeground': '#a0aec0',
    'editorCursor.foreground':        '#AEAFAD',
    'editorIndentGuide.background':   '#2d3748',
    'editorIndentGuide.activeBackground': '#4a5568',
    'editorBracketMatch.background':  '#0064001a',
    'editorBracketMatch.border':      '#888',
    'editorGutter.background':        '#0f1117',
    'scrollbarSlider.background':     '#4a556840',
    'scrollbarSlider.hoverBackground':'#4a556870',
  },
};

const AI_LIGHT_THEME = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment',      foreground: '008000', fontStyle: 'italic' },
    { token: 'keyword',      foreground: 'AF00DB' },
    { token: 'string',       foreground: 'A31515' },
    { token: 'number',       foreground: '098658' },
    { token: 'type',         foreground: '267F99' },
    { token: 'function',     foreground: '795E26' },
    { token: 'variable',     foreground: '001080' },
    { token: 'operator',     foreground: '000000' },
  ],
  colors: {
    'editor.background':              '#FAFAFA',
    'editor.foreground':              '#1E1E1E',
    'editor.lineHighlightBackground': '#EDF2F7',
    'editor.selectionBackground':     '#ADD6FF80',
    'editor.inactiveSelectionBackground': '#E5EBF1',
    'editorLineNumber.foreground':    '#A0AEC0',
    'editorLineNumber.activeForeground': '#4A5568',
    'editorCursor.foreground':        '#1E1E1E',
    'editorIndentGuide.background':   '#CBD5E0',
    'editorIndentGuide.activeBackground': '#A0AEC0',
    'editorBracketMatch.background':  '#0064001a',
    'editorBracketMatch.border':      '#aaa',
    'editorGutter.background':        '#F0F4F8',
    'scrollbarSlider.background':     '#CBD5E040',
    'scrollbarSlider.hoverBackground':'#CBD5E080',
  },
};

// ---------------------------------------------------------------------------
// Shared Monaco options
// ---------------------------------------------------------------------------

const EDITOR_OPTIONS = {
  // ── Display ───────────────────────────────────────────────────────────────
  fontSize:              14,
  fontFamily:            "'Fira Code', 'Cascadia Code', 'Consolas', 'Menlo', monospace",
  fontLigatures:         true,
  lineNumbers:           'on',
  lineNumbersMinChars:   3,
  renderLineHighlight:   'line',
  padding:               { top: 12, bottom: 12 },
  minimap:               { enabled: false },

  // ── Indentation ───────────────────────────────────────────────────────────
  tabSize:               4,
  insertSpaces:          true,
  autoIndent:            'full',          // language-aware auto-indent
  formatOnPaste:         true,
  formatOnType:          false,           // can be noisy; toggled below via keybind

  // ── Bracket matching ──────────────────────────────────────────────────────
  matchBrackets:                 'always',
  bracketPairColorization:       { enabled: true },
  guides: {
    bracketPairs:        true,            // colourised bracket-pair guides
    indentation:         true,
  },

  // ── Scrolling / wrapping ──────────────────────────────────────────────────
  wordWrap:              'on',
  scrollBeyondLastLine:  false,
  smoothScrolling:       true,
  scrollbar: {
    verticalScrollbarSize:   8,
    horizontalScrollbarSize: 8,
    useShadows:              false,
  },

  // ── Cursor ────────────────────────────────────────────────────────────────
  cursorBlinking:        'smooth',
  cursorSmoothCaretAnimation: 'on',
  cursorStyle:           'line',

  // ── IntelliSense / hints ──────────────────────────────────────────────────
  quickSuggestions:      { other: true, comments: false, strings: false },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  parameterHints:        { enabled: true },
  hover:                 { enabled: true },

  // ── Misc ──────────────────────────────────────────────────────────────────
  automaticLayout:       true,            // resizes with flex container
  renderWhitespace:      'boundary',
  colorDecorators:       true,
  stickyScroll:          { enabled: false },
  accessibilitySupport:  'auto',
};

// ---------------------------------------------------------------------------
// Keyboard action IDs that mirror VS Code defaults
// We register these via editor.addAction() so they show in the command palette.
// Most are already built into Monaco; we add the ones that aren't.
// ---------------------------------------------------------------------------

function registerVSCodeShortcuts(editor, monaco) {
  // Format document — Shift+Alt+F
  editor.addAction({
    id:    'format-document',
    label: 'Format Document',
    keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
    contextMenuGroupId: 'modification',
    contextMenuOrder: 1,
    run: (ed) => ed.getAction('editor.action.formatDocument')?.run(),
  });

  // Delete line — Ctrl+Shift+K
  editor.addAction({
    id:    'delete-line',
    label: 'Delete Line',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK],
    run: (ed) => ed.getAction('editor.action.deleteLines')?.run(),
  });

  // Duplicate line — Shift+Alt+Down
  editor.addAction({
    id:    'duplicate-line',
    label: 'Duplicate Line Down',
    keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
    run: (ed) => ed.getAction('editor.action.copyLinesDownAction')?.run(),
  });

  // Move line up — Alt+Up
  editor.addAction({
    id:    'move-line-up',
    label: 'Move Line Up',
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.UpArrow],
    run: (ed) => ed.getAction('editor.action.moveLinesUpAction')?.run(),
  });

  // Move line down — Alt+Down
  editor.addAction({
    id:    'move-line-down',
    label: 'Move Line Down',
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.DownArrow],
    run: (ed) => ed.getAction('editor.action.moveLinesDownAction')?.run(),
  });

  // Toggle word wrap — Alt+Z (VS Code default)
  editor.addAction({
    id:    'toggle-word-wrap',
    label: 'Toggle Word Wrap',
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyZ],
    run: (ed) => {
      const current = ed.getOption(monaco.editor.EditorOption.wordWrap);
      ed.updateOptions({ wordWrap: current === 'on' ? 'off' : 'on' });
    },
  });

  // Go to line — Ctrl+G (VS Code: Ctrl+G)
  editor.addAction({
    id:    'go-to-line',
    label: 'Go to Line…',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG],
    run: (ed) => ed.getAction('editor.action.gotoLine')?.run(),
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @param {object}   props
 * @param {string}   props.language         — 'python' | 'javascript' | 'java' | 'cpp'
 * @param {string}   props.code             — controlled editor value
 * @param {function} props.onChange         — (newValue: string) => void
 * @param {function} [props.onCursorChange] — ({ line, column }) => void  (for StatusBar)
 * @param {function} [props.onEditorMount]  — (editor, monaco) => void
 */
export default function CodeEditor({ language, code, onChange, onCursorChange, onEditorMount }) {
  const { isDark } = useTheme();
  const monacoRef  = useRef(null);
  const editorRef  = useRef(null);

  const monacoLanguage = LANGUAGE_MAP[language] ?? 'plaintext';
  const monacoTheme    = isDark ? 'ai-dark' : 'ai-light';

  // ── beforeMount: register themes before the editor renders ─────────────
  const handleBeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme('ai-dark',  AI_DARK_THEME);
    monaco.editor.defineTheme('ai-light', AI_LIGHT_THEME);
  }, []);

  // ── onMount: store refs, register shortcuts, hook cursor listener ───────
  const handleMount = useCallback((editor, monaco) => {
    editorRef.current  = editor;
    monacoRef.current  = monaco;

    registerVSCodeShortcuts(editor, monaco);

    // Cursor position → StatusBar
    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange({
          line:   e.position.lineNumber,
          column: e.position.column,
        });
      });
    }

    // Focus editor on mount for immediate keyboard use
    editor.focus();

    onEditorMount?.(editor, monaco);
  }, [onCursorChange, onEditorMount]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-2 border-b rounded-t-lg flex-shrink-0 transition-colors
        ${isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-100 border-gray-300'}`}
      >
        {/* Traffic-light dots */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>

        {/* Filename */}
        <span className={`text-xs font-mono transition-colors
          ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {FILE_NAME[language]}
        </span>

        {/* Load sample */}
        <button
          onClick={() => onChange(DEFAULT_CODE[language])}
          className={`text-xs transition-colors
            ${isDark
              ? 'text-gray-500 hover:text-gray-300'
              : 'text-gray-500 hover:text-gray-700'}`}
          title="Load sample code"
        >
          Load Sample
        </button>
      </div>

      {/* ── Monaco Editor ────────────────────────────────────────────────── */}
      <div className={`flex-1 min-h-0 rounded-b-lg overflow-hidden border border-t-0 transition-colors
        ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code !== undefined ? code : DEFAULT_CODE[language]}
          theme={monacoTheme}
          onChange={(value) => onChange(value ?? '')}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={EDITOR_OPTIONS}
        />
      </div>
    </div>
  );
}

