import { useCallback, useEffect, useState } from 'react';
import { questionBankApi } from '../api/questionBankApi';

export const useQuestionBankCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const remoteCategories = await questionBankApi.listCategories({ includeDrafts: true });
      setCategories(Array.isArray(remoteCategories) ? remoteCategories : []);
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load question categories.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    refetch: loadCategories,
  };
};

export default useQuestionBankCategories;
