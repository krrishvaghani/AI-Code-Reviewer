export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
      {/* Animated rings */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-300 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }}></div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-300">Analyzing your code...</p>
        <p className="text-xs text-gray-500 mt-1">Gemini AI is reviewing for bugs, optimizations, and improvements</p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
