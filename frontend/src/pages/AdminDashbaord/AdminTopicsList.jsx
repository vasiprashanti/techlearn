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
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // Edit topic modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editTopicForm, setEditTopicForm] = useState({
    topicName: "",
    notesBody: "",
    notesFile: null,
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Image Upload states & handlers inside Edit Topic Modal
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

  // Delete topic modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

  // Add topic modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTopicForm, setAddTopicForm] = useState({
    topicName: "",
    notesFile: null,
  });
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [numTopics, setNumTopics] = useState(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [assignedBatchIds, setAssignedBatchIds] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [courseType, setCourseType] = useState("Self-paced");
  const [instructor, setInstructor] = useState("");
  const [duration, setDuration] = useState("");
  const [schedule, setSchedule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerFile, setBannerFile] = useState(null);

  // Theme & layout states
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCourseBatch = (batchId) => {
    setAssignedBatchIds((prev) => {
      const alreadyChecked = prev.map(String).includes(String(batchId));
      if (alreadyChecked) {
        return prev.filter((id) => String(id) !== String(batchId));
      } else {
        return [...prev, batchId];
      }
    });
  };

  // Fetch topics + course info + batches
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
        setAssignedBatchIds(res.data.assignedBatchIds || []);
        setCourseType(res.data.courseType || "Self-paced");
        setInstructor(res.data.instructor || "");
        setDuration(res.data.duration || "");
        setSchedule(res.data.schedule || "");
        setStartDate(res.data.startDate || "");
        setBannerImage(res.data.bannerImage || "");
        setError(null);

        // Fetch batch options for assignment checklist
        try {
          const batchesRes = await axios.get(
            `${BASE_URL}/admin/batches`,
            token ? { headers: { Authorization: `Bearer ${token}` } } : {}
          );
          const formatted = (batchesRes.data.data || batchesRes.data.batches || batchesRes.data || []).map((b) => ({
            id: b.id || b._id,
            name: b.name,
            college: b.college || b.collegeName || "",
          }));
          setBatchOptions(formatted);
        } catch (bErr) {
          console.error("Failed to load batch list options:", bErr);
        }
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

      const topicTitles = [addTopicForm.topicName.trim()];
      formData.append("titles", JSON.stringify(topicTitles));

      const mcqFilesInfo = [{
        index: 0,
        hasMcq: false,
        mcqFileName: ""
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
        mcqFile: "",
        notesFilePath: uploadedTopic.notesFilePath || null,
        mcqFilePath: null,
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
    });
    setEditError("");
    setEditSuccess("");
    // Reset image upload state so previous topic's image doesn't bleed over
    setImageFile(null);
    setUploadedImageUrl("");
    setUploadedImageMarkdown("");
    setImageError("");
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
      const formData = new FormData();
      formData.append("title", courseTitle);
      formData.append("description", description);
      formData.append("level", level);
      formData.append("numTopics", String(numTopics));

      if (courseType === "Self-paced") {
        formData.append("assignedBatchIds", JSON.stringify(assignedBatchIds));
      } else {
        formData.append("instructor", instructor);
        formData.append("duration", duration);
        formData.append("schedule", schedule);
        formData.append("startDate", startDate);
      }

      if (bannerFile) {
        formData.append("bannerFile", bannerFile);
      }

      await axios.put(
        `${BASE_URL}/admin/${courseId}`,
        formData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      alert("Course details updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update course details.");
    }
  };



  const cardFormInputClass = "mt-1 w-full px-3 py-2.5 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-[#f5f8fc] dark:bg-[#122b52] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";
  const categoryFormInputClass = "mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";
  const dropdownOptionClass = "bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white";
  const configCardClass = "rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#0f1f43] overflow-hidden";

  if (loading && topics.length === 0) {
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

            <form onSubmit={handleAddTopicSubmit}>
              <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto minimal-scrollbar">
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



                {addError && (
                  <p className="text-xs text-red-500">{addError}</p>
                )}
                {addSuccess && (
                  <p className="text-xs text-emerald-500">{addSuccess}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
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

            <form onSubmit={handleEditTopicSubmit}>
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto minimal-scrollbar">
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

                {/* Markdown Image Upload Panel inside Edit Topic Modal */}
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



                {editError && (
                  <p className="text-xs text-red-500">{editError}</p>
                )}
                {editSuccess && (
                  <p className="text-xs text-emerald-500">{editSuccess}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
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

          <section className="space-y-6">

            {/* Course configuration cards */}
            <div className="space-y-4 pb-6 border-b border-black/5 dark:border-white/10">

              {/* Edit Course Details */}
              <div className={configCardClass}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-black/5 dark:border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center shrink-0">
                    <FiSave className="w-4 h-4 text-[#3C83F6] dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-[15px] font-semibold text-[#0b1b38] dark:text-white">Edit Course Details</h3>
                    <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300">Modify the core track details of this curriculum.</p>
                  </div>
                </div>

                <form onSubmit={handleCourseDetailsUpdate} className="p-5 space-y-4">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Course Title*</label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className={cardFormInputClass}
                      placeholder="e.g. Python Programming, DSA with Java"
                      required
                    />
                  </div>

                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={`${cardFormInputClass} resize-none`}
                      placeholder="Summarize course goals and curriculum syllabus..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Topics Count</label>
                      <input
                        type="number"
                        min="1"
                        value={numTopics}
                        onChange={(e) => setNumTopics(Number(e.target.value))}
                        className={cardFormInputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Difficulty Level</label>
                      <div className="relative">
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className={`${cardFormInputClass} pr-10 appearance-none`}
                        >
                          <option className={dropdownOptionClass} value="Beginner">Beginner</option>
                          <option className={dropdownOptionClass} value="Intermediate">Intermediate</option>
                          <option className={dropdownOptionClass} value="Advanced">Advanced</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                      </div>
                    </div>

                    {courseType === "Self-paced" ? (
                      <div className="col-span-2">
                        <label className="admin-micro-label text-black/45 dark:text-white/45">Assign to Batch(es)</label>
                        <div className="mt-1 h-[126px] overflow-y-auto rounded-lg border border-black/10 dark:border-white/10 bg-[#f5f8fc] dark:bg-[#122b52] p-2 space-y-1 minimal-scrollbar">
                          {batchOptions.map((batch) => {
                            const checked = assignedBatchIds.map(String).includes(String(batch.id));
                            return (
                              <label key={batch.id} className="flex items-start gap-2 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCourseBatch(batch.id)}
                                  className="mt-0.5"
                                />
                                <span>
                                  <span className="font-medium">{batch.name}</span>
                                  {batch.college && <span className="block text-[10px] text-[#5f7592] dark:text-slate-400">{batch.college}</span>}
                                </span>
                              </label>
                            );
                          })}
                          {batchOptions.length === 0 && (
                            <p className="px-2 py-3 text-xs text-[#5f7592] dark:text-slate-350">No batches available.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Instructor Name</label>
                          <input
                            type="text"
                            value={instructor}
                            onChange={(e) => setInstructor(e.target.value)}
                            className={cardFormInputClass}
                            placeholder="e.g. Prashanti Vasi"
                          />
                        </div>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Start Date</label>
                          <input
                            type="text"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={cardFormInputClass}
                            placeholder="e.g. In Progress"
                          />
                        </div>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Duration</label>
                          <input
                            type="text"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className={cardFormInputClass}
                            placeholder="e.g. 4 weeks"
                          />
                        </div>
                        <div>
                          <label className="admin-micro-label text-black/45 dark:text-white/45">Schedule</label>
                          <input
                            type="text"
                            value={schedule}
                            onChange={(e) => setSchedule(e.target.value)}
                            className={cardFormInputClass}
                            placeholder="e.g. Mon-Sat"
                          />
                        </div>
                        </>
                      )}

                      <div className="col-span-2">
                        <label className="admin-micro-label text-black/45 dark:text-white/45 font-medium">Banner Image</label>
                        {bannerImage && (
                          <div className="mb-2 text-xs text-slate-500 truncate">
                            Current: <a href={bannerImage} target="_blank" rel="noreferrer" className="text-[#3C83F6] underline">{bannerImage}</a>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                          className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#3C83F6]/10 file:text-[#3C83F6] hover:file:bg-[#3C83F6]/20 cursor-pointer w-full mt-1"
                        />
                      </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-black/5 dark:border-white/10">
                    <button
                      type="submit"
                      className="dashboard-primary-btn h-9 px-4 text-xs inline-flex items-center gap-1.5 mt-3"
                    >
                      <FiSave className="w-3.5 h-3.5" />
                      Save Course Details
                    </button>
                  </div>
                </form>
              </div>



            </div>

            {/* Curriculum topics table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-[15px] font-semibold text-[#0b1b38] dark:text-white">
                  Curriculum Topics ({topics.length})
                </h3>
              </div>

              {slots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-8 text-center text-sm text-black/40 dark:text-white/40">
                  No curriculum topics configured yet.
                </div>
              ) : (
                <div className="overflow-auto max-h-[78vh] bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl">
                  <table className="w-full min-w-[900px] table-fixed">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 select-none">
                        <th className="px-4 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-16 whitespace-nowrap">#</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[300px] whitespace-nowrap">Topic Name</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap">Slug</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[200px] whitespace-nowrap">Status</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[150px] whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="border-t border-black/5 dark:border-white/10">
                      {slots.map(({ slotIndex, topic }) => {
                        if (topic) {
                          return (
                            <tr key={topic.topicId} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                              <td className="px-4 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap">{slotIndex}</td>
                              <td className="px-4 py-2.5 text-[11px] sm:text-xs font-semibold truncate text-slate-800 dark:text-white/85" title={topic.topicName}>{topic.topicName}</td>
                              <td className="px-4 py-2.5 text-[11px] sm:text-xs truncate text-slate-500 dark:text-white/60" title={topic.topicSlug}>{topic.topicSlug}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 dark:text-slate-350">
                                  <FiFileText className="w-3.5 h-3.5 text-[#3C83F6]" />
                                  <span>Notes configured</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditClick(topic)}
                                    className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 text-slate-500 dark:text-slate-400"
                                    title="Edit Topic Content"
                                  >
                                    <FiEdit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(topic)}
                                    className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 text-slate-500 dark:text-slate-400"
                                    title="Delete Topic"
                                  >
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        } else {
                          return (
                            <tr key={`empty-${slotIndex}`} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                              <td className="px-4 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">{slotIndex}</td>
                              <td className="px-4 py-2.5 text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 italic" colSpan={3}>
                                No topic configured. Click configure to add notes and quiz worksheets.
                              </td>
                              <td className="px-4 py-2.5">
                                <button
                                  onClick={() => {
                                    setSelectedSlotIndex(slotIndex);
                                    setAddTopicForm({ topicName: "", notesFile: null });
                                    setAddError("");
                                    setAddSuccess("");
                                    setShowAddModal(true);
                                  }}
                                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3.5 bg-[#3C83F6]/10 hover:bg-[#3C83F6]/20 text-[#3C83F6] dark:text-[#8fd9ff] rounded-lg text-xs font-semibold transition"
                                >
                                  <FiPlus className="w-3 h-3" />
                                  Configure
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
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
