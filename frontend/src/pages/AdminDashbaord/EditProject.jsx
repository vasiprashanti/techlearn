import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useNavigate, useParams } from "react-router-dom";
import { adminAPI } from "../../services/adminApi";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowLeft, FiSave, FiUpload, FiX, FiFileText, FiArchive, FiTrash2, FiEdit2 } from "react-icons/fi";

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
  const [activeTab, setActiveTab] = useState("Overview");
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
    overview_markdown_content: ""
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

  const navigate = useNavigate();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    fetchProject();
  }, [projectId]);

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
          overview_markdown_content: data.overview_markdown_content || ""
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
        setExistingFileUrl(data.overview_markdown_file_url || "");
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
                            {existingFileUrl ? "overview.md (Staged in DB)" : "No file uploaded"}
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
                                {overviewFile ? overviewFile.name : (existingFileUrl ? "overview.md (Uploaded)" : "No file chosen")}
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
            )}

            {activeTab !== "Overview" && (
              <div className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-2xl p-12 text-center text-slate-400 shadow-[0_4px_24px_rgba(0,0,0,0.015)]">
                <FiFileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Content for {activeTab} is coming soon.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
