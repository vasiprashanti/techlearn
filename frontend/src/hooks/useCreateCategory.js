import { useState } from 'react';
import { questionBankApi } from '../api/questionBankApi';

export const useCreateCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const createCategory = async (payload) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await questionBankApi.createCategory(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to create category.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCategory,
    loading,
    error,
    success,
  };
};

export default useCreateCategory;
