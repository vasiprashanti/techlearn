import { useState, useCallback } from 'react';
import { questionBankApi } from '../api/questionBankApi';

export const useCategoryQuestions = (categoryId) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQuestions = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    setError('');
    try {
      const data = await questionBankApi.listQuestions({ categoryId });
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  return {
    questions,
    loading,
    error,
    refetch: fetchQuestions,
  };
};

export default useCategoryQuestions;
