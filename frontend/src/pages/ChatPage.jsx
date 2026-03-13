import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import ChatPanel from '../components/ChatPanel';
import { useCodeReview } from '../hooks/useCodeReview';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../context/ThemeContext';
import { Trash2 } from 'lucide-react';

export default function ChatPage() {
  const { isDark } = useTheme();
  const { language, code, setCode, handleLanguageChange } = useCodeReview();
  const { messages, isLoading: chatLoading, error: chatError, sendMessage, clearChat } = useChat();

  return (
    <div className={`flex flex-col h-full overflow-hidden ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-3 border-b px-4 py-2.5 flex-shrink-0
        ${isDark ? 'bg-[#0a0a0a] border-white/[0.08]' : 'bg-white border-gray-200'}`}>
        <LanguageSelector language={language} onChange={handleLanguageChange} />
        <span className={`text-xs hidden sm:inline ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>← AI will answer questions about this code</span>
        <div className="flex-1" />
        <button
          onClick={clearChat}
          disabled={chatLoading || messages.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-40
            ${isDark ? 'text-gray-400 border-white/[0.08] hover:bg-white/[0.04]' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}
        >
          <Trash2 size={12} /> Clear Chat
        </button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className={`flex-1 min-w-0 border-r overflow-hidden ${isDark ? 'border-white/[0.08]' : 'border-gray-200'}`}>
          <CodeEditor language={language} code={code} onChange={setCode} />
        </div>
        <div className="flex-1 min-w-0 lg:max-w-[48%] flex flex-col overflow-hidden">
          <ChatPanel code={code} language={language} messages={messages} isLoading={chatLoading} error={chatError} onSendMessage={sendMessage} onClear={clearChat} />
        </div>
      </div>
    </div>
  );
}
