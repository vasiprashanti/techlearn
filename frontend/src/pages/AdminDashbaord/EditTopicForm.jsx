import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineUpload } from "react-icons/hi";

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
    <div className="max-w-xl mx-auto p-6 bg-white/50 dark:bg-gray-800/70 backdrop-blur rounded-lg shadow mt-36 mb-12">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-4">
        Edit Topic
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Topic Name */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
            Topic Name
          </label>
          <input
            type="text"
            value={topicName}
            onChange={e => setTopicName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter topic name"
            required
          />
        </div>

        {/* Notes File upload */}
        <div>
          <h2 className="text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
            Notes File
          </h2>
          <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-2 text-sm sm:text-base">
            <HiOutlineUpload className="inline text-lg" />
            <input
              type="file"
              accept=".md,.pdf,.txt"
              className="hidden"
              onChange={(e) => setNotesFile(e.target.files?.[0] || null)}
            />
            Upload Notes File (.md/.pdf/.txt)
          </label>
          {notesFile && (
            <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
              {notesFile.name}
            </p>
          )}
        </div>

        {/* Quiz File upload */}
        <div>
          <h2 className="text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
            Quiz File
          </h2>
          <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-2 text-sm sm:text-base">
            <HiOutlineUpload className="inline text-lg" />
            <input
              type="file"
              accept=".md,.pdf,.txt"
              className="hidden"
              onChange={(e) => setQuizFile(e.target.files?.[0] || null)}
            />
            Upload Quiz File (.md/.pdf/.txt)
          </label>
          {quizFile && (
            <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
              {quizFile.name}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-lg px-4 sm:px-4 py-2 text-sm sm:text-base font-semibold shadow hover:bg-blue-700 transition w-full sm:w-auto"
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
