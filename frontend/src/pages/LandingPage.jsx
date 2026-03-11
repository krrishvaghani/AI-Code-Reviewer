import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🔍',
    title: 'Instant Code Review',
    desc: 'Paste code in any language and get AI-powered feedback on bugs, performance, and best practices in seconds.',
    color: 'indigo',
  },
  {
    icon: '💬',
    title: 'Chat with Your Code',
    desc: 'Ask questions about your code in natural language. Get step-by-step explanations, test ideas, and more.',
    color: 'blue',
  },
  {
    icon: '🐙',
    title: 'GitHub Repo Analysis',
    desc: 'Drop any public GitHub repository URL and receive a full quality analysis with per-file feedback.',
    color: 'purple',
  },
  {
    icon: '📊',
    title: 'Complexity Analysis',
    desc: "Get Big-O time and space complexity, detect bottlenecks, and receive targeted optimization hints.",
    color: 'green',
  },
  {
    icon: '🤖',
    title: 'PR Auto-Reviewer',
    desc: 'Connect GitHub webhooks to automatically review every pull request and post AI comments.',
    color: 'yellow',
  },
  {
    icon: '📚',
    title: 'Review History',
    desc: 'Every review is saved automatically. Browse your history, revisit previous feedback anytime.',
    color: 'pink',
  },
];

const STEPS = [
  { n: '01', title: 'Paste or Upload Code', desc: 'Paste source code or upload a .py, .js, .java, or .cpp file directly into the editor.' },
  { n: '02', title: 'AI Analyses Instantly', desc: 'Our AI model scans for issues, security risks, performance bottlenecks, and improvement opportunities.' },
  { n: '03', title: 'Get Actionable Feedback', desc: 'Receive structured results — issues, suggestions, improved code, and a plain-English explanation.' },
];

const colorMap = {
  indigo:  { card: 'border-indigo-700/40  bg-indigo-900/10', icon: 'bg-indigo-600/20 text-indigo-400' },
  blue:    { card: 'border-blue-700/40    bg-blue-900/10',   icon: 'bg-blue-600/20   text-blue-400'   },
  purple:  { card: 'border-purple-700/40  bg-purple-900/10', icon: 'bg-purple-600/20 text-purple-400' },
  green:   { card: 'border-green-700/40   bg-green-900/10',  icon: 'bg-green-600/20  text-green-400'  },
  yellow:  { card: 'border-yellow-700/40  bg-yellow-900/10', icon: 'bg-yellow-600/20 text-yellow-400' },
  pink:    { card: 'border-pink-700/40    bg-pink-900/10',   icon: 'bg-pink-600/20   text-pink-400'   },
};

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => navigate(isAuthenticated ? '/dashboard/review' : '/signup');

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">

      {/* ===== NAV ===== */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/80 bg-[#0a0c14]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight">AI Code Reviewer</span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard/review" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-900/40 border border-indigo-700/40 rounded-full text-xs font-medium text-indigo-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Powered by GPT-4o and Gemini 2.0
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Code Reviews at the{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Speed of AI
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Detect bugs, optimise performance, understand complexity — all powered by
            large language models. Works with Python, JavaScript, Java, C++, and more.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="px-7 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition-all shadow-xl shadow-indigo-900/40 hover:shadow-indigo-900/60"
            >
              Start Reviewing for Free →
            </button>
            <a
              href="https://github.com/krrishvaghani/AI-Code-Reviewer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-gray-300 border border-gray-700 hover:border-gray-500 hover:text-white rounded-xl transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {[['6+', 'Languages'], ['5', 'AI Tools'], ['100%', 'Free & OSS']].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-bold text-white">{v}</div>
                <div className="text-xs text-gray-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-20 px-6 border-t border-gray-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything you need to ship better code</h2>
            <p className="text-gray-400">A complete AI-powered toolkit for developers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const c = colorMap[f.color];
              return (
                <div key={f.title} className={`p-5 rounded-xl border ${c.card} hover:border-opacity-80 transition-all`}>
                  <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center text-xl mb-4`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-6 bg-gray-900/30 border-t border-gray-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-gray-400">Three steps from code to insight.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-700/40 text-indigo-300 font-mono font-bold text-sm flex items-center justify-center mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 px-6 text-center border-t border-gray-800/60">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to write better code?</h2>
          <p className="text-gray-400 mb-8">Free to use. No credit card required.</p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-xl shadow-indigo-900/40"
          >
            Get Started for Free →
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-800/60 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
                <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 0 1 .527.921l-4.5 16.5a.75.75 0 0 1-1.448-.394l4.5-16.5a.75.75 0 0 1 .921-.527ZM16.72 6.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 0 1 0-1.06Zm-9.44 0a.75.75 0 0 1 0 1.06L2.56 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L.97 12.53a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </div>
            <span>AI Code Reviewer</span>
          </div>
          <p>© {new Date().getFullYear()} AI Code Reviewer. Open source under MIT.</p>
        </div>
      </footer>
    </div>
  );
}
