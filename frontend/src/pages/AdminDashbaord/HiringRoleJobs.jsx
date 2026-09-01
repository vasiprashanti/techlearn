import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiX,
  FiBriefcase,
  FiAlertTriangle,
  FiCheck,
  FiMapPin,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiExternalLink,
} from "react-icons/fi";
import { adminAPI } from "../../services/adminApi";

export default function HiringRoleJobs() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();
  const { roleId } = useParams();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [roleName, setRoleName] = useState("Hiring Role");
  const [roleDescription, setRoleDescription] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State for View Job Details
  const [viewingJob, setViewingJob] = useState(null);

  // Modal State for Create Job
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [uploadingMarkdown, setUploadingMarkdown] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");

  const [jobForm, setJobForm] = useState({
    companyName: "",
    roleTitle: "",
    jobType: "Full-time",
    companyType: "MNC",
    workMode: "Hybrid",
    location: "",
    experience: "Fresher",
    salary: "",
    education: "",
    eligibleBranches: "",
    graduationYear: "",
    eligibility: "",
    description: "",
    skills: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    applicationUrl: "",
    applicationDeadline: "",
    status: "Draft",
    markdownFile: null,
    logoFile: null,
  });

  const resetJobForm = () => {
    setJobForm({
      companyName: "",
      roleTitle: "",
      jobType: "Full-time",
      companyType: "MNC",
      workMode: "Hybrid",
      location: "",
      experience: "Fresher",
      salary: "",
      education: "",
      eligibleBranches: "",
      graduationYear: "",
      eligibility: "",
      description: "",
      skills: "",
      responsibilities: "",
      requirements: "",
      benefits: "",
      applicationUrl: "",
      applicationDeadline: "",
      status: "Draft",
      markdownFile: null,
      logoFile: null,
    });
    setLogoUrl("");
    setSubmitError("");
    setDuplicateWarning(null);
  };

  const updateJobField = (field, value) => {
    setJobForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      (job.JID || job.jid || job.id || "").toLowerCase().includes(query) ||
      (job.company || "").toLowerCase().includes(query) ||
      (job.title || "").toLowerCase().includes(query) ||
      (job.location || "").toLowerCase().includes(query) ||
      (job.status || "").toLowerCase().includes(query)
    );
  });

  const fetchRoleAndJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const [roleResponse, jobsResponse] = await Promise.all([
        adminAPI.getRoleById(roleId),
        adminAPI.getJobs({
          roleId,
          search: searchQuery,
          status: statusFilter,
          sortBy: sortBy || "createdAt",
          sortOrder,
          page,
          limit: 10,
        }),
      ]);

      const role = roleResponse?.data || roleResponse;
      setRoleName(role?.roleName || role?.name || "Hiring Role");
      setRoleDescription(role?.description || "Manage job opportunities and openings under this hiring category.");

      const jobData = jobsResponse?.data || [];
      setJobs(
        (Array.isArray(jobData) ? jobData : []).map((job) => ({
          ...job,
          id: job._id || job.id,
          company: job.companyName || job.company || "",
          title: job.title || job.roleTitle || "",
          experience: job.experience || "",
          salary: job.salary || "",
          location: job.location || "",
          status: job.status || "Draft",
          companyLogo: job.companyLogo || "",
        }))
      );

      if (jobsResponse?.pagination) {
        setPagination(jobsResponse.pagination);
      }
    } catch (err) {
      console.error("Failed to load hiring role jobs:", err);
      setError(err.message || "Failed to load jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (roleId) {
      fetchRoleAndJobs();
    }
  }, [roleId, searchQuery, statusFilter, sortBy, sortOrder, page]);

  const handleCreateJobSubmit = async (chosenStatus = "Draft", allowDuplicate = false) => {
    if (!jobForm.companyName.trim()) {
      setSubmitError("Company name is required.");
      return;
    }
    if (!jobForm.roleTitle.trim()) {
      setSubmitError("Job title is required.");
      return;
    }

    try {
      setSubmittingJob(true);
      setSubmitError("");
      setDuplicateWarning(null);

      const jobData = {
        roleId,
        companyName: jobForm.companyName.trim(),
        companyLogo: logoUrl || "",
        allowDuplicate,
        parsedData: {
          title: jobForm.roleTitle.trim(),
          companyType: jobForm.companyType.trim(),
          jobType: jobForm.jobType,
          workMode: jobForm.workMode,
          location: jobForm.location.trim(),
          experience: jobForm.experience.trim(),
          salary: jobForm.salary.trim(),
          skills: jobForm.skills,
          education: jobForm.education.trim(),
          eligibleBranches: jobForm.eligibleBranches,
          graduationYear: jobForm.graduationYear.trim(),
          eligibility: jobForm.eligibility.trim(),
          description: jobForm.description.trim(),
          responsibilities: jobForm.responsibilities,
          requirements: jobForm.requirements,
          benefits: jobForm.benefits,
          applicationUrl: jobForm.applicationUrl.trim(),
          applicationDeadline: jobForm.applicationDeadline || null,
        },
        status: chosenStatus || jobForm.status || "Draft",
      };

      await adminAPI.createJob(jobData);
      setShowCreateModal(false);
      resetJobForm();
      fetchRoleAndJobs();
    } catch (err) {
      console.error("Failed to create job:", err);
      if (err.duplicate || err.status === 409 || err.message?.toLowerCase().includes("duplicate")) {
        setDuplicateWarning(
          err.existingJob || err.message || "A job with this company, title, and role already exists."
        );
      } else {
        setSubmitError(err.message || "Failed to create job. Please try again.");
      }
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleMarkdownUpload = async (e) => {
    const file = e.target.files?.[0] || null;
    updateJobField("markdownFile", file);
    if (!file) return;

    try {
      setUploadingMarkdown(true);
      setSubmitError("");

      const result = await adminAPI.parseJobMarkdown(file);
      const data = result?.data || result;

      setJobForm((prev) => ({
        ...prev,
        roleTitle: data?.title || prev.roleTitle,
        jobType: data?.jobType || prev.jobType,
        companyType: data?.companyType || prev.companyType,
        workMode: data?.workMode || prev.workMode,
        location: data?.location || prev.location,
        experience: data?.experience || prev.experience,
        salary: data?.salary || prev.salary,
        education: data?.education || prev.education,
        eligibleBranches: Array.isArray(data?.eligibleBranches)
          ? data.eligibleBranches.join(", ")
          : data?.eligibleBranches || prev.eligibleBranches,
        graduationYear: data?.graduationYear ? String(data.graduationYear) : prev.graduationYear,
        eligibility: data?.eligibility || prev.eligibility,
        description: data?.description || prev.description,
        skills: Array.isArray(data?.skills)
          ? data.skills.join(", ")
          : data?.skills || prev.skills,
        responsibilities: Array.isArray(data?.responsibilities)
          ? data.responsibilities.join("\n")
          : data?.responsibilities || prev.responsibilities,
        requirements: Array.isArray(data?.requirements)
          ? data.requirements.join("\n")
          : data?.requirements || prev.requirements,
        benefits: Array.isArray(data?.benefits)
          ? data.benefits.join("\n")
          : data?.benefits || prev.benefits,
        applicationUrl: data?.applicationUrl || prev.applicationUrl,
        applicationDeadline: data?.applicationDeadline
          ? new Date(data.applicationDeadline).toISOString().split("T")[0]
          : prev.applicationDeadline,
        companyName: data?.company || data?.companyName || prev.companyName,
      }));
    } catch (err) {
      console.error("Failed to parse markdown:", err);
      setSubmitError(err.message || "Failed to parse markdown file.");
    } finally {
      setUploadingMarkdown(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0] || null;
    updateJobField("logoFile", file);
    if (!file) return;

    try {
      setUploadingLogo(true);
      setSubmitError("");
      const result = await adminAPI.uploadJobLogo(file);
      const data = result?.data || result;
      setLogoUrl(data?.logoUrl || "");
    } catch (err) {
      console.error("Failed to upload logo:", err);
      setLogoUrl("");
      setSubmitError(err.message || "Failed to upload company logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

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
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Top Breadcrumb */}
          <div>
            <button
              onClick={() => navigate("/admin/hiring")}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Hiring Roles
            </button>
          </div>

          {/* Section 1: Role Heading & Description */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              {roleName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
              {roleDescription}
            </p>
          </div>

          {/* Section 2: Table Section with Toolbar on Top */}
          <div className="space-y-4">
            {/* Toolbar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 dark:bg-white/[0.03] p-3 rounded-xl border border-black/5 dark:border-white/10">
              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search jobs..."
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
              </div>

              {/* Filters & Actions Group */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 px-2.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                >
                  <option value="" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">All Status</option>
                  <option value="Draft" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Draft</option>
                  <option value="Published" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Published</option>
                  <option value="Closed" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Closed</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 px-2.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                >
                  <option value="" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Sort By</option>
                  <option value="companyName" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Company</option>
                  <option value="title" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Job Title</option>
                  <option value="createdAt" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Created Date</option>
                  <option value="status" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Status</option>
                </select>

                {/* Sort Order Toggle */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="h-9 px-2 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                >
                  <option value="asc" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">A → Z</option>
                  <option value="desc" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Z → A</option>
                </select>

                {/* Create Job Button */}
                <button
                  onClick={() => {
                    resetJobForm();
                    setShowCreateModal(true);
                  }}
                  className="dashboard-primary-btn h-9 px-3.5 text-xs shrink-0 flex items-center gap-1.5 font-semibold"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Create Job
                </button>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="overflow-auto max-h-[72vh] bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs">
              <table className="w-full min-w-full table-fixed">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 select-none">
                    <th className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[12%] whitespace-nowrap">
                      JID
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[7%] whitespace-nowrap">
                      Logo
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[15%] whitespace-nowrap">
                      Company
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[18%] whitespace-nowrap">
                      Job Title
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[10%] whitespace-nowrap">
                      Experience
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[12%] whitespace-nowrap">
                      Salary
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[12%] whitespace-nowrap">
                      Location
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[10%] whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[14%] whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="border-t border-black/5 dark:border-white/10">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        Loading jobs...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-red-500">
                        {error}
                      </td>
                    </tr>
                  ) : filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No jobs found under this role category. Click &quot;Create Job&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
                      >
                        {/* JID */}
                        <td className="px-3 py-3 text-left">
                          <span className="block whitespace-nowrap text-xs font-bold text-[#3C83F6] dark:text-blue-300">
                            {job.JID || job.jid || job.id}
                          </span>
                        </td>

                        {/* Logo */}
                        <td className="px-3 py-3 text-center">
                          {job.companyLogo ? (
                            <img
                              src={job.companyLogo}
                              alt={job.company}
                              className="w-7 h-7 rounded-md object-contain mx-auto bg-white/90 p-0.5 border border-black/10 dark:border-white/10 shadow-2xs"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/40 text-[#3C83F6] font-bold text-[10px] flex items-center justify-center mx-auto">
                              {(job.company || "C").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </td>

                        {/* Company */}
                        <td className="px-3 py-3 text-left">
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white truncate block">
                            {job.company}
                          </span>
                        </td>

                        {/* Job Title */}
                        <td className="px-3 py-3 text-left">
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium truncate block">
                            {job.title}
                          </span>
                        </td>

                        {/* Experience */}
                        <td className="px-3 py-3 text-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {job.experience || "Fresher"}
                          </span>
                        </td>

                        {/* Salary */}
                        <td className="px-3 py-3 text-left">
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {job.salary || "Undisclosed"}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-3 py-3 text-left">
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate block">
                            {job.location || "India"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              job.status === "Published"
                                ? "bg-[#dff6e8] text-[#1f7d53]"
                                : "bg-[#fff6c9] text-[#9a7a16]"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>

                        {/* Actions: View, Edit, Delete */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Job Modal Button */}
                            <button
                              onClick={() => setViewingJob(job)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                              title="View Job Details"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Job */}
                            <button
                              onClick={() => navigate(`/admin/hiring/${roleId}/jobs/${job.id}/edit`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                              title="Edit Job"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Job */}
                            <button
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Are you sure you want to delete "${job.title}"?`
                                );
                                if (!confirmed) return;
                                try {
                                  await adminAPI.deleteJob(job.id);
                                  setJobs((prevJobs) =>
                                    prevJobs.filter((item) => item.id !== job.id)
                                  );
                                } catch (err) {
                                  console.error("Failed to delete job:", err);
                                  alert(err.message || "Failed to delete job.");
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                              title="Delete Job"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(pagination.totalPages, prev + 1))
                    }
                    className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* VIEW JOB DETAILS MODAL */}
      {viewingJob && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0f1f43] shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-3">
                {viewingJob.companyLogo ? (
                  <img
                    src={viewingJob.companyLogo}
                    alt={viewingJob.company}
                    className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-black/10 dark:border-white/10 shadow-2xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#3C83F6] font-bold text-xs flex items-center justify-center">
                    {(viewingJob.company || "C").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {viewingJob.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {viewingJob.company} • {roleName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl p-1"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 minimal-scrollbar">
              {/* Badges Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#071532] p-3.5 rounded-xl border border-black/5 dark:border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 block">JID</span>
                  <span className="text-xs font-bold text-[#3C83F6] dark:text-blue-300">
                    {viewingJob.JID || viewingJob.jid || viewingJob.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Salary</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">
                    {viewingJob.salary || "Undisclosed"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Experience</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">
                    {viewingJob.experience || "Fresher"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    viewingJob.status === "Published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700"
                  }`}>
                    {viewingJob.status}
                  </span>
                </div>
              </div>

              {/* Location, Mode & Type */}
              <div className="flex flex-wrap gap-2 text-xs">
                {viewingJob.location && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                    <FiMapPin className="w-3 h-3 text-slate-400" /> {viewingJob.location}
                  </span>
                )}
                {viewingJob.workMode && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                    {viewingJob.workMode}
                  </span>
                )}
                {viewingJob.jobType && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                    {viewingJob.jobType}
                  </span>
                )}
                {viewingJob.companyType && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                    {viewingJob.companyType}
                  </span>
                )}
              </div>

              {/* Description */}
              {viewingJob.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1.5">
                    Job Description
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {viewingJob.description}
                  </p>
                </div>
              )}

              {/* Skills */}
              {viewingJob.skills && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1.5">
                    Skills Required
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(viewingJob.skills) ? viewingJob.skills : String(viewingJob.skills).split(",")).map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[11px] font-medium">
                        {sk.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Details */}
              <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
                {viewingJob.applicationUrl && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Application Link:</span>
                    <a
                      href={viewingJob.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3C83F6] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Open Link <FiExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {viewingJob.applicationDeadline && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Deadline:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {new Date(viewingJob.applicationDeadline).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-black/10 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/30 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL POPUP */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0f1f43] shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FiBriefcase className="w-4 h-4 text-[#3C83F6]" />
                  Create New Job
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Role: <span className="font-semibold text-slate-700 dark:text-slate-200">{roleName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetJobForm();
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl p-1"
              >
                ×
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 minimal-scrollbar">
              {/* Duplicate Warning Prompt */}
              {duplicateWarning && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <FiAlertTriangle className="w-4 h-4" />
                    Potential Duplicate Job Detected
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300/90">
                    A job with this company and title already exists under {roleName}. Would you like to create it anyway?
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-3 py-1 text-xs rounded-lg border border-amber-400 text-amber-800 dark:text-amber-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateJobSubmit(jobForm.status, true)}
                      className="px-3 py-1 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    >
                      Create Anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Boxes Row: Markdown + Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Markdown Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    1. Upload .md File
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#071532] cursor-pointer hover:border-[#3C83F6] transition-colors p-3 text-center">
                    <FiUpload className="w-4 h-4 text-[#3C83F6] mb-1" />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                      {jobForm.markdownFile ? jobForm.markdownFile.name : (uploadingMarkdown ? "Parsing .md..." : "Click to auto-fill with .md")}
                    </span>
                    <span className="text-[9px] text-slate-400">Extracts title, skills, description</span>
                    <input
                      type="file"
                      accept=".md,text/markdown"
                      className="hidden"
                      onChange={handleMarkdownUpload}
                    />
                  </label>
                </div>

                {/* 2. Logo Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                    2. Company Logo
                  </label>
                  <div className="flex items-center gap-2.5">
                    <label className="flex-1 flex flex-col items-center justify-center h-24 rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#071532] cursor-pointer hover:border-[#3C83F6] transition-colors p-3 text-center">
                      <FiUpload className="w-4 h-4 text-[#3C83F6] mb-1" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                        {jobForm.logoFile ? jobForm.logoFile.name : (uploadingLogo ? "Uploading logo..." : "Upload logo image")}
                      </span>
                      <span className="text-[9px] text-slate-400">PNG, JPG, SVG</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    {logoUrl && (
                      <div className="w-16 h-24 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 p-2 flex items-center justify-center shrink-0">
                        <img src={logoUrl} alt="Logo" className="max-h-16 max-w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-black/5 dark:border-white/10">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name*
                  </label>
                  <input
                    type="text"
                    value={jobForm.companyName}
                    onChange={(e) => updateJobField("companyName", e.target.value)}
                    placeholder="e.g. TCS, Amazon, Microsoft"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    required
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title*
                  </label>
                  <input
                    type="text"
                    value={jobForm.roleTitle}
                    onChange={(e) => updateJobField("roleTitle", e.target.value)}
                    placeholder="e.g. Software Engineer, SDE-1"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    required
                  />
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Salary / Stipend
                  </label>
                  <input
                    type="text"
                    value={jobForm.salary}
                    onChange={(e) => updateJobField("salary", e.target.value)}
                    placeholder="e.g. ₹6–10 LPA, ₹25,000/mo"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={jobForm.experience}
                    onChange={(e) => updateJobField("experience", e.target.value)}
                    placeholder="e.g. Fresher, 0–2 years"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => updateJobField("location", e.target.value)}
                    placeholder="e.g. Bengaluru, Hyderabad, Remote"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                </div>

                {/* Work Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Mode
                  </label>
                  <select
                    value={jobForm.workMode}
                    onChange={(e) => updateJobField("workMode", e.target.value)}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Hybrid" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Hybrid</option>
                    <option value="Remote" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Remote</option>
                    <option value="On-site" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">On-site</option>
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Type
                  </label>
                  <select
                    value={jobForm.jobType}
                    onChange={(e) => updateJobField("jobType", e.target.value)}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Full-time" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Full-time</option>
                    <option value="Internship" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Internship</option>
                    <option value="Freelance" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Freelance</option>
                    <option value="Contract" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Contract</option>
                  </select>
                </div>

                {/* Company Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Type
                  </label>
                  <input
                    type="text"
                    value={jobForm.companyType}
                    onChange={(e) => updateJobField("companyType", e.target.value)}
                    placeholder="e.g. MNC, Startup"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                {/* Application URL */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Application Link / URL
                  </label>
                  <input
                    type="url"
                    value={jobForm.applicationUrl}
                    onChange={(e) => updateJobField("applicationUrl", e.target.value)}
                    placeholder="https://careers.company.com/apply"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                  />
                </div>

                {/* Application Deadline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={jobForm.applicationDeadline}
                    onChange={(e) => updateJobField("applicationDeadline", e.target.value)}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Listing Status
                  </label>
                  <select
                    value={jobForm.status}
                    onChange={(e) => updateJobField("status", e.target.value)}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Draft" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Draft (Hidden from users)</option>
                    <option value="Published" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Published (Live on Hiring page)</option>
                    <option value="Closed" className="bg-white text-slate-900 dark:bg-[#071532] dark:text-white">Closed</option>
                  </select>
                </div>

                {/* Skills */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={jobForm.skills}
                    onChange={(e) => updateJobField("skills", e.target.value)}
                    placeholder="e.g. React, Node.js, Python, SQL"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                {/* Description */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Description Overview
                  </label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => updateJobField("description", e.target.value)}
                    placeholder="Brief description of the job opportunity and expectations..."
                    rows={3}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#071532] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none resize-none"
                  />
                </div>
              </div>

              {submitError && <p className="text-xs text-red-500 font-medium">{submitError}</p>}
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-3.5 border-t border-black/10 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetJobForm();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submittingJob}
                  onClick={() => handleCreateJobSubmit("Draft")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#3C83F6]/30 text-[#3C83F6] dark:text-blue-300 hover:bg-[#3C83F6]/10 transition disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={submittingJob}
                  onClick={() => handleCreateJobSubmit("Published")}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  {submittingJob ? "Publishing..." : "Publish Job"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}