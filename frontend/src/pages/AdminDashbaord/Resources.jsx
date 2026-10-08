import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../../context/ThemeContext";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { adminAPI } from "../../services/adminApi";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiEye,
  FiSearch,
  FiLayers,
  FiArchive,
  FiCheckCircle,
  FiClock,
  FiUpload,
  FiX,
  FiFileText,
  FiChevronDown,
} from "react-icons/fi";

const TARGET_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI / Machine Learning Engineer",
  "Data Scientist",
  "Generative AI Engineer",
];

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Other"];
const DURATION_UNITS = ["days", "weeks", "months"];
const STATUSES = ["Active", "Draft", "Archived"];

const createRoadmapForm = () => ({
  title: "",
  description: "",
  targetRole: "",
  customTargetRole: "",
  duration: "",
  durationUnit: "weeks",
  markdownBody: "",
  markdownFile: "",
  branches: [],
  assignedBatchIds: [],
  status: "Draft",
});

const normalizeId = (roadmap) => roadmap?.id || roadmap?._id;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getDurationLabel = (roadmap) => {
  if (roadmap?.durationLabel) return roadmap.durationLabel;
  if (!roadmap?.duration || !roadmap?.durationUnit) return "Not set";
  const duration = Number(roadmap.duration);
  const unit = String(roadmap.durationUnit).replace(/s$/, "");
  return `${duration} ${unit}${duration === 1 ? "" : "s"}`;
};

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold">{children}</h3>,
  p: ({ children }) => <p className="mb-4 leading-7 opacity-80">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-5 opacity-80">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 opacity-80">{children}</ol>,
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>
    ) : (
      <code className="font-mono text-sm">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="mb-5 overflow-x-auto rounded-lg bg-[#071831] p-4 text-sm text-slate-100">{children}</pre>
  ),
};

export default function Resources() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Sidebar & mount states matching Courses & Hiring
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Data states
  const [roadmapEntries, setRoadmapEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // Filters & sorting
  const [activeTab, setActiveTab] = useState("All"); // All, or specific Target Role
  const [statusFilter, setStatusFilter] = useState("All"); // All, Active, Draft, Archived
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");

  // Form modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoadmapId, setEditingRoadmapId] = useState(null);
  const [roadmapForm, setRoadmapForm] = useState(createRoadmapForm());
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showFormPreview, setShowFormPreview] = useState(false);
  const fileInputRef = useRef(null);

  // View modal state
  const [viewingRoadmap, setViewingRoadmap] = useState(null);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadRoadmaps = async () => {
    try {
      setLoading(true);
      setPageError("");
      const roadmaps = await adminAPI.getRoadmaps();
      setRoadmapEntries(Array.isArray(roadmaps) ? roadmaps : []);
    } catch (error) {
      console.error("Failed to load roadmaps:", error);
      setPageError(error?.message || "Could not load roadmaps.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoadmaps();
  }, []);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Quick summary statistics matching Courses/Hiring
  const stats = useMemo(() => {
    const total = roadmapEntries.length;
    const active = roadmapEntries.filter((item) => item.status === "Active").length;
    const drafts = roadmapEntries.filter((item) => item.status === "Draft").length;
    const archived = roadmapEntries.filter((item) => item.status === "Archived").length;
    return { total, active, drafts, archived };
  }, [roadmapEntries]);

  // Filtered & Sorted Roadmaps
  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = roadmapEntries.filter((roadmap) => {
      // Tab filter (Target Role)
      if (activeTab !== "All") {
        if ((roadmap.targetRole || "").toLowerCase() !== activeTab.toLowerCase()) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "All") {
        if ((roadmap.status || "Draft").toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (query) {
        const matchesTitle = String(roadmap.title || "").toLowerCase().includes(query);
        const matchesRole = String(roadmap.targetRole || "").toLowerCase().includes(query);
        const matchesDesc = String(roadmap.description || "").toLowerCase().includes(query);
        const matchesId = String(roadmap.roadmapId || "").toLowerCase().includes(query);
        const matchesBranches = (roadmap.branches || []).some((b) =>
          String(b).toLowerCase().includes(query)
        );
        return matchesTitle || matchesRole || matchesDesc || matchesId || matchesBranches;
      }

      return true;
    });

    return result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "duration") {
        aVal = Number(a.duration || 0);
        bVal = Number(b.duration || 0);
      } else if (sortField === "createdAt") {
        aVal = new Date(a.createdAt || 0).getTime();
        bVal = new Date(b.createdAt || 0).getTime();
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal, undefined, { sensitivity: "base" })
          : bVal.localeCompare(aVal, undefined, { sensitivity: "base" });
      } else {
        return sortDirection === "asc" ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
      }
    });
  }, [roadmapEntries, activeTab, statusFilter, searchQuery, sortField, sortDirection]);

  const updateForm = (field, value) => {
    setRoadmapForm((previous) => ({ ...previous, [field]: value }));
    setFormError("");
  };

  const openCreateForm = () => {
    setEditingRoadmapId(null);
    setRoadmapForm(createRoadmapForm());
    setFormError("");
    setShowFormPreview(false);
    setIsFormOpen(true);
  };

  const openEditForm = (roadmap) => {
    const knownRole = TARGET_ROLES.includes(roadmap.targetRole);
    setEditingRoadmapId(normalizeId(roadmap));
    setRoadmapForm({
      title: roadmap.title || "",
      description: roadmap.description || "",
      targetRole: knownRole ? roadmap.targetRole : roadmap.targetRole ? "__custom__" : "",
      customTargetRole: knownRole ? "" : roadmap.targetRole || "",
      duration: roadmap.duration ?? "",
      durationUnit: String(roadmap.durationUnit || "weeks").toLowerCase(),
      markdownBody: roadmap.markdownBody || "",
      markdownFile: roadmap.markdownFile || "Existing Markdown",
      branches: Array.isArray(roadmap.branches) ? roadmap.branches : [],
      assignedBatchIds: Array.isArray(roadmap.assignedBatchIds)
        ? roadmap.assignedBatchIds.map(String)
        : [],
      status: roadmap.status || "Draft",
    });
    setFormError("");
    setShowFormPreview(false);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRoadmapId(null);
    setRoadmapForm(createRoadmapForm());
    setFormError("");
    setShowFormPreview(false);
  };

  const handleMarkdownFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".md")) {
      setFormError("Only Markdown (.md) files are supported.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateForm("markdownBody", String(reader.result || ""));
      updateForm("markdownFile", file.name);
      setShowFormPreview(true);
    };
    reader.onerror = () => setFormError("Could not read that Markdown file.");
    reader.readAsText(file);
  };

  const toggleBranch = (branch) => {
    setRoadmapForm((previous) => ({
      ...previous,
      branches: previous.branches.includes(branch)
        ? previous.branches.filter((item) => item !== branch)
        : [...previous.branches, branch],
    }));
    setFormError("");
  };

  const persistRoadmap = async (payload) => {
    if (editingRoadmapId) return adminAPI.updateRoadmap(editingRoadmapId, payload);
    return adminAPI.createRoadmap(payload);
  };

  const saveRoadmap = async (statusOverride = null, allowDuplicate = false) => {
    const targetRole =
      roadmapForm.targetRole === "__custom__"
        ? roadmapForm.customTargetRole.trim()
        : roadmapForm.targetRole.trim();
    const status = statusOverride || roadmapForm.status;
    const duration = Number(roadmapForm.duration);

    if (!roadmapForm.title.trim()) return setFormError("Roadmap title is required.");
    if (!targetRole) return setFormError("Target role is required.");
    if (!roadmapForm.markdownBody.trim())
      return setFormError("Upload a Markdown file before saving.");
    if (!Number.isFinite(duration) || duration <= 0)
      return setFormError("Duration must be a positive number.");

    const payload = {
      title: roadmapForm.title.trim(),
      description: roadmapForm.description.trim(),
      targetRole,
      duration,
      durationUnit: roadmapForm.durationUnit,
      markdownBody: roadmapForm.markdownBody.trim(),
      markdownFile: roadmapForm.markdownFile.trim(),
      status,
      branches: roadmapForm.branches,
      assignedBatchIds: roadmapForm.assignedBatchIds,
      ...(allowDuplicate ? { allowDuplicate: true } : {}),
    };

    try {
      setIsSaving(true);
      setFormError("");
      await persistRoadmap(payload);
      await loadRoadmaps();
      closeForm();
    } catch (error) {
      if ((error?.code === "ROADMAP_DUPLICATE" || error?.data?.existing) && !allowDuplicate) {
        const shouldContinue = window.confirm(
          `A roadmap named "${error.data?.existing?.title || payload.title}" for "${targetRole}" already exists. Create another one anyway?`
        );
        if (shouldContinue) {
          await saveRoadmap(statusOverride, true);
          return;
        }
      }
      setFormError(error?.message || "Failed to save roadmap.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (roadmap, status) => {
    const id = normalizeId(roadmap);
    const previous = roadmapEntries;
    setRoadmapEntries((items) =>
      items.map((item) => (normalizeId(item) === id ? { ...item, status } : item))
    );
    try {
      const updated = await adminAPI.updateRoadmapStatus(id, status);
      setRoadmapEntries((items) =>
        items.map((item) =>
          normalizeId(item) === id ? updated?.data || updated || { ...item, status } : item
        )
      );
    } catch (error) {
      setRoadmapEntries(previous);
      alert(error?.message || "Could not update roadmap status.");
    }
  };

  const handleDeleteClick = (roadmap) => {
    setRoadmapToDelete(roadmap);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!roadmapToDelete) return;
    const id = normalizeId(roadmapToDelete);
    try {
      await adminAPI.deleteRoadmap(id);
      setRoadmapEntries((prev) => prev.filter((entry) => normalizeId(entry) !== id));
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      alert(error?.message || "Could not delete roadmap.");
    } finally {
      setShowDeleteConfirm(false);
      setRoadmapToDelete(null);
    }
  };

  const previewForm = {
    ...roadmapForm,
    targetRole:
      roadmapForm.targetRole === "__custom__"
        ? roadmapForm.customTargetRole
        : roadmapForm.targetRole,
    duration: Number(roadmapForm.duration),
    durationLabel: getDurationLabel(roadmapForm),
    status: roadmapForm.status,
  };

  const categoryFormInputClass =
    "course-form-field mt-1 w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35";

  if (pageError) {
    return (
      <div
        className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
          isDarkMode ? "dark" : "light"
        }`}
      >
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
            isDarkMode
              ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
              : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
          }`}
        />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />
        <main
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          } pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden`}
        >
          <div className="max-w-4xl mx-auto space-y-8 text-center py-8">
            <h2 className="text-xl font-semibold text-rose-500">Error Loading Roadmaps</h2>
            <p className="mt-2 text-sm">{pageError}</p>
            <button
              onClick={() => loadRoadmaps()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
        isDarkMode ? "dark" : "light"
      }`}
    >
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
            : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
        }`}
      />

      {/* Sidebar with collapse toggle matching Courses & Hiring */}
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      {/* Main Content Area */}
      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-20 sm:pt-24 md:pt-28 pb-12 px-3 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header & Stats Cards - Perfectly matching Courses & Hiring */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="admin-page-title text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  Roadmap Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Manage personalized learning paths by target role and branch eligibility.
                </p>
              </div>

              <button
                onClick={openCreateForm}
                className="dashboard-primary-btn h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Create Roadmap
              </button>
            </div>

            {/* Quick Summary Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Total Roadmaps */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <FiLayers className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                    Total Roadmaps
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                    {stats.total}
                  </span>
                </div>
              </div>

              {/* Active */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                    Active
                  </span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.active}
                  </span>
                </div>
              </div>

              {/* Drafts */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                    Drafts
                  </span>
                  <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
                    {stats.drafts}
                  </span>
                </div>
              </div>

              {/* Archived */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                  <FiArchive className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                    Archived
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-600 dark:text-slate-400">
                    {stats.archived}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Tabs */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Target Role Tabs (matching Course Delivery Type tabs) */}
              <div className="flex border-b border-black/10 dark:border-white/10 gap-2 overflow-x-auto minimal-scrollbar max-w-full pb-0.5">
                {["All", ...TARGET_ROLES].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? "border-[#3C83F6] text-[#3C83F6] dark:text-blue-400"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Status Filter Pills & Search Bar (matching Courses & Hiring) */}
              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap justify-between sm:justify-end">
                {/* Status Pills */}
                <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-0.5 text-xs overflow-x-auto">
                  {["All", ...STATUSES].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded-md transition font-semibold whitespace-nowrap ${
                        statusFilter === st
                          ? "bg-[#3C83F6] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roadmaps, roles..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                </div>
              </div>
            </div>

            {/* Table / Responsive Cards Section */}
            {loading ? (
              <div className="text-center py-16 text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <p className="mt-2 text-xs font-medium">Loading roadmaps...</p>
              </div>
            ) : filteredRoadmaps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-12 text-center text-sm text-slate-400">
                No roadmaps match the selected filters. Click &ldquo;Create Roadmap&rdquo; above to create one.
              </div>
            ) : (
              <div className="overflow-x-auto w-full bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs minimal-scrollbar">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0b1736] shadow-xs">
                    <tr className="border-b border-black/5 dark:border-white/10 select-none">
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-14 whitespace-nowrap">
                        #
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[220px] cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("title")}
                      >
                        Roadmap Title {sortField === "title" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">
                        Actions
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[180px] cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("targetRole")}
                      >
                        Target Role {sortField === "targetRole" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("duration")}
                      >
                        Duration {sortField === "duration" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("status")}
                      >
                        Status {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[180px] whitespace-nowrap">
                        Eligible Branches
                      </th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("createdAt")}
                      >
                        Created {sortField === "createdAt" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
                    {filteredRoadmaps.map((roadmap, index) => (
                      <tr
                        key={normalizeId(roadmap)}
                        onClick={() => setViewingRoadmap(roadmap)}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        {/* Index */}
                        <td className="px-3.5 py-3.5 text-center text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
                          {index + 1}
                        </td>

                        {/* Roadmap Title */}
                        <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-2 max-w-[260px]">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                              <FiFileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="truncate block font-semibold hover:text-blue-600 transition-colors" title={roadmap.title}>
                                {roadmap.title || "Untitled Roadmap"}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {roadmap.roadmapId || "Legacy ID"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-3.5 py-3.5 text-center whitespace-nowrap"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingRoadmap(roadmap)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"
                              title="Preview Roadmap"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditForm(roadmap)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"
                              title="Edit Roadmap"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(roadmap)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              title="Delete Roadmap"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Target Role */}
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-800 dark:text-white block truncate max-w-[200px]" title={roadmap.targetRole || "Not set"}>
                            {roadmap.targetRole || "Not set"}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-3.5 py-3.5 text-center whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                          {getDurationLabel(roadmap)}
                        </td>

                        {/* Status (inline selector matching Courses) */}
                        <td
                          className="px-3.5 py-3.5 text-center whitespace-nowrap"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="inline-block relative">
                            <select
                              aria-label={`Status for ${roadmap.title}`}
                              value={roadmap.status || "Draft"}
                              onChange={(event) => updateStatus(roadmap, event.target.value)}
                              className={`appearance-none pr-6 px-2.5 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer transition ${
                                roadmap.status === "Active"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : roadmap.status === "Draft"
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Draft">Draft</option>
                              <option value="Archived">Archived</option>
                            </select>
                            <FiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                          </div>
                        </td>

                        {/* Branches */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {roadmap.branches && roadmap.branches.length > 0 ? (
                              roadmap.branches.slice(0, 3).map((branch) => (
                                <span
                                  key={branch}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  {branch}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                                All Branches
                              </span>
                            )}
                            {roadmap.branches && roadmap.branches.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{roadmap.branches.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="px-3.5 py-3.5 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(roadmap.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Delete Roadmap Confirmation Modal - Matching Courses & Hiring */}
      {showDeleteConfirm && roadmapToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setRoadmapToDelete(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-rose-500">Delete Roadmap?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-white">
                &ldquo;{roadmapToDelete.title}&rdquo;
              </strong>
              ?
              <br />
              <br />
              <span className="text-xs text-rose-500 font-medium">
                ⚠️ This action is permanent and will remove all associated content and milestones.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRoadmapToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Roadmap Modal - Matching Courses Popup Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative w-full max-w-3xl bg-white border border-black/10 dark:bg-[#0a1737] dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#3C83F6] dark:text-[#bceaff]">
                  {editingRoadmapId ? "Edit Roadmap" : "Create New Roadmap"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure learning path metadata, target role, duration, and branch eligibility.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-medium px-2 py-1 rounded-lg text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveRoadmap();
              }}
              className="flex min-h-0 flex-1 flex-col overflow-visible"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 minimal-scrollbar">
                {formError && (
                  <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Roadmap Title */}
                  <div className="sm:col-span-2">
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                      Roadmap Title*
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={roadmapForm.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="e.g. Frontend Developer Roadmap 2026"
                      className={categoryFormInputClass}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                      Description
                    </label>
                    <textarea
                      value={roadmapForm.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                      placeholder="Comprehensive roadmap covering core web technologies, frameworks, and tools..."
                      rows={2}
                      className={`${categoryFormInputClass} resize-none`}
                    />
                  </div>

                  {/* Target Role */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                      Target Role*
                    </label>
                    <select
                      value={roadmapForm.targetRole}
                      onChange={(e) => updateForm("targetRole", e.target.value)}
                      className={categoryFormInputClass}
                      required
                    >
                      <option value="">Select target role</option>
                      {TARGET_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                      <option value="__custom__">Other / Custom role…</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                      Duration*
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={roadmapForm.duration}
                        onChange={(e) => updateForm("duration", e.target.value)}
                        className={categoryFormInputClass}
                        placeholder="e.g. 12"
                        required
                      />
                      <select
                        value={roadmapForm.durationUnit}
                        onChange={(e) => updateForm("durationUnit", e.target.value)}
                        className={`${categoryFormInputClass} w-32 shrink-0`}
                      >
                        {DURATION_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit[0].toUpperCase() + unit.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Custom Target Role Field if selected */}
                  {roadmapForm.targetRole === "__custom__" && (
                    <div className="sm:col-span-2">
                      <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                        Custom Target Role Name*
                      </label>
                      <input
                        type="text"
                        value={roadmapForm.customTargetRole}
                        onChange={(e) => updateForm("customTargetRole", e.target.value)}
                        placeholder="e.g. Cyber Security Specialist"
                        className={categoryFormInputClass}
                        required
                      />
                    </div>
                  )}

                  {/* Markdown File Upload & Content */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold">
                        Markdown File (.md)*
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowFormPreview(!showFormPreview)}
                        className="text-xs font-semibold text-[#3C83F6] hover:underline flex items-center gap-1"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        {showFormPreview ? "Hide Preview" : "Preview Markdown"}
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,text/markdown"
                      onChange={handleMarkdownFile}
                      className="hidden"
                    />
                    <div className="mt-1 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#3C83F6]/10 text-[#3C83F6] hover:bg-[#3C83F6]/20 transition"
                      >
                        <FiUpload className="w-3.5 h-3.5" />
                        Upload .md File
                      </button>
                      <span className="text-xs text-slate-500 truncate">
                        {roadmapForm.markdownFile || "No file selected"}
                      </span>
                    </div>
                    <textarea
                      value={roadmapForm.markdownBody}
                      onChange={(e) => updateForm("markdownBody", e.target.value)}
                      placeholder="Upload a .md file or paste markdown curriculum here..."
                      rows={5}
                      className={`${categoryFormInputClass} font-mono text-xs mt-2 resize-y`}
                      required
                    />

                    {/* Markdown live preview inside form */}
                    {showFormPreview && (
                      <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#071532] p-4 text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {roadmapForm.markdownBody || "*Markdown preview will appear here.*"}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Branch Eligibility */}
                  <div className="sm:col-span-2">
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                      Assign to Branches (Leave unchecked for All Branches)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {BRANCHES.map((branch) => {
                        const checked = roadmapForm.branches.includes(branch);
                        return (
                          <label
                            key={branch}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs border cursor-pointer transition ${
                              checked
                                ? "border-[#3C83F6] bg-[#3C83F6]/10 text-[#3C83F6] font-semibold"
                                : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBranch(branch)}
                              className="rounded border-slate-300 text-[#3C83F6] focus:ring-[#3C83F6]"
                            />
                            {branch}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div className="sm:col-span-2">
                    <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                      Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateForm("status", status)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                            roadmapForm.status === status
                              ? status === "Active"
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                : status === "Archived"
                                ? "bg-slate-500/15 text-slate-600 border-slate-500/30"
                                : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                              : "border-black/10 dark:border-white/10 text-slate-500 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons matching Courses */}
              <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-black/10 rounded-b-xl">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveRoadmap("Draft")}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-black/10 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => saveRoadmap("Active")}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70 transition-colors"
                >
                  {isSaving
                    ? "Saving..."
                    : editingRoadmapId
                    ? "Save Changes"
                    : "Publish Roadmap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {viewingRoadmap && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setViewingRoadmap(null)}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0a1737]">
            <div className="flex items-start justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3c83f6]">
                  {viewingRoadmap.roadmapId || "Roadmap Preview"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {viewingRoadmap.title}
                </h2>
                <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{viewingRoadmap.targetRole || "Target role not set"}</span>
                  <span>•</span>
                  <span>{getDurationLabel(viewingRoadmap)}</span>
                  <span>•</span>
                  <span>{formatDate(viewingRoadmap.createdAt)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRoadmap(null)}
                className="text-sm font-medium px-2 py-1 rounded-lg text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 minimal-scrollbar">
              {viewingRoadmap.description && (
                <p className="mb-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] p-3.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {viewingRoadmap.description}
                </p>
              )}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {(viewingRoadmap.branches?.length ? viewingRoadmap.branches : ["All branches"]).map(
                  (branch) => (
                    <span
                      key={branch}
                      className="rounded-full border border-[#3c83f6]/25 bg-[#3c83f6]/10 px-3 py-0.5 text-xs font-semibold text-[#2563eb] dark:text-[#a9d9ff]"
                    >
                      {branch}
                    </span>
                  )
                )}
              </div>
              <div className="border-t border-black/10 dark:border-white/10 pt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {viewingRoadmap.markdownBody || "No Markdown content available."}
                </ReactMarkdown>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-black/10 px-6 py-3.5 dark:border-white/10 bg-slate-50/50 dark:bg-black/10">
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingRoadmap;
                  setViewingRoadmap(null);
                  openEditForm(toEdit);
                }}
                className="dashboard-primary-btn inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold"
              >
                <FiEdit2 className="w-3.5 h-3.5" /> Edit Roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
