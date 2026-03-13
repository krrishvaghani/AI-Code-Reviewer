import GithubReviewPanel from '../components/GithubReviewPanel';
import { useGithubReview } from '../hooks/useGithubReview';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveHistory } from '../services/authApi';
import { Github, Loader2, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GithubReviewPage() {
  const { isDark } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const { repoUrl, setRepoUrl, result, isLoading, error, handleReview, handleClear } = useGithubReview();

  const handleReviewAndSave = async () => {
    const res = await handleReview();
    if (res && isAuthenticated && token) {
      saveHistory(token, { language: 'multi', code: repoUrl, result: res, review_type: 'github', title: repoUrl.replace('https://github.com/', '').slice(0, 60), }).catch(() => {});
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-2.5 flex-shrink-0
        ${isDark ? 'bg-[#0a0a0a] border-white/[0.08]' : 'bg-white border-gray-200'}`}>
        <Github size={18} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
        <input
          type="url" value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleReviewAndSave()}
          placeholder="https://github.com/owner/repository"
          disabled={isLoading}
          className={`flex-1 border rounded-lg px-3 py-1.5 text-sm placeholder-gray-500 focus:outline-none disabled:opacity-50 transition-colors min-w-[200px]
            ${isDark ? 'bg-[#111] border-white/[0.08] text-gray-200 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500'}`}
        />
        <div className="flex gap-2">
          {result && (
            <button onClick={handleClear} disabled={isLoading} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50
              ${isDark ? 'text-gray-400 border-white/[0.08] hover:bg-white/[0.04]' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              <X size={14} /> Clear
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReviewAndSave}
            disabled={isLoading || !repoUrl.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-900/20"
          >
            {isLoading ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <><Search size={14} /> Analyze Repo</>}
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <GithubReviewPanel result={result} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
