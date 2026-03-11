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
  const [openSections, setOpenSections] = useState({ issues: true, suggestions: true, improved_code: true, explanation: true });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const monacoLanguage = language === 'cpp' ? 'cpp' : language;

  const formattedTime = reviewedAt
    ? reviewedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

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
            onClick={() => setOpenSections({ issues: true, suggestions: true, improved_code: true, explanation: true })}
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

        {!isLoading && !error && review && SECTIONS.map((section) => {
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
        })}
      </div>
    </div>
  );
}
