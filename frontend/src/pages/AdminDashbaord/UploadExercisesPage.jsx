import React, { useState } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { HiOutlineUpload } from "react-icons/hi";

export default function UploadExercisePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);
  const [fileStatus, setFileStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const BASE_URL = import.meta.env.VITE_API_URL;

  // File upload handler
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files?.[0] || null;
    setFile(uploadedFile);
    setFileStatus(uploadedFile ? `Uploaded: ${uploadedFile.name}` : "");
  };

  // Submit handler (mock API)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Mock API POST with FormData
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("difficulty", difficulty);
      formData.append("tags", tags);
      if (file) formData.append("exerciseFile", file);

      // Mock API endpoint (this should be changed to real when backend is ready)
      const res = await fetch(`${BASE_URL}/mock/exercises`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload exercise");

      const data = await res.json();
      console.log("Mock API Response:", data);

      setMessage("Exercise uploaded successfully!");
      setTitle("");
      setDescription("");
      setDifficulty("easy");
      setTags("");
      setFile(null);
      setFileStatus("");
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <Sidebar />
      <div className="flex-1 flex justify-center items-start lg:items-center min-h-screen px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-0 pt-28 sm:pt-32 md:pt-28 lg:pt-0 lg:mt-24">
        <div className="bg-white/50 dark:bg-gray-800/70 rounded-2xl shadow-xl p-6 w-full max-w-3xl">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold brand-heading-primary mb-6">Upload Exercise</h1>
          {message && (
            <div
              className={`mb-3 p-2 rounded text-sm ${
                message.startsWith("Error")
                  ? "bg-red-200 text-red-700"
                  : "bg-green-200 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter exercise title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter exercise description"
                required
              ></textarea>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
                Level *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full border rounded px-3 py-2 text-light-text/80 dark:text-dark-text/70 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Comma separated tags (e.g. array, recursion)"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2 text-light-text/80 dark:text-dark-text/70">
                Upload File / Code
              </label>
              <label className="cursor-pointer font-medium text-blue-700 hover:underline inline-flex items-center gap-2">
                <HiOutlineUpload />
                <input
                  type="file"
                  accept=".md,.txt,.js,.py"
                  onChange={handleFileChange}
                  className="hidden"
                />
                Upload
              </label>
              {fileStatus && (
                <p className="text-xs text-gray-600 mt-1">{fileStatus}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto"
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}