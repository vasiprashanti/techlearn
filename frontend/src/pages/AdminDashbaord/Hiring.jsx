import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import {
  FiPlus,
  FiEye,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiArchive,
  FiChevronDown,
} from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/adminApi";

export default function Hiring() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All, Published, Draft, Archived
  const [showRoleForm, setShowRoleForm] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [roleError, setRoleError] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    status: "Published",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [allJobs, setAllJobs] = useState([]);

  // Sorting
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizeRole = (role) => {
    const rawStatus = role.status || "Draft";
    // Normalize "Active" legacy status to "Published"
    const normalizedStatus = rawStatus === "Active" ? "Published" : rawStatus;

    return {
      id: role._id || role.id,
      name: role.roleName || role.name || "",
      description: role.description || "",
      status: normalizedStatus,
      jobs: Number(role.jobs || 0),
      activeJobs: Number(role.activeJobs || 0),
      createdAt: role.createdAt
        ? new Date(role.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "--",
    };
  };

  const fetchRolesAndJobs = async () => {
    try {
      setLoadingRoles(true);
      setRoleError("");

      const [rolesRes, jobsRes] = await Promise.allSettled([
        adminAPI.getRoles({ limit: 100 }),
        adminAPI.getJobs({ limit: 200 }),
      ]);

      if (rolesRes.status === "fulfilled") {
        const rawList = rolesRes.value?.data || rolesRes.value || [];
        setRoles((Array.isArray(rawList) ? rawList : []).map(normalizeRole));
      }

      if (jobsRes.status === "fulfilled") {
        const rawJobs =
          jobsRes.value?.data?.jobs ||
          jobsRes.value?.jobs ||
          jobsRes.value?.data ||
          (Array.isArray(jobsRes.value) ? jobsRes.value : []);
        setAllJobs(Array.isArray(rawJobs) ? rawJobs : []);
      }
    } catch (error) {
      console.error("Failed to fetch hiring roles or jobs:", error);
      setRoleError(error.message || "Failed to load hiring records.");
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRolesAndJobs();
  }, []);

  // Compute 5 Dashboard Summary Statistics dynamically
  const stats = useMemo(() => {
    const totalRoles = roles.length;
    const activeRoles = roles.filter((r) => r.status === "Published").length;
    const draftRoles = roles.filter((r) => r.status === "Draft").length;

    // Total jobs count across all roles
    let totalJobs = 0;
    let publishedJobs = 0;

    if (allJobs.length > 0) {
      totalJobs = allJobs.length;
      publishedJobs = allJobs.filter((j) => j.status === "Published").length;
    } else {
      // Fallback to role-level aggregates if jobs list isn't populated
      totalJobs = roles.reduce((acc, r) => acc + (r.jobs || 0), 0);
      publishedJobs = roles.reduce((acc, r) => acc + (r.activeJobs || 0), 0);
    }

    return {
      totalRoles,
      activeRoles,
      draftRoles,
      totalJobs,
      publishedJobs,
    };
  }, [roles, allJobs]);

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) return;

    try {
      setCreatingRole(true);
      setRoleError("");

      const payload = {
        roleName: roleForm.name.trim(),
        description: roleForm.description.trim(),
        status: roleForm.status || "Draft",
      };

      if (editingRole) {
        const roleId = editingRole.id || editingRole._id;
        const res = await adminAPI.updateRole(roleId, payload);
        const updated = res?.data || res;
        setRoles((prevRoles) =>
          prevRoles.map((role) =>
            (role.id || role._id) === roleId ? normalizeRole(updated) : role
          )
        );
      } else {
        const res = await adminAPI.createRole(payload);
        const newRole = res?.data || res;
        setRoles((prevRoles) => [...prevRoles, normalizeRole(newRole)]);
      }

      setRoleForm({
        name: "",
        description: "",
        status: "Published",
      });
      setEditingRole(null);
      setShowRoleForm(false);
    } catch (error) {
      console.error("Failed to save hiring role:", error);
      setRoleError(error.message || "Failed to save hiring role.");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleInlineStatusChange = async (roleId, newStatus) => {
    try {
      const prevRole = roles.find((r) => r.id === roleId);
      if (!prevRole) return;

      // Optimistic update
      setRoles((prev) =>
        prev.map((r) => (r.id === roleId ? { ...r, status: newStatus } : r))
      );

      await adminAPI.updateRole(roleId, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.message || "Failed to update role status.");
      fetchRolesAndJobs();
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      const roleId = roleToDelete.id || roleToDelete._id;
      await adminAPI.deleteRole(roleId);
      setRoles((prev) => prev.filter((r) => (r.id || r._id) !== roleId));
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    } catch (err) {
      console.error("Failed to delete role:", err);
      alert(err.message || "Failed to delete role.");
    }
  };

  const filteredRoles = roles
    .filter((role) => {
      // Status filter
      if (statusFilter !== "All" && role.status !== statusFilter) {
        return false;
      }

      // Search query
      const query = searchQuery.toLowerCase();
      return (
        role.name.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query) ||
        role.status.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && roleToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setRoleToDelete(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-bold text-rose-500">
              Delete Role Category?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the role category{" "}
              <strong className="text-slate-900 dark:text-white">
                &ldquo;{roleToDelete.name}&rdquo;
              </strong>
              ?
              <br />
              <br />
              <span className="text-xs text-rose-500 font-medium">
                ⚠️ All associated job postings under this role category will be removed.
              </span>
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRoleToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRole}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Create/Edit Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowRoleForm(false);
              setEditingRole(null);
              setRoleError("");
              setRoleForm({
                name: "",
                description: "",
                status: "Published",
              });
            }}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-black/10 dark:bg-[#0a1737] dark:border-white/10 p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div>
                <h2 className="text-lg font-bold text-[#3C83F6] dark:text-[#bceaff]">
                  {editingRole ? "Edit Role Category" : "Create Role Category"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editingRole
                    ? "Update hiring category details and status."
                    : "Add a new role category for job opportunities."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowRoleForm(false);
                  setEditingRole(null);
                  setRoleError("");
                  setRoleForm({
                    name: "",
                    description: "",
                    status: "Published",
                  });
                }}
                className="text-sm font-medium px-2 py-1 rounded-lg text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Role Name*
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) =>
                    setRoleForm({
                      ...roleForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Software Development, Frontend Development"
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Description
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) =>
                    setRoleForm({
                      ...roleForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description of this hiring category..."
                  rows={3}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 resize-none"
                />
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Status*
                </label>
                <div className="relative">
                  <select
                    value={roleForm.status}
                    onChange={(e) =>
                      setRoleForm({
                        ...roleForm,
                        status: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 pr-10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 appearance-none font-medium cursor-pointer"
                  >
                    <option value="Draft" className="bg-white text-slate-900 dark:bg-[#0a1737] dark:text-white">Draft (Hidden from user side)</option>
                    <option value="Published" className="bg-white text-slate-900 dark:bg-[#0a1737] dark:text-white">Published (Visible on user side)</option>
                    <option value="Archived" className="bg-white text-slate-900 dark:bg-[#0a1737] dark:text-white">Archived (Retired / Inactive)</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              {roleError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  ⚠️ {roleError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleForm(false);
                    setEditingRole(null);
                    setRoleError("");
                    setRoleForm({
                      name: "",
                      description: "",
                      status: "Published",
                    });
                  }}
                  className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/15 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={!roleForm.name.trim() || creatingRole}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-50 transition-colors"
                >
                  {creatingRole
                    ? "Saving..."
                    : editingRole
                    ? "Update Role"
                    : "Create Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-20 sm:pt-24 md:pt-28 pb-12 px-3 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header & Stats Cards - Matching Courses Page */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="admin-page-title text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Hiring Management</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Manage hiring role categories, job postings, status lifecycles, and user visibility.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRole(null);
                  setRoleForm({
                    name: "",
                    description: "",
                    status: "Published",
                  });
                  setShowRoleForm(true);
                }}
                className="dashboard-primary-btn h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Create Role
              </button>
            </div>

            {/* Quick Summary Stat Cards (5 metrics matching Courses Page design) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Total Roles */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <FiLayers className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Total Roles</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{stats.totalRoles}</span>
                </div>
              </div>

              {/* Active Roles */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Active Roles</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.activeRoles}</span>
                </div>
              </div>

              {/* Draft Roles */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Draft Roles</span>
                  <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">{stats.draftRoles}</span>
                </div>
              </div>

              {/* Total Jobs */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Total Jobs</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.totalJobs}</span>
                </div>
              </div>

              {/* Published Jobs */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Published Jobs</span>
                  <span className="text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400">{stats.publishedJobs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hiring Categories Section */}
          <section className="space-y-4">
            {/* Toolbar: Status Filter Pills + Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center shrink-0">
                  <FiBriefcase className="w-4 h-4 text-[#3C83F6] dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-sm md:text-[15px] font-semibold text-[#0b1b38] dark:text-white">
                    Role Categories & Job Management
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap justify-between sm:justify-end">
                {/* Status Pills Filter */}
                <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-0.5 text-xs overflow-x-auto">
                  {["All", "Published", "Draft", "Archived"].map((st) => (
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
                    placeholder="Search roles..."
                    className="w-full h-9 pl-9 pr-7 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Database Table Listing */}
            {loadingRoles ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm font-medium">Loading hiring roles...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-8 text-center text-sm text-black/40 dark:text-white/40 mt-4">
                No role categories match your filter. Click &quot;Create Role&quot; above to add a new category.
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[78vh] w-full bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs minimal-scrollbar">
                <table className="w-full min-w-[860px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40 select-none">
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-14 whitespace-nowrap">
                        #
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[200px] cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("name")}
                      >
                        Role Category
                        {sortField === "name" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">
                        Actions
                      </th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-24 cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("jobs")}
                      >
                        Jobs
                        {sortField === "jobs" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("status")}
                      >
                        Status
                        {sortField === "status" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("createdAt")}
                      >
                        Created
                        {sortField === "createdAt" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[200px] whitespace-nowrap">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
                    {filteredRoles.map((role, idx) => (
                      <tr
                        key={role.id}
                        onClick={() => navigate(`/admin/hiring/${role.id}`)}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        {/* Index */}
                        <td className="px-3.5 py-3.5 text-center text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* Role Category */}
                        <td className="px-4 py-3.5">
                          <div className="max-w-[240px] truncate">
                            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white hover:text-blue-600 transition-colors">
                              {role.name}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-3.5 py-3.5 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => navigate(`/admin/hiring/${role.id}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"
                              title="View Jobs"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRole(role);
                                setRoleForm({
                                  name: role.name,
                                  description: role.description,
                                  status: role.status,
                                });
                                setShowRoleForm(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"
                              title="Edit Role"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setRoleToDelete(role);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              title="Delete Role"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Jobs Count */}
                        <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                            {role.jobs}
                          </span>
                        </td>

                        {/* Status (with Dropdown selection) */}
                        <td
                          className="px-3.5 py-3.5 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-block relative">
                            <select
                              value={role.status}
                              onChange={(e) =>
                                handleInlineStatusChange(role.id, e.target.value)
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer appearance-none pr-6 transition ${
                                role.status === "Published"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                  : role.status === "Draft"
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              <option value="Published" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Published</option>
                              <option value="Draft" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Draft</option>
                              <option value="Archived" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Archived</option>
                            </select>
                            <FiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="px-3.5 py-3.5 text-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {role.createdAt}
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          <div className="max-w-[260px] truncate" title={role.description || "--"}>
                            {role.description || "--"}
                          </div>
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
    </div>
  );
}