import { useState } from 'react';
import { questionBankApi } from '../api/questionBankApi';

export const useCreateQuestion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const createQuestion = async (payload) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await questionBankApi.createQuestion(payload);
      setSuccess(true);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to create question.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = async (questionId, payload) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await questionBankApi.updateQuestion(questionId, payload);
      setSuccess(true);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to update question.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createQuestion,
    updateQuestion,
    loading,
    error,
    success,
  };
};

export default useCreateQuestion;
