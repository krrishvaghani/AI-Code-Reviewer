import { useState } from 'react';
import ReviewSection from './ReviewSection';
import LoadingSpinner from './LoadingSpinner';

const SECTIONS = [
  {
    key: 'issues',
    title: 'Detected Issues',
    icon: '🐛',
    colorClass: {
      border: 'border-red-800/50',
      text: 'text-red-400',
      badge: 'bg-red-900/60 text-red-300',
      dot: 'bg-red-500',
    },
  },
  {
    key: 'suggestions',
    title: 'Optimization Suggestions',
    icon: '⚡',
    colorClass: {
      border: 'border-yellow-700/50',
      text: 'text-yellow-400',
      badge: 'bg-yellow-900/60 text-yellow-300',
      dot: 'bg-yellow-500',
    },
  },
  {
    key: 'improved_code',
    title: 'Improved Code',
    icon: '✨',
    colorClass: {
      border: 'border-green-800/50',
      text: 'text-green-400',
      badge: 'bg-green-900/60 text-green-300',
      dot: 'bg-green-500',
    },
  },
  {
    key: 'explanation',
    title: 'Explanation',
    icon: '💡',
    colorClass: {
      border: 'border-blue-800/50',
      text: 'text-blue-400',
      badge: 'bg-blue-900/60 text-blue-300',
      dot: 'bg-blue-500',
    },
  },
];

// ---------------------------------------------------------------------------
// Complexity card — rendered between suggestions and improved_code
// ---------------------------------------------------------------------------

function ComplexityCard({ complexity, isOpen, onToggle }) {
  const hasIssue = complexity.has_nested_loops || complexity.bottlenecks.length > 0;

  return (
    <div className="rounded-lg border border-purple-800/50 bg-gray-900/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔬</span>
          <span className="text-sm font-semibold text-purple-400">Complexity Analysis</span>
          {hasIssue && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-300 border border-orange-700/40">
              ⚠ bottleneck detected
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

      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-700/50">
          {/* Big-O badges */}
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="flex flex-col items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 min-w-[90px]">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Time</span>
              <span className="text-lg font-bold font-mono text-purple-300">
                {complexity.time_complexity}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 min-w-[90px]">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Space</span>
              <span className="text-lg font-bold font-mono text-purple-300">
                {complexity.space_complexity}
              </span>
            </div>
            <div className={`flex flex-col items-center gap-1 border rounded-lg px-4 py-2 min-w-[90px] ${
              complexity.has_nested_loops
                ? 'bg-orange-900/20 border-orange-700/40'
                : 'bg-gray-800 border-gray-700'
            }`}>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Nested Loops</span>
              <span className={`text-sm font-bold ${complexity.has_nested_loops ? 'text-orange-400' : 'text-green-400'}`}>
                {complexity.has_nested_loops ? 'Yes ⚠' : 'No ✓'}
              </span>
            </div>
          </div>

          {/* Bottlenecks */}
          {complexity.bottlenecks.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">
                Bottlenecks
              </p>
              <ul className="space-y-1.5">
                {complexity.bottlenecks.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-orange-500/80 flex items-center justify-center text-xs font-bold text-white">
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
            <div className="mt-3 flex items-start gap-2 bg-purple-900/20 border border-purple-700/30 rounded-lg px-3 py-2">
              <span className="text-purple-400 flex-shrink-0">💡</span>
              <p className="text-sm text-gray-300 leading-relaxed">{complexity.optimization_hint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl">
        🤖
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-300">No review yet</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Paste your code in the editor, select a language, and click <span className="text-indigo-400">"Review Code"</span> to get AI feedback.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
      <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-800/50 flex items-center justify-center text-3xl">
        ❌
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-red-400">Review Failed</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">{message || 'An unexpected error occurred. Please try again.'}</p>
      </div>
    </div>
  );
}

export default function ReviewPanel({ review, isLoading, error, language, loadingMessage, reviewedAt }) {
  const [openSections, setOpenSections] = useState({
    issues: true,
    suggestions: true,
    complexity: true,
    improved_code: true,
    explanation: true,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const monacoLanguage = language === 'cpp' ? 'cpp' : language;

  const formattedTime = reviewedAt
    ? reviewedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  // Helper so we can render ReviewSections and insert ComplexityCard in between
  const renderSection = (section) => {
    const value = review[section.key];
    if (!value) return null;
    return (
      <ReviewSection
        key={section.key}
        title={section.title}
        icon={section.icon}
        colorClass={section.colorClass}
        items={section.key !== 'improved_code' ? (Array.isArray(value) ? value : [value]) : undefined}
        code={section.key === 'improved_code' ? value : undefined}
        language={monacoLanguage}
        isOpen={openSections[section.key]}
        onToggle={() => toggleSection(section.key)}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-semibold text-gray-200">Review Output</span>
          {formattedTime && (
            <span className="text-xs text-gray-500 font-mono ml-1">· last reviewed {formattedTime}</span>
          )}
        </div>
        {review && (
          <button
            onClick={() => setOpenSections({ issues: true, suggestions: true, complexity: true, improved_code: true, explanation: true })}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Expand All
          </button>
        )}
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 rounded-b-lg border border-t-0 border-gray-700 bg-gray-900/40">
        {isLoading && <LoadingSpinner message={loadingMessage} />}

        {!isLoading && error && <ErrorState message={error} />}

        {!isLoading && !error && !review && <EmptyState />}

        {!isLoading && !error && review && (
          <>
            {renderSection(SECTIONS[0])}  {/* issues */}
            {renderSection(SECTIONS[1])}  {/* suggestions */}

            {/* Complexity Analysis — inserted between suggestions and improved code */}
            {review.complexity && (
              <ComplexityCard
                complexity={review.complexity}
                isOpen={openSections.complexity}
                onToggle={() => toggleSection('complexity')}
              />
            )}

            {renderSection(SECTIONS[2])}  {/* improved_code */}
            {renderSection(SECTIONS[3])}  {/* explanation */}
          </>
        )}
      </div>
    </div>
  );
}
