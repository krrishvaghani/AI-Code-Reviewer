import { useState, useCallback } from 'react';
import { reviewCode } from '../services/api';

const DEFAULT_CODE_BY_LANGUAGE = {
  python: `def calculate_average(numbers):\n    total = 0\n    for n in numbers:\n        total = total + n\n    average = total / len(numbers)\n    return average\n\nresult = calculate_average([10, 20, 30, 40, 50])\nprint("Average:", result)\n`,
  javascript: `function calculateAverage(numbers) {\n  var total = 0;\n  for (var i = 0; i < numbers.length; i++) {\n    total = total + numbers[i];\n  }\n  var average = total / numbers.length;\n  return average;\n}\n\nconst result = calculateAverage([10, 20, 30, 40, 50]);\nconsole.log("Average:", result);\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}\n`,
  cpp: `#include <iostream>\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}\n`,
};

export function useCodeReview() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE_BY_LANGUAGE['python']);
  const [review, setReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE_BY_LANGUAGE[newLang]);
    setReview(null);
    setError(null);
  }, []);

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter some code before reviewing.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReview(null);

    try {
      const result = await reviewCode(code, language);
      setReview(result);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('Cannot connect to the backend server. Make sure the FastAPI server is running on port 8000.');
      } else if (err.response?.status === 422) {
        setError('Invalid request. Please check your code and language selection.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred while reviewing your code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, language]);

  const handleClear = useCallback(() => {
    setCode('');
    setReview(null);
    setError(null);
  }, []);

  return {
    language,
    code,
    review,
    isLoading,
    error,
    setCode,
    handleLanguageChange,
    handleReview,
    handleClear,
  };
}
