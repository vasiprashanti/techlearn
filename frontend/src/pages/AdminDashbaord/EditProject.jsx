import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { adminAPI } from "../../services/adminApi";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowLeft, FiSave, FiUpload, FiX, FiArchive, FiTrash2, FiEdit2, FiBookOpen, FiCopy } from "react-icons/fi";
import DayConfiguration from "../../components/AdminDashbaord/DayConfiguration";
import StudentAssignmentPanel from "../../components/AdminDashbaord/StudentAssignmentPanel";
import ProjectProgressMonitor from "../../components/AdminDashbaord/ProjectProgressMonitor";
import MarkdownContent from "../Learn/MarkdownContent";

const CATEGORIES = [
  "Java Full Stack",
  "Web Development",
  "AIML",
  "DSA Java",
  "DSA Python",
  "Python",
  "MERN",
  "Mini Projects",
  "Major Projects",
  "Other"
];

const TABS = ["Overview", "Days & Tasks", "Students", "Submissions"];

export default function EditProject() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const isGeneratedProjectFlow = searchParams.get("generated") === "1";
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "days-tasks" ? "Days & Tasks" : "Overview"
  );
  const [isEditing, setIsEditing] = useState(false);

  // Project data state (original details fetched from DB)
  const [projectDetails, setProjectDetails] = useState({
    title: "",
    description: "",
    category: "",
    duration_days: "",
    xp_requirement: "",
    status: "",
    overview_markdown_file_url: "",
    overview_markdown_content: "",
    overview_markdown_original_name: ""
  });

  // Edit form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Java Full Stack",
    duration_days: "",
    xp_requirement: "",
    status: "Draft",
    overview_markdown_content: ""
  });

  const [existingFileUrl, setExistingFileUrl] = useState("");
  const [overviewFile, setOverviewFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Actions modal states
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Phase 2 states
  const [projectDays, setProjectDays] = useState([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loadingDays, setLoadingDays] = useState(false);
  const [analytics, setAnalytics] = useState({ totalStudents: 0, activeStudents: 0, averageProgress: 0, averageXp: 0, completionRate: 0 });
  const [duplicatingDayId, setDuplicatingDayId] = useState(null);
  const [deletingDayId, setDeletingDayId] = useState(null);

  const navigate = useNavigate();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    fetchProject();
    fetchProjectAnalytics();
  }, [projectId]);

  useEffect(() => {
    if (isGeneratedProjectFlow) {
      setSuccess("Project created as a Draft. Days and tasks have been auto-generated and are ready to configure.");
    }
  }, [isGeneratedProjectFlow]);

  useEffect(() => {
    if (activeTab === "Days & Tasks" && projectId) {
      fetchProjectDays();
    }
  }, [activeTab, projectId]);

  const fetchProjectDays = async () => {
    setLoadingDays(true);
    try {
      const data = await adminAPI.getProjectDays(projectId);
      setProjectDays(data || []);
    } catch (err) {
      console.error("Error fetching project days:", err);
      setError("Failed to fetch project days checklist.");
    } finally {
      setLoadingDays(false);
    }
  };

  const fetchProjectAnalytics = async () => {
    try {
      const data = await adminAPI.getProjectAnalytics(projectId);
      setAnalytics({
        totalStudents: data?.totalStudents || 0,
        activeStudents: data?.activeStudents || 0,
        averageProgress: data?.averageProgress || 0,
        averageXp: data?.averageXp || 0,
        completionRate: data?.completionRate || 0,
      });
    } catch (err) {
      console.error("Error fetching project analytics:", err);
    }
  };

  const handleDuplicateDay = async (dayId) => {
    setDuplicatingDayId(dayId);
    setError("");
    try {
      await adminAPI.duplicateProjectDay(dayId);
      await Promise.all([fetchProject(), fetchProjectDays()]);
      setSelectedDayIndex(projectDays.length);
      setSuccess("Day duplicated with its topic, markdown notes, and tasks.");
    } catch (err) {
      setError(err.message || "Failed to duplicate the day.");
    } finally {
      setDuplicatingDayId(null);
    }
  };

  const handleDeleteDay = async (dayId) => {
    setDeletingDayId(dayId);
    setError("");
    try {
      await adminAPI.deleteProjectDay(dayId);
      await Promise.all([fetchProject(), fetchProjectDays()]);
      setSelectedDayIndex(0);
      setSuccess("Day and its tasks deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete the day.");
    } finally {
      setDeletingDayId(null);
    }
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getProject(projectId);
      if (data) {
        setProjectDetails({
          title: data.title || "Untitled Project",
          description: data.description || "",
          category: data.category || "Other",
          duration_days: data.duration_days || 0,
          xp_requirement: data.xp_requirement || 0,
          status: data.status || "Draft",
          overview_markdown_file_url: data.overview_markdown_file_url || "",
          overview_markdown_content: data.overview_markdown_content || "",
          overview_markdown_original_name: data.overview_markdown_original_name || ""
        });

        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "Java Full Stack",
          duration_days: data.duration_days || "",
          xp_requirement: data.xp_requirement || "",
          status: data.status || "Draft",
          overview_markdown_content: data.overview_markdown_content || ""
        });
        
        const originalFileName = data.overview_markdown_original_name || 
          (data.overview_markdown_file_url ? data.overview_markdown_file_url.split("/").pop().replace(/^\d+-/, "") : "") || 
          (data.overview_markdown_content ? "overview.md" : "");
        setExistingFileUrl(originalFileName);
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
      setError("Failed to fetch project details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith(".md")) {
      setError("Please upload a valid Markdown (.md) file.");
      setOverviewFile(null);
      return;
    }
    setError("");
    setOverviewFile(file);
  };

  const handleRemoveFile = () => {
    setOverviewFile(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm({
      title: projectDetails.title,
      description: projectDetails.description,
      category: projectDetails.category,
      duration_days: projectDetails.duration_days,
      xp_requirement: projectDetails.xp_requirement,
      status: projectDetails.status,
      overview_markdown_content: projectDetails.overview_markdown_content
    });
    setOverviewFile(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Project Title is required.");
    if (!form.description.trim()) return setError("Project Description is required.");
    if (!form.duration_days || Number(form.duration_days) <= 0) return setError("Duration must be a positive number.");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("category", form.category);
      formData.append("duration_days", form.duration_days);
      formData.append("xp_requirement", form.xp_requirement || 0);
      formData.append("status", form.status);
      formData.append("overview_markdown_content", form.overview_markdown_content);

      if (overviewFile) {
        formData.append("overviewFile", overviewFile);
      }

      await adminAPI.updateProject(projectId, formData);
      setSuccess("Project updated successfully!");
      setIsEditing(false);
      setOverviewFile(null);
      
      // Refresh details
      setTimeout(() => {
        fetchProject();
        setSuccess("");
      }, 1000);

    } catch (err) {
      console.error("Edit Project Submit Error:", err);
      setError(err.message || "Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveProject = async () => {
    try {
      await adminAPI.archiveProject(projectId);
      const isCurrentlyArchived = projectDetails.status === "Archived";
      setSuccess(isCurrentlyArchived ? "Project unarchived successfully!" : "Project archived successfully!");
      setShowArchiveConfirm(false);
      
      if (isCurrentlyArchived) {
        setTimeout(() => {
          fetchProject();
          setSuccess("");
        }, 1000);
      } else {
        setTimeout(() => navigate("/admin/projects"), 1000);
      }
    } catch (err) {
      setError(err.message || "Operation failed.");
    }
  };

  const handleDeleteProject = async () => {
    try {
      await adminAPI.deleteProject(projectId);
      setSuccess("Project deleted successfully!");
      setShowDeleteConfirm(false);
      setTimeout(() => navigate("/admin/projects"), 1000);
    } catch (err) {
      setError(err.message || "Deletion failed.");
    }
  };

  const categoryFormInputClass = "mt-1 w-full px-3 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const dropdownOptionClass = "bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white";

  if (loading && !projectDetails.title) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />
        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden flex items-center justify-center`}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      {/* Archive Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowArchiveConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-orange-500 dark:text-orange-400">Archive Project?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to soft-archive this project? Active student cohorts will lose visibility but data remains intact.</p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button onClick={() => setShowArchiveConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition">Cancel</button>
              <button onClick={handleArchiveProject} className="px-4 py-2 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition shadow-sm">Confirm Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">Delete Project?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this project? All associated ProjectDays and ProjectTasks will be permanently erased!</p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition">Cancel</button>
              <button onClick={handleDeleteProject} className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}>
        <div className="max-w-[1200px] mx-auto space-y-6">
          
          {/* Back Button */}
          <div>
            <button
              onClick={() => navigate("/admin/projects")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-400 mb-2 transition"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Projects
            </button>
          </div>

          {/* Heading Section (No Section Divider) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{projectDetails.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {projectDetails.category}
                </span>
                <span className="px-3 py-0.5 bg-slate-500/10 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold">
                  {projectDetails.duration_days} Days
                </span>
              </div>
            </div>
          </div>

          {/* Switcher Tab Category Header */}
          <div className="flex items-center gap-6 border-b border-black/10 dark:border-white/10 pb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 text-xs font-bold tracking-wide transition-all border-b-2 relative -bottom-[1px] ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-300 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="pt-4">
            {activeTab === "Overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                  {[
                    ["Total Students", analytics.totalStudents],
                    ["Active Students", analytics.activeStudents],
                    ["Average Progress", `${analytics.averageProgress}%`],
                    ["Average XP", analytics.averageXp],
                    ["Completion Rate", `${analytics.completionRate}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-4 shadow-[0_4px_18px_rgba(0,0,0,0.015)]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                      <p className="mt-2 text-xl font-bold text-[#0c1833] dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
                  <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3 mb-4">
                    <FiBookOpen className="text-blue-500" />
                    <h3 className="text-sm font-bold text-[#0c1833] dark:text-white">Project Overview</h3>
                  </div>
                  {projectDetails.overview_markdown_content ? (
                    <div className="max-w-none admin-dashboard-typography">
                      <MarkdownContent compact>{projectDetails.overview_markdown_content}</MarkdownContent>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-xs font-medium text-slate-400">No overview markdown has been uploaded yet.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
                {/* Left Card: Project Details (2/3 width) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)] flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold text-[#0c1833] dark:text-white">Project Details</h3>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/25 dark:text-blue-300 dark:hover:bg-blue-400/20 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <FiEdit2 className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                    </div>

                    {error && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3.5 rounded-xl text-xs font-semibold mb-4">{error}</div>
                    )}
                    {success && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3.5 rounded-xl text-xs font-semibold mb-4">{success}</div>
                    )}

                    {!isEditing ? (
                      /* VIEW ONLY STATE */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 text-xs text-slate-600 dark:text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Title</span>
                          <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">{projectDetails.title}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Duration</span>
                          <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">{projectDetails.duration_days} Days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Certificate XP Requirement</span>
                          <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">{projectDetails.xp_requirement} XP</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Category</span>
                          <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">{projectDetails.category}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Status</span>
                          <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">{projectDetails.status}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Overview Markdown File</span>
                          <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                            {existingFileUrl ? existingFileUrl : "No file uploaded"}
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">Description</span>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-semibold text-xs whitespace-pre-line">
                            {projectDetails.description || "No description provided."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* EDIT MODE STATE */
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Title*</label>
                            <input
                              type="text"
                              name="title"
                              value={form.title}
                              onChange={handleInputChange}
                              className={categoryFormInputClass}
                              required
                            />
                          </div>
                          <div>
                            <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Duration (Days)*</label>
                            <input
                              type="number"
                              name="duration_days"
                              min="1"
                              value={form.duration_days}
                              onChange={handleInputChange}
                              className={categoryFormInputClass}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Certificate XP Req*</label>
                            <input
                              type="number"
                              name="xp_requirement"
                              min="0"
                              value={form.xp_requirement}
                              onChange={handleInputChange}
                              className={categoryFormInputClass}
                              required
                            />
                          </div>
                          <div>
                            <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Category*</label>
                            <select
                              name="category"
                              value={form.category}
                              onChange={handleInputChange}
                              className={categoryFormInputClass}
                            >
                              {CATEGORIES.map((cat) => (
                                  <option key={cat} className={dropdownOptionClass} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Description*</label>
                          <textarea
                            name="description"
                            value={form.description}
                            onChange={handleInputChange}
                            rows={3}
                            className={`${categoryFormInputClass} resize-none`}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Status*</label>
                            <select
                              name="status"
                              value={form.status}
                              onChange={handleInputChange}
                              className={categoryFormInputClass}
                            >
                              <option className={dropdownOptionClass} value="Draft">Draft</option>
                              <option className={dropdownOptionClass} value="Published">Published</option>
                              <option className={dropdownOptionClass} value="Archived">Archived</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Project Overview File (.md)</label>
                            <div className="mt-1 flex items-center gap-3">
                              <label className="cursor-pointer bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 shadow-sm">
                                <FiUpload className="text-sm" />
                                <input
                                  type="file"
                                  accept=".md"
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                                Choose File
                              </label>
                              <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={overviewFile ? overviewFile.name : (existingFileUrl ? "Stored in DB" : "No file selected")}>
                                {overviewFile ? overviewFile.name : (existingFileUrl ? `${existingFileUrl} (Uploaded)` : "No file chosen")}
                              </span>
                              {overviewFile && (
                                <button type="button" onClick={handleRemoveFile} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-full">
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-4 border-t border-black/5 dark:border-white/5">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2.5 text-xs font-semibold border border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            <FiSave className="w-4 h-4" />
                            {saving ? "Saving Changes..." : "Save Changes"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Right Card: Actions (1/3 width) */}
                <div className="lg:col-span-1 bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)] flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-sm font-bold text-[#0c1833] dark:text-white mb-5">Actions</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <button
                          type="button"
                          onClick={
                            projectDetails.status === "Archived"
                              ? handleArchiveProject
                              : () => setShowArchiveConfirm(true)
                          }
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <FiArchive className="w-4 h-4" />
                          {projectDetails.status === "Archived" ? "Unarchive Project" : "Archive Project"}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1.5 px-1 leading-relaxed">
                          {projectDetails.status === "Archived"
                            ? "Unarchiving will make the project visible as a Draft or Active cohort again."
                            : "Soft-archiving makes the project invisible to students but preserves all user completions and assignments."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-black/5 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete Project
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1.5 px-1 leading-relaxed">
                          Hard deletion permanently cleans up the project details, daily content slots, and configuration tables.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                </div>
              </div>
            )}

            {activeTab === "Days & Tasks" && (
              <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.015)] space-y-4">
                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-semibold">
                    {success}
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-[#0c1833] dark:text-white uppercase tracking-wider">
                    Days Checklist & Configuration
                  </h3>
                </div>

                {loadingDays ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : projectDays.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium text-center py-12">
                    No days generated for this project.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {projectDays.map((day, idx) => (
                        <button
                          key={day._id}
                          type="button"
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] font-bold transition ${selectedDayIndex === idx ? "border-blue-500 bg-blue-500 text-white" : "border-black/10 bg-white/70 text-slate-500 hover:border-blue-500/40 dark:border-white/10 dark:bg-black/10 dark:text-slate-300"}`}
                        >
                          Day {day.day_number}
                        </button>
                      ))}
                    </div>
                    {projectDays.map((day, idx) => {
                      const isExpanded = selectedDayIndex === idx;
                      return (
                        <div
                          key={day._id}
                          className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                            isExpanded
                              ? "border-blue-500/30 bg-slate-50/35 dark:bg-black/15 shadow-sm"
                              : "border-black/5 dark:border-white/5 bg-slate-50/10 dark:bg-black/5 hover:bg-slate-50/40 dark:hover:bg-black/10"
                          }`}
                        >
                          {/* Accordion Trigger Day Card Header */}
                          <div className="w-full p-4 flex items-center justify-between gap-4">
                            <button
                              type="button"
                              onClick={() => setSelectedDayIndex(isExpanded ? null : idx)}
                              className="min-w-0 flex-1 text-left outline-none"
                            >
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                                Day {day.day_number}: {day.topic_title || `Day ${day.day_number} Topic`}
                              </h4>
                              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                                {day.taskCount || 0} Tasks &bull; {day.totalXp || 0} XP
                              </p>
                            </button>
                            
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(event) => { event.stopPropagation(); handleDuplicateDay(day._id); }}
                                disabled={duplicatingDayId === day._id}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-500 disabled:opacity-50"
                              >
                                <FiCopy className="h-3 w-3" />
                                {duplicatingDayId === day._id ? "Duplicating..." : "Duplicate"}
                              </button>
                              <span className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-all">
                                {isExpanded ? "Collapse ▲" : "Configure ▼"}
                              </span>
                            </div>
                          </div>

                          {/* Expanded Day Details & Config Panel */}
                          {isExpanded && (
                            <div className="border-t border-black/5 dark:border-white/5 p-4 bg-white/40 dark:bg-black/20 rounded-b-2xl">
                              <DayConfiguration
                                dayId={day._id}
                                dayNumber={day.day_number}
                                onSave={fetchProjectDays}
                                onDeleteDay={() => handleDeleteDay(day._id)}
                                deletingDay={deletingDayId === day._id}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Students" && (
              <StudentAssignmentPanel projectId={projectId} />
            )}

            {activeTab === "Submissions" && (
              <ProjectProgressMonitor projectId={projectId} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
