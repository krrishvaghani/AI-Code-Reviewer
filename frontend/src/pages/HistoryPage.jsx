import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchHistory, deleteHistory } from '../services/authApi';
import { Clock, Code2, Github, MessageSquare, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_ICON  = { code: Code2, github: Github, chat: MessageSquare };
const TYPE_LABEL = { code: 'Code Review', github: 'GitHub', chat: 'Chat' };

function timeSince(dateStr) {
  if (!dateStr) return '';
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)     return 'just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function HistoryPage() {
  const { isDark } = useTheme();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true); setError('');
    try { setItems(await fetchHistory(token)); }
    catch (err) { setError(err.userMessage || 'Failed to load history.'); }
    finally { setIsLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await deleteHistory(token, id); setItems(prev => prev.filter(i => i.id !== id)); }
    catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  return (
    <div className={`h-full overflow-y-auto ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Review History</h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>All your past AI code reviews</p>
          </div>
          <button onClick={load} disabled={isLoading} className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-white/20 border-t-indigo-500' : 'border-gray-200 border-t-indigo-600'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className={`p-4 border rounded-lg text-sm ${isDark ? 'border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>{error}</div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 opacity-70">
            <Clock size={28} className={`mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No reviews yet</h3>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Run your first review — it'll appear here.</p>
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, i) => {
              const Icon = TYPE_ICON[item.review_type] || Code2;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`group flex items-start gap-3.5 p-4 border rounded-xl transition-colors
                    ${isDark ? 'bg-[#111] border-white/[0.08] hover:border-white/[0.15]' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-50'}`}>
                    <Icon size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] font-mono uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.language}</span>
                          <span className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>·</span>
                          <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{TYPE_LABEL[item.review_type] || 'Review'}</span>
                          <span className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>·</span>
                          <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{timeSince(item.created_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all ${isDark ? 'text-gray-600 hover:text-red-400 hover:bg-white/[0.04]' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
                      >
                        {deleting === item.id
                          ? <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin border-current border-t-transparent" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                    {item.code_snippet && (
                      <pre className={`mt-2 text-xs font-mono rounded-lg px-2.5 py-2 overflow-x-auto whitespace-pre-wrap line-clamp-2 border
                        ${isDark ? 'bg-white/[0.02] border-white/[0.06] text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                        {item.code_snippet}
                      </pre>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
