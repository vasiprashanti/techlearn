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
  const res = await axios.get(`${BASE_URL}/admin/${courseId}`);
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Topics for Course</h2>
      <ul className="space-y-4">
        {topics.length === 0 && <li>No topics found.</li>}
        {topics.map((topic) => (
          <li key={topic.topicId} className="flex items-center justify-between bg-white rounded shadow p-4">
            <div>
              <div className="font-semibold text-lg">{topic.topicName}</div>
              <div className="text-sm text-gray-500">Slug: {topic.topicSlug}</div>
              <div className="text-xs text-gray-400">ID: {topic.topicId}</div>
            </div>
            <button
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
