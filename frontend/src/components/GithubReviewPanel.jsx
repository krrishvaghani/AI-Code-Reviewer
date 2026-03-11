import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const QUALITY_COLORS = {
  Excellent:          { badge: 'bg-green-900/60 text-green-300 border-green-700/50', dot: 'bg-green-500' },
  Good:               { badge: 'bg-blue-900/60  text-blue-300  border-blue-700/50',  dot: 'bg-blue-500'  },
  'Needs Improvement':{ badge: 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50', dot: 'bg-yellow-500' },
  Poor:               { badge: 'bg-red-900/60   text-red-300   border-red-700/50',   dot: 'bg-red-500'   },
};

function QualityBadge({ quality }) {
  const colors = QUALITY_COLORS[quality] || QUALITY_COLORS['Needs Improvement'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${colors.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {quality}
    </span>
  );
}

function IssueList({ title, icon, items, colorClass }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${colorClass}`}>{title}</span>
        <span className="text-xs text-gray-600">({items.length})</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
            <span className="mt-0.5 flex-shrink-0 text-gray-600">•</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FileCard({ file }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/60 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-indigo-400 font-mono text-xs">📄</span>
          <span className="text-sm font-medium text-gray-200 truncate">{file.path}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
            {file.language}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {file.issues.length > 0 && (
            <span className="text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded-full">
              {file.issues.length} issue{file.issues.length !== 1 ? 's' : ''}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-700/50 space-y-4 mt-2">
          <IssueList title="Issues"      icon="🐛" items={file.issues}      colorClass="text-red-400" />
          <IssueList title="Suggestions" icon="⚡" items={file.suggestions} colorClass="text-yellow-400" />
          {file.issues.length === 0 && file.suggestions.length === 0 && (
            <p className="text-xs text-gray-500">No specific issues found in this file.</p>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl">🐙</div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-300">No review yet</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Paste a public GitHub repository URL above and click <span className="text-indigo-400">"Analyze Repo"</span> to get AI feedback.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
      <div className="w-16 h-16 rounded-2xl bg-red-900/30 border border-red-800/50 flex items-center justify-center text-3xl">❌</div>
      <div className="text-center">
        <p className="text-sm font-medium text-red-400">Review Failed</p>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">{message}</p>
      </div>
    </div>
  );
}

export default function GithubReviewPanel({ result, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full border border-gray-700 rounded-lg bg-gray-900/40">
        <LoadingSpinner message="Fetching and analyzing repository…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full border border-gray-700 rounded-lg bg-gray-900/40">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col h-full border border-gray-700 rounded-lg bg-gray-900/40">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto rounded-lg border border-gray-700 bg-gray-900/40">
      {/* Repository header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-indigo-400">🐙</span>
          <span className="text-sm font-semibold text-white font-mono truncate">{result.repo_name}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">{result.files_analyzed} files analyzed</span>
        </div>
        <QualityBadge quality={result.overall_quality} />
      </div>

      <div className="p-4 space-y-5">
        {/* Structure summary */}
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>📋</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Repository Overview</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{result.structure_summary}</p>
        </div>

        {/* Top issues + suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 space-y-2">
            <IssueList title="Top Issues" icon="🐛" items={result.top_issues} colorClass="text-red-400" />
          </div>
          <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-4 space-y-2">
            <IssueList title="Top Suggestions" icon="⚡" items={result.top_suggestions} colorClass="text-yellow-400" />
          </div>
        </div>

        {/* Per-file reviews */}
        {result.file_reviews.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span>📁</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                File Reviews ({result.file_reviews.length})
              </span>
            </div>
            <div className="space-y-2">
              {result.file_reviews.map((file) => (
                <FileCard key={file.path} file={file} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
