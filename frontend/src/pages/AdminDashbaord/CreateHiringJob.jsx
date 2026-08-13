import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowLeft, FiUpload, FiX } from "react-icons/fi";

export default function CreateHiringJob() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const navigate = useNavigate();
  const { roleId } = useParams();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    roleTitle: "",
    markdownFile: null,
    logoFile: null,
  });

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    console.log("Creating job:", {
      roleId,
      ...form,
    });
  };

  return (
    <div
      className={`flex min-h-screen w-full font-sans antialiased ${
        isDarkMode
          ? "dark bg-[#020b23] text-slate-100"
          : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] text-slate-900"
      }`}
    >
      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      <main
        className={`flex-1 min-h-screen transition-all duration-700 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16`}
      >
        <div className="max-w-4xl mx-auto">

          {/* Back */}
          <button
            onClick={() => navigate(`/admin/hiring/${roleId}/jobs`)}
            className="flex items-center gap-2 mb-6 text-sm text-slate-500 dark:text-slate-300 hover:text-[#3C83F6]"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Create New Job
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create a new job opening under this hiring role.
            </p>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0b1b38] p-6 md:p-8">

            <div className="space-y-6">

              {/* Role Category */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  Role Category
                </label>

                <input
                  type="text"
                  value="Software Development"
                  disabled
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#071532] px-4 py-3 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Automatically selected from the hiring role.
                </p>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  Company Name
                </label>

                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) =>
                    updateField("companyName", e.target.value)
                  }
                  placeholder="e.g. TCS"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
              </div>

              {/* Role Title */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  Job Title
                </label>

                <input
                  type="text"
                  value={form.roleTitle}
                  onChange={(e) =>
                    updateField("roleTitle", e.target.value)
                  }
                  placeholder="e.g. Software Engineer"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
              </div>

              {/* Company Logo */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  Company Logo
                </label>

                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#071532] cursor-pointer hover:border-[#3C83F6] transition-colors">

                  <FiUpload className="w-6 h-6 text-slate-400 mb-2" />

                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Click to upload company logo
                  </span>

                  <span className="text-xs text-slate-400 mt-1">
                    PNG, JPG, JPEG
                  </span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={(e) =>
                      updateField(
                        "logoFile",
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </label>

                {form.logoFile && (
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{form.logoFile.name}</span>

                    <button
                      type="button"
                      onClick={() => updateField("logoFile", null)}
                      className="text-red-500"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
              </div>

              {/* Markdown */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  Job Markdown File
                </label>

                <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#071532] cursor-pointer hover:border-[#3C83F6] transition-colors">

                  <FiUpload className="w-6 h-6 text-slate-400 mb-2" />

                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Click to upload .md file
                  </span>

                  <span className="text-xs text-slate-400 mt-1">
                    Markdown files only
                  </span>

                  <input
                    type="file"
                    accept=".md,text/markdown"
                    className="hidden"
                    onChange={(e) =>
                      updateField(
                        "markdownFile",
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </label>

                {form.markdownFile && (
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{form.markdownFile.name}</span>

                    <button
                      type="button"
                      onClick={() =>
                        updateField("markdownFile", null)
                      }
                      className="text-red-500"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/hiring/${roleId}/jobs`)
                  }
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !form.companyName.trim() ||
                    !form.roleTitle.trim()
                  }
                  className="dashboard-primary-btn px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Job
                </button>

              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}