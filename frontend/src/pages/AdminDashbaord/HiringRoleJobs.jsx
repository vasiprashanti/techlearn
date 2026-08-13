import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiMoreHorizontal,
} from "react-icons/fi";

export default function HiringRoleJobs() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const navigate = useNavigate();
  const { roleId } = useParams();
  const roleNames = {
  "1": "Software Development",
  "2": "Frontend Development",
  "3": "Data Analytics",
  "4": "AI / Machine Learning",
};

const roleName = roleNames[roleId] || "Hiring Role";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Temporary data for UI testing
  const [jobs] = useState([
    {
      id: "JID-000001",
      company: "TCS",
      title: "Software Engineer",
      experience: "Fresher",
      salary: "₹4–6 LPA",
      location: "Hyderabad",
      status: "Published",
    },
    {
      id: "JID-000002",
      company: "Amazon",
      title: "SDE",
      experience: "Fresher",
      salary: "₹12–18 LPA",
      location: "Bangalore",
      status: "Published",
    },
    {
      id: "JID-000003",
      company: "Infosys",
      title: "System Engineer",
      experience: "Fresher",
      salary: "₹4–6 LPA",
      location: "Pune",
      status: "Draft",
    },
  ]);

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();

    return (
      job.id.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.title.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      job.status.toLowerCase().includes(query)
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
        <div className="max-w-[1600px] mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate("/admin/hiring")}
            className="flex items-center gap-2 mb-6 text-sm text-slate-500 dark:text-slate-300 hover:text-[#3C83F6] transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Hiring Roles
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {roleName}
            </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage job openings under this hiring role.
              </p>
            </div>

            <div className="flex items-center gap-2">

              {/* Search */}
              <div className="relative w-48 sm:w-56">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full h-10 pl-10 pr-3 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
              </div>

              {/* Create Job */}
              <button
                onClick={() => navigate(`/admin/hiring/${roleId}/jobs/create`)}
                className="dashboard-primary-btn h-10 px-4 text-xs shrink-0 flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Create Job
              </button>

            </div>
          </div>

          {/* Jobs Table */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-[#0b1b38] shadow-sm">

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[130px_1.2fr_1.5fr_1fr_1fr_1.2fr_110px_60px] gap-4 px-5 py-4 bg-[#e7f0f6] dark:bg-[#24384e] border-b border-black/10 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-200">
              <span>JID</span>
              <span>Company</span>
              <span>Job Title</span>
              <span>Experience</span>
              <span>Salary</span>
              <span>Location</span>
              <span>Status</span>
              <span></span>
            </div>

            {/* Rows */}
            {filteredJobs.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No jobs found.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-1 md:grid-cols-[130px_1.2fr_1.5fr_1fr_1fr_1.2fr_110px_60px] gap-3 md:gap-4 px-5 py-5 border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                >

                  {/* JID */}
                  <div>
                    <span className="text-xs font-semibold text-[#3C83F6] dark:text-blue-300">
                      {job.id}
                    </span>
                  </div>

                  {/* Company */}
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      {job.company}
                    </span>
                  </div>

                  {/* Job Title */}
                  <div>
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {job.title}
                    </span>
                  </div>

                  {/* Experience */}
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {job.experience}
                    </span>
                  </div>

                  {/* Salary */}
                  <div>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {job.salary}
                    </span>
                  </div>

                  {/* Location */}
                  <div>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {job.location}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        job.status === "Published"
                          ? "bg-[#dff6e8] text-[#1f7d53]"
                          : "bg-[#fff6c9] text-[#9a7a16]"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-start md:justify-end gap-2">
                    <button
                      onClick={() => console.log("Edit job:", job)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => console.log("Delete job:", job)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))
            )}

          </div>

        </div>
      </main>
    </div>
  );
}