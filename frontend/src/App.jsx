import { useState } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import LanguageSelector from './components/LanguageSelector';
import ReviewPanel from './components/ReviewPanel';
import ChatPanel from './components/ChatPanel';
import GithubReviewPanel from './components/GithubReviewPanel';
import TabBar from './components/TabBar';
import StatusBar from './components/StatusBar';
import LoadingSpinner from './components/LoadingSpinner';
import { useCodeReview } from './hooks/useCodeReview';
import { useChat } from './hooks/useChat';
import { useGithubReview } from './hooks/useGithubReview';

function App() {
  const [activeTab, setActiveTab] = useState('review');

  // --- Code Review tab state ---
  const {
    language,
    code,
    review,
    isLoading,
    error,
    loadingMessage,
    reviewedAt,
    setCode,
    handleLanguageChange,
    handleReview,
    handleClear,
  } = useCodeReview();

  // --- Chat tab state ---
  const { messages, isLoading: chatLoading, error: chatError, sendMessage, clearChat } = useChat();

  // --- GitHub Review tab state ---
  const {
    repoUrl,
    setRepoUrl,
    result: githubResult,
    isLoading: githubLoading,
    error: githubError,
    handleReview: handleGithubReview,
    handleClear: handleGithubClear,
  } = useGithubReview();

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      {/* Top header bar */}
      <Header />

      {/* Tabs */}
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {/* ================================================================== */}
      {/* Tab: Code Review                                                    */}
      {/* ================================================================== */}
      {activeTab === 'review' && (
        <main className="flex flex-col flex-1 px-4 py-4 gap-4 md:px-6 lg:px-8">
          {/* Toolbar row */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
            <LanguageSelector language={language} onChange={handleLanguageChange} />
            <div className="flex-1" />
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={handleReview}
              disabled={isLoading || !code.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Reviewing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.09 3.09 0 00-.9 2.16V19a2 2 0 11-4 0v-1.17a3.09 3.09 0 00-.9-2.16l-.347-.346z" />
                  </svg>
                  Review Code
                </>
              )}
            </button>
          </div>

          {/* Editor + Review Panel side-by-side */}
          <div className="flex flex-col lg:flex-row flex-1 gap-4" style={{ minHeight: '0', height: 'calc(100vh - 210px)' }}>
            <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '400px' }}>
              <CodeEditor language={language} code={code} onChange={setCode} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col lg:max-w-[48%]" style={{ minHeight: '400px' }}>
              <ReviewPanel
                review={review}
                isLoading={isLoading}
                error={error}
                language={language}
                loadingMessage={loadingMessage}
                reviewedAt={reviewedAt}
              />
            </div>
          </div>
        </main>
      )}

      {/* ================================================================== */}
      {/* Tab: Chat with Code                                                 */}
      {/* ================================================================== */}
      {activeTab === 'chat' && (
        <main className="flex flex-col flex-1 px-4 py-4 gap-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row flex-1 gap-4" style={{ minHeight: '0', height: 'calc(100vh - 165px)' }}>
            {/* Left: editable code editor (shared with review tab) */}
            <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '400px' }}>
              <div className="flex items-center gap-3 mb-2">
                <LanguageSelector language={language} onChange={handleLanguageChange} />
                <span className="text-xs text-gray-500">← The AI will answer questions about this code</span>
              </div>
              <div className="flex-1">
                <CodeEditor language={language} code={code} onChange={setCode} />
              </div>
            </div>

            {/* Right: Chat panel */}
            <div className="flex-1 min-w-0 flex flex-col lg:max-w-[48%]" style={{ minHeight: '400px' }}>
              <ChatPanel
                code={code}
                language={language}
                messages={messages}
                isLoading={chatLoading}
                error={chatError}
                onSendMessage={sendMessage}
                onClear={clearChat}
              />
            </div>
          </div>
        </main>
      )}

      {/* ================================================================== */}
      {/* Tab: GitHub Repository Review                                       */}
      {/* ================================================================== */}
      {activeTab === 'github' && (
        <main className="flex flex-col flex-1 px-4 py-4 gap-4 md:px-6 lg:px-8">
          {/* URL input bar */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
            <span className="text-lg">🐙</span>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !githubLoading && handleGithubReview()}
              placeholder="https://github.com/owner/repository"
              disabled={githubLoading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors min-w-[260px]"
            />
            <div className="flex gap-2">
              {githubResult && (
                <button
                  onClick={handleGithubClear}
                  disabled={githubLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleGithubReview}
                disabled={githubLoading || !repoUrl.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
              >
                {githubLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Analyzing…
                  </>
                ) : (
                  <>🔍 Analyze Repo</>
                )}
              </button>
            </div>
          </div>

          {/* Results panel */}
          <div className="flex-1" style={{ minHeight: '400px', maxHeight: 'calc(100vh - 230px)', overflowY: 'auto' }}>
            <GithubReviewPanel
              result={githubResult}
              isLoading={githubLoading}
              error={githubError}
            />
          </div>
        </main>
      )}

      {/* Status bar at the bottom */}
      <StatusBar code={code} reviewedAt={reviewedAt} />
    </div>
  );
}

export default App;
