import { useRef, useState, useEffect } from 'react';
import CodeEditorPanel from '../components/CodeEditorPanel';
import ReviewResultsPanel from '../components/ReviewResultsPanel';
import StatusBar from '../components/StatusBar';
import { useCodeReview } from '../hooks/useCodeReview';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveHistory } from '../services/authApi';

export default function Dashboard() {
  const { isDark } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const [cursor, setCursor] = useState({ line: 1, column: 1 });

  const {
    language, code, review, isLoading, error,
    loadingMessage, reviewedAt,
    setCode, handleLanguageChange, handleReview, handleClear,
  } = useCodeReview();

  const {
    messages: chatMessages,
    isLoading: chatLoading,
    error: chatError,
    sendMessage: onSendMessage,
    clearChat: onClearChat
  } = useChat();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsCollectionRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsCollectionRef.current = editor.createDecorationsCollection();
  };

  const handleLineClick = (lineNumber) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleReplaceCode = (improvedCode) => {
    setCode(improvedCode);
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !decorationsCollectionRef.current) return;
    
    if (!review || !review.ai_review) {
       decorationsCollectionRef.current.clear();
       return;
    }
    
    const monaco = monacoRef.current;
    const newDecorations = [];
    
    const addDecs = (items, severityColor) => {
       if (!Array.isArray(items)) return;
       items.forEach(item => {
          const locRe = /(?:line\s+|:)(\d+)/i;
          const m = item.match(locRe);
          if (m && m[1]) {
             const ln = parseInt(m[1], 10);
             newDecorations.push({
                range: new monaco.Range(ln, 1, ln, 1),
                options: {
                   isWholeLine: true,
                   className: `bg-${severityColor}-500/10 border-l-[3px] border-${severityColor}-500`,
                   hoverMessage: { value: `**AI Feedback:**\n\n${item}` },
                   minimap: {
                      color: severityColor === 'red' ? '#ef4444' : severityColor === 'yellow' ? '#eab308' : '#22c55e',
                      position: monaco.editor.MinimapPosition.Inline
                   }
                }
             });
             newDecorations.push({
                range: new monaco.Range(ln, 1, ln, 200),
                options: { inlineClassName: `${severityColor}-squiggle` }
             });
          }
       });
    };

    addDecs(review.ai_review.issues, 'red');
    addDecs(review.ai_review.security_issues, 'red');
    addDecs(review.ai_review.performance_issues, 'yellow');
    addDecs(review.ai_review.suggestions, 'green');

    decorationsCollectionRef.current.set(newDecorations);
  }, [review]);

  useEffect(() => {
    const handleFormat = () => {
       if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument').run();
       }
    };
    window.addEventListener('format-code', handleFormat);
    return () => window.removeEventListener('format-code', handleFormat);
  }, []);

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

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      {/* Two-column workspace */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <CodeEditorPanel 
           language={language}
           code={code}
           isLoading={isLoading}
           loadingMessage={loadingMessage}
           setCode={setCode}
           handleLanguageChange={handleLanguageChange}
           handleClear={handleClear}
           handleReviewAndSave={handleReviewAndSave}
           handleEditorMount={handleEditorMount}
           setCursor={setCursor}
        />

        <div className={`flex flex-col lg:w-[46%] xl:w-[44%] flex-shrink-0 overflow-hidden border-l ${isDark ? 'border-white/[0.08]' : 'border-gray-200'}`}>
          <ReviewResultsPanel 
            review={review}
            originalCode={code}
            isLoading={isLoading}
            error={error}
            language={language}
            onIssueClick={handleLineClick}
            onReplaceCode={handleReplaceCode}
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            chatError={chatError}
            onSendMessage={onSendMessage}
            onClearChat={onClearChat}
          />
        </div>
      </div>

      <StatusBar code={code} reviewedAt={reviewedAt} cursor={cursor} />
    </div>
  );
}