import { useRef, useState } from 'react';
import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import ReviewPanel from '../components/ReviewPanel';
import StatusBar from '../components/StatusBar';
import { useCodeReview } from '../hooks/useCodeReview';
import { useAuth } from '../context/AuthContext';
import { saveHistory } from '../services/authApi';

// Map file extension → editor language
const EXT_LANG = {
  py: 'python', js: 'javascript', jsx: 'javascript',
  ts: 'javascript', tsx: 'javascript', java: 'java',
  cpp: 'cpp', cc: 'cpp', c: 'cpp',
};

const ACCEPTED = '.py,.js,.jsx,.ts,.tsx,.java,.cpp,.cc,.c';

// Language → display filename (shown in file tab)
const LANG_FILENAME = {
  python: 'main.py',
  javascript: 'index.js',
  java: 'Main.java',
  cpp: 'main.cpp',
};

// Language → dot color for the tab indicator
const LANG_DOT = {
  python: 'bg-blue-400',
  javascript: 'bg-yellow-400',
  java: 'bg-orange-400',
  cpp: 'bg-purple-400',
};

export default function CodeReviewPage() {
  const { token, isAuthenticated } = useAuth();
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
      }).catch(() => {});
    }
  };

  const filename  = LANG_FILENAME[language] ?? 'code.txt';
  const dotColor  = LANG_DOT[language]      ?? 'bg-gray-400';
  const lineCount = code.split('\n').length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0a0c14]">

      {/* ── Two-column workspace ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* ── LEFT: Editor panel ───────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-white/[0.06] overflow-hidden">

          {/* Panel header / file-tab bar */}
          <div className="flex items-center gap-0 px-0 bg-[#0d1017] border-b border-white/[0.07] flex-shrink-0 min-h-[42px]">
            {/* File tab */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f1117] border-r border-white/[0.07] text-xs text-gray-300 font-medium">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
              <span className="font-mono">{filename}</span>
              <span className="text-gray-600 text-[10px] ml-1">{lineCount}L</span>
            </div>

            <div className="flex-1" />

            {/* Controls — right-aligned in header */}
            <div className="flex items-center gap-2 px-3">
              <LanguageSelector language={language} onChange={handleLanguageChange} />

              <div className="w-px h-4 bg-white/[0.07] mx-0.5" />

              {/* Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload a code file"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Clear */}
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-200 hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>

              {/* Review — primary action */}
              <button
                onClick={handleReviewAndSave}
                disabled={isLoading || !code.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-900/30"
              >
                {isLoading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Reviewing…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.09 3.09 0 00-.9 2.16V19a2 2 0 11-4 0v-1.17a3.09 3.09 0 00-.9-2.16l-.347-.346z" />
                    </svg>
                    Review Code
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={language}
              code={code}
              onChange={setCode}
              onCursorChange={setCursor}
            />
          </div>
        </div>

        {/* ── RIGHT: AI Review panel ───────────────────────────────────────── */}
        <div className="flex flex-col lg:w-[46%] xl:w-[44%] flex-shrink-0 overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 bg-[#0d1017] border-b border-white/[0.07] flex-shrink-0 min-h-[42px]">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.09 3.09 0 00-.9 2.16V19a2 2 0 11-4 0v-1.17a3.09 3.09 0 00-.9-2.16l-.347-.346z" />
              </svg>
              <span className="text-xs font-semibold text-gray-300">AI Review Results</span>
            </div>
            {review && !isLoading && (
              <span className="ml-auto text-[10px] text-gray-600 font-mono">
                {reviewedAt ? new Date(reviewedAt).toLocaleTimeString() : ''}
              </span>
            )}
          </div>

          {/* Results scroll area */}
          <div className="flex-1 overflow-y-auto">
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
      </div>

      {/* ── Status bar ────────────────────────────────────────────────────────── */}
      <StatusBar code={code} reviewedAt={reviewedAt} cursor={cursor} />
    </div>
  );
}