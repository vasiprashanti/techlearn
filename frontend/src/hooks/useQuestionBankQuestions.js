import { useCallback, useEffect, useState } from 'react';
import { questionBankApi } from '../api/questionBankApi';

export const useQuestionBankQuestions = ({ categoryId, categorySlug, enabled = true } = {}) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  const loadQuestions = useCallback(async () => {
    if (!enabled) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const remoteQuestions = await questionBankApi.listQuestions({
        ...(categoryId ? { categoryId } : {}),
        ...(categorySlug ? { categorySlug } : {}),
      });
      setQuestions(Array.isArray(remoteQuestions) ? remoteQuestions : []);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load questions for this category.');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, categorySlug, enabled]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: loadQuestions,
  };
};

export default useQuestionBankQuestions;
