import React, { useRef, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';

export default function CodeDiffViewer({ originalCode, improvedCode, language, onReplace }) {
  const { isDark } = useTheme();
  const diffEditorRef = useRef(null);

  const handleEditorMount = (editor) => {
    diffEditorRef.current = editor;
  };

  return (
    <div className={`rounded-xl overflow-hidden border shadow-inner flex flex-col ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
      
      {/* Header toolbar */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
        <div className="flex items-center gap-3">
           <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
             Original vs Improved
           </span>
        </div>
        <div className="flex items-center gap-2">
           <button
             onClick={() => onReplace(improvedCode)}
             className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors shadow-sm"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
             </svg>
             Replace with Improved Code
           </button>
        </div>
      </div>

      {/* Diff Editor instance */}
      <div className="h-[350px]">
        <DiffEditor
          original={originalCode}
          modified={improvedCode}
          language={language}
          theme={isDark ? 'ai-dark' : 'ai-light'}
          onMount={handleEditorMount}
          options={{
            readOnly: true,
            renderSideBySide: true,
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            renderLineHighlight: 'none',
            diffWordWrap: 'on'
          }}
        />
      </div>
    </div>
  );
}
