import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { HiOutlineUpload } from "react-icons/hi";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowLeft, FiEdit2, FiSave, FiAward, FiFileText, FiTrash2, FiPlus, FiChevronDown } from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_API_URL || "";

const AdminTopicsList = () => {
  const { courseId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [exerciseFile, setExerciseFile] = useState(null);
  const [exerciseStatus, setExerciseStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Edit topic modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editTopicForm, setEditTopicForm] = useState({
    topicName: "",
    notesBody: "",
    notesFile: null,
    mcqFile: null,
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete topic modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

  // Add topic modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTopicForm, setAddTopicForm] = useState({
    topicName: "",
    notesFile: null,
    mcqFile: null,
  });
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [numTopics, setNumTopics] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("Beginner");

  // Theme & layout states
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch topics + course info
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${BASE_URL}/admin/${courseId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        setTopics(res.data.topics || []);
        setCourseTitle(res.data.courseTitle || "");
        setNumTopics(res.data.numTopics || 0);
        setDescription(res.data.description || "");
        setLevel(res.data.level || "Beginner");
        setError(null);
      } catch (err) {
        setError("Failed to fetch topics.");
      }
      setLoading(false);
    };
    fetchTopics();
  }, [courseId]);

  const handleAddTopicSubmit = async (e) => {
    e.preventDefault();
    if (!addTopicForm.topicName.trim()) {
      setAddError("Topic name is required.");
      return;
    }
    if (!addTopicForm.notesFile) {
      setAddError("Study notes file (.md) is required.");
      return;
    }

    setAddSaving(true);
    setAddError("");
    setAddSuccess("");

    try {
      const token = localStorage.getItem("token");

      // 1. Upload files first
      const formData = new FormData();
      formData.append("notesFile0", addTopicForm.notesFile);
      if (addTopicForm.mcqFile) {
        formData.append("mcqFile0", addTopicForm.mcqFile);
      }

      const topicTitles = [addTopicForm.topicName.trim()];
      formData.append("titles", JSON.stringify(topicTitles));

      const mcqFilesInfo = [{
        index: 0,
        hasMcq: !!addTopicForm.mcqFile,
        mcqFileName: addTopicForm.mcqFile ? addTopicForm.mcqFile.name : ""
      }];
      formData.append("mcqFilesInfo", JSON.stringify(mcqFilesInfo));

      const filesRes = await axios.post(`${BASE_URL}/admin/files`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const filesData = filesRes.data;
      const processedTopics = filesData.topics || [];
      const uploadedTopic = processedTopics[0] || {};

      const targetIndex = selectedSlotIndex || (topics.length + 1);

      // 2. Prepare payload and create the topic
      const finalTopics = [{
        title: uploadedTopic.title || addTopicForm.topicName.trim(),
        noteFile: addTopicForm.notesFile.name,
        mcqFile: addTopicForm.mcqFile ? addTopicForm.mcqFile.name : "",
        notesFilePath: uploadedTopic.notesFilePath || null,
        mcqFilePath: uploadedTopic.mcqFilePath || null,
        index: targetIndex
      }];

      const payload = {
        topics: finalTopics,
        exerciseFileName: "",
        processedTopics: processedTopics,
      };

      const topicsRes = await axios.post(
        `${BASE_URL}/admin/${courseId}/topics`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      setAddSuccess("Topic added successfully!");

      const dbResult = topicsRes.data.results?.[0];
      if (dbResult) {
        setTopics(prev => [...prev, {
          topicId: dbResult.id,
          topicName: dbResult.title,
          topicSlug: dbResult.slug,
          index: dbResult.index,
          notesId: dbResult.notesId,
        }]);
      } else {
        const refreshRes = await axios.get(
          `${BASE_URL}/admin/${courseId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        setTopics(refreshRes.data.topics || []);
      }

      try {
        await axios.delete(`${BASE_URL}/admin/notes/exercises/cleanup`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      } catch (cleanupErr) {
        console.warn("Cleanup failed:", cleanupErr.message);
      }

      setTimeout(() => {
        setShowAddModal(false);
        setAddTopicForm({
          topicName: "",
          notesFile: null,
          mcqFile: null,
        });
      }, 1000);

    } catch (err) {
      console.error(err);
      setAddError(err.response?.data?.message || err.message || "Failed to add topic.");
    } finally {
      setAddSaving(false);
    }
  };

  const handleEditClick = (topic) => {
    setEditingTopic(topic);
    setEditTopicForm({
      topicName: topic.topicName || "",
      notesBody: topic.notesContent || "",
      notesFile: null,
      mcqFile: null,
    });
    setEditError("");
    setEditSuccess("");
    setShowEditModal(true);
  };

  const handleDeleteClick = (topic) => {
    setTopicToDelete(topic);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${BASE_URL}/admin/topic/${topicToDelete.topicId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setTopics(prev => prev.filter(t => t.topicId !== topicToDelete.topicId));
      alert("Topic deleted successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete topic.");
    } finally {
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
    }
  };

  const handleEditTopicSubmit = async (e) => {
    e.preventDefault();
    if (!editTopicForm.topicName.trim()) {
      setEditError("Topic name is required.");
      return;
    }
    setEditSaving(true);
    setEditError("");
    setEditSuccess("");

    try {
      const formData = new FormData();
      formData.append("topicName", editTopicForm.topicName.trim());
      formData.append("notesBody", editTopicForm.notesBody);
      if (editTopicForm.notesFile) {
        formData.append("notesFile", editTopicForm.notesFile);
      }
      if (editTopicForm.mcqFile) {
        formData.append("mcqFile", editTopicForm.mcqFile);
      }

      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/admin/topic/${editingTopic.topicId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      setEditSuccess("Topic updated successfully!");

      setTopics(prev => prev.map(t =>
        String(t.topicId) === String(editingTopic.topicId)
          ? { ...t, topicName: editTopicForm.topicName.trim(), notesContent: editTopicForm.notesBody }
          : t
      ));

      setTimeout(() => {
        setShowEditModal(false);
        setEditingTopic(null);
      }, 1000);
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || "Failed to update topic.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCourseDetailsUpdate = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/admin/${courseId}`,
        {
          title: courseTitle,
          description: description,
          level: level,
          numTopics: numTopics,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      alert("Course details updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update course details.");
    }
  };

  const handleExerciseFileChange = (file) => {
    setExerciseFile(file);
    if (file) {
      setExerciseStatus(`Selected file: ${file.name}`);
    } else {
      setExerciseStatus("");
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!exerciseFile) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("exerciseFile", exerciseFile);

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/admin/${courseId}/exercise`,
        formData,
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          : {}
      );
      alert("Exercises updated successfully!");
      setExerciseStatus(`Uploaded: ${exerciseFile.name}`);
      setExerciseFile(null);
    } catch (err) {
      alert("Failed to update exercises.");
    } finally {
      setUploading(false);
    }
  };

  const categoryFormInputClass = "w-full px-3 py-2 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";

  if (loading && topics.length === 0 && !exerciseFile) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
        <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'
        }`}
      />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />
        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden flex items-center justify-center`}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
        <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
            : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'
        }`}
      />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />
        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden flex items-center justify-center`}>
          <div className="text-red-500 font-semibold">{error}</div>
        </main>
      </div>
    );
  }

  const totalSlotsCount = Math.max(numTopics, topics.length);
  const mappedTopics = new Set();
  
  const slots = Array.from({ length: totalSlotsCount }, (_, i) => {
    const slotIndex = i + 1;
    let topic = topics.find(t => t.index === slotIndex);
    if (topic) {
      mappedTopics.add(topic.topicId);
    } else {
      topic = topics.find(t => !mappedTopics.has(t.topicId));
      if (topic) {
        mappedTopics.add(topic.topicId);
      }
    }
    return {
      slotIndex,
      topic: topic || null
    };
  });

  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
        isDarkMode ? "dark" : "light"
      }`}
    >
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      {/* Add Topic Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                Add New Topic
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-white">Close</button>
            </div>

            <form onSubmit={handleAddTopicSubmit} className="p-5 space-y-4">
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Topic Name*</label>
                <input
                  value={addTopicForm.topicName}
                  onChange={(e) => setAddTopicForm(prev => ({ ...prev, topicName: e.target.value }))}
                  placeholder="e.g. Introduction to Python"
                  className={categoryFormInputClass}
                  required
                />
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Study Notes File (.md)*</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 shadow-sm">
                    <HiOutlineUpload className="text-sm" />
                    <input
                      type="file"
                      accept=".md"
                      className="hidden"
                      onChange={(e) => setAddTopicForm(prev => ({ ...prev, notesFile: e.target.files?.[0] || null }))}
                      required
                    />
                    Choose Notes
                  </label>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {addTopicForm.notesFile ? addTopicForm.notesFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">MCQ Quiz File (.csv / .md) (Optional)</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 shadow-sm">
                    <HiOutlineUpload className="text-sm" />
                    <input
                      type="file"
                      accept=".csv,.md"
                      className="hidden"
                      onChange={(e) => setAddTopicForm(prev => ({ ...prev, mcqFile: e.target.files?.[0] || null }))}
                    />
                    Choose Quiz
                  </label>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {addTopicForm.mcqFile ? addTopicForm.mcqFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {addError && (
                <p className="text-xs text-red-500">{addError}</p>
              )}
              {addSuccess && (
                <p className="text-xs text-emerald-500">{addSuccess}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-5 py-2 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition disabled:opacity-70"
                >
                  {addSaving ? "Adding..." : "Add Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Topic Modal Popup */}
      {showEditModal && editingTopic && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditingTopic(null); }} />
          <div className="relative w-full max-w-3xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                Edit Topic Details
              </h2>
              <button onClick={() => { setShowEditModal(false); setEditingTopic(null); }} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-white">Close</button>
            </div>

            <form onSubmit={handleEditTopicSubmit} className="p-5 space-y-4">
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Topic Name*</label>
                <input
                  value={editTopicForm.topicName}
                  onChange={(e) => setEditTopicForm(prev => ({ ...prev, topicName: e.target.value }))}
                  placeholder="e.g. Introduction to Python"
                  className={categoryFormInputClass}
                />
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Study Notes File (.md)</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 shadow-sm">
                    <HiOutlineUpload className="text-sm" />
                    <input
                      type="file"
                      accept=".md"
                      className="hidden"
                      onChange={(e) => setEditTopicForm(prev => ({ ...prev, notesFile: e.target.files?.[0] || null }))}
                    />
                    Choose Notes
                  </label>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {editTopicForm.notesFile ? editTopicForm.notesFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Study Notes Markdown</label>
                <textarea
                  value={editTopicForm.notesBody}
                  onChange={(e) => setEditTopicForm(prev => ({ ...prev, notesBody: e.target.value }))}
                  rows={9}
                  placeholder="Edit the markdown notes shown on the Learn page"
                  className={`${categoryFormInputClass} min-h-[180px] resize-y font-mono text-xs leading-6`}
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-300">
                  Edit titles, subtitles, descriptions, lists, tables, and note content directly here.
                </p>
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">MCQ Quiz File (.csv / .md)</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="cursor-pointer bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 shadow-sm">
                    <HiOutlineUpload className="text-sm" />
                    <input
                      type="file"
                      accept=".csv,.md"
                      className="hidden"
                      onChange={(e) => setEditTopicForm(prev => ({ ...prev, mcqFile: e.target.files?.[0] || null }))}
                    />
                    Choose Quiz
                  </label>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {editTopicForm.mcqFile ? editTopicForm.mcqFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {editError && (
                <p className="text-xs text-red-500">{editError}</p>
              )}
              {editSuccess && (
                <p className="text-xs text-emerald-500">{editSuccess}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingTopic(null); }}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition disabled:opacity-70"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Topic Confirmation Modal Popup */}
      {showDeleteConfirm && topicToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => { setShowDeleteConfirm(false); setTopicToDelete(null); }} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">
              Delete Topic?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the topic <strong className="text-slate-800 dark:text-white">&ldquo;{topicToDelete.topicName}&rdquo;</strong> from this course track?
              <br /><br />
              <span className="text-xs text-rose-500 font-medium">⚠️ This action will remove the topic from this curriculum registry locally.</span>
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setTopicToDelete(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTopic}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 
          ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
          pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin/courses")}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-4 transition"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Courses
            </button>
          </div>

          <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0f274f] p-4 md:p-6 space-y-6">
            
            {/* Quick configurations block */}
            <div className="grid grid-cols-1 gap-6 pb-6 border-b border-black/5 dark:border-white/5">
              
              {/* Edit Course Details Panel */}
              <div className="bg-[#f5fbff] dark:bg-[#122b52] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                <div>
                  <h3 className="admin-section-heading mb-2 text-[#0b1b38] dark:text-white font-semibold">Edit Course Details</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-300 mb-4">Modify the core track details of this curriculum.</p>
                </div>
                <form onSubmit={handleCourseDetailsUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50">Course Title</label>
                      <input
                        type="text"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        className={categoryFormInputClass}
                        placeholder="Enter course title"
                        required
                      />
                    </div>
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50">Difficulty Level</label>
                      <div className="relative rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35">
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="appearance-none w-full px-3 py-2 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                        >
                          <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="Beginner">Beginner</option>
                          <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="Intermediate">Intermediate</option>
                          <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="Advanced">Advanced</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className={`${categoryFormInputClass} resize-none`}
                        placeholder="Enter course description"
                      />
                    </div>
                    <div>
                      <label className="admin-micro-label text-black/50 dark:text-white/50">Topics Count</label>
                      <input
                        type="number"
                        min="1"
                        value={numTopics}
                        onChange={(e) => setNumTopics(Number(e.target.value))}
                        className={categoryFormInputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#3C83F6] hover:bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow transition flex items-center gap-1.5"
                    >
                      <FiSave className="w-4 h-4" />
                      Save Course Details
                    </button>
                  </div>
                </form>
              </div>

              {/* Edit Exercises Panel */}
              <div className="bg-[#f5fbff] dark:bg-[#122b52] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="admin-section-heading mb-2 text-[#0b1b38] dark:text-white font-semibold">Upload Exercise File</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-300 mb-4">Configure or replace the exercise challenge sheet (.md file).</p>
                </div>
                <div className="flex flex-col justify-end">
                  <form onSubmit={handleFileUpload} className="flex items-center justify-between gap-4">
                    <label className="cursor-pointer font-semibold text-[#3C83F6] hover:underline inline-flex items-center gap-1.5 text-sm">
                      <HiOutlineUpload className="inline text-lg" />
                      <input
                        type="file"
                        accept=".md"
                        className="hidden"
                        onChange={(e) => handleExerciseFileChange(e.target.files?.[0] || null)}
                      />
                      Choose File
                    </label>
                    <button
                      type="submit"
                      className="bg-[#3C83F6] hover:bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow transition disabled:opacity-50"
                      disabled={uploading || !exerciseFile}
                    >
                      {uploading ? "Uploading..." : "Submit"}
                    </button>
                  </form>
                  {exerciseStatus && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-300 truncate" title={exerciseStatus}>
                      {exerciseStatus}
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Grid of topic cards (slots) */}
            <div>
              <div className="pb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#0b1b38] dark:text-white">
                  Curriculum Topics ({topics.length})
                </h3>
              </div>

              {slots.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic text-sm">
                  No curriculum topics configured yet.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {slots.map(({ slotIndex, topic }) => {
                    if (topic) {
                      return (
                        <div 
                          key={topic.topicId} 
                          className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between transition hover:border-[#3C83F6]/50 gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#3C83F6]/10 text-[#3C83F6] dark:text-[#8fd9ff] flex items-center justify-center font-bold text-sm shrink-0">
                              {slotIndex}
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-black dark:text-white line-clamp-1" title={topic.topicName}>
                                {topic.topicName}
                              </h4>
                              <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5 truncate" title={topic.topicSlug}>
                                Slug: {topic.topicSlug}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-300">
                              <FiFileText className="w-3.5 h-3.5 text-[#3C83F6]" />
                              <span>Notes configured</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleEditClick(topic)}
                                className="h-9 w-9 rounded-xl inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] transition text-slate-500 dark:text-slate-400"
                                title="Edit Topic Content"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(topic)}
                                className="h-9 w-9 rounded-xl inline-flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] transition text-slate-500 dark:text-slate-400"
                                title="Delete Topic"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div 
                          key={`empty-${slotIndex}`} 
                          className="border border-dashed border-black/20 dark:border-white/20 hover:border-[#3C83F6]/50 bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between transition gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center font-bold text-sm shrink-0">
                              {slotIndex}
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-slate-400 dark:text-slate-500">
                                No topic configured
                              </h4>
                              <p className="text-xs text-slate-400/70 dark:text-slate-500/70 mt-0.5">
                                Click configure to add notes and quiz worksheets.
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedSlotIndex(slotIndex);
                              setAddTopicForm({ topicName: "", notesFile: null, mcqFile: null });
                              setAddError("");
                              setAddSuccess("");
                              setShowAddModal(true);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 bg-[#3C83F6]/10 hover:bg-[#3C83F6]/20 text-[#3C83F6] dark:text-[#8fd9ff] rounded-xl text-xs font-semibold transition sm:w-auto w-full"
                          >
                            <FiPlus className="w-3.5 h-3.5" />
                            Configure Topic
                          </button>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>

          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminTopicsList;
