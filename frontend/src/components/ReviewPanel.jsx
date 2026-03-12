import { useState } from 'react';
import ReviewSection from './ReviewSection';
import LoadingSpinner from './LoadingSpinner';
import { useTheme } from '../context/ThemeContext';

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

const SECTIONS = [
  {
    key: 'issues',
    title: 'Detected Issues',
    icon: 'ðŸ›',
    colorClass: {
      border: 'border-red-800/50',
      text:  'text-red-400',
      badge: 'bg-red-900/60 text-red-300',
      dot:   'bg-red-500',
    },
  },
  {
    key: 'performance_issues',
    title: 'Performance Issues',
    icon: 'â±',
    colorClass: {
      border: 'border-orange-700/50',
      text:  'text-orange-400',
      badge: 'bg-orange-900/60 text-orange-300',
      dot:   'bg-orange-500',
    },
  },
  {
    key: 'security_issues',
    title: 'Security Vulnerabilities',
    icon: 'ðŸ”’',
    colorClass: {
      border: 'border-rose-800/50',
      text:  'text-rose-400',
      badge: 'bg-rose-900/60 text-rose-300',
      dot:   'bg-rose-500',
    },
  },
  {
    key: 'suggestions',
    title: 'Suggestions',
    icon: 'ðŸ’¡',
    colorClass: {
      border: 'border-green-800/50',
      text:  'text-green-400',
      badge: 'bg-green-900/60 text-green-300',
      dot:   'bg-green-500',
    },
  },
  {
    key: 'improved_code',
    title: 'Improved Code',
    icon: 'âœ¨',
    colorClass: {
      border: 'border-indigo-800/50',
      text:  'text-indigo-400',
      badge: 'bg-indigo-900/60 text-indigo-300',
      dot:   'bg-indigo-500',
    },
  },
  {
    key: 'explanation',
    title: 'Explanation',
    icon: 'ðŸ“',
    colorClass: {
      border: 'border-blue-800/50',
      text:  'text-blue-400',
      badge: 'bg-blue-900/60 text-blue-300',
      dot:   'bg-blue-400',
    },
  },
];

// ---------------------------------------------------------------------------
// Summary bar â€” quick totals across all warning categories
// ---------------------------------------------------------------------------

function SummaryBar({ review, isDark }) {
  const ai = review.ai_review;
  const staticCount = review.static_analysis?.length ?? 0;

  const pills = [
    { label: 'Issues',      count: ai.issues?.length ?? 0,            color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'    },
    { label: 'Performance', count: ai.performance_issues?.length ?? 0, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20'},
    { label: 'Security',    count: ai.security_issues?.length ?? 0,    color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20'  },
    { label: 'Suggestions', count: ai.suggestions?.length ?? 0,        color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'},
    { label: 'Linter',      count: staticCount,                        color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20'},
  ];

  return (
    <div className={`flex flex-wrap gap-1.5 px-4 py-2.5 border-b text-xs transition-colors
      ${isDark ? 'bg-gray-900/80 border-gray-700/60' : 'bg-gray-50 border-gray-200'}`}
    >
      {pills.map(({ label, count, color, bg }) => (
        <span key={label}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium ${bg} ${color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
          {count} {label}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static Analysis card
// ---------------------------------------------------------------------------

const SEVERITY_STYLES = {
  error:   { pill: 'bg-red-500/20 text-red-400 border border-red-500/30',    dot: 'bg-red-500',    label: 'error'   },
  warning: { pill: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', dot: 'bg-yellow-500', label: 'warning' },
  info:    { pill: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',  dot: 'bg-blue-400',   label: 'info'    },
};

function StaticAnalysisCard({ findings, isOpen, onToggle, isDark }) {
  if (!findings || findings.length === 0) return null;

  const errors   = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');
  const infos    = findings.filter((f) => f.severity === 'info');

  return (
    <div className={`rounded-xl border border-violet-800/50 overflow-hidden shadow-sm transition-colors
      ${isDark ? 'bg-gray-900/70' : 'bg-white'}`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors
          ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-5 rounded-full flex-shrink-0 bg-violet-500" />
          <span className="text-base">ðŸ”</span>
          <span className="text-sm font-semibold text-violet-400">Static Analysis</span>

          {/* Counts by severity */}
          {errors.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/20 text-red-400 border-red-500/30 font-mono">
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-mono">
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </span>
          )}
          {infos.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-400 border-blue-500/30 font-mono">
              {infos.length} info
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`border-t transition-colors ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
          <ul className="p-3 space-y-2">
            {findings.map((f, i) => {
              const style = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.warning;
              const accent = f.severity === 'error'
                ? 'border-l-2 border-red-500/60'
                : f.severity === 'warning'
                ? 'border-l-2 border-yellow-500/60'
                : 'border-l-2 border-blue-500/60';
              return (
                <li key={i} className={`rounded-r-lg pl-3 pr-2 py-2 transition-colors
                  ${isDark
                    ? `bg-gray-800/50 hover:bg-gray-800/80 ${accent}`
                    : `bg-gray-50 hover:bg-gray-100 ${accent}`}`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded font-mono ${style.pill}`}>
                      {style.label}
                    </span>
                    <code className={`text-xs font-mono px-1.5 py-0.5 rounded
                      ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                      {f.tool}
                    </code>
                    {f.code && (
                      <code className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {f.code}
                      </code>
                    )}
                    {f.line != null && (
                      <span className={`text-xs font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        line {f.line}{f.column != null ? `:${f.column}` : ''}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {f.message}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Complexity card
// ---------------------------------------------------------------------------

function ComplexityCard({ complexity, isOpen, onToggle, isDark }) {
  const hasIssue = complexity.has_nested_loops || complexity.bottlenecks.length > 0;

  return (
    <div className={`rounded-xl border border-purple-800/50 overflow-hidden shadow-sm transition-colors
      ${isDark ? 'bg-gray-900/70' : 'bg-white'}`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors
          ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-1 h-5 rounded-full flex-shrink-0 bg-purple-500" />
          <span className="text-base">ðŸ”¬</span>
          <span className="text-sm font-semibold text-purple-400">Complexity Analysis</span>
          {hasIssue && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/20 text-orange-400 border-orange-500/30">
              âš  bottleneck
            </span>
          )}
          {!hasIssue && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
              âœ“ clean
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`border-t px-4 pb-4 transition-colors
          ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}
        >
          {/* Big-O badges */}
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: 'Time',  value: complexity.time_complexity },
              { label: 'Space', value: complexity.space_complexity },
            ].map(({ label, value }) => (
              <div key={label}
                className={`flex flex-col items-center gap-1 border rounded-xl px-5 py-2.5 min-w-[90px]
                  ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
              >
                <span className={`text-xs uppercase tracking-widest font-medium
                  ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
                <span className="text-xl font-bold font-mono text-purple-300">{value}</span>
              </div>
            ))}
            <div className={`flex flex-col items-center gap-1 border rounded-xl px-5 py-2.5 min-w-[90px] ${
              complexity.has_nested_loops
                ? 'bg-orange-900/20 border-orange-700/40'
                : isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
            }`}>
              <span className={`text-xs uppercase tracking-widest font-medium
                ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nested Loops</span>
              <span className={`text-sm font-bold ${complexity.has_nested_loops ? 'text-orange-400' : 'text-green-400'}`}>
                {complexity.has_nested_loops ? 'Yes âš ' : 'No âœ“'}
              </span>
            </div>
          </div>

          {/* Bottlenecks */}
          {complexity.bottlenecks.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2
                ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>Bottlenecks</p>
              <ul className="space-y-1.5">
                {complexity.bottlenecks.map((b, i) => (
                  <li key={i}
                    className={`flex items-start gap-2 text-sm pl-3 py-1.5 rounded-r-lg border-l-2 border-orange-500/60
                      ${isDark ? 'bg-gray-800/50 text-gray-300' : 'bg-orange-50 text-gray-700'}`}
                  >
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-500/80 flex items-center justify-center text-xs font-bold text-white mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optimization hint */}
          {complexity.optimization_hint && (
            <div className={`mt-3 flex items-start gap-2 border rounded-lg px-3 py-2
              ${isDark
                ? 'bg-purple-900/20 border-purple-700/30'
                : 'bg-purple-50 border-purple-200'}`}
            >
              <span className="text-purple-400 flex-shrink-0">ðŸ’¡</span>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {complexity.optimization_hint}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty / Error states
// ---------------------------------------------------------------------------

function EmptyState({ isDark }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl
        ${isDark ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
        ðŸ¤–
      </div>
      <div className="text-center max-w-xs">
        <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          No review yet
        </p>
        <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Paste your code in the editor, choose a language, and click{' '}
          <span className="text-indigo-400 font-medium">"Review Code"</span>{' '}
          to get AI feedback with static analysis.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message, isDark }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
      <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl
        ${isDark ? 'bg-red-900/30 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
        âŒ
      </div>
      <div className="text-center max-w-xs">
        <p className="text-sm font-semibold text-red-400">Review Failed</p>
        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {message || 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReviewPanel
// ---------------------------------------------------------------------------

const ALL_KEYS = {
  issues: true, performance_issues: true, security_issues: true,
  suggestions: true, static_analysis: true, complexity: true,
  improved_code: true, explanation: true,
};

export default function ReviewPanel({ review, isLoading, error, language, loadingMessage, reviewedAt }) {
  const { isDark } = useTheme();
  const [openSections, setOpenSections] = useState({ ...ALL_KEYS });

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const expandAll  = () => setOpenSections({ ...ALL_KEYS });
  const collapseAll = () =>
    setOpenSections(Object.fromEntries(Object.keys(ALL_KEYS).map((k) => [k, false])));

  const monacoLanguage = language === 'cpp' ? 'cpp' : language;

  const formattedTime = reviewedAt
    ? reviewedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const renderSection = (section) => {
    const value = review.ai_review[section.key];
    const isEmpty = !value || (Array.isArray(value) && value.length === 0);

    // Always render explanation/improved_code placeholders for now; hide truly empty lists
    if (isEmpty && section.key !== 'explanation' && section.key !== 'improved_code') return null;
    if (isEmpty) return null;

    // Explanation: wrap string in array for unified items prop
    const items = section.key !== 'improved_code'
      ? (Array.isArray(value) ? value : [value])
      : undefined;

    return (
      <ReviewSection
        key={section.key}
        sectionKey={section.key}
        title={section.title}
        icon={section.icon}
        colorClass={section.colorClass}
        items={items}
        code={section.key === 'improved_code' ? value : undefined}
        language={monacoLanguage}
        isOpen={openSections[section.key]}
        onToggle={() => toggleSection(section.key)}
      />
    );
  };

  return (
    <div className={`flex flex-col h-full transition-colors
      ${isDark ? '' : 'bg-gray-50'}`}
    >
      {/* â”€â”€ Panel header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className={`flex items-center justify-between px-4 py-3 border-b rounded-t-lg flex-shrink-0 transition-colors
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">ðŸ“‹</span>
          <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Review Output
          </span>
          {formattedTime && (
            <span className={`text-xs font-mono ml-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Â· {formattedTime}
            </span>
          )}
        </div>

        {review && (
          <div className="flex items-center gap-3">
            <button
              onClick={collapseAll}
              className={`text-xs transition-colors ${isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Collapse All
            </button>
            <button
              onClick={expandAll}
              className={`text-xs transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Expand All
            </button>
          </div>
        )}
      </div>

      {/* â”€â”€ Summary bar (only when review is loaded) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!isLoading && !error && review && (
        <SummaryBar review={review} isDark={isDark} />
      )}

      {/* â”€â”€ Panel body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className={`flex-1 overflow-y-auto p-3 space-y-2.5 rounded-b-lg border border-t-0 transition-colors
        ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}
      >
        {isLoading && <LoadingSpinner message={loadingMessage} />}

        {!isLoading && error && <ErrorState message={error} isDark={isDark} />}

        {!isLoading && !error && !review && <EmptyState isDark={isDark} />}

        {!isLoading && !error && review && (
          <>
            {/* 1. Static analysis linter findings */}
            <StaticAnalysisCard
              findings={review.static_analysis}
              isOpen={openSections.static_analysis}
              onToggle={() => toggleSection('static_analysis')}
              isDark={isDark}
            />

            {/* 2. Bugs / errors */}
            {renderSection(SECTIONS[0])}

            {/* 3. Performance */}
            {renderSection(SECTIONS[1])}

            {/* 4. Security */}
            {renderSection(SECTIONS[2])}

            {/* 5. Suggestions (green) */}
            {renderSection(SECTIONS[3])}

            {/* 6. Complexity */}
            {review.ai_review.complexity && (
              <ComplexityCard
                complexity={review.ai_review.complexity}
                isOpen={openSections.complexity}
                onToggle={() => toggleSection('complexity')}
                isDark={isDark}
              />
            )}

            {/* 7. Improved code */}
            {renderSection(SECTIONS[4])}

            {/* 8. Explanation */}
            {renderSection(SECTIONS[5])}
          </>
        )}
      </div>
    </div>
  );
}
