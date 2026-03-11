import { useState, useCallback } from 'react';
import { reviewGithubRepo } from '../services/api';

export function useGithubReview() {
  const [repoUrl, setRepoUrl]     = useState('');
  const [result, setResult]       = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const handleReview = useCallback(async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await reviewGithubRepo(repoUrl.trim());
      setResult(data);
    } catch (err) {
      setError(
        err.userMessage ||
        'Failed to review the repository. Make sure the URL is correct and the repo is public.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [repoUrl]);

  const handleClear = useCallback(() => {
    setResult(null);
    setError(null);
    setRepoUrl('');
  }, []);

  return { repoUrl, setRepoUrl, result, isLoading, error, handleReview, handleClear };
}
