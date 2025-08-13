import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Use backend API base URL from environment variable
const BASE_URL = import.meta.env.VITE_API_URL || '';

const AdminTopicsList = () => {
  const { courseId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/admin/${courseId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        console.log(res);
        setTopics(res.data.topics || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch topics');
      }
      setLoading(false);
    };
    fetchTopics();
  }, [courseId]);

  const handleEdit = (topicId) => {
    navigate(`/admin/topics/${courseId}/edit/${topicId}`);
  };

  if (loading) return <div>Loading topics...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6 mt-24 ">
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-2">Topics for Course</h2>
      <ul className="space-y-4">
        {topics.length === 0 && <li>No topics found.</li>}
        {topics.map((topic) => (
          <li key={topic.topicId} className="flex items-center justify-between bg-white/50 dark:bg-gray-800/70 backdrop-blur rounded-lg shadow p-4">
            <div>
              <div className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">{topic.topicName}</div>
              <div className="block text-xs sm:text-xs font-normal mb-2 text-light-text/80 dark:text-dark-text/70">Slug: {topic.topicSlug}</div>
              <div className="block text-xs sm:text-xs font-normal mb-2 text-light-text/80 dark:text-dark-text/70">ID: {topic.topicId}</div>
            </div>
            <button
              className="bg-blue-600 text-white rounded-lg px-4 sm:px-4 py-2 text-sm sm:text-base font-semibold shadow hover:bg-blue-700 transition w-full sm:w-auto"
              onClick={() => handleEdit(topic.topicId)}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminTopicsList;
