import GithubReviewPanel from '../components/GithubReviewPanel';
import { useGithubReview } from '../hooks/useGithubReview';
import { useAuth } from '../context/AuthContext';
import { saveHistory } from '../services/authApi';

export default function GithubReviewPage() {
  const { token, isAuthenticated } = useAuth();
  const {
    repoUrl, setRepoUrl,
    result, isLoading, error,
    handleReview, handleClear,
  } = useGithubReview();

  const handleReviewAndSave = async () => {
    const res = await handleReview();
    if (res && isAuthenticated && token) {
      saveHistory(token, {
        language: 'multi',
        code: repoUrl,
        result: res,
        review_type: 'github',
        title: repoUrl.replace('https://github.com/', '').slice(0, 60),
      }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-900/80 border-b border-gray-700/80 px-4 py-3 flex-shrink-0">
        <span className="text-lg flex-shrink-0">🐙</span>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleReviewAndSave()}
          placeholder="https://github.com/owner/repository"
          disabled={isLoading}
          className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors min-w-[200px]"
        />
        <div className="flex gap-2">
          {result && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-600/80 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleReviewAndSave}
            disabled={isLoading || !repoUrl.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing…
              </>
            ) : '🔍 Analyze Repo'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <GithubReviewPanel result={result} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
