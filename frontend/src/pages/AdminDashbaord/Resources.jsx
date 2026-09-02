import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../../context/ThemeContext";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import LoadingScreen from "../../components/AdminDashbaord/AdminPageLoader";
import { adminAPI } from "../../services/adminApi";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiFileText,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUpload,
  FiX,
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
  // Kept in state so editing a legacy batch-linked roadmap does not silently
  // remove its old assignment. New roadmaps use branches for eligibility.
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

const getStatusClasses = (status, isDarkMode) => {
  if (status === "Active") return isDarkMode
    ? "bg-emerald-400/15 text-emerald-200 border-emerald-300/20"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Archived") return isDarkMode
    ? "bg-rose-400/15 text-rose-200 border-rose-300/20"
    : "bg-rose-50 text-rose-700 border-rose-200";
  return isDarkMode
    ? "bg-amber-400/15 text-amber-200 border-amber-300/20"
    : "bg-amber-50 text-amber-700 border-amber-200";
};

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-6 text-xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-5 text-lg font-semibold">{children}</h3>,
  p: ({ children }) => <p className="mb-4 leading-7 opacity-80">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-5 opacity-80">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 opacity-80">{children}</ol>,
  code: ({ inline, children }) => (
    inline
      ? <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>
      : <code className="font-mono text-sm">{children}</code>
  ),
  pre: ({ children }) => <pre className="mb-5 overflow-x-auto rounded-lg bg-[#071831] p-4 text-sm text-slate-100">{children}</pre>,
};

export default function Resources() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [roadmapEntries, setRoadmapEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sortBy, setSortBy] = useState("updated-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoadmapId, setEditingRoadmapId] = useState(null);
  const [roadmapForm, setRoadmapForm] = useState(createRoadmapForm());
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showFormPreview, setShowFormPreview] = useState(false);
  const [viewingRoadmap, setViewingRoadmap] = useState(null);
  const fileInputRef = useRef(null);

  const loadRoadmaps = async () => {
    try {
      setIsLoading(true);
      setPageError("");
      const roadmaps = await adminAPI.getRoadmaps();
      setRoadmapEntries(Array.isArray(roadmaps) ? roadmaps : []);
    } catch (error) {
      setPageError(error?.message || "Could not load roadmaps.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRoadmaps();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortBy, pageSize]);

  const filteredRoadmaps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = roadmapEntries.filter((roadmap) => {
      const matchesQuery = !query || [
        roadmap.title,
        roadmap.targetRole,
        roadmap.description,
        roadmap.roadmapId,
        ...(roadmap.branches || []),
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "All statuses" || roadmap.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return result.sort((left, right) => {
      if (sortBy === "title-asc") return String(left.title || "").localeCompare(String(right.title || ""));
      if (sortBy === "duration-asc") return Number(left.duration || 0) - Number(right.duration || 0);
      if (sortBy === "created-desc") return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    });
  }, [roadmapEntries, searchQuery, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoadmaps.length / pageSize));
  const visibleRoadmaps = filteredRoadmaps.slice((page - 1) * pageSize, page * pageSize);

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
      assignedBatchIds: Array.isArray(roadmap.assignedBatchIds) ? roadmap.assignedBatchIds.map(String) : [],
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
    const targetRole = roadmapForm.targetRole === "__custom__"
      ? roadmapForm.customTargetRole.trim()
      : roadmapForm.targetRole.trim();
    const status = statusOverride || roadmapForm.status;
    const duration = Number(roadmapForm.duration);

    if (!roadmapForm.title.trim()) return setFormError("Roadmap title is required.");
    if (!targetRole) return setFormError("Target role is required.");
    if (!roadmapForm.markdownBody.trim()) return setFormError("Upload a Markdown file before saving.");
    if (!Number.isFinite(duration) || duration <= 0) return setFormError("Duration must be a positive number.");

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
    try {
      const updated = await adminAPI.updateRoadmapStatus(normalizeId(roadmap), status);
      setRoadmapEntries((previous) => previous.map((entry) => (
        String(normalizeId(entry)) === String(normalizeId(roadmap)) ? updated : entry
      )));
    } catch (error) {
      window.alert(error?.message || "Could not update roadmap status.");
    }
  };

  const deleteRoadmap = async (roadmap) => {
    if (!window.confirm(`Delete "${roadmap.title}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteRoadmap(normalizeId(roadmap));
      setRoadmapEntries((previous) => previous.filter((entry) => String(normalizeId(entry)) !== String(normalizeId(roadmap))));
    } catch (error) {
      window.alert(error?.message || "Could not delete roadmap.");
    }
  };

  const previewForm = {
    ...roadmapForm,
    targetRole: roadmapForm.targetRole === "__custom__" ? roadmapForm.customTargetRole : roadmapForm.targetRole,
    duration: Number(roadmapForm.duration),
    durationLabel: getDurationLabel(roadmapForm),
    status: roadmapForm.status,
  };

  if (isLoading) {
    return <LoadingScreen message="Loading roadmaps..." fullScreen />;
  }

  return (
    <div className={`min-h-screen font-sans antialiased ${isDarkMode ? "dark bg-[#020b23] text-slate-100" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] text-slate-900"}`}>
      <Sidebar />
      <main className="min-h-screen overflow-y-auto px-4 pb-14 pt-24 sm:px-6 lg:ml-64 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3c83f6]">Learning content</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Roadmaps</h1>
              <p className="mt-2 max-w-2xl text-sm opacity-65">Manage personalized learning paths by target role and branch eligibility.</p>
            </div>
            <button type="button" onClick={openCreateForm} className="dashboard-primary-btn inline-flex h-11 items-center justify-center gap-2 px-5 text-sm">
              <FiPlus /> Create Roadmap
            </button>
          </div>

          {pageError && <div className="mb-5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">{pageError}</div>}

          <section className="dashboard-surface overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            <div className="flex flex-col gap-3 border-b border-black/10 p-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-45" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search roadmaps, roles, or RID..."
                  className="dashboard-input-surface h-10 w-full pl-9 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative">
                  <span className="sr-only">Filter by status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="dashboard-input-surface h-10 appearance-none pr-9 text-sm">
                    <option>All statuses</option>
                    {STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
                </label>
                <label className="relative">
                  <span className="sr-only">Sort roadmaps</span>
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="dashboard-input-surface h-10 appearance-none pr-9 text-sm">
                    <option value="updated-desc">Recently updated</option>
                    <option value="created-desc">Recently created</option>
                    <option value="title-asc">Title A–Z</option>
                    <option value="duration-asc">Duration shortest</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-black/[0.03] text-[10px] uppercase tracking-[0.16em] opacity-55 dark:bg-white/[0.04]">
                  <tr>
                    <th className="px-5 py-4">Roadmap</th>
                    <th className="px-5 py-4">Target role</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {visibleRoadmaps.map((roadmap) => (
                    <tr key={normalizeId(roadmap)} className="transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.035]">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-lg bg-[#3c83f6]/10 p-2 text-[#3c83f6]"><FiFileText /></div>
                          <div className="min-w-0">
                            <p className="truncate font-bold" title={roadmap.title}>{roadmap.title || "Untitled roadmap"}</p>
                            <p className="mt-1 text-xs opacity-50">{roadmap.roadmapId || "Legacy ID pending"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{roadmap.targetRole || "Not set"}</p>
                        <p className="mt-1 text-xs opacity-50">{roadmap.branches?.length ? roadmap.branches.join(", ") : "All branches"}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">{getDurationLabel(roadmap)}</td>
                      <td className="px-5 py-4">
                        <select
                          aria-label={`Change status for ${roadmap.title}`}
                          value={roadmap.status || "Draft"}
                          onChange={(event) => updateStatus(roadmap, event.target.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold outline-none ${getStatusClasses(roadmap.status, isDarkMode)}`}
                        >
                          {STATUSES.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 opacity-70">{formatDate(roadmap.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setViewingRoadmap(roadmap)} className="rounded-lg p-2 opacity-65 transition hover:bg-[#3c83f6]/10 hover:text-[#3c83f6]" aria-label={`Preview ${roadmap.title}`}><FiEye /></button>
                          <button type="button" onClick={() => openEditForm(roadmap)} className="rounded-lg p-2 opacity-65 transition hover:bg-[#3c83f6]/10 hover:text-[#3c83f6]" aria-label={`Edit ${roadmap.title}`}><FiEdit2 /></button>
                          <button type="button" onClick={() => deleteRoadmap(roadmap)} className="rounded-lg p-2 opacity-65 transition hover:bg-rose-500/10 hover:text-rose-500" aria-label={`Delete ${roadmap.title}`}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visibleRoadmaps.length && <div className="px-5 py-16 text-center text-sm opacity-60">No roadmaps match the current filters.</div>}
            </div>

            <div className="flex flex-col gap-3 border-t border-black/10 px-5 py-4 text-xs opacity-70 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <span>{filteredRoadmaps.length} roadmap{filteredRoadmaps.length === 1 ? "" : "s"}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">Rows
                  <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="dashboard-input-surface h-8 px-2 text-xs">
                    {[8, 16, 32].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <span>Page {Math.min(page, totalPages)} of {totalPages}</span>
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg p-1.5 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10" aria-label="Previous page"><FiChevronLeft /></button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg p-1.5 hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/10" aria-label="Next page"><FiChevronRight /></button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1d3b]">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3c83f6]">Roadmap CRUD</p>
                <h2 className="mt-1 text-xl font-black">{editingRoadmapId ? "Edit Roadmap" : "Create Roadmap"}</h2>
              </div>
              <button type="button" onClick={closeForm} className="rounded-lg p-2 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10" aria-label="Close form"><FiX /></button>
            </div>

            <div className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-5">
                <label className="block text-sm font-semibold">Roadmap Title *
                  <input value={roadmapForm.title} onChange={(event) => updateForm("title", event.target.value)} className="dashboard-input-surface mt-2 w-full" placeholder="Frontend Developer Roadmap" />
                </label>
                <label className="block text-sm font-semibold">Description
                  <textarea value={roadmapForm.description} onChange={(event) => updateForm("description", event.target.value)} className="dashboard-input-surface mt-2 min-h-24 w-full resize-y" placeholder="A structured roadmap for frontend development." />
                </label>
                <label className="block text-sm font-semibold">Target Role *
                  <select value={roadmapForm.targetRole} onChange={(event) => updateForm("targetRole", event.target.value)} className="dashboard-input-surface mt-2 w-full">
                    <option value="">Select target role</option>
                    {TARGET_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    <option value="__custom__">Other role…</option>
                  </select>
                </label>
                {roadmapForm.targetRole === "__custom__" && <input value={roadmapForm.customTargetRole} onChange={(event) => updateForm("customTargetRole", event.target.value)} className="dashboard-input-surface -mt-2 w-full" placeholder="Enter a target role" />}

                <div>
                  <p className="text-sm font-semibold">Duration *</p>
                  <div className="mt-2 flex gap-2">
                    <input type="number" step="any" value={roadmapForm.duration} onChange={(event) => updateForm("duration", event.target.value)} className="dashboard-input-surface w-full" placeholder="6" />
                    <select value={roadmapForm.durationUnit} onChange={(event) => updateForm("durationUnit", event.target.value)} className="dashboard-input-surface w-36 shrink-0">
                      {DURATION_UNITS.map((unit) => <option key={unit} value={unit}>{unit[0].toUpperCase() + unit.slice(1)}</option>)}
                    </select>
                  </div>
                  <p className="mt-1 text-xs opacity-55">Enter any positive duration; there is no fixed roadmap length.</p>
                </div>

                <div>
                  <p className="text-sm font-semibold">Markdown File (.md) *</p>
                  <input ref={fileInputRef} type="file" accept=".md,text/markdown" onChange={handleMarkdownFile} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="dashboard-input-surface mt-2 flex w-full items-center gap-3 text-left text-sm">
                    <FiUpload className="shrink-0 text-[#3c83f6]" />
                    <span className="truncate">{roadmapForm.markdownFile || "Click to upload Markdown file"}</span>
                  </button>
                  <p className="mt-1 text-xs opacity-55">Only Markdown (.md) files are supported.</p>
                  <textarea value={roadmapForm.markdownBody} onChange={(event) => updateForm("markdownBody", event.target.value)} className="dashboard-input-surface mt-3 min-h-40 w-full resize-y font-mono text-xs" placeholder="Upload a .md file to load its content, or paste Markdown here." />
                </div>

                <div>
                  <p className="text-sm font-semibold">Assign to Branches</p>
                  <p className="mt-1 text-xs opacity-55">Leave all unchecked to make the roadmap available to every branch.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {BRANCHES.map((branch) => (
                      <label key={branch} className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs dark:border-white/10">
                        <input type="checkbox" checked={roadmapForm.branches.includes(branch)} onChange={() => toggleBranch(branch)} />
                        {branch}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold">Status</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {STATUSES.map((status) => (
                      <label key={status} className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-xs font-bold ${roadmapForm.status === status ? getStatusClasses(status, isDarkMode) : "border-black/10 opacity-60 dark:border-white/10"}`}>
                        <input type="radio" name="roadmap-status" value={status} checked={roadmapForm.status === status} onChange={() => updateForm("status", status)} className="sr-only" />
                        {status}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs opacity-55">Only Active roadmaps appear on the learner side.</p>
                </div>

                <div className="rounded-xl border border-black/10 bg-black/[0.025] p-4 dark:border-white/10 dark:bg-white/[0.035]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">Preview</p>
                      <p className="mt-1 text-xs opacity-55">Check the title, metadata, and rendered Markdown before publishing.</p>
                    </div>
                    <button type="button" onClick={() => setShowFormPreview((current) => !current)} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#3c83f6] px-3 py-2 text-xs font-bold text-white"><FiEye /> {showFormPreview ? "Hide" : "Preview"}</button>
                  </div>
                  {showFormPreview && (
                    <div className="mt-4 max-h-[28rem] overflow-y-auto rounded-lg border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-[#071831]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#3c83f6]">{previewForm.targetRole || "Target role not set"} · {getDurationLabel(previewForm)}</p>
                      <h3 className="mt-2 text-xl font-black">{previewForm.title || "Untitled roadmap"}</h3>
                      {previewForm.description && <p className="mt-2 opacity-70">{previewForm.description}</p>}
                      <div className="mt-4 border-t border-black/10 pt-3 dark:border-white/10"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{previewForm.markdownBody || "Markdown content will appear here."}</ReactMarkdown></div>
                    </div>
                  )}
                </div>

                {formError && <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">{formError}</p>}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-black/10 px-6 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-end">
              <button type="button" onClick={closeForm} className="dashboard-secondary-btn px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={() => saveRoadmap("Draft")} disabled={isSaving} className="dashboard-secondary-btn px-4 py-2 text-sm disabled:opacity-50">{isSaving ? "Saving…" : "Save Draft"}</button>
              <button type="button" onClick={() => saveRoadmap("Active")} disabled={isSaving} className="dashboard-primary-btn px-4 py-2 text-sm disabled:opacity-50">{editingRoadmapId ? "Publish / Activate" : "Publish / Activate"}</button>
            </div>
          </div>
        </div>
      )}

      {viewingRoadmap && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1d3b]">
            <div className="flex items-start justify-between border-b border-black/10 px-6 py-5 dark:border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3c83f6]">{viewingRoadmap.roadmapId || "Roadmap preview"}</p>
                <h2 className="mt-1 text-2xl font-black">{viewingRoadmap.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-70"><span>{viewingRoadmap.targetRole || "Target role not set"}</span><span>·</span><span>{getDurationLabel(viewingRoadmap)}</span><span>·</span><span>{formatDate(viewingRoadmap.createdAt)}</span></div>
              </div>
              <button type="button" onClick={() => setViewingRoadmap(null)} className="rounded-lg p-2 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10" aria-label="Close preview"><FiX /></button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              {viewingRoadmap.description && <p className="mb-5 rounded-lg bg-black/[0.035] p-4 text-sm leading-6 opacity-75 dark:bg-white/[0.04]">{viewingRoadmap.description}</p>}
              <div className="mb-5 flex flex-wrap gap-2">{(viewingRoadmap.branches?.length ? viewingRoadmap.branches : ["All branches"]).map((branch) => <span key={branch} className="rounded-full border border-[#3c83f6]/25 bg-[#3c83f6]/10 px-3 py-1 text-xs font-semibold text-[#2563eb] dark:text-[#a9d9ff]">{branch}</span>)}</div>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{viewingRoadmap.markdownBody || "No Markdown content available."}</ReactMarkdown>
            </div>
            <div className="flex justify-end gap-2 border-t border-black/10 px-6 py-4 dark:border-white/10"><button type="button" onClick={() => { setViewingRoadmap(null); openEditForm(viewingRoadmap); }} className="dashboard-primary-btn inline-flex items-center gap-2 px-4 py-2 text-sm"><FiEdit2 /> Edit</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
