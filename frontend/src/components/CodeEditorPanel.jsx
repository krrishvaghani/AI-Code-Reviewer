import React, { useRef } from 'react';
import CodeEditor from './CodeEditor';
import LanguageSelector from './LanguageSelector';
import LoadingIndicator from './LoadingIndicator';
import { useTheme } from '../context/ThemeContext';
import { Upload, Trash2, Sparkles, Play, AlignLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CodeEditorPanel({ 
  language, code, isLoading, loadingMessage, setCode, 
  handleLanguageChange, handleClear, handleReviewAndSave,
  handleEditorMount, setCursor 
}) {
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);

  const ACCEPTED = '.py,.js,.jsx,.ts,.tsx,.java,.cpp,.cc,.c';
  const EXT_LANG = {
    py: 'python', js: 'javascript', jsx: 'javascript',
    ts: 'javascript', tsx: 'javascript', java: 'java',
    cpp: 'cpp', cc: 'cpp', c: 'cpp',
  };

  const LANG_FILENAME = { python: 'main.py', javascript: 'index.js', java: 'Main.java', cpp: 'main.cpp' };
  const LANG_DOT = { python: 'bg-blue-500', javascript: 'bg-yellow-400', java: 'bg-orange-500', cpp: 'bg-purple-500' };

  const filename = LANG_FILENAME[language] ?? 'code.txt';
  const dotColor = LANG_DOT[language] ?? 'bg-gray-400';
  const lineCount = code.split('\n').length;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const detectedLang = EXT_LANG[ext];
    if (detectedLang) handleLanguageChange(detectedLang);
    const reader = new FileReader();
    reader.onload = (ev) => { if (typeof ev.target?.result === 'string') setCode(ev.target.result); };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFormat = () => {
    window.dispatchEvent(new CustomEvent('format-code', { detail: { language }}));
  };

  const ToolbarBtn = ({ onClick, disabled, title, children }) => (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed
        ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/[0.08]' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
    >
      {children}
    </motion.button>
  );

  return (
    <div className={`flex flex-col flex-1 min-w-0 overflow-hidden ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center gap-0 border-b flex-shrink-0 min-h-[44px]
        ${isDark ? 'border-white/[0.08] bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
        {/* File tab */}
        <div className={`flex items-center gap-2 px-4 py-2.5 border-r text-xs font-medium h-full
          ${isDark ? 'border-white/[0.08] text-gray-300' : 'border-gray-200 text-gray-700'}`}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="font-mono">{filename}</span>
          <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{lineCount}L</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 px-3">
          <LanguageSelector language={language} onChange={handleLanguageChange} />
          <div className={`w-px h-4 mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

          <ToolbarBtn onClick={handleFormat} disabled={isLoading || !code.trim()} title="Format code">
            <AlignLeft size={15} /> Format
          </ToolbarBtn>

          <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="Upload file">
            <Upload size={15} /> Upload
          </ToolbarBtn>
          <input ref={fileInputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileChange} />

          <ToolbarBtn onClick={handleClear} disabled={isLoading} title="Clear editor">
            <Trash2 size={15} /> Clear
          </ToolbarBtn>

          <button
            onClick={handleReviewAndSave}
            disabled={isLoading || !code.trim()}
            className={`ml-2 group relative flex items-center justify-center w-[140px] h-[36px] rounded-[10px] cursor-pointer transition-all duration-300 ease outline-none disabled:opacity-50 disabled:cursor-not-allowed
              bg-[rgba(46,142,255,0.2)] bg-gradient-to-br from-[#2e8eff] from-0% to-transparent to-30% 
              ${(!isLoading && code.trim()) ? 'hover:bg-[rgba(46,142,255,0.7)] hover:shadow-[0_0_10px_rgba(46,142,255,0.5)] focus:bg-[rgba(46,142,255,0.7)] focus:shadow-[0_0_10px_rgba(46,142,255,0.5)]' : ''}`}
          >
            <div className={`w-[136px] h-[32px] rounded-[8px] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors
              ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-800'}`}>
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-[#2e8eff]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analyzing
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-[#2e8eff]" />
                  Review Code
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden relative">
        <CodeEditor
          language={language} code={code} onChange={setCode}
          onCursorChange={setCursor} onEditorMount={handleEditorMount}
        />
        {isLoading && <LoadingIndicator message={loadingMessage || "Analyzing your code..."} />}
      </div>
    </div>
  );
}
