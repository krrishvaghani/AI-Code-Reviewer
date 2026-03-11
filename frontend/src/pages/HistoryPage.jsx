import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchHistory, deleteHistory } from '../services/authApi';

const TYPE_ICON  = { code: '🔍', github: '🐙', chat: '💬' };
const TYPE_LABEL = { code: 'Code Review', github: 'GitHub', chat: 'Chat' };
const LANG_COLOR = {
  python:     'bg-blue-900/40  text-blue-300  border-blue-700/40',
  javascript: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  java:       'bg-orange-900/40 text-orange-300 border-orange-700/40',
  cpp:        'bg-purple-900/40 text-purple-300 border-purple-700/40',
  multi:      'bg-gray-700/40  text-gray-300  border-gray-600/40',
};

function timeSince(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = Date.now();
  const s = Math.floor((now - d.getTime()) / 1000);
  if (s < 60)     return 'just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function HistoryPage() {
  const { token } = useAuth();
  const [items,    setItems]    = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null); // id being deleted

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchHistory(token);
      setItems(data);
    } catch (err) {
      setError(err.userMessage || 'Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteHistory(token, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // silently ignore
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Review History</h1>
            <p className="text-sm text-gray-500 mt-0.5">All your past AI code reviews</p>
          </div>
          <button
            onClick={load}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading history…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-sm text-red-300">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-base font-semibold text-gray-300 mb-2">No reviews yet</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Run your first code review — it will appear here automatically.
            </p>
          </div>
        )}

        {/* History list */}
        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => {
              const langClass = LANG_COLOR[item.language] || LANG_COLOR.multi;
              return (
                <div
                  key={item.id}
                  className="group flex items-start gap-4 p-4 bg-gray-900/60 border border-gray-700/60 rounded-xl hover:border-gray-600/80 transition-all"
                >
                  {/* Type icon */}
                  <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                    {TYPE_ICON[item.review_type] || '📋'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${langClass}`}>
                            {item.language}
                          </span>
                          <span className="text-xs text-gray-600">
                            {TYPE_LABEL[item.review_type] || 'Review'}
                          </span>
                          <span className="text-xs text-gray-600">·</span>
                          <span className="text-xs text-gray-600">{timeSince(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded flex-shrink-0"
                        title="Delete this review"
                      >
                        {deleting === item.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Code snippet preview */}
                    {item.code_snippet && (
                      <pre className="mt-2 text-xs text-gray-500 font-mono bg-gray-800/50 rounded px-2.5 py-2 overflow-x-auto whitespace-pre-wrap line-clamp-2 border border-gray-700/40">
                        {item.code_snippet}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
