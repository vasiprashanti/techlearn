import React, { useState, useEffect } from "react";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../services/adminApi";
import { useTheme } from "../../context/ThemeContext";
import { FiChevronDown, FiPlus, FiTrash2, FiEdit2, FiSearch, FiFolder, FiArchive, FiUsers, FiClock, FiExternalLink, FiCopy, FiUpload, FiX, FiSave } from "react-icons/fi";

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

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    archivedProjects: 0,
    studentsAssigned: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter, Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Projects");
  const [sortBy, setSortBy] = useState("created_desc");

  // Create Project Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "Java Full Stack",
    duration_days: "",
    xp_requirement: "",
    status: "Draft"
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
          studentsAssigned: metricsData.studentsAssigned || 0
        });
      }
    } catch (err) {
      console.error("Error fetching projects and metrics:", err);
      setError(err.message || "Failed to load project database.");
    } finally {
      setLoading(false);
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
      const payload = {
        title: `${project.title} (Copy)`,
        description: project.description,
        category: project.category,
        duration_days: project.duration_days,
        xp_requirement: project.xp_requirement,
        overview_markdown_content: project.overview_markdown_content,
        overview_markdown_file_url: project.overview_markdown_file_url,
        status: "Draft"
      };
      await adminAPI.createProject(payload);
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
      formData.append("status", createForm.status);
      formData.append("overviewFile", overviewFile);

      await adminAPI.createProject(formData);
      setShowCreateModal(false);
      setCreateForm({
        title: "",
        description: "",
        category: "Java Full Stack",
        duration_days: "",
        xp_requirement: "",
        status: "Draft"
      });
      setOverviewFile(null);
      fetchData();
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
      
      return titleMatches && categoryMatches;
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Category*</label>
                  <select
                    name="category"
                    value={createForm.category}
                    onChange={handleCreateInputChange}
                    className={categoryFormInputClass}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} className={dropdownOptionClass} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="admin-micro-label text-slate-400 font-bold uppercase tracking-wider">Status*</label>
                  <select
                    name="status"
                    value={createForm.status}
                    onChange={handleCreateInputChange}
                    className={categoryFormInputClass}
                  >
                    <option className={dropdownOptionClass} value="Draft">Draft</option>
                    <option className={dropdownOptionClass} value="Published">Published</option>
                    <option className={dropdownOptionClass} value="Archived">Archived</option>
                  </select>
                </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-[#0f274f]/80 border border-white/40 dark:border-white/5 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-[0_4px_18px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
                <FiFolder className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0c1833] dark:text-white leading-none">{metrics.totalProjects}</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">Total Projects</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f274f]/80 border border-white/40 dark:border-white/5 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-[0_4px_18px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                <FiClock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0c1833] dark:text-white leading-none">{metrics.activeProjects}</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">Active</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f274f]/80 border border-white/40 dark:border-white/5 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-[0_4px_18px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-xl bg-[#e6f4ea] dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <FiArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0c1833] dark:text-white leading-none">{metrics.archivedProjects}</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">Archived</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-[#0f274f]/80 border border-white/40 dark:border-white/5 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-[0_4px_18px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-300">
                <FiUsers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0c1833] dark:text-white leading-none">{metrics.studentsAssigned}</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">Students Assigned</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProjects.map((project) => (
                <div key={project._id} className="bg-white dark:bg-[#0f274f] border border-white/40 dark:border-white/5 rounded-[24px] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-[15px] font-bold text-[#0c1833] dark:text-white line-clamp-1 truncate leading-snug" title={project.title}>
                          {project.title}
                        </h2>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                          {project.category}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] ${getStatusColor(project.status === "Published" ? "Active" : project.status)}`}>
                        {project.status === "Published" ? "Active" : project.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-4 border-t border-black/5 dark:border-white/5">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duration</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{project.duration_days} days</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Students</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{project.assignedStudentsCount || 0}</p>
                      </div>
                      <div className="col-span-2 mt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Created</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {new Date(project.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/admin/projects/edit/${project._id}`)}
                      className="flex-1 bg-[#001b54] text-white hover:bg-[#0a2764] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <FiExternalLink className="w-3.5 h-3.5" />
                      View
                    </button>
                    
                    <button
                      onClick={() => handleArchiveClick(project)}
                      className={`h-8 w-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1f43] inline-flex items-center justify-center transition-all shadow-sm ${
                        project.status === "Archived"
                          ? "text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 border-orange-500/20"
                          : "text-slate-400 hover:text-orange-500 hover:bg-orange-500/5"
                      }`}
                      title={project.status === "Archived" ? "Unarchive Project" : "Archive Project"}
                    >
                      <FiArchive className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      onClick={() => handleDuplicateClick(project)}
                      className="h-8 w-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1f43] inline-flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all shadow-sm"
                      title="Duplicate Project"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(project)}
                      className="h-8 w-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1f43] inline-flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all shadow-sm"
                      title="Delete Project"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
