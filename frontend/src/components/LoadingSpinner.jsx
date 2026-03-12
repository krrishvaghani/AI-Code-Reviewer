export default function LoadingSpinner({ message = 'Analyzing your code…' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-6 px-8 py-12 select-none">

      {/* ── Concentric ring spinner ───────────────────────────────── */}
      <div className="relative w-14 h-14">
        {/* Static track */}
        <div className="absolute inset-0 rounded-full border-[3px] border-white/[0.06]" />
        {/* Outer spinning arc */}
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-500 animate-spin"
          style={{ animationDuration: '1.1s', animationTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Inner counter-spinning arc */}
        <div
          className="absolute inset-[5px] rounded-full border-[3px] border-transparent border-t-violet-400 animate-spin"
          style={{ animationDuration: '0.75s', animationDirection: 'reverse', animationTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </div>
      </div>

      {/* ── Message ──────────────────────────────────────────────── */}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-200 transition-all duration-500 mb-1">{message}</p>
        <p className="text-xs text-gray-600">Powered by Gemini · OpenAI</p>
      </div>

      {/* ── Skeleton preview cards ────────────────────────────────── */}
      <div className="w-full max-w-sm space-y-2 mt-2">
        {[80, 60, 70, 50].map((w, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <div className="skeleton w-7 h-7 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className={`skeleton h-2.5 rounded`} style={{ width: `${w}%` }} />
              <div className="skeleton h-2 rounded" style={{ width: `${w * 0.6}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Thinking dots ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 mt-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-500/60"
            style={{
              animation: 'thinking-pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
