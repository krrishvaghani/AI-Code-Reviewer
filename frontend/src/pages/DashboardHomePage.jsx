import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchStats } from '../services/authApi';
import { BarChart3, Bug, Shield, Zap, Code2, MessageSquare, Github, Clock, RefreshCw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
function gradeFromScore(score) {
  if (score >= 90) return { letter: 'A', color: 'text-green-500' };
  if (score >= 75) return { letter: 'B', color: 'text-teal-500'  };
  if (score >= 60) return { letter: 'C', color: 'text-yellow-500'};
  if (score >= 40) return { letter: 'D', color: 'text-orange-500'};
  return               { letter: 'F', color: 'text-red-500'   };
}

const LANG_BAR = { python: 'bg-blue-500', javascript: 'bg-yellow-400', java: 'bg-orange-500', cpp: 'bg-purple-500' };

// ---------------------------------------------------------------------------
function StatCard({ Icon, label, value, sub, isDark, loading, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`rounded-xl border p-4 transition-colors
        ${isDark ? 'bg-[#111] border-white/[0.08] hover:border-white/[0.15]' : 'bg-white border-gray-200 hover:border-gray-300'}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-gray-50'}`}>
          <Icon size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
        </div>
        {sub && <span className={`text-[10px] font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{sub}</span>}
      </div>
      <div className="mt-3">
        {loading
          ? <div className={`h-6 w-14 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
          : <div className={`text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
        }
        <div className={`text-[10px] mt-0.5 font-medium uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
function ActivityChart({ data, loading, isDark }) {
  if (loading) return (
    <div className="h-20 flex items-end gap-1 px-1">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className={`flex-1 rounded-t animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} style={{ height: `${Math.random() * 60 + 20}%` }} />
      ))}
    </div>
  );
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => {
        const pct = d.count === 0 ? 4 : Math.max(8, (d.count / maxCount) * 100);
        return (
          <motion.div
            key={d.date}
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ delay: i * 0.03, duration: 0.4, ease: 'easeOut' }}
            className={`group relative flex-1 rounded-sm cursor-default ${
              d.count > 0
                ? (i === data.length-1 ? (isDark ? 'bg-indigo-500' : 'bg-indigo-600') : (isDark ? 'bg-indigo-500/50 hover:bg-indigo-500/80' : 'bg-indigo-400 hover:bg-indigo-500'))
                : (isDark ? 'bg-white/[0.06] hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200')
            }`}
          >
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex z-10 pointer-events-none">
              <div className={`rounded-md px-2 py-1 text-[10px] whitespace-nowrap border ${isDark ? 'bg-[#111] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'}`}>
                <span className="font-semibold">{d.count}</span> <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{d.date.slice(5)}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
function LanguageBreakdown({ languages, loading, isDark }) {
  if (loading) return (
    <div className="space-y-2.5">
      {[80, 55, 35].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-16 h-3 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
          <div className={`flex-1 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
        </div>
      ))}
    </div>
  );
  if (!languages || languages.length === 0) return <p className={`text-xs py-4 text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No data yet</p>;
  return (
    <div className="space-y-3">
      {languages.map(l => (
        <div key={l.language} className="flex items-center gap-3">
          <span className={`text-[10px] font-mono uppercase tracking-wide min-w-[72px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{l.language}</span>
          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${l.percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${LANG_BAR[l.language?.toLowerCase()] ?? 'bg-gray-500'}`}
            />
          </div>
          <span className={`text-[10px] tabular-nums w-10 text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{l.count}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
function QualityRing({ score, loading, isDark }) {
  const radius = 42, circumference = 2 * Math.PI * radius;
  const dash = loading ? 0 : (score / 100) * circumference;
  const grade = gradeFromScore(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="7" className={isDark ? 'stroke-white/10' : 'stroke-gray-100'} />
          <motion.circle
            cx="50" cy="50" r={radius} fill="none"
            strokeWidth="7" strokeLinecap="round"
            className={isDark ? 'stroke-indigo-500' : 'stroke-indigo-600'}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: loading ? circumference : circumference - dash }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? <div className={`w-8 h-4 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} /> : (
            <>
              <span className={`text-lg font-bold tabular-nums leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{score}</span>
              <span className={`text-[9px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/100</span>
            </>
          )}
        </div>
      </div>
      {!loading && <span className={`text-xs font-bold ${grade.color}`}>Grade {grade.letter}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
function QuickAction({ Icon, label, desc, to, isDark }) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(to)}
      className={`w-full text-left rounded-xl border p-4 transition-colors
        ${isDark ? 'border-white/[0.08] hover:border-indigo-500/40 hover:bg-indigo-500/[0.03]' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-50'}`}>
        <Icon size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
      </div>
      <div className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{label}</div>
      <div className={`text-[10px] mt-0.5 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
export default function DashboardHomePage() {
  const { isDark } = useTheme();
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try { setStats(await fetchStats(token)); }
    catch (err) { setError(err.userMessage || 'Failed to load analytics.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className={`h-full overflow-y-auto ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{greeting()}, {firstName} 👋</h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Here's an overview of your code review activity.</p>
          </div>
          <button onClick={load} disabled={loading} className={`flex items-center gap-1.5 text-xs transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div className={`flex items-center gap-3 p-4 border rounded-lg text-sm ${isDark ? 'border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard Icon={BarChart3} label="Total Reviews" value={stats?.total_reviews ?? 0} sub={stats?.streak_days ? `🔥 ${stats.streak_days}d` : undefined} loading={loading} isDark={isDark} delay={0} />
          <StatCard Icon={Bug} label="Bugs Detected" value={stats?.total_bugs ?? 0} loading={loading} isDark={isDark} delay={0.05} />
          <StatCard Icon={Shield} label="Security Issues" value={stats?.total_security_issues ?? 0} loading={loading} isDark={isDark} delay={0.1} />
          <StatCard Icon={Zap} label="Perf Issues" value={stats?.total_performance_issues ?? 0} loading={loading} isDark={isDark} delay={0.15} />
        </div>

        {/* Quality + Activity */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className={`rounded-xl border p-5 flex flex-col items-center justify-center gap-2 ${isDark ? 'bg-[#111] border-white/[0.08]' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-[10px] font-semibold uppercase tracking-widest self-start w-full ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Avg Quality</h2>
            <QualityRing score={stats?.avg_quality_score ?? 100} loading={loading} isDark={isDark} />
          </div>
          <div className={`md:col-span-2 rounded-xl border p-5 ${isDark ? 'bg-[#111] border-white/[0.08]' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Activity</h2>
              <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Last 14 days</span>
            </div>
            <ActivityChart data={stats?.activity} loading={loading} isDark={isDark} />
          </div>
        </div>

        {/* Languages + Quick actions */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className={`rounded-xl border p-5 ${isDark ? 'bg-[#111] border-white/[0.08]' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-[10px] font-semibold uppercase tracking-widest mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Languages</h2>
            <LanguageBreakdown languages={stats?.languages} loading={loading} isDark={isDark} />
          </div>
          <div className={`rounded-xl border p-5 ${isDark ? 'bg-[#111] border-white/[0.08]' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-[10px] font-semibold uppercase tracking-widest mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction Icon={Code2} label="Review Code" desc="AI review on a snippet" to="/dashboard/review" isDark={isDark} />
              <QuickAction Icon={MessageSquare} label="Chat with Code" desc="Ask questions" to="/dashboard/chat" isDark={isDark} />
              <QuickAction Icon={Github} label="GitHub Review" desc="Analyse a repository" to="/dashboard/github" isDark={isDark} />
              <QuickAction Icon={Clock} label="View History" desc="Past code reviews" to="/dashboard/history" isDark={isDark} />
            </div>
          </div>
        </div>

        {!loading && !error && stats?.total_reviews === 0 && (
          <div className={`rounded-xl border border-dashed p-10 text-center ${isDark ? 'border-white/10' : 'border-gray-300'}`}>
            <Trophy size={28} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No reviews yet</p>
            <p className={`text-xs mt-1.5 max-w-xs mx-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Start by reviewing your first code snippet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
