import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/adminApi";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronDown, FiPlus, FiTrash2, FiSearch, FiFolder, FiArchive, FiUsers, FiClock, FiExternalLink, FiCopy, FiUpload, FiX, FiSave, FiActivity, FiTrendingUp, FiMoreHorizontal } from "react-icons/fi";

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

const STATUS_FILTERS = ["All", "Draft", "Published", "Archived"];

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    archivedProjects: 0,
    studentsAssigned: 0,
    studentsActive: 0,
    averageProgress: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Projects");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("created_desc");
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Create Project Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "",
    duration_days: "",
    xp_requirement: ""
  });
  const [overviewFile, setOverviewFile] = useState(null);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  // Modals state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState(null);

  const navigate = useNavigate();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isDarkMode = theme === "dark";

  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!event.target.closest(`.project-actions-trigger`) && !event.target.closest(`.project-actions-menu`)) {
        setOpenActionMenuId(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      setError(null);
      const [projectsData, metricsData] = await Promise.all([
        adminAPI.getProjects(),
        adminAPI.getProjectMetrics()
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      if (metricsData) {
        setMetrics({
          totalProjects: metricsData.totalProjects || 0,
          activeProjects: metricsData.activeProjects || 0,
          archivedProjects: metricsData.archivedProjects || 0,
          studentsAssigned: metricsData.studentsAssigned || 0,
          studentsActive: metricsData.studentsActive || 0,
          averageProgress: metricsData.averageProgress || 0,
          completionRate: metricsData.completionRate || 0
        });
      }
    } catch (err) {
      console.error("Error fetching projects and metrics:", err);
      setError(err.message || "Failed to load project database.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProjects = projects.filter((project) => selectedProjectIds.includes(project._id));

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const clearSelection = () => {
    setSelectedProjectIds([]);
    setBulkDeleteConfirm(false);
  };

  const handleBulkArchive = async () => {
    if (selectedProjectIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const archiveTargets = selectedProjects.filter((project) => project.status !== "Archived");
      await Promise.all(archiveTargets.map((project) => adminAPI.archiveProject(project._id)));
      clearSelection();
      fetchData();
    } catch (err) {
      console.error("Bulk archive failed:", err);
      alert(`Bulk archive failed: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjectIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedProjectIds.map((projectId) => adminAPI.deleteProject(projectId)));
      clearSelection();
      fetchData();
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert(`Bulk delete failed: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleArchiveClick = async (project) => {
    if (project.status === "Archived") {
      try {
        await adminAPI.archiveProject(project._id);
        fetchData();
      } catch (err) {
        console.error("Error unarchiving project:", err);
        alert(`Unarchiving failed: ${err.message}`);
      }
    } else {
      setProjectToArchive(project);
      setShowArchiveConfirm(true);
    }
  };

  const confirmArchive = async () => {
    if (!projectToArchive) return;
    try {
      await adminAPI.archiveProject(projectToArchive._id);
      fetchData();
      setShowArchiveConfirm(false);
      setProjectToArchive(null);
    } catch (err) {
      console.error("Error archiving project:", err);
      alert(`Archiving failed: ${err.message}`);
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await adminAPI.deleteProject(projectToDelete._id);
      fetchData();
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Error deleting project:", err);
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleDuplicateClick = async (project) => {
    try {
      if (!project.overview_markdown_content) {
        throw new Error("This project cannot be duplicated because its overview markdown is missing.");
      }

      const formData = new FormData();
      formData.append("title", `${project.title} (Copy)`);
      formData.append("description", project.description);
      formData.append("category", project.category);
      formData.append("duration_days", project.duration_days);
      formData.append("xp_requirement", project.xp_requirement || 0);
      formData.append(
        "overviewFile",
        new File(
          [project.overview_markdown_content],
          project.overview_markdown_original_name || "overview.md",
          { type: "text/markdown" }
        )
      );

      await adminAPI.createProject(formData);
      fetchData();
      alert("Project duplicated successfully as a Draft!");
    } catch (err) {
      console.error("Error duplicating project:", err);
      alert(`Duplication failed: ${err.message}`);
    }
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith(".md")) {
      setCreateError("Please upload a valid Markdown (.md) file.");
      setOverviewFile(null);
      return;
    }
    setCreateError("");
    setOverviewFile(file);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return setCreateError("Project Title is required.");
    if (!createForm.description.trim()) return setCreateError("Project Description is required.");
    if (!createForm.category) return setCreateError("Please select a project category.");
    if (!createForm.duration_days || Number(createForm.duration_days) <= 0) return setCreateError("Duration must be a positive number.");
    if (!overviewFile) return setCreateError("Please upload an Overview Markdown file.");

    setCreateSaving(true);
    setCreateError("");

    try {
      const formData = new FormData();
      formData.append("title", createForm.title.trim());
      formData.append("description", createForm.description.trim());
      formData.append("category", createForm.category);
      formData.append("duration_days", createForm.duration_days);
      formData.append("xp_requirement", createForm.xp_requirement || 0);
      formData.append("overviewFile", overviewFile);

      const createdProject = await adminAPI.createProject(formData);
      const projectId = createdProject?.project?._id || createdProject?._id;
      if (!projectId) throw new Error("Project was created, but its setup page could not be opened.");

      setShowCreateModal(false);
      setCreateForm({
        title: "",
        description: "",
        category: "",
        duration_days: "",
        xp_requirement: ""
      });
      setOverviewFile(null);
      navigate(`/admin/projects/edit/${projectId}?tab=days-tasks&generated=1`);
    } catch (err) {
      console.error("Create Project Modal Submit Error:", err);
      setCreateError(err.message || "Failed to create project.");
    } finally {
      setCreateSaving(false);
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter((project) => {
      const titleMatches = project.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let categoryMatches = true;
      if (selectedCategory !== "All Projects") {
        const cleanSelected = selectedCategory.endsWith("s") ? selectedCategory.slice(0, -1) : selectedCategory;
        const cleanModel = project.category.endsWith("s") ? project.category.slice(0, -1) : project.category;
        categoryMatches = cleanModel.toLowerCase().trim() === cleanSelected.toLowerCase().trim();
      }

      const statusMatches = selectedStatus === "All" || project.status === selectedStatus;
      
      return titleMatches && categoryMatches && statusMatches;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "created_asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "duration_desc":
          return b.duration_days - a.duration_days;
        case "duration_asc":
          return a.duration_days - b.duration_days;
        case "alpha_asc":
          return a.title.localeCompare(b.title);
        case "alpha_desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "Published":
      case "Active":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold";
      case "Archived":
        return "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300 font-semibold";
      default:
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 font-semibold";
    }
  };

  const dropdownOptionClass = "bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white";
  const categoryFormInputClass = "mt-1 w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      {/* Create Project Modal Popup */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-xl rounded-[24px] border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0c1833] dark:text-[#bceaff]">
                Create Project Cohort
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3.5 rounded-xl text-xs font-semibold">{createError}</div>
              )}

              <div>
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Project Title*</label>
                <input
                  type="text"
                  name="title"
                  value={createForm.title}
                  onChange={handleCreateInputChange}
                  placeholder="e.g. Hostel Management System"
                  className={categoryFormInputClass}
                  required
                />
              </div>

              <div>
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Description*</label>
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateInputChange}
                  placeholder="Provide a high-level summary of project goals..."
                  rows={3}
                  className={`${categoryFormInputClass} resize-none`}
                  required
                />
              </div>

              <div>
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Category*</label>
                <select
                  name="category"
                  value={createForm.category}
                  onChange={handleCreateInputChange}
                  className={categoryFormInputClass}
                  required
                >
                  <option className={dropdownOptionClass} value="" disabled>Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} className={dropdownOptionClass} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Duration (Days)*</label>
                  <input
                    type="number"
                    name="duration_days"
                    min="1"
                    value={createForm.duration_days}
                    onChange={handleCreateInputChange}
                    placeholder="e.g. 10"
                    className={categoryFormInputClass}
                    required
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Certificate XP Req*</label>
                  <input
                    type="number"
                    name="xp_requirement"
                    min="0"
                    value={createForm.xp_requirement}
                    onChange={handleCreateInputChange}
                    placeholder="e.g. 1000"
                    className={categoryFormInputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Project Overview Markdown File (.md)*</label>
                {!overviewFile ? (
                  <div className="mt-1 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/40 dark:bg-black/10 hover:bg-white/60 dark:hover:bg-black/20 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept=".md"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <FiUpload className="w-6 h-6 text-blue-500 mb-2" />
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Drag and drop or click to upload</p>
                  </div>
                ) : (
                  <div className="mt-1 bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiUpload className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[250px]" title={overviewFile.name}>
                        {overviewFile.name}
                      </span>
                    </div>
                    <button type="button" onClick={() => setOverviewFile(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold border border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="bg-[#00113b] hover:bg-[#0b1c4b] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <FiSave className="w-3.5 h-3.5" />
                  {createSaving ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && projectToArchive && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowArchiveConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-orange-500 dark:text-orange-400">Archive Project Cohort?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to soft-archive <strong className="text-slate-800 dark:text-white">&ldquo;{projectToArchive.title}&rdquo;</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button onClick={() => setShowArchiveConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition">Cancel</button>
              <button onClick={confirmArchive} className="px-4 py-2 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition shadow-sm">Confirm Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">Delete Project?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-white">&ldquo;{projectToDelete.title}&rdquo;</strong>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setBulkDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">Delete Selected Projects?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This will delete {selectedProjectIds.length} selected project{selectedProjectIds.length === 1 ? "" : "s"} and related days, tasks, and assignments.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button onClick={() => setBulkDeleteConfirm(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition">Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkActionLoading} className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm disabled:opacity-60">
                {bulkActionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-bold text-[#0c1833] dark:text-white tracking-tight">Projects</h1>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="bg-[#00113b] hover:bg-[#0b1c4b] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <FiPlus className="w-4 h-4" />
              Create New Project
            </button>
          </div>

          {/* Metrics Dashboard Row */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
            <div className="bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiFolder className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#0c1833] dark:text-white leading-none">{metrics.totalProjects}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Total Projects</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiClock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#0c1833] dark:text-white leading-none">{metrics.activeProjects}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Published Projects</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiArchive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#0c1833] dark:text-white leading-none">{metrics.archivedProjects}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Archived</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiUsers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#0c1833] dark:text-white leading-none">{metrics.studentsAssigned}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Students Assigned</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiActivity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#0c1833] dark:text-white leading-none">{metrics.studentsActive}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Students Active</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiTrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#0c1833] dark:text-white leading-none">{metrics.averageProgress}%</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Average Progress</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f1f43] border border-black/10 dark:border-white/15 backdrop-blur-xl px-4 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiUsers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#0c1833] dark:text-white leading-none">{metrics.completionRate}%</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Completion Rate</p>
              </div>
            </div>
          </div>

          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name..."
                className="w-full pl-9 pr-4 py-3 text-xs rounded-xl border-0 bg-white dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Custom styled sort select */}
            <div className="relative w-full sm:w-64">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full pl-4 pr-10 py-3 text-xs font-semibold rounded-xl border-0 bg-white dark:bg-[#0f1f43] text-slate-800 dark:text-white cursor-pointer shadow-sm outline-none"
              >
                <option className={dropdownOptionClass} value="created_desc">Sort: Created Date</option>
                <option className={dropdownOptionClass} value="created_asc">Sort: Created Date (Oldest)</option>
                <option className={dropdownOptionClass} value="duration_desc">Sort: Duration (Desc)</option>
                <option className={dropdownOptionClass} value="duration_asc">Sort: Duration (Asc)</option>
                <option className={dropdownOptionClass} value="alpha_asc">Sort: Alphabetical (A-Z)</option>
                <option className={dropdownOptionClass} value="alpha_desc">Sort: Alphabetical (Z-A)</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap">
            <button
              onClick={() => setSelectedCategory("All Projects")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                selectedCategory === "All Projects"
                  ? "bg-[#001b54] text-white shadow-sm"
                  : "bg-white/60 hover:bg-white/90 text-slate-600 dark:bg-[#0f1f43]/45 dark:text-slate-300"
              }`}
            >
              All Projects
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                  selectedCategory === cat
                    ? "bg-[#001b54] text-white shadow-sm"
                    : "bg-white/60 hover:bg-white/90 text-slate-600 dark:bg-[#0f1f43]/45 dark:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                  selectedStatus === status
                    ? "bg-[#001b54] text-white shadow-sm"
                    : "bg-white/60 hover:bg-white/90 text-slate-600 dark:bg-[#0f1f43]/45 dark:text-slate-300"
                }`}
              >
                {status === "All" ? "All Status" : status}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedProjectIds.length > 0 && (
            <div className="sticky top-0 z-20 rounded-2xl border border-blue-500/20 bg-white/95 dark:bg-[#0a1737]/95 shadow-lg backdrop-blur-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#0c1833] dark:text-white">{selectedProjectIds.length} project{selectedProjectIds.length === 1 ? "" : "s"} selected</p>
                <p className="text-[11px] font-semibold text-slate-400">Bulk actions apply to the selected project cards.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearSelection} className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/15 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition">Clear</button>
                <button onClick={handleBulkArchive} disabled={bulkActionLoading} className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-60 flex items-center gap-1.5">
                  <FiArchive className="w-3.5 h-3.5" />
                  {bulkActionLoading ? "Archiving..." : "Bulk Archive"}
                </button>
                <button onClick={() => setBulkDeleteConfirm(true)} disabled={bulkActionLoading} className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition disabled:opacity-60 flex items-center gap-1.5">
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Bulk Delete
                </button>
              </div>
            </div>
          )}

          {/* Project List / Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-3 text-sm text-slate-400 font-medium">Loading project catalog...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-2xl text-center space-y-3">
              <p className="font-semibold text-sm">{error}</p>
              <button onClick={fetchData} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs hover:bg-rose-600 transition">Retry</button>
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <div className="bg-white/50 border border-dashed border-black/10 dark:border-white/10 p-12 rounded-2xl text-center text-slate-400">
              No projects match your filter queries.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredAndSortedProjects.map((project) => {
                const isSelected = selectedProjectIds.includes(project._id);
                const theme = { topTint: 'bg-[#d8e6ef] dark:bg-[#24384e]' };
                
                return (
                  <article key={project._id} className={`relative rounded-xl overflow-hidden border ${isSelected ? 'border-[#3C83F6] ring-1 ring-[#3C83F6]/50 dark:border-blue-400 dark:ring-blue-400/50' : 'border-black/10 dark:border-white/15'} bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] h-full flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group`}>
                    
                    {/* Checkbox */}
                    <div className="absolute left-3 top-2.5 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProjectSelection(project._id)}
                        className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white/70 dark:bg-black/30"
                        aria-label={`Select ${project.title}`}
                      />
                    </div>

                    {/* Action Menu (3 dots) */}
                    <div className={`absolute right-2 top-2 z-20`}>
                      <button
                        type="button"
                        className="project-actions-trigger w-6 h-6 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenActionMenuId(openActionMenuId === project._id ? null : project._id);
                        }}
                        aria-label="Open project actions"
                      >
                        <FiMoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {openActionMenuId === project._id && (
                        <div className="project-actions-menu absolute right-0 top-7 w-36 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
                          <button
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleArchiveClick(project);
                            }}
                            className="w-full text-left px-3 py-2 text-xs transition-colors text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            {project.status === "Archived" ? "Unarchive" : "Archive"}
                          </button>
                          <button
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleDuplicateClick(project);
                            }}
                            className="w-full text-left px-3 py-2 text-xs transition-colors text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleDeleteClick(project);
                            }}
                            className="w-full text-left px-3 py-2 text-xs transition-colors text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Top Panel (pl-11 pr-9 check/icon spaces, min-h-[72px] with top tint) */}
                    <div className={`px-4 pt-4 pb-3.5 min-h-[72px] border-b border-black/10 dark:border-white/15 ${theme.topTint} pl-11 pr-9 flex items-center`}>
                      <div className="flex items-center justify-between gap-2.5 text-left w-full">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs md:text-sm leading-snug font-bold text-slate-900 dark:text-white truncate" title={project.title}>{project.title}</h3>
                          <p className="mt-0.5 text-[10px] md:text-[11px] leading-tight text-slate-500 dark:text-slate-355 truncate">{project.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Panel */}
                    <div className="px-4 py-3.5 mt-auto bg-white/70 dark:bg-transparent flex flex-col gap-2 text-left">
                      <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-550 dark:text-slate-400">
                        <span>Duration</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{project.duration_days} days</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-550 dark:text-slate-400">
                        <span>Students</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{project.assignedStudentsCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-550 dark:text-slate-400">
                        <span>Created</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(project.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-550 dark:text-slate-400">
                        <span>Status</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{project.status === "Published" ? "Active" : project.status}</span>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/projects/edit/${project._id}`)}
                        className="mt-3 w-full h-9 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        View Project
                      </button>
                    </div>
                  </article>
                )})}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
