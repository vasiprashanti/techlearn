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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Image Upload states & handlers
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadedImageMarkdown, setUploadedImageMarkdown] = useState("");
  const [imageError, setImageError] = useState("");

  const handleImageUpload = async () => {
    if (!imageFile) {
      setImageError("Please select an image file to upload.");
      return;
    }
    setUploadingImage(true);
    setImageError("");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await axios.post(
        `${BASE_URL}/admin/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      setUploadedImageUrl(res.data.url);
      setUploadedImageMarkdown(res.data.markdown);
      setImageFile(null);
    } catch (err) {
      console.error(err);
      setImageError(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

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

          <section className="space-y-4">
            
            {/* Form wrapper in a beautiful premium card */}
            <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl p-5 shadow-sm">
              
              {error && (
                <div className="mb-3 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-semibold">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-3 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
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
                <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-1.5">
                  <h3 className="admin-section-heading">Study Notes File</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="cursor-pointer font-semibold text-[#3C83F6] hover:underline inline-flex items-center gap-2 text-sm">
                      <HiOutlineUpload className="inline text-base" />
                      <input
                        type="file"
                        accept=".md"
                        className="hidden"
                        onChange={(e) => setNotesFile(e.target.files?.[0] || null)}
                      />
                      Upload Notes File (.md)
                    </label>
                    {notesFile && (
                      <p className="text-xs text-slate-500 max-w-xs truncate" title={notesFile.name}>
                        {notesFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-1.5">
                  <h3 className="admin-section-heading">Study Notes Markdown</h3>
                  <textarea
                    value={notesBody}
                    onChange={(e) => setNotesBody(e.target.value)}
                    rows={5}
                    placeholder="Edit the markdown notes shown on the Learn page"
                    className={`${categoryFormInputClass} min-h-[120px] resize-y font-mono text-xs leading-6`}
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-350">
                    Edit titles, subtitles, descriptions, lists, tables, and note content directly here.
                  </p>
                </div>

                {/* Insert Image Section */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-2 bg-[#f5f8fc]/40 dark:bg-[#122b52]/20 p-4 rounded-xl">
                  <h3 className="admin-section-heading font-medium text-slate-800 dark:text-slate-200">Insert Image inside Notes</h3>
                  <p className="text-[11px] text-slate-500">Upload images to generate URLs and copy markdown code to insert them into your notes.</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="cursor-pointer bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 shadow-sm">
                      <HiOutlineUpload className="text-sm" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      />
                      Choose Image
                    </label>
                    <span className="text-xs text-slate-400 truncate max-w-[200px]">
                      {imageFile ? imageFile.name : "No image chosen"}
                    </span>
                    {imageFile && (
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                        className="px-3.5 py-2 text-xs rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-white font-medium disabled:opacity-75"
                      >
                        {uploadingImage ? "Uploading..." : "Upload Image"}
                      </button>
                    )}
                  </div>

                  {imageError && (
                    <p className="text-xs text-red-500 mt-1">{imageError}</p>
                  )}

                  {uploadedImageUrl && (
                    <div className="mt-3 space-y-2 border-t border-black/5 dark:border-white/10 pt-3">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Image uploaded successfully!</p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(uploadedImageUrl)}
                          className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 text-xs text-slate-600 dark:text-slate-350 bg-white dark:bg-[#0f1f43] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"
                        >
                          Copy Image URL
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(uploadedImageMarkdown)}
                          className="px-3 py-1.5 rounded-lg bg-[#3C83F6]/10 text-xs text-[#3C83F6] font-semibold hover:bg-[#3C83F6]/20 transition"
                        >
                          Copy Markdown Code
                        </button>
                      </div>

                      <div className="mt-2 p-2 rounded-lg bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 font-mono text-[10px] text-slate-700 dark:text-slate-350 break-all select-all">
                        {uploadedImageMarkdown}
                      </div>

                      <div className="mt-2 border border-black/5 dark:border-white/10 rounded-lg overflow-hidden max-w-[200px] max-h-[120px] bg-slate-100 dark:bg-slate-900">
                        <img src={uploadedImageUrl} alt="Uploaded preview" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>



                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10 mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/topics/${courseId}`)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 text-sm font-semibold shadow transition shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-70 w-full sm:w-auto"
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
