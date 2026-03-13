import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Send, Trash2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUGGESTIONS = [
  'What does this function do?',
  'Explain this code step by step.',
  'How can I optimize this code?',
  'What is the time complexity?',
  'Are there any security issues?',
];

function MessageBubble({ msg, isDark }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
        ${isUser
          ? 'bg-indigo-600 text-white'
          : (isDark ? 'bg-white/[0.08] text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed
        ${isUser
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : (isDark ? 'bg-white/[0.04] text-gray-200 border border-white/[0.08] rounded-tl-sm' : 'bg-gray-50 text-gray-800 border border-gray-200 rounded-tl-sm')}`}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </motion.div>
  );
}

export default function ChatPanel({ code, language, messages, isLoading, error, onSendMessage, onClear }) {
  const { isDark } = useTheme();
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onSendMessage(code, question.trim(), language);
    setQuestion('');
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0
        ${isDark ? 'border-white/[0.08]' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Bot size={16} className={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Chat with Code</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className={`flex items-center gap-1 text-xs transition-colors
              ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
            <Bot size={28} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
            <div className="text-center">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Ask anything about your code</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {code?.trim() ? 'Try one of the suggestions below' : 'Add code in the editor first'}
              </p>
            </div>
            {code?.trim() && (
              <div className="flex flex-col gap-1.5 w-full max-w-xs mt-2">
                {SUGGESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => onSendMessage(code, q, language)}
                    disabled={isLoading}
                    className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-50
                      ${isDark ? 'text-gray-400 border-white/[0.08] hover:bg-white/[0.04] hover:text-gray-200' : 'text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-800'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} isDark={isDark} />
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/[0.08] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
              <Bot size={14} />
            </div>
            <div className={`rounded-xl rounded-tl-sm px-4 py-3 border ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    className={`w-2 h-2 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className={`text-xs px-3 py-2 rounded-lg border ${isDark ? 'text-red-400 bg-red-900/10 border-red-800/30' : 'text-red-600 bg-red-50 border-red-200'}`}>
              {error}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`border-t p-3 ${isDark ? 'border-white/[0.08] bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your code…"
            disabled={isLoading || !code?.trim()}
            className={`flex-1 border rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none disabled:opacity-50 transition-colors
              ${isDark ? 'bg-[#111] border-white/[0.08] text-gray-200 focus:border-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-indigo-500'}`}
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading || !question.trim() || !code?.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Send size={14} /> Send
          </motion.button>
        </form>
      </div>
    </div>
  );
}
