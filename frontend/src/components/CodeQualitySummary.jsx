import { useTheme } from '../context/ThemeContext';
import { Bug, Shield, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CodeQualitySummary({ review }) {
  const { isDark } = useTheme();
  if (!review?.ai_review) return null;

  const r = review.ai_review;
  const issueCount = r.issues?.length || 0;
  const secCount   = r.security_issues?.length || 0;
  const perfCount  = r.performance_issues?.length || 0;
  const sugCount   = r.suggestions?.length || 0;
  const total      = issueCount + secCount + perfCount + sugCount;
  const score      = Math.max(0, Math.round(100 - total * 8));

  const badges = [
    { label: 'Issues', count: issueCount, icon: Bug,              color: isDark ? 'text-red-400'    : 'text-red-600' },
    { label: 'Security', count: secCount,  icon: Shield,           color: isDark ? 'text-rose-400'   : 'text-rose-600' },
    { label: 'Perf',   count: perfCount, icon: Zap,              color: isDark ? 'text-yellow-400' : 'text-yellow-600' },
    { label: 'Tips',   count: sugCount,  icon: AlertTriangle,    color: isDark ? 'text-green-400'  : 'text-green-600' },
  ];

  return (
    <div className={`mb-6 p-5 rounded-xl border flex flex-wrap items-center gap-5 transition-colors shadow-sm
      ${isDark ? 'bg-[#111115] border-white/[0.06] shadow-black/20' : 'bg-white border-gray-100 shadow-gray-100/40'}`}>
      {/* Score */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${score >= 70 ? (isDark ? 'text-green-400' : 'text-green-600') : score >= 40 ? (isDark ? 'text-yellow-400' : 'text-yellow-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
          <CheckCircle size={16} />
          <span className="text-sm font-bold tabular-nums">{score}%</span>
        </div>
        <div className={`flex-1 h-1.5 min-w-[80px] max-w-[120px] rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

      {/* Badges */}
      {badges.map(b => {
        const Icon = b.icon;
        return (
          <div key={b.label} className="flex items-center gap-1.5">
            <Icon size={13} className={b.count > 0 ? b.color : (isDark ? 'text-gray-600' : 'text-gray-300')} />
            <span className={`text-xs font-medium tabular-nums ${b.count > 0 ? (isDark ? 'text-gray-200' : 'text-gray-700') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>
              {b.count}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}
