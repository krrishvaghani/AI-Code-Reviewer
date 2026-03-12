import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

// ---------------------------------------------------------------------------
// Severity detection — parses tags like [SEVERITY: HIGH], [PERF], [OWASP …]
// ---------------------------------------------------------------------------

function detectSeverity(text) {
  const t = text.toUpperCase();
  if (t.includes('[SEVERITY: HIGH]') || t.includes('HIGH]'))   return 'high';
  if (t.includes('[SEVERITY: MEDIUM]') || t.includes('MEDIUM]')) return 'medium';
  if (t.includes('[SEVERITY: LOW]') || t.includes('LOW]'))     return 'low';
  if (t.includes('[PERF]'))                                     return 'perf';
  if (t.includes('[OWASP') || t.includes('[CWE'))               return 'owasp';
  return null;
}

const SEV_STYLES = {
  high:  { pill: 'bg-red-500/20 text-red-400 border border-red-500/30',    dot: 'bg-red-500',    label: 'HIGH'   },
  medium:{ pill: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', dot: 'bg-orange-500', label: 'MED'    },
  low:   { pill: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-500', label: 'LOW'    },
  perf:  { pill: 'bg-orange-500/20 text-orange-300 border border-orange-500/30', dot: 'bg-orange-400', label: 'PERF'   },
  owasp: { pill: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',  dot: 'bg-rose-500',   label: 'OWASP'  },
};

/** Strip the tag prefix so the body text reads cleanly. */
function stripTag(text) {
  return text
    .replace(/\[SEVERITY:\s*(HIGH|MEDIUM|LOW)\]\s*/i, '')
    .replace(/\[PERF\]\s*/i, '')
    .replace(/\[OWASP\s+CWE-\d+\]\s*/i, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Extract an optional location annotation: "FunctionName:12 — description"
// Returns { location, body } where location may be null.
// ---------------------------------------------------------------------------
function splitLocation(text) {
  // Match patterns like "line 12", "foo() line 3", "ClassName.method — "
  const locRe = /^([A-Za-z0-9_.()<>:, ]{1,60}(?:line\s+\d+)?)\s*[—–-]{1,2}\s*/;
  const m = text.match(locRe);
  if (m && m[1].length < text.length - 5) {
    return { location: m[1].trim(), body: text.slice(m[0].length) };
  }
  return { location: null, body: text };
}

// ---------------------------------------------------------------------------
// Single item row inside a section
// ---------------------------------------------------------------------------

function ItemRow({ text, index, sectionKey, isDark }) {
  const severity = detectSeverity(text);
  const cleaned  = severity ? stripTag(text) : text;
  const { location, body } = splitLocation(cleaned);
  const sevStyle = severity ? SEV_STYLES[severity] : null;

  // Warning sections: issues, security_issues → red left-accent
  // Suggestion sections → green left-accent
  const isWarning    = ['issues', 'security_issues'].includes(sectionKey);
  const isSuggestion = sectionKey === 'suggestions';
  const isPerf       = sectionKey === 'performance_issues';

  const isHighSeverity = severity === 'high';

  const leftAccent = isHighSeverity
    ? 'border-l-[3px] border-red-500'
    : isWarning
    ? 'border-l-2 border-red-500/60'
    : isSuggestion
    ? 'border-l-2 border-green-500/60'
    : isPerf
    ? 'border-l-2 border-orange-500/60'
    : 'border-l-2 border-gray-600/40';

  const itemBg = isHighSeverity
    ? (isDark ? 'bg-red-950/30 hover:bg-red-950/50' : 'bg-red-50 hover:bg-red-100')
    : isWarning
    ? (isDark ? 'bg-gray-800/50 hover:bg-gray-800/80' : 'bg-red-50/30 hover:bg-red-50')
    : isSuggestion
    ? (isDark ? 'bg-gray-800/50 hover:bg-gray-800/80' : 'bg-green-50/30 hover:bg-green-50')
    : (isDark ? 'bg-gray-800/50 hover:bg-gray-800/80' : 'bg-gray-50 hover:bg-gray-100');

  return (
    <li className={`rounded-r-lg pl-3 pr-2 py-2.5 transition-colors ${itemBg} ${leftAccent}`}>
      <div className="flex items-start gap-2">
        {/* Index badge */}
        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5
          ${isWarning ? 'bg-red-500' : isSuggestion ? 'bg-green-500' : isPerf ? 'bg-orange-500' : 'bg-gray-600'}`}>
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          {/* Location + severity pill */}
          {(location || sevStyle) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {location && (
                <code className={`text-xs font-mono px-1.5 py-0.5 rounded
                  ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                  {location}
                </code>
              )}
              {sevStyle && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${sevStyle.pill}`}>
                  {sevStyle.label}
                </span>
              )}
            </div>
          )}
          {/* Body text */}
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {parseInlineCode(body, isDark)}
          </p>
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

function CopyButton({ text, isDark }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all
        ${copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : isDark
          ? 'bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-500'
          : 'bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-300'}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Explanation renderer — splits on double newlines into paragraphs
// ---------------------------------------------------------------------------

function ExplanationBody({ text, isDark }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    return (
      <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        {text}
      </p>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      {paragraphs.map((p, i) => (
        <p key={i} className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {p}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline code parser — renders `backtick` spans as styled <code> elements
// ---------------------------------------------------------------------------

function parseInlineCode(text, isDark) {
  const parts = text.split(/(`[^`\n]+`)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className={`text-xs font-mono px-1.5 py-0.5 rounded mx-0.5 align-middle
        ${isDark ? 'bg-gray-700/80 text-cyan-300' : 'bg-gray-200 text-indigo-600'}`}>
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ---------------------------------------------------------------------------
// Main ReviewSection component
// ---------------------------------------------------------------------------

/**
 * A collapsible section card.
 *
 * Props:
 *  title, icon, colorClass  — appearance metadata from SECTIONS config
 *  items    (string[])      — list items (issues / suggestions / explanation)
 *  code     (string)        — improved code (renders Monaco editor)
 *  language (string)        — Monaco language id
 *  sectionKey (string)      — logical key used for accent-colour decisions
 *  isOpen, onToggle         — collapse state
 */
export default function ReviewSection({
  title, icon, items, code, language, colorClass, sectionKey, isOpen, onToggle,
}) {
  const { isDark } = useTheme();

  // Section-type tinted hover background so each card feels distinct
  const hoverBg = {
    issues:             isDark ? 'hover:bg-red-900/20'    : 'hover:bg-red-50',
    performance_issues: isDark ? 'hover:bg-orange-900/20' : 'hover:bg-orange-50',
    security_issues:    isDark ? 'hover:bg-rose-900/20'   : 'hover:bg-rose-50',
    suggestions:        isDark ? 'hover:bg-green-900/20'  : 'hover:bg-green-50',
    improved_code:      isDark ? 'hover:bg-indigo-900/20' : 'hover:bg-indigo-50',
    explanation:        isDark ? 'hover:bg-blue-900/20'   : 'hover:bg-blue-50',
  }[sectionKey] ?? (isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50');

  // Explanation is a plain string, not an array
  const isExplanation = sectionKey === 'explanation';

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors shadow-sm
      ${colorClass.border}
      ${isDark ? 'bg-gray-900/70' : 'bg-white'}`}
    >
      {/* ── Section header ──────────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${hoverBg}`}
      >
        <div className="flex items-center gap-2.5">
          {/* Coloured left pip */}
          <span className={`w-1 h-5 rounded-full flex-shrink-0 ${colorClass.dot}`} />
          <span className="text-base leading-none">{icon}</span>
          <span className={`text-sm font-semibold ${colorClass.text}`}>{title}</span>

          {/* Count badge for list sections */}
          {Array.isArray(items) && items.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${colorClass.badge}`}>
              {items.length}
            </span>
          )}

          {/* "all clear" badge when list is empty */}
          {Array.isArray(items) && items.length === 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-green-900/40 text-green-400 border border-green-700/40">
              ✓ none
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

      {/* ── Collapsible body ─────────────────────────────────────────────── */}
      {isOpen && (
        <div className={`border-t transition-colors
          ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}
        >
          {/* ── List items (issues / performance / security / suggestions) */}
          {Array.isArray(items) && items.length > 0 && (
            <ul className="p-3 space-y-2">
              {items.map((item, idx) => (
                <ItemRow
                  key={idx}
                  text={item}
                  index={idx}
                  sectionKey={sectionKey}
                  isDark={isDark}
                />
              ))}
            </ul>
          )}

          {/* ── Explanation text ─────────────────────────────────────────── */}
          {isExplanation && typeof items?.[0] === 'string' && (
            <div className="px-4 py-3">
              <ExplanationBody text={items[0]} isDark={isDark} />
            </div>
          )}

          {/* ── Improved code block ──────────────────────────────────────── */}
          {code && (
            <div className="p-3">
              <div className={`rounded-xl overflow-hidden border shadow-inner
                ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              >
                {/* Code block toolbar */}
                <div className={`flex items-center justify-between px-3 py-2 border-b
                  ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
                >
                  <div className="flex items-center gap-2">
                    {/* Traffic lights */}
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    <span className={`text-xs font-mono ml-1
                      ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      improved.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'java' ? 'java' : 'cpp'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Line count */}
                    <span className={`text-xs font-mono
                      ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {code.split('\n').length} lines
                    </span>
                    <CopyButton text={code} isDark={isDark} />
                  </div>
                </div>

                {/* Monaco syntax-highlighted code view */}
                <Editor
                  height="320px"
                  language={language}
                  value={code}
                  theme={isDark ? 'ai-dark' : 'ai-light'}
                  options={{
                    readOnly:            true,
                    domReadOnly:         true,
                    fontSize:            13,
                    fontFamily:          "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    fontLigatures:       true,
                    minimap:             { enabled: false },
                    scrollBeyondLastLine:false,
                    lineNumbers:         'on',
                    lineNumbersMinChars: 3,
                    padding:             { top: 10, bottom: 10 },
                    automaticLayout:     true,
                    wordWrap:            'on',
                    renderLineHighlight: 'none',
                    matchBrackets:       'always',
                    bracketPairColorization: { enabled: true },
                    scrollbar:           { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                    contextmenu:         false,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

