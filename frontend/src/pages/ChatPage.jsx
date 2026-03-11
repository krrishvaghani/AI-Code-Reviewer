import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import ChatPanel from '../components/ChatPanel';
import { useCodeReview } from '../hooks/useCodeReview';
import { useChat } from '../hooks/useChat';

export default function ChatPage() {
  const {
    language, code, setCode, handleLanguageChange,
  } = useCodeReview();

  const {
    messages, isLoading: chatLoading, error: chatError,
    sendMessage, clearChat,
  } = useChat();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-900/80 border-b border-gray-700/80 px-4 py-3 flex-shrink-0">
        <LanguageSelector language={language} onChange={handleLanguageChange} />
        <span className="text-xs text-gray-500 hidden sm:inline">← The AI will answer questions about this code</span>
        <div className="flex-1" />
        <button
          onClick={clearChat}
          disabled={chatLoading || messages.length === 0}
          className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-600/80 rounded-lg hover:bg-gray-800 hover:text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear Chat
        </button>
      </div>

      {/* Editor + Chat */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="flex-1 min-w-0 border-r border-gray-700/60 overflow-hidden">
          <CodeEditor language={language} code={code} onChange={setCode} />
        </div>
        <div className="flex-1 min-w-0 lg:max-w-[48%] flex flex-col overflow-hidden">
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
    </div>
  );
}
