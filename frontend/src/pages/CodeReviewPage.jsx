import { useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import ReviewPanel from '../components/ReviewPanel';
import StatusBar from '../components/StatusBar';
import { useCodeReview } from '../hooks/useCodeReview';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveHistory } from '../services/authApi';

// Map file extension → editor language
const EXT_LANG = {
  py: 'python', js: 'javascript', jsx: 'javascript',
  ts: 'javascript', tsx: 'javascript', java: 'java',
  cpp: 'cpp', cc: 'cpp', c: 'cpp',
};

const ACCEPTED = '.py,.js,.jsx,.ts,.tsx,.java,.cpp,.cc,.c';

export default function CodeReviewPage() {
  const { token, isAuthenticated } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const fileInputRef = useRef(null);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });

  const {
    language, code, review, isLoading, error,
    loadingMessage, reviewedAt,
    setCode, handleLanguageChange, handleReview, handleClear,
  } = useCodeReview();

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const detectedLang = EXT_LANG[ext];
    if (detectedLang) handleLanguageChange(detectedLang);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') setCode(text);
    };
    reader.readAsText(file);
    // Reset so re-selecting the same file works
    e.target.value = '';
  };

  // ── Review + optional history save ────────────────────────────────────────
  const handleReviewAndSave = async () => {
    const result = await handleReview();
    if (result && isAuthenticated && token) {
      const firstLine = code.trim().split('\n')[0]?.slice(0, 60) || 'Code Review';
      saveHistory(token, {
        language,
        code,
        result,
        review_type: 'code',
        title: firstLine,
      }).catch(() => {}); // silent — history saving is non-critical
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors
      ${isDark ? 'bg-[#0f1117]' : 'bg-gray-50'}`}>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 flex-shrink-0 transition-colors
        ${isDark
          ? 'bg-gray-900/80 border-gray-700/80'
          : 'bg-white border-gray-200'}`}>
        <LanguageSelector language={language} onChange={handleLanguageChange} />

        {/* File upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload a code file (.py .js .java .cpp)"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 border border-gray-600/80 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors
            ${isDark
              ? 'text-gray-400 border-gray-600/80 hover:bg-gray-800 hover:text-gray-200'
              : 'text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-800'}`}
        >
          {isDark ? (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m8.485-9H21M3 12H2m14.95-6.364l-.707.707M7.757 17.657l-.707.707m9.9 0l-.707-.707M7.757 6.343l-.707-.707M17 12a5 5 0 11-10 0 5 5 0 0110 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} stroke="currentColor" fill="none" />
              </svg>
              Light
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
              Dark
            </>
          )}
        </button>

        <button
          onClick={handleClear}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-600/80 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={handleReviewAndSave}
          disabled={isLoading || !code.trim()}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Reviewing…
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

      {/* ── Editor + Results ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-0">
        <div className="flex-1 min-w-0 border-r border-gray-700/60 overflow-hidden">
          <CodeEditor
            language={language}
            code={code}
            onChange={setCode}
            onCursorChange={setCursor}
          />
        </div>
        <div className="flex-1 min-w-0 lg:max-w-[48%] overflow-y-auto">
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

      {/* ── Status bar ────────────────────────────────────────────────────────── */}
      <StatusBar code={code} reviewedAt={reviewedAt} cursor={cursor} />
    </div>
  );
}
