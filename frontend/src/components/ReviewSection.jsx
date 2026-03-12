import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

/**
 * A single collapsible section card inside the Review Panel.
 * Supports plain text list rendering and code block rendering.
 */
export default function ReviewSection({ title, icon, items, code, language, colorClass, isOpen, onToggle }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-lg border ${colorClass.border} overflow-hidden transition-colors
      ${isDark ? 'bg-gray-900/60' : 'bg-white/80'}`}>
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-semibold ${colorClass.text}`}>{title}</span>
          {items && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass.badge}`}>
              {items.length}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className={`px-4 pb-4 border-t transition-colors
          ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
          {/* List items (bugs / optimizations / explanation) */}
          {items && items.length > 0 && (
            <ul className="mt-3 space-y-2">
              {items.map((item, idx) => (
                <li key={idx} className={`flex items-start gap-2.5 text-sm
                  ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${colorClass.dot} flex items-center justify-center text-xs font-bold text-white`}>
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Explanation as paragraphs (if it's a string) */}
          {typeof items === 'string' && (
            <p className="mt-3 text-sm text-gray-300 leading-relaxed">{items}</p>
          )}

          {/* Improved code block */}
          {code && (
            <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">Improved Code</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
              <Editor
                height="280px"
                language={language}
                value={code}
                theme={isDark ? 'ai-dark' : 'ai-light'}
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: "'Fira Code', 'Consolas', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  padding: { top: 8, bottom: 8 },
                  automaticLayout: true,
                  wordWrap: 'on',
                  domReadOnly: true,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
