import { useState, useCallback, useEffect, useRef } from 'react';
import { reviewCode } from '../services/api';

// ---------------------------------------------------------------------------
// Default code samples per language
// ---------------------------------------------------------------------------

const DEFAULT_CODE_BY_LANGUAGE = {
  python: `def calculate_average(numbers):\n    total = 0\n    for n in numbers:\n        total = total + n\n    average = total / len(numbers)\n    return average\n\nresult = calculate_average([10, 20, 30, 40, 50])\nprint("Average:", result)\n`,
  javascript: `function calculateAverage(numbers) {\n  var total = 0;\n  for (var i = 0; i < numbers.length; i++) {\n    total = total + numbers[i];\n  }\n  var average = total / numbers.length;\n  return average;\n}\n\nconst result = calculateAverage([10, 20, 30, 40, 50]);\nconsole.log("Average:", result);\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}\n`,
  cpp: `#include <iostream>\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}\n`,
};

// ---------------------------------------------------------------------------
// Loading messages — cycles through while AI is working
// ---------------------------------------------------------------------------

const LOADING_MESSAGES = [
  'Sending code to AI…',
  'Analyzing your code…',
  'Detecting bugs and issues…',
  'Generating optimization suggestions…',
  'Writing improved version…',
  'Preparing explanation…',
  'Almost done…',
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCodeReview() {
  const [language, setLanguage]         = useState('python');
  const [code, setCode]                 = useState(DEFAULT_CODE_BY_LANGUAGE['python']);
  const [review, setReview]             = useState(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [reviewedAt, setReviewedAt]     = useState(null);

  // Timer ref for cycling loading messages
  const messageTimerRef = useRef(null);
  const messageIndexRef = useRef(0);

  // Start cycling through loading messages every 3 seconds
  const startMessageCycle = useCallback(() => {
    messageIndexRef.current = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    messageTimerRef.current = setInterval(() => {
      messageIndexRef.current =
        (messageIndexRef.current + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndexRef.current]);
    }, 3000);
  }, []);

  const stopMessageCycle = useCallback(() => {
    if (messageTimerRef.current) {
      clearInterval(messageTimerRef.current);
      messageTimerRef.current = null;
    }
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => stopMessageCycle(), [stopMessageCycle]);

  // -------------------------------------------------------------------------

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE_BY_LANGUAGE[newLang]);
    setReview(null);
    setError(null);
    setReviewedAt(null);
  }, []);

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code before reviewing.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReview(null);
    startMessageCycle();

    try {
      const result = await reviewCode(code, language);
      setReview(result);
      setReviewedAt(new Date());
    } catch (err) {
      // Use the normalized userMessage set by the Axios interceptor when available
      if (err.userMessage) {
        setError(err.userMessage);
      } else if (err.response?.status === 503) {
        setError(
          'The AI service is temporarily unavailable. Please check your API key or try again shortly.'
        );
      } else if (err.response?.status === 422) {
        setError(
          'Invalid request. Please check your code length and language selection.'
        );
      } else if (err.response?.status === 500) {
        setError(
          'An internal server error occurred. Please make sure the backend is running correctly.'
        );
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      stopMessageCycle();
      setIsLoading(false);
    }
  }, [code, language, startMessageCycle, stopMessageCycle]);

  const handleClear = useCallback(() => {
    setCode('');
    setReview(null);
    setError(null);
    setReviewedAt(null);
  }, []);

  return {
    language,
    code,
    review,
    isLoading,
    error,
    loadingMessage,
    reviewedAt,
    setCode,
    handleLanguageChange,
    handleReview,
    handleClear,
  };
}
