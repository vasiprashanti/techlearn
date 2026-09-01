import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowLeft, FiUpload, FiX } from "react-icons/fi";
import { adminAPI } from "../../services/adminApi";

export default function CreateHiringJob() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const navigate = useNavigate();
  const { roleId } = useParams();
  const [roleName, setRoleName] = useState("Loading role...");
  const [loadingRole, setLoadingRole] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (!roleId) return;
      try {
        setLoadingRole(true);
        const res = await adminAPI.getRoleById(roleId);
        const role = res?.data || res;
        setRoleName(role?.roleName || role?.name || "Hiring Role");
      } catch (err) {
        console.error("Failed to load role details:", err);
        setRoleName("Hiring Role");
      } finally {
        setLoadingRole(false);
      }
    };
    fetchRole();
  }, [roleId]);

  const [form, setForm] = useState({
  companyName: "",
  roleTitle: "",
  jobType: "",
  companyType: "",
  workMode: "",
  location: "",
  experience: "",
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
  const [parsedJob, setParsedJob] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingMarkdown, setUploadingMarkdown] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateJobWithStatus = async (chosenStatus, allowDuplicate = false) => {
    try {
      setSubmitting(true);
      setSubmitError("");
      setDuplicateWarning(null);

      const companyLogo = logoUrl || "";
      const jobData = {
        roleId,
        companyName: form.companyName.trim(),
        companyLogo,
        allowDuplicate,
        parsedData: {
          title: form.roleTitle.trim(),
          companyType: form.companyType.trim(),
          jobType: form.jobType,
          workMode: form.workMode,
          location: form.location.trim(),
          experience: form.experience.trim(),
          salary: form.salary.trim(),
          skills: form.skills,
          education: form.education.trim(),
          eligibleBranches: form.eligibleBranches,
          graduationYear: form.graduationYear.trim(),
          eligibility: form.eligibility.trim(),
          description: form.description.trim(),
          responsibilities: form.responsibilities,
          requirements: form.requirements,
          benefits: form.benefits,
          applicationUrl: form.applicationUrl.trim(),
          applicationDeadline: form.applicationDeadline || null,
        },
        status: chosenStatus || form.status || "Draft",
      };

      const res = await adminAPI.createJob(jobData);
      alert(`Job ${chosenStatus === "Published" ? "published" : "saved as draft"} successfully!`);
      navigate(`/admin/hiring/${roleId}`);
    } catch (error) {
      console.error("Failed to create job:", error);
      if (error.duplicate || error.status === 409 || error.message?.toLowerCase().includes("duplicate")) {
        setDuplicateWarning(error.existingJob || error.message || "A job with this company, title, and role already exists.");
      } else {
        setSubmitError(error.message || "Failed to create job. Please try again.");
      }
    } finally {
      setSubmitting(false);
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
            onClick={() => navigate(`/admin/hiring/${roleId}`)}
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
                  value={roleName}
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

              {/* Job Type */}
<div>
  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
    Job Type
  </label>

  <select
    value={form.jobType}
    onChange={(e) => updateField("jobType", e.target.value)}
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
  >
    <option value="">Select job type</option>
    <option value="Full Time">Full Time</option>
    <option value="Part Time">Part Time</option>
    <option value="Internship">Internship</option>
    <option value="Contract">Contract</option>
  </select>
</div>

{/* Company Type */}
<div>
  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
    Company Type
  </label>

  <input
    type="text"
    value={form.companyType}
    onChange={(e) => updateField("companyType", e.target.value)}
    placeholder="e.g. MNC, Startup, Product Company"
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
  />
</div>

{/* Work Mode */}
<div>
  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
    Work Mode
  </label>

  <select
    value={form.workMode}
    onChange={(e) => updateField("workMode", e.target.value)}
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
  >
    <option value="">Select work mode</option>
    <option value="On-site">On-site</option>
    <option value="Remote">Remote</option>
    <option value="Hybrid">Hybrid</option>
  </select>
</div>

{/* Location */}
<div>
  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
    Location
  </label>

  <input
    type="text"
    value={form.location}
    onChange={(e) => updateField("location", e.target.value)}
    placeholder="e.g. Bangalore"
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
  />
</div>

{/* Experience */}
<div>
  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
    Experience
  </label>

  <input
    type="text"
    value={form.experience}
    onChange={(e) => updateField("experience", e.target.value)}
    placeholder="e.g. Fresher / 0-2 years"
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
  />
</div>

{/* Salary */}
<div>
  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
    Salary
  </label>

  <input
    type="text"
    value={form.salary}
    onChange={(e) => updateField("salary", e.target.value)}
    placeholder="e.g. ₹6-10 LPA"
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
  />
</div>

{/* Eligibility */}
<div className="pt-4 border-t border-black/10 dark:border-white/10">
  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
    Eligibility
  </h2>

  <div className="space-y-5">

    {/* Education */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Education
      </label>

      <input
        type="text"
        value={form.education}
        onChange={(e) => updateField("education", e.target.value)}
        placeholder="e.g. B.Tech / B.E. / MCA"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

    {/* Eligible Branches */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Eligible Branches
      </label>

      <input
        type="text"
        value={form.eligibleBranches}
        onChange={(e) =>
          updateField("eligibleBranches", e.target.value)
        }
        placeholder="e.g. CSE, IT, ECE"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />

      <p className="mt-1.5 text-xs text-slate-400">
        Separate multiple branches with commas.
      </p>
    </div>

    {/* Graduation Year */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Graduation Year
      </label>

      <input
        type="text"
        value={form.graduationYear}
        onChange={(e) =>
          updateField("graduationYear", e.target.value)
        }
        placeholder="e.g. 2027"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

    {/* Eligibility */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Eligibility Criteria
      </label>

      <textarea
        value={form.eligibility}
        onChange={(e) =>
          updateField("eligibility", e.target.value)
        }
        rows={4}
        placeholder="e.g. Minimum 60% throughout academics"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

{/* Job Details */}
<div className="pt-4 border-t border-black/10 dark:border-white/10">
  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
    Job Details
  </h2>

  <div className="space-y-5">

    {/* Description */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Description
      </label>

      <textarea
        value={form.description}
        onChange={(e) =>
          updateField("description", e.target.value)
        }
        rows={5}
        placeholder="Describe the job role..."
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

    {/* Skills */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Skills
      </label>

      <input
        type="text"
        value={form.skills}
        onChange={(e) =>
          updateField("skills", e.target.value)
        }
        placeholder="e.g. Python, React, SQL"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />

      <p className="mt-1.5 text-xs text-slate-400">
        Separate skills with commas.
      </p>
    </div>

    {/* Responsibilities */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Responsibilities
      </label>

      <textarea
        value={form.responsibilities}
        onChange={(e) =>
          updateField("responsibilities", e.target.value)
        }
        rows={5}
        placeholder={"One responsibility per line"}
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

    {/* Requirements */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Requirements
      </label>

      <textarea
        value={form.requirements}
        onChange={(e) =>
          updateField("requirements", e.target.value)
        }
        rows={5}
        placeholder={"One requirement per line"}
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

    {/* Benefits */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Benefits
      </label>

      <textarea
        value={form.benefits}
        onChange={(e) =>
          updateField("benefits", e.target.value)
        }
        rows={4}
        placeholder={"One benefit per line"}
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

  </div>
</div>
  </div>
</div>

{/* Application */}
<div className="pt-4 border-t border-black/10 dark:border-white/10">
  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
    Application
  </h2>

  <div className="space-y-5">

    {/* Application URL */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Application URL
      </label>

      <input
        type="url"
        value={form.applicationUrl}
        onChange={(e) =>
          updateField("applicationUrl", e.target.value)
        }
        placeholder="https://company.com/apply"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

    {/* Application Deadline */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Application Deadline
      </label>

      <input
        type="date"
        value={form.applicationDeadline}
        onChange={(e) =>
          updateField("applicationDeadline", e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
      />
    </div>

    {/* Status */}
    <div>
      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">
        Status
      </label>

      <select
        value={form.status}
        onChange={(e) =>
          updateField("status", e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
      >
        <option value="Draft">Draft</option>
        <option value="Published">Published</option>
        <option value="Closed">Closed</option>
      </select>
    </div>

  </div>
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
                    onChange={async (e) => {
  const file = e.target.files?.[0] || null;

  updateField("logoFile", file);

  if (!file) return;

  try {
    setUploadingLogo(true);
    setSubmitError("");

    const result = await adminAPI.uploadJobLogo(file);

    const data = result?.data || result;

    setLogoUrl(data?.logoUrl || "");
  } catch (error) {
    console.error("Failed to upload logo:", error);
    setLogoUrl("");
    setSubmitError(
      error.message || "Failed to upload company logo."
    );
  } finally {
    setUploadingLogo(false);
  }
}}
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
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      updateField("markdownFile", file);
                      if (!file) return;

                      try {
                        setUploadingMarkdown(true);
                        setSubmitError("");

                        const result = await adminAPI.parseJobMarkdown(file);
                        const data = result?.data || result;
                        setParsedJob(data);

                        // Autofill fields from parsed markdown
                        setForm((prev) => ({
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
                            : (data?.eligibleBranches || prev.eligibleBranches),
                          graduationYear: data?.graduationYear ? String(data.graduationYear) : prev.graduationYear,
                          eligibility: data?.eligibility || prev.eligibility,
                          description: data?.description || prev.description,
                          skills: Array.isArray(data?.skills)
                            ? data.skills.join(", ")
                            : (data?.skills || prev.skills),
                          responsibilities: Array.isArray(data?.responsibilities)
                            ? data.responsibilities.join("\n")
                            : (data?.responsibilities || prev.responsibilities),
                          requirements: Array.isArray(data?.requirements)
                            ? data.requirements.join("\n")
                            : (data?.requirements || prev.requirements),
                          benefits: Array.isArray(data?.benefits)
                            ? data.benefits.join("\n")
                            : (data?.benefits || prev.benefits),
                          applicationUrl: data?.applicationUrl || prev.applicationUrl,
                          applicationDeadline: data?.applicationDeadline
                            ? String(data.applicationDeadline).slice(0, 10)
                            : prev.applicationDeadline,
                        }));
                      } catch (error) {
                        console.error("Failed to parse Markdown:", error);
                        setParsedJob(null);
                        setSubmitError(
                          error.message || "Failed to parse Markdown file."
                        );
                      } finally {
                        setUploadingMarkdown(false);
                      }
                    }}
                  />
                </label>

                {form.markdownFile && (
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{form.markdownFile.name}</span>
                    <button
                      type="button"
                      onClick={() => updateField("markdownFile", null)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              {/* Duplicate Warning Prompt */}
              {duplicateWarning && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-sm space-y-3">
                  <div className="font-bold flex items-center gap-2">
                    ⚠️ Potential Duplicate Job Found
                  </div>
                  <p>
                    An existing listing already exists for <strong>{form.companyName || "this company"}</strong> — <strong>{form.roleTitle || "this role"}</strong>.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateJobWithStatus(form.status || "Published", true)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                    >
                      Create Anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Live Preview Section */}
              <div className="pt-6 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Job Preview
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Live preview representing the candidate user-facing job card & details.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs font-semibold text-[#3C83F6] hover:underline"
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>

                {showPreview && (
                  <div className="space-y-4">
                    {/* User-facing Job Row Preview */}
                    <div className="rounded-2xl border p-5 bg-[#d9e8ef] dark:bg-[#0b1934] border-[#c0d5e0] dark:border-white/10 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1.1fr_0.8fr_auto] gap-4 items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain rounded-lg bg-white p-1 border" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold">
                                {form.companyName ? form.companyName.charAt(0).toUpperCase() : "🏢"}
                              </div>
                            )}
                            <div>
                              <h3 className="text-base font-bold text-[#17251a] dark:text-white">
                                {form.roleTitle || "Job Title"}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {form.location || "Location not set"} • {form.experience || "Fresher"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-[#17251a] dark:text-white">
                            {form.companyName || "Company Name"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {form.workMode && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#eaf7d5] dark:bg-[#a3e635]/15 text-[#5e8d20] dark:text-[#a3e635]">
                                {form.workMode}
                              </span>
                            )}
                            {form.jobType && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300">
                                {form.jobType}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-[#17251a] dark:text-white">
                            {form.salary || "Not Disclosed"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {form.applicationDeadline ? `Deadline: ${form.applicationDeadline}` : "Estimated Compensation"}
                          </p>
                        </div>

                        <div>
                          <span className="inline-block px-4 py-2 rounded-xl bg-[#b5e959] text-[#00113b] text-[10px] font-['Press_Start_2P']">
                            APPLY
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed info breakdown */}
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#071532] p-4 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                      {form.description && (
                        <div>
                          <strong className="text-slate-800 dark:text-white">Description: </strong>
                          <p className="mt-0.5 whitespace-pre-line">{form.description}</p>
                        </div>
                      )}
                      {form.skills && (
                        <div className="mt-2">
                          <strong className="text-slate-800 dark:text-white">Skills: </strong>
                          <span>{form.skills}</span>
                        </div>
                      )}
                      {form.requirements && (
                        <div className="mt-2">
                          <strong className="text-slate-800 dark:text-white">Requirements: </strong>
                          <p className="mt-0.5 whitespace-pre-line">{form.requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions: Cancel, Save Draft, and Publish */}
              <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/hiring/${roleId}`)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateJobWithStatus("Draft")}
                  disabled={
                    submitting ||
                    !form.companyName.trim() ||
                    !form.roleTitle.trim()
                  }
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/10 text-sm font-semibold text-slate-800 dark:text-white hover:bg-white/80 dark:hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateJobWithStatus("Published")}
                  disabled={
                    submitting ||
                    !form.companyName.trim() ||
                    !form.roleTitle.trim() ||
                    !form.jobType ||
                    !form.location.trim() ||
                    !form.applicationUrl.trim()
                  }
                  className="dashboard-primary-btn px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Publishing..." : "Publish Job"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}