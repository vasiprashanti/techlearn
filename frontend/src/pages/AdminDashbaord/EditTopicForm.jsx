import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { HiOutlineUpload } from "react-icons/hi";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowLeft, FiSave } from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_API_URL || "";

const EditTopicForm = () => {
  const { courseId, topicId } = useParams();
  const [topicName, setTopicName] = useState("");
  const [notesBody, setNotesBody] = useState("");
  const [notesFile, setNotesFile] = useState(null);
  const [mcqFile, setMcqFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Theme & layout states
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current topic details to prepopulate topicName
  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${BASE_URL}/admin/${courseId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        const matchingTopic = (res.data.topics || []).find(t => String(t.topicId) === String(topicId));
        if (matchingTopic?.topicName) {
          setTopicName(matchingTopic.topicName);
        }
        setNotesBody(matchingTopic?.notesContent || "");
      } catch (err) {
        console.error("Failed to load topic details:", err);
      }
    };
    fetchTopicDetails();
  }, [courseId, topicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("topicName", topicName);
      formData.append("notesBody", notesBody);
      if (notesFile) formData.append("notesFile", notesFile);
      if (mcqFile) formData.append("mcqFile", mcqFile);
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/admin/topic/${topicId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        }
      );
      setSuccess("Topic updated successfully!");
      setTimeout(() => navigate(`/admin/topics/${courseId}`), 1200);
    } catch (err) {
      setError("Failed to update topic.");
    }
    setLoading(false);
  };

  const categoryFormInputClass = "mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";

  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
        isDarkMode ? "dark" : "light"
      }`}
    >
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'
        }`}
      />

      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
          pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <div>
              <h1 className="mt-8 font-poppins tracking-tight leading-[0.92]">
                <span className="block italic text-4xl sm:text-5xl md:text-6xl brand-heading-primary">
                  EDIT TOPIC
                </span>
              </h1>
              <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-4">
                Update topic content and study notes
              </p>
            </div>
            
            <button
              onClick={() => navigate(`/admin/topics/${courseId}`)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-black/10 dark:border-white/10 px-4 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 shadow-sm shrink-0 w-auto self-start sm:self-auto transition"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              Back to Topics
            </button>
          </header>

          <section className="space-y-6">
            
            {/* Form wrapper in a beautiful premium card */}
            <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
              
              {error && (
                <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-xs sm:text-sm font-semibold">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Topic Name */}
                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Topic Name*</label>
                  <input
                    type="text"
                    value={topicName}
                    onChange={e => setTopicName(e.target.value)}
                    className={categoryFormInputClass}
                    placeholder="Enter topic title"
                    required
                  />
                </div>

                {/* Notes File upload */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-2">
                  <h3 className="admin-section-heading">Study Notes File</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="cursor-pointer font-semibold text-[#3C83F6] hover:underline inline-flex items-center gap-2 text-sm sm:text-base">
                      <HiOutlineUpload className="inline text-lg" />
                      <input
                        type="file"
                        accept=".md"
                        className="hidden"
                        onChange={(e) => setNotesFile(e.target.files?.[0] || null)}
                      />
                      Upload Notes File (.md)
                    </label>
                    {notesFile && (
                      <p className="text-xs sm:text-sm text-slate-500 max-w-xs truncate" title={notesFile.name}>
                        {notesFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-2">
                  <h3 className="admin-section-heading">Study Notes Markdown</h3>
                  <textarea
                    value={notesBody}
                    onChange={(e) => setNotesBody(e.target.value)}
                    rows={12}
                    placeholder="Edit the markdown notes shown on the Learn page"
                    className={`${categoryFormInputClass} min-h-[240px] resize-y font-mono text-xs leading-6`}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-300">
                    Edit titles, subtitles, descriptions, lists, tables, and note content directly here.
                  </p>
                </div>

                {/* MCQ File upload */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-2">
                  <h3 className="admin-section-heading">MCQ Quiz File</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="cursor-pointer font-semibold text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-2 text-sm sm:text-base">
                      <HiOutlineUpload className="inline text-lg" />
                      <input
                        type="file"
                        accept=".md"
                        className="hidden"
                        onChange={(e) => setMcqFile(e.target.files?.[0] || null)}
                      />
                      Upload MCQ File (.md)
                    </label>
                    {mcqFile && (
                      <p className="text-xs sm:text-sm text-slate-500 max-w-xs truncate" title={mcqFile.name}>
                        {mcqFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-black/5 dark:border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/topics/${courseId}`)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 text-sm font-semibold shadow transition shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-70 w-full sm:w-auto"
                    disabled={loading}
                  >
                    <FiSave className="w-4 h-4" />
                    {loading ? "Saving..." : "Save changes"}
                  </button>
                </div>

              </form>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
};

export default EditTopicForm;
