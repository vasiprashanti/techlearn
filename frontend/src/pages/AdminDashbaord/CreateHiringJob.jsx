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

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
  try {
    setSubmitting(true);

    const companyLogo = logoUrl || "";
    const parsedData = parsedJob || {};
    const jobData = {
  roleId,
  companyName: form.companyName.trim(),
  companyLogo,
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

  status: form.status,
};

    await adminAPI.createJob(jobData);

    alert("Job created successfully!");

    navigate(`/admin/hiring/${roleId}`);
  } catch (error) {
    console.error("Failed to create job:", error);

    alert(
      error.message ||
      "Failed to create job. Please try again."
    );
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
    submitting ||
    !form.companyName.trim() ||
    !form.roleTitle.trim() ||
    !form.jobType ||
    !form.location.trim() ||
    !form.applicationUrl.trim()
  }
  className="dashboard-primary-btn px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
>
  {submitting ? "Creating..." : "Create Job"}
</button>

              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}