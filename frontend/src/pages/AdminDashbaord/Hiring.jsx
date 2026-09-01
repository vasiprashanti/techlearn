import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { FiPlus, FiEye, FiSearch, FiEdit2, FiTrash2, FiBriefcase } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { adminAPI } from "../../services/adminApi";

export default function Hiring() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleForm, setShowRoleForm] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [roleError, setRoleError] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    status: "Active",
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

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

  const normalizeRole = (role) => ({
    id: role._id || role.id,
    name: role.roleName || role.name || "",
    description: role.description || "",
    status: role.status || "Active",
    jobs: role.jobs || 0,
    activeJobs: role.activeJobs || 0,
    createdAt: role.createdAt ? new Date(role.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) : "--",
  });

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      setRoleError("");
      const response = await adminAPI.getRoles();
      setRoles((response || []).map(normalizeRole));
    } catch (error) {
      console.error("Failed to fetch hiring roles:", error);
      setRoleError(error.message || "Failed to load hiring roles.");
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) return;

    try {
      setCreatingRole(true);
      setRoleError("");

      const payload = {
        roleName: roleForm.name.trim(),
        description: roleForm.description.trim(),
        status: roleForm.status || "Active",
      };

      if (editingRole) {
        const roleId = editingRole.id || editingRole._id;
        const updatedRole = await adminAPI.updateRole(roleId, payload);
        setRoles((prevRoles) =>
          prevRoles.map((role) =>
            (role.id || role._id) === roleId
              ? normalizeRole(updatedRole)
              : role
          )
        );
      } else {
        const newRole = await adminAPI.createRole(payload);
        setRoles((prevRoles) => [
          ...prevRoles,
          normalizeRole(newRole),
        ]);
      }

      setRoleForm({
        name: "",
        description: "",
        status: "Active",
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
      className={`flex min-h-screen w-full font-sans antialiased ${
        isDarkMode
          ? "dark bg-[#020b23] text-slate-100"
          : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] text-slate-900"
      }`}
    >
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && roleToDelete && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setRoleToDelete(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-500 dark:text-rose-400">
              Delete Role Category?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the role category{" "}
              <strong className="text-slate-800 dark:text-white">
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
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRole}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Create/Edit Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f1f43] p-6 shadow-2xl border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingRole ? "Edit Role Category" : "Create Role Category"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {editingRole
                    ? "Update the hiring role details."
                    : "Create a new role category for job opportunities."}
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
                    status: "Active",
                  });
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
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
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
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
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={roleForm.status}
                  onChange={(e) =>
                    setRoleForm({
                      ...roleForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {roleError && <p className="text-xs text-red-500">{roleError}</p>}

              <div className="flex justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleForm(false);
                    setEditingRole(null);
                    setRoleError("");
                    setRoleForm({
                      name: "",
                      description: "",
                      status: "Active",
                    });
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={!roleForm.name.trim() || creatingRole}
                  className="px-5 py-2 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2f73e0] transition"
                >
                  {creatingRole ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
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
        } pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="admin-page-title">Hiring</h1>
          </div>

          {/* Hiring Categories Section */}
          <section className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center shrink-0">
                  <FiBriefcase className="w-4 h-4 text-[#3C83F6] dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-sm md:text-[15px] font-semibold text-[#0b1b38] dark:text-white">
                    Role Categories & Job Management
                  </h2>
                  <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300 truncate">
                    Manage hiring role categories and create job opportunities under each role.
                  </p>
                </div>
              </div>

              {/* Search + Add */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <div className="relative w-48 sm:w-56">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingRole(null);
                    setRoleForm({
                      name: "",
                      description: "",
                      status: "Active",
                    });
                    setShowRoleForm(true);
                  }}
                  className="dashboard-primary-btn h-9 px-4 text-xs shrink-0 flex items-center gap-2"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Create Role
                </button>
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
                No role categories created yet. Click &quot;Create Role&quot; above to add your first category.
              </div>
            ) : (
              <div className="overflow-auto max-h-[78vh] bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs">
                <table className="w-full min-w-full table-fixed">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 select-none">
                      <th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[6%] whitespace-nowrap">
                        #
                      </th>
                      <th
                        className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[24%] cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("name")}
                      >
                        Role Category
                        {sortField === "name" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[12%] whitespace-nowrap">
                        Actions
                      </th>
                      <th
                        className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[10%] cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("jobs")}
                      >
                        Jobs
                        {sortField === "jobs" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[12%] cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("status")}
                      >
                        Status
                        {sortField === "status" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th
                        className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[14%] cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort("createdAt")}
                      >
                        Created
                        {sortField === "createdAt" && (sortDirection === "asc" ? " ▲" : " ▼")}
                      </th>
                      <th className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[22%] whitespace-nowrap">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="border-t border-black/5 dark:border-white/10">
                    {filteredRoles.map((role, idx) => (
                      <tr
                        key={role.id}
                        onClick={() => navigate(`/admin/hiring/${role.id}`)}
                        className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        {/* Index */}
                        <td className="px-3 py-3 text-center text-[11px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap">
                          {idx + 1}
                        </td>

                        {/* Role Category */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-white hover:text-blue-600 transition-colors truncate">
                              {role.name}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-3 py-3 text-center"
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
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                            {role.jobs}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              role.status === "Active"
                                ? "bg-[#dff6e8] text-[#1f7d53]"
                                : "bg-[#fff6c9] text-[#9a7a16]"
                            }`}
                          >
                            {role.status}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                          {role.createdAt}
                        </td>

                        {/* Description */}
                        <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 truncate">
                          {role.description || "--"}
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