import { useState, useCallback } from 'react';
import { chatWithCode } from '../services/api';

export function useChat() {
  const [messages, setMessages]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const sendMessage = useCallback(async (code, question, language) => {
    if (!question.trim() || !code.trim()) return;

    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const { answer } = await chatWithCode(code, question, language);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      const msg = err.userMessage || 'Failed to get an answer. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
