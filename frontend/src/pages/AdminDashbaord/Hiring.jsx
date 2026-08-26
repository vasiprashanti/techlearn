import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { FiPlus, FiEye, FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import HiringRoleCard from "../../components/AdminDashbaord/HiringRoleCard";
import { adminAPI } from "../../services/adminApi";

export default function Hiring() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleForm, setShowRoleForm] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [roleError, setRoleError] = useState("");

  const [creatingRole, setCreatingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
  });

  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const normalizeRole = (role) => ({
  id: role._id || role.id,
  name: role.roleName || role.name || "",
  description: role.description || "",
  status: role.status || "Active",
  jobs: role.jobs || 0,
  activeJobs: role.activeJobs || 0,
  });

  useEffect(() => {
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
    };

    if (editingRole) {
      // EDIT EXISTING ROLE
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
      // CREATE NEW ROLE
      const newRole = await adminAPI.createRole(payload);

      setRoles((prevRoles) => [
        ...prevRoles,
        normalizeRole(newRole),
      ]);
    }

    setRoleForm({
      name: "",
      description: "",
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

const filteredRoles = roles.filter((role) => {
  const query = searchQuery.toLowerCase();

  return (
    role.name.toLowerCase().includes(query) ||
    role.description.toLowerCase().includes(query) ||
    role.status.toLowerCase().includes(query)
  );
});
  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased ${
        isDarkMode
          ? "dark bg-[#020b23] text-slate-100"
          : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] text-slate-900"
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen transition-all duration-700 ease-in-out ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16`}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">

          {/* Page Title */}
          <div>
            <h1 className="admin-page-title">
              Hiring
            </h1>
          </div>

          {/* Hiring Section */}
          <section className="space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center">
                  <span className="text-[#3C83F6] dark:text-blue-300 font-bold">
                    H
                  </span>
                </div>

                <div>
                  <h2 className="text-sm md:text-[15px] font-semibold text-[#0b1b38] dark:text-white">
                    Hiring Roles
                  </h2>

                  <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300">
                    Manage hiring roles and required skills.
                  </p>
                </div>
              </div>

              {/* Search + Add */}
              <div className="flex items-center gap-2 self-end sm:self-auto">

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
                  onClick={() => setShowRoleForm(true)}
                  className="dashboard-primary-btn h-9 px-4 text-xs shrink-0 flex items-center gap-2"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Role
                </button>

              </div>
            </div>

            
            {filteredRoles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-8 text-center text-sm text-black/40 dark:text-white/40 mt-4">
              No hiring roles found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {filteredRoles.map((role) => (
          <HiringRoleCard
            key={role.id}
            role={role}
            selected={false}
            onSelectToggle={() => {}}
            onEdit={(selectedRole) => {
              setEditingRole(selectedRole);
              setRoleForm({
                name: selectedRole.name || selectedRole.roleName || "",
                description: selectedRole.description || "",
              });
            setShowRoleForm(true);
            }}
            onDelete={async (selectedRole) => {
              const roleId = selectedRole.id || selectedRole._id;
              if (!roleId) return;
              const confirmed = window.confirm(
              `Delete "${selectedRole.name || selectedRole.roleName}"?`
            );
            if (!confirmed) return;
            try {
              await adminAPI.deleteRole(roleId);
              setRoles((currentRoles) =>
                currentRoles.filter(
                (role) => (role.id || role._id) !== roleId
                )
              );
            } catch (error) {
          console.error("Failed to delete role:", error);
          alert(error.message || "Failed to delete role.");
         }
        }}
          onView={(selectedRole) => {
            navigate(`/admin/hiring/${selectedRole.id}`);
          }}
          />
        ))}
      </div>
    )}
      </section>
      </div>
        {showRoleForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f1f43] p-6 shadow-2xl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
           {editingRole ? "Edit Role" : "Create Role"}
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {editingRole
              ? "Update the hiring role details."
              : "Create a new hiring category."}
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
            });
          }}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-5">

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Role Name
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
            placeholder="e.g. Software Development"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
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
            placeholder="Optional description"
            rows={4}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">

          <button
            type="button"
            onClick={() => {
              setShowRoleForm(false);
              setEditingRole(null);
              setRoleError("");
              setRoleForm({
                name: "",
                description: "",
              });
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveRole}
            disabled={!roleForm.name.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingRole ? "Update Role" : "Create Role"}
          </button>

        </div>

      </div>
    </div>
  </div>
)}
      </main>
    </div>
  );
}