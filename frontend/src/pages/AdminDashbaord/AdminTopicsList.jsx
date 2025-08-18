import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiOutlineUpload } from 'react-icons/hi';

// Use backend API base URL from environment variable
const BASE_URL = import.meta.env.VITE_API_URL || '';

const AdminTopicsList = () => {
  const { courseId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [courseTitle, setCourseTitle] = useState('');
  const [exerciseFile, setExerciseFile] = useState(null);
  const [exerciseStatus, setExerciseStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Fetch topics + course info
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${BASE_URL}/admin/${courseId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        setTopics(res.data.topics || []);
        setCourseTitle(res.data.courseTitle || ''); // Assuming API provides courseTitle
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

  // Handle course title update (with file upload, matches /api/admin/topic/:topicId)
  const handleCourseTitleUpdate = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', courseTitle);
      // Use the first topic's ID if available, else fallback to courseId
      const topicId = topics && topics.length > 0 ? topics[0].topicId : courseId;
      const res=await axios.put(
        `${BASE_URL}/admin/topic/${topicId}`,
        formData,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          : {}
      );
      alert('Course title updated successfully!');
      console.log("ipd ide",res);
    } catch (err) {
      alert('Failed to update course title.');
    }
  };

  // Handle file select
  const handleExerciseFileChange = (file) => {
    setExerciseFile(file);
    if (file) {
      setExerciseStatus(`Selected file: ${file.name}`);
    } else {
      setExerciseStatus('');
    }
  };

  // Handle exercise file upload (edit exercises for course)
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!exerciseFile) {
      alert('Please select a file first.');
      return;
    }
    const formData = new FormData();
    formData.append('exerciseFile', exerciseFile); // field name must match backend

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `${BASE_URL}/admin/${courseId}/exercise`,
        formData,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          : {}
      );
      alert('Exercises updated successfully!');
      setExerciseStatus(`Uploaded: ${exerciseFile.name}`);
      setExerciseFile(null);
    } catch (err) {
      alert('Failed to update exercises.');
    } finally {
      setUploading(false);
    }
  };

  if (loading && topics.length === 0 && !exerciseFile)
    return <div>Loading topics...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6 mt-24 ">
      {/* Course Title */}
      <div className="mb-6">
        <label className="block text-xs sm:text-lg font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
          Course Title:
        </label>
        <form className="flex gap-2" onSubmit={handleCourseTitleUpdate}>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            className="sm:w-64 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter course title"
          />
          <button
            type="submit"
            className="self-center bg-blue-600 text-white rounded px-3 py-1 h-8 text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed w-auto"
          >
            Save
          </button>
        </form>
      </div>

      {/* Exercise file upload */}
      <div className="mt-8">
        <h2 className="block text-xs sm:text-lg font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
          Exercise File
        </h2>
        <form className="flex items-center gap-4" onSubmit={handleFileUpload}>
          <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-2 text-sm sm:text-base mb-0">
            <HiOutlineUpload className="inline text-lg" />
            <input
              type="file"
              accept=".md"
              className="hidden"
              onChange={(e) =>
                handleExerciseFileChange(e.target.files?.[0] || null)
              }
            />
            Upload Exercise File (.md)
          </label>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-3 py-1.5 text-xs sm:text-sm font-medium shadow hover:bg-blue-700 transition w-auto"
            disabled={uploading || !exerciseFile || !courseId}
          >
            {uploading ? 'Uploading...' : 'Submit'}
          </button>
        </form>
        {exerciseStatus && (
          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
            {exerciseStatus}
          </p>
        )}
      </div>

      {/* Topics list */}
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-2 mt-8">
        Topics for Course
      </h2>
      <ul className="space-y-4">
        {topics.length === 0 && <li>No topics found.</li>}
        {topics.map((topic) => (
          <li
            key={topic.topicId}
            className="flex items-center justify-between bg-white/50 dark:bg-gray-800/70 backdrop-blur rounded-lg shadow p-4"
          >
            <div>
              <div className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
                {topic.topicName}
              </div>
              <div className="block text-xs sm:text-xs font-normal mb-2 text-light-text/80 dark:text-dark-text/70">
                Slug: {topic.topicSlug}
              </div>
              <div className="block text-xs sm:text-xs font-normal mb-2 text-light-text/80 dark:text-dark-text/70">
                ID: {topic.topicId}
              </div>
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
