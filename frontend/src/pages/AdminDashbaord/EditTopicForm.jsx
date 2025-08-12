import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const EditTopicForm = () => {
  const { courseId, topicId } = useParams();
  const [topicName, setTopicName] = useState('');
  const [notesFile, setNotesFile] = useState(null);
  const [quizFile, setQuizFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
  formData.append('topicName', topicName);
      if (notesFile) formData.append('notesFile', notesFile);
      if (quizFile) formData.append('quizFile', quizFile);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${BASE_URL}/admin/topic/${topicId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        }
      );
      console.log(res);
      setSuccess('Topic updated successfully!');
      setTimeout(() => navigate(`/admin/topics/${courseId}`), 1200);
    } catch (err) {
      setError('Failed to update topic');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Topic</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Topic Name</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={topicName}
            onChange={e => setTopicName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Notes File</label>
          <input
            type="file"
            accept=".md,.pdf,.txt"
            className="w-full"
            onChange={e => setNotesFile(e.target.files[0])}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Quiz File</label>
          <input
            type="file"
            accept=".md,.pdf,.txt"
            className="w-full"
            onChange={e => setQuizFile(e.target.files[0])}
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Submit'}
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </form>
    </div>
  );
};

export default EditTopicForm;
