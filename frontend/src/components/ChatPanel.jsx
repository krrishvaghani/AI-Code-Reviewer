import { useState, useRef, useEffect } from 'react';

const SUGGESTIONS = [
  'What does this function do?',
  'Explain this code step by step.',
  'How can I optimize this code?',
  'What is the time complexity?',
  'Are there any security issues?',
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-1.5">
            🤖 AI Assistant
          </div>
        )}
        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

export default function ChatPanel({ code, language, messages, isLoading, error, onSendMessage, onClear }) {
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message
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

  const handleSuggestion = (q) => {
    onSendMessage(code, q, language);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <span className="text-sm font-semibold text-gray-200">Chat with Code</span>
          <span className="text-xs text-gray-500 ml-1">· uses code from the editor</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 border border-t-0 border-gray-700 bg-gray-900/40">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl">
              💬
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">Ask anything about your code</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {code.trim()
                  ? 'Your code is ready — try one of the suggestions below.'
                  : 'Add code in the "Code Review" tab first, then ask questions here.'}
              </p>
            </div>
            {code.trim() && (
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestion(q)}
                    disabled={isLoading}
                    className="text-left text-xs text-gray-400 hover:text-indigo-300 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium mb-2">
                🤖 AI Assistant
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 max-w-xs text-center">
              {error}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input box */}
      <div className="border border-t-0 border-gray-700 bg-gray-900 rounded-b-lg p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your code…"
            disabled={isLoading || !code.trim()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim() || !code.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
        {!code.trim() && (
          <p className="text-xs text-gray-600 mt-1.5 ml-1">
            Add code in the "Code Review" tab to enable chat.
          </p>
        )}
      </div>
    </div>
  );
}
