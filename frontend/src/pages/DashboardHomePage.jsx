import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchStats } from '../services/authApi';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gradeFromScore(score) {
  if (score >= 90) return { letter: 'A', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30'  };
  if (score >= 75) return { letter: 'B', color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/30'   };
  if (score >= 60) return { letter: 'C', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30'};
  if (score >= 40) return { letter: 'D', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30'};
  return               { letter: 'F', color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30'    };
}

const LANG_COLORS = {
  python:     { bar: 'bg-blue-500',    pill: 'bg-blue-500/20 text-blue-300 border-blue-500/30'    },
  javascript: { bar: 'bg-yellow-400',  pill: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'},
  java:       { bar: 'bg-orange-500',  pill: 'bg-orange-500/20 text-orange-300 border-orange-500/30'},
  cpp:        { bar: 'bg-purple-500',  pill: 'bg-purple-500/20 text-purple-300 border-purple-500/30'},
};
const DEFAULT_LANG = { bar: 'bg-gray-500', pill: 'bg-gray-700 text-gray-300 border-gray-600' };

function langStyle(lang) {
  return LANG_COLORS[lang?.toLowerCase()] ?? DEFAULT_LANG;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, sub, accent = 'indigo', loading }) {
  const accentMap = {
    indigo: 'from-indigo-500/10 border-indigo-500/20',
    red:    'from-red-500/10 border-red-500/20',
    rose:   'from-rose-500/10 border-rose-500/20',
    orange: 'from-orange-500/10 border-orange-500/20',
    green:  'from-green-500/10 border-green-500/20',
  };
  const iconBgMap = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    red:    'bg-red-500/20 text-red-400',
    rose:   'bg-rose-500/20 text-rose-400',
    orange: 'bg-orange-500/20 text-orange-400',
    green:  'bg-green-500/20 text-green-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accentMap[accent]} to-transparent p-5 transition-all hover:scale-[1.01]`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${iconBgMap[accent]}`}>
          {icon}
        </div>
        {sub && (
          <span className="text-xs text-gray-600 font-medium">{sub}</span>
        )}
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-16 bg-gray-700/50 rounded-lg animate-pulse" />
        ) : (
          <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
        )}
        <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline activity chart (pure SVG, no libraries)
// ---------------------------------------------------------------------------

function ActivityChart({ data, loading }) {
  if (loading) {
    return (
      <div className="h-24 flex items-end gap-1.5 px-1">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-t bg-gray-700/40 animate-pulse" style={{ height: `${Math.random() * 60 + 20}%` }} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-20" title="Reviews per day (last 14 days)">
      {data.map((d, i) => {
        const pct = d.count === 0 ? 4 : Math.max(8, (d.count / maxCount) * 100);
        const isToday = i === data.length - 1;
        return (
          <div key={d.date} className="group relative flex-1 flex flex-col items-center justify-end h-full">
            <div
              className={`w-full rounded-t transition-all duration-500 ${
                d.count > 0
                  ? isToday
                    ? 'bg-indigo-400'
                    : 'bg-indigo-600/70 group-hover:bg-indigo-500'
                  : 'bg-gray-700/30 group-hover:bg-gray-700/60'
              }`}
              style={{ height: `${pct}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs whitespace-nowrap">
                <span className="text-white font-semibold">{d.count}</span>
                <span className="text-gray-400 ml-1">{d.date.slice(5)}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-gray-900 border-r border-b border-gray-700 rotate-45 -mt-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Language breakdown bar
// ---------------------------------------------------------------------------

function LanguageBreakdown({ languages, loading }) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[80, 55, 35, 20].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-20 h-3.5 bg-gray-700/50 rounded animate-pulse" />
            <div className="flex-1 h-2 bg-gray-700/50 rounded-full animate-pulse" />
            <div className="w-8 h-3.5 bg-gray-700/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!languages || languages.length === 0) {
    return <p className="text-sm text-gray-600 py-4 text-center">No language data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {languages.map((l) => {
        const style = langStyle(l.language);
        return (
          <div key={l.language} className="flex items-center gap-3 group">
            <span className={`text-xs font-mono px-2 py-0.5 rounded border capitalize min-w-[84px] text-center ${style.pill}`}>
              {l.language}
            </span>
            <div className="flex-1 h-2 bg-gray-700/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${style.bar}`}
                style={{ width: `${l.percentage}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-gray-500 w-10 text-right">
              {l.count} <span className="text-gray-700">({l.percentage}%)</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quality score ring (SVG donut)
// ---------------------------------------------------------------------------

function QualityRing({ score, loading }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = loading ? 0 : (score / 100) * circumference;
  const grade = gradeFromScore(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor"
            strokeWidth="10" className="text-gray-700/50" />
          {/* Arc */}
          <circle cx="50" cy="50" r={radius} fill="none"
            stroke="url(#qualityGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference : circumference - dash}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="qualityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <div className="w-10 h-5 bg-gray-700/50 rounded animate-pulse" />
          ) : (
            <>
              <span className="text-xl font-bold text-white tabular-nums leading-none">{score}</span>
              <span className="text-[10px] text-gray-500 mt-0.5">/100</span>
            </>
          )}
        </div>
      </div>
      {!loading && (
        <span className={`text-sm font-bold px-3 py-0.5 rounded-full border ${grade.bg} ${grade.color}`}>
          Grade {grade.letter}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick-action cards
// ---------------------------------------------------------------------------

function QuickAction({ icon, label, desc, to, color }) {
  const navigate = useNavigate();
  const colors = {
    indigo: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
    orange: 'hover:border-orange-500/50 hover:bg-orange-500/5',
    violet: 'hover:border-violet-500/50 hover:bg-violet-500/5',
    green:  'hover:border-green-500/50 hover:bg-green-500/5',
  };
  const iconColors = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    orange: 'bg-orange-500/20 text-orange-400',
    violet: 'bg-violet-500/20 text-violet-400',
    green:  'bg-green-500/20 text-green-400',
  };
  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full text-left rounded-xl border border-gray-700/40 p-4 transition-all ${colors[color]}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-2.5 ${iconColors[color]}`}>
        {icon}
      </div>
      <div className="text-sm font-semibold text-gray-200">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DashboardHomePage() {
  const { token, user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchStats(token);
      setStats(data);
    } catch (err) {
      setError(err.userMessage || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's an overview of your code review activity.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-sm text-red-300">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="🔍" label="Total Reviews" accent="indigo"
            value={stats?.total_reviews ?? 0}
            sub={stats?.streak_days ? `🔥 ${stats.streak_days}d streak` : undefined}
            loading={loading}
          />
          <StatCard
            icon="🐛" label="Bugs Detected" accent="red"
            value={stats?.total_bugs ?? 0}
            sub={stats?.total_reviews ? `${((stats.total_bugs / stats.total_reviews)).toFixed(1)} avg/review` : undefined}
            loading={loading}
          />
          <StatCard
            icon="🔒" label="Security Issues" accent="rose"
            value={stats?.total_security_issues ?? 0}
            loading={loading}
          />
          <StatCard
            icon="⏱" label="Perf Issues" accent="orange"
            value={stats?.total_performance_issues ?? 0}
            loading={loading}
          />
        </div>

        {/* ── Quality + Activity row ───────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* Quality score */}
          <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5 flex flex-col items-center justify-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 self-start w-full">
              Avg Code Quality
            </h2>
            <QualityRing score={stats?.avg_quality_score ?? 100} loading={loading} />
            {!loading && stats && (
              <p className="text-[11px] text-gray-600 text-center max-w-[140px] leading-relaxed">
                Based on {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}.
                Lower issues = higher score.
              </p>
            )}
          </div>

          {/* Activity chart */}
          <div className="md:col-span-2 rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Review Activity
              </h2>
              <span className="text-xs text-gray-600">Last 14 days</span>
            </div>
            <ActivityChart data={stats?.activity} loading={loading} />
            {/* X-axis labels */}
            {!loading && stats?.activity && (
              <div className="flex justify-between mt-1.5 px-0.5">
                {[0, 6, 13].map((i) => (
                  <span key={i} className="text-[10px] text-gray-700">
                    {stats.activity[i]?.date?.slice(5)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Languages + Quick actions row ────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Language breakdown */}
          <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Languages Used
              </h2>
              {!loading && stats && (
                <span className="text-xs text-gray-600 tabular-nums">
                  {stats.languages.length} language{stats.languages.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <LanguageBreakdown languages={stats?.languages} loading={loading} />
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              <QuickAction
                icon="🔍" label="Review Code" color="indigo"
                desc="Run an AI review on a new snippet"
                to="/dashboard/review"
              />
              <QuickAction
                icon="💬" label="Chat with Code" color="orange"
                desc="Ask questions about your code"
                to="/dashboard/chat"
              />
              <QuickAction
                icon="🐙" label="GitHub Review" color="violet"
                desc="Analyse an entire repository"
                to="/dashboard/github"
              />
              <QuickAction
                icon="📚" label="View History" color="green"
                desc="See all past code reviews"
                to="/dashboard/history"
              />
            </div>
          </div>
        </div>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && !error && stats?.total_reviews === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-700/60 p-10 text-center">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm font-semibold text-gray-300">No reviews yet</p>
            <p className="text-xs text-gray-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Start by reviewing your first code snippet. Analytics will appear here once you have some history.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
