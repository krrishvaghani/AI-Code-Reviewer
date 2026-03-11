import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import LanguageSelector from './components/LanguageSelector';
import ReviewPanel from './components/ReviewPanel';
import StatusBar from './components/StatusBar';
import { useCodeReview } from './hooks/useCodeReview';

function App() {
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

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117]">
      {/* Top header bar */}
      <Header />

      {/* Main content */}
      <main className="flex flex-col flex-1 px-4 py-4 gap-4 md:px-6 lg:px-8">

        {/* Toolbar row */}
        <div className="flex flex-wrap items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
          <LanguageSelector language={language} onChange={handleLanguageChange} />

          <div className="flex-1" />

          {/* Action buttons */}
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
        <div className="flex flex-col lg:flex-row flex-1 gap-4" style={{ minHeight: '0', height: 'calc(100vh - 180px)' }}>
          {/* Left: Code editor */}
          <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '400px' }}>
            <CodeEditor
              language={language}
              code={code}
              onChange={setCode}
            />
          </div>

          {/* Right: Review output */}
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

      {/* Status bar at the bottom */}
      <StatusBar code={code} reviewedAt={reviewedAt} />
    </div>
  );
}

export default App;
