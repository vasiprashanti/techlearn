import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import {
  FiArrowLeft,
  FiUpload,
  FiX,
  FiEdit3,
  FiCopy,
  FiCheck,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import { adminAPI } from "../../services/adminApi";

const STANDARD_JOB_TEMPLATE = `# Job Posting

## Basic Information
Job Title: 
Role Category: 
Company Name: 
Location: 
Work Mode: (On-site / Hybrid / Remote)
Employment Type: (Full-time / Part-time / Internship / Contract)
Experience Level: 
Number of Openings: 

## Job Description
Brief Overview: 

## Responsibilities
- 
- 
- 

## Required Skills
- 
- 
- 

## Preferred Skills
- 
- 
- 

## Eligibility
Education: 
Graduation Year: 
Other Requirements: 

## Compensation
Salary / Stipend: 
Compensation Details: 

## Application Details
Application Deadline: 
Application Link: 
Contact Email: 

## Additional Information
Benefits: 
Additional Notes: 
`;

export default function CreateHiringJob() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const navigate = useNavigate();
  const { roleId } = useParams();
  const [roleName, setRoleName] = useState("Loading role...");
  const [loadingRole, setLoadingRole] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Field-by-field entry is primary; Markdown upload remains a secondary shortcut.
  const [entryMode, setEntryMode] = useState("manual");

  // Raw text state for paste mode
  const [rawPastedText, setRawPastedText] = useState("");
  const [parsingPastedText, setParsingPastedText] = useState(false);

  // Copy template state
  const [copiedTemplate, setCopiedTemplate] = useState(false);

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

  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingMarkdown, setUploadingMarkdown] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [parseSuccessMsg, setParseSuccessMsg] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);

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

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyParsedDataToForm = (data) => {
    setForm((prev) => ({
      ...prev,
      companyName: data?.companyName || prev.companyName,
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
      graduationYear: data?.graduationYear
        ? String(data.graduationYear)
        : prev.graduationYear,
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
        ? String(data.applicationDeadline).slice(0, 10)
        : prev.applicationDeadline,
    }));
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(STANDARD_JOB_TEMPLATE);
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2500);
    } catch (err) {
      console.error("Failed to copy template:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0] || null;
    updateField("markdownFile", file);
    if (!file) return;

    try {
      setUploadingMarkdown(true);
      setSubmitError("");
      setParseSuccessMsg("");

      const result = await adminAPI.parseJobMarkdown(file);
      const data = result?.data || result;
      applyParsedDataToForm(data);
      setParseSuccessMsg(`Parsed successfully from ${file.name}! Please review and adjust the fields below.`);
    } catch (error) {
      console.error("Failed to parse Markdown file:", error);
      setSubmitError(error.message || "Failed to parse Markdown file.");
    } finally {
      setUploadingMarkdown(false);
    }
  };

  const handleParsePastedText = async () => {
    if (!rawPastedText.trim()) {
      setSubmitError("Please paste your job details or markdown text before parsing.");
      return;
    }

    try {
      setParsingPastedText(true);
      setSubmitError("");
      setParseSuccessMsg("");

      const result = await adminAPI.parseJobText(rawPastedText);
      const data = result?.data || result;
      applyParsedDataToForm(data);
      setParseSuccessMsg("Pasted text parsed successfully! Please review the extracted fields below.");
    } catch (error) {
      console.error("Failed to parse pasted text:", error);
      setSubmitError(error.message || "Failed to parse pasted text. Please verify formatting.");
    } finally {
      setParsingPastedText(false);
    }
  };

  // Required fields for publishing
  const missingPublishFields = [];
  if (!form.companyName.trim()) missingPublishFields.push("Company Name");
  if (!form.roleTitle.trim()) missingPublishFields.push("Job Title");
  if (!form.description.trim()) missingPublishFields.push("Description");
  if (!form.jobType.trim()) missingPublishFields.push("Job Type");
  if (!form.location.trim()) missingPublishFields.push("Location");
  if (!form.applicationUrl.trim()) missingPublishFields.push("Application Link / URL");

  const handleCreateJobWithStatus = async (chosenStatus, allowDuplicate = false) => {
    try {
      setSubmitting(true);
      setSubmitError("");
      setDuplicateWarning(null);

      // Enforce publishing requirements
      if (chosenStatus === "Published") {
        if (missingPublishFields.length > 0) {
          setSubmitError(
            `Cannot publish job. Please complete the following required fields: ${missingPublishFields.join(
              ", "
            )}`
          );
          setSubmitting(false);
          return;
        }
      } else {
        // Draft minimally needs title or company name
        if (!form.companyName.trim() && !form.roleTitle.trim()) {
          setSubmitError("Please provide at least a Company Name or Job Title to save as Draft.");
          setSubmitting(false);
          return;
        }
      }

      const companyLogo = logoUrl || "";
      const jobData = {
        roleId,
        companyName: form.companyName.trim() || "Untitled Company",
        companyLogo,
        allowDuplicate,
        parsedData: {
          title: form.roleTitle.trim() || "Untitled Job",
          companyType: form.companyType.trim(),
          jobType: form.jobType || "Full Time",
          workMode: form.workMode || "Hybrid",
          location: form.location.trim() || "Remote",
          experience: form.experience.trim(),
          salary: form.salary.trim(),
          skills: form.skills
            ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          education: form.education.trim(),
          eligibleBranches: form.eligibleBranches
            ? form.eligibleBranches.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          graduationYear: form.graduationYear.trim(),
          eligibility: form.eligibility.trim(),
          description: form.description.trim() || "No description provided",
          responsibilities: form.responsibilities
            ? form.responsibilities.split("\n").map((s) => s.trim()).filter(Boolean)
            : [],
          requirements: form.requirements
            ? form.requirements.split("\n").map((s) => s.trim()).filter(Boolean)
            : [],
          benefits: form.benefits
            ? form.benefits.split("\n").map((s) => s.trim()).filter(Boolean)
            : [],
          applicationUrl: form.applicationUrl.trim() || "https://example.com/apply",
          applicationDeadline: form.applicationDeadline || null,
        },
        status: chosenStatus || form.status || "Draft",
      };

      await adminAPI.createJob(jobData);
      alert(`Job ${chosenStatus === "Published" ? "published" : "saved as draft"} successfully!`);
      navigate(`/admin/hiring/${roleId}`);
    } catch (error) {
      console.error("Failed to create job:", error);
      if (
        error.duplicate ||
        error.status === 409 ||
        error.message?.toLowerCase().includes("duplicate")
      ) {
        setDuplicateWarning(
          error.existingJob ||
            error.message ||
            "A job with this company, title, and role already exists."
        );
      } else {
        setSubmitError(error.message || "Failed to create job. Please check missing fields.");
      }
    } finally {
      setSubmitting(false);
    }
  };

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

      <Sidebar
        onToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />

      <main
        className={`flex-1 min-h-screen transition-all duration-700 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16`}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back button */}
          <button
            onClick={() => navigate(`/admin/hiring/${roleId}`)}
            className="flex items-center gap-2 text-sm text-[#3C83F6] hover:text-[#2a68d0] dark:text-[#bceaff] font-medium transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Role Jobs
          </button>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="admin-page-title text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Create New Job
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Creating job listing under category:{" "}
                <span className="font-semibold text-slate-800 dark:text-white">
                  {roleName}
                </span>
              </p>
            </div>

            {/* Copy Standard Job Template Button */}
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition self-start sm:self-auto text-slate-800 dark:text-white shadow-xs"
              title="Copy the standard Markdown template to your clipboard"
            >
              {copiedTemplate ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Template Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-3.5 h-3.5 text-[#3C83F6]" />
                  <span>Copy Job Template</span>
                </>
              )}
            </button>
          </div>

          {/* Notification Banners */}
          {copiedTemplate && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <FiCheck className="w-4 h-4 shrink-0" />
              Standard Job Posting Template copied to clipboard! You can paste it into your editor or below.
            </div>
          )}

          {parseSuccessMsg && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-medium flex items-center gap-2">
              <FiInfo className="w-4 h-4 shrink-0" />
              {parseSuccessMsg}
            </div>
          )}

          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-2">
              <div className="font-bold flex items-center gap-2">
                ⚠️ Potential Duplicate Job Found
              </div>
              <p>
                An existing listing with the same company and title already exists under this role.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateJobWithStatus(form.status, true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  Create Anyway
                </button>
              </div>
            </div>
          )}

          {/* Manual entry stays primary; Markdown is an optional shortcut. */}
          <div className="border-b border-black/10 dark:border-white/10 flex gap-2">
            <button
              type="button"
              onClick={() => setEntryMode("manual")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                entryMode === "manual"
                  ? "border-[#3C83F6] text-[#3C83F6] dark:text-[#bceaff]"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <FiEdit3 className="w-3.5 h-3.5" />
              Manual Entry (Recommended)
            </button>

            <button
              type="button"
              onClick={() => setEntryMode("upload")}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                entryMode === "upload"
                  ? "border-[#3C83F6] text-[#3C83F6] dark:text-[#bceaff]"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <FiUpload className="w-3.5 h-3.5" />
              Optional .md Upload
            </button>
          </div>

          {/* Entry Mode Panes */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0a1737] p-5 shadow-sm">
            {/* Mode A: Upload Markdown */}
            {entryMode === "upload" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Upload Job Markdown File (.md)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Optional shortcut: fields are parsed for review in the form below.
                  </span>
                </div>

                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-white/5 cursor-pointer hover:border-[#3C83F6] transition-colors p-4 text-center">
                  <FiUpload className="w-6 h-6 text-[#3C83F6] mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {uploadingMarkdown
                      ? "Parsing file..."
                      : form.markdownFile
                      ? form.markdownFile.name
                      : "Click to select and upload a .md file"}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Accepts standardized job template or frontmatter Markdown
                  </span>
                  <input
                    type="file"
                    accept=".md,text/markdown"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {form.markdownFile && (
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                    <span>Uploaded: {form.markdownFile.name}</span>
                    <button
                      type="button"
                      onClick={() => updateField("markdownFile", null)}
                      className="text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <FiX /> Clear file
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode B: Manual Notice */}
            {entryMode === "manual" && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                You can enter and edit all job parameters directly in the structured review form below.
              </div>
            )}
          </div>

          {/* Structured Job Form (Review & Edit Extracted / Manual Fields) */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0a1737] p-6 space-y-6">
            <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Job Information Review & Form
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify or edit extracted information before publishing or saving as draft.
                </p>
              </div>

              {missingPublishFields.length > 0 && (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  {missingPublishFields.length} field(s) required to publish
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Category */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Role Category
                </label>
                <input
                  type="text"
                  value={roleName}
                  disabled
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Company Name*
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="e.g. Google, TCS, Startup Labs"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 ${
                    !form.companyName.trim()
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532]"
                  }`}
                  required
                />
              </div>

              {/* Job Title */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Job Title*
                </label>
                <input
                  type="text"
                  value={form.roleTitle}
                  onChange={(e) => updateField("roleTitle", e.target.value)}
                  placeholder="e.g. Software Engineer, Frontend Developer"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 ${
                    !form.roleTitle.trim()
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532]"
                  }`}
                  required
                />
              </div>

              {/* Job Type */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Job Type*
                </label>
                <select
                  value={form.jobType}
                  onChange={(e) => updateField("jobType", e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 ${
                    !form.jobType
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532]"
                  }`}
                >
                  <option value="">Select employment type</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>

              {/* Work Mode */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Work Mode
                </label>
                <select
                  value={form.workMode}
                  onChange={(e) => updateField("workMode", e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Location*
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="e.g. Bengaluru, Hyderabad, Remote"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 ${
                    !form.location.trim()
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532]"
                  }`}
                  required
                />
              </div>

              {/* Experience */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Experience Level
                </label>
                <input
                  type="text"
                  value={form.experience}
                  onChange={(e) => updateField("experience", e.target.value)}
                  placeholder="e.g. Fresher / 0–2 years"
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Salary / Stipend */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Salary / Stipend
                </label>
                <input
                  type="text"
                  value={form.salary}
                  onChange={(e) => updateField("salary", e.target.value)}
                  placeholder="e.g. ₹6–10 LPA, ₹25,000/month"
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Application Link */}
              <div className="md:col-span-2">
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Application Link / URL*
                </label>
                <input
                  type="url"
                  value={form.applicationUrl}
                  onChange={(e) => updateField("applicationUrl", e.target.value)}
                  placeholder="https://company.com/careers/apply"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 ${
                    !form.applicationUrl.trim()
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532]"
                  }`}
                  required
                />
              </div>

              {/* Application Deadline */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => updateField("applicationDeadline", e.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Company Logo Upload */}
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Company Logo (Image)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-white/70 dark:bg-[#071532] cursor-pointer hover:border-[#3C83F6] text-xs text-slate-600 dark:text-slate-300">
                    <FiUpload className="mr-1.5 w-3.5 h-3.5 text-[#3C83F6]" />
                    <span>{uploadingLogo ? "Uploading logo..." : form.logoFile ? form.logoFile.name : "Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0] || null;
                        updateField("logoFile", file);
                        if (!file) return;
                        try {
                          setUploadingLogo(true);
                          const result = await adminAPI.uploadJobLogo(file);
                          const data = result?.data || result;
                          setLogoUrl(data?.logoUrl || "");
                        } catch (err) {
                          console.error("Logo upload failed:", err);
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                  </label>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain border border-black/10 dark:border-white/10 bg-white p-0.5" />
                  )}
                </div>
              </div>

              {/* Key Skills */}
              <div className="md:col-span-2">
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                  placeholder="e.g. React, Node.js, Python, SQL"
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Job Description Overview*
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Detailed overview of job responsibilities and company mission..."
                  rows={4}
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none resize-y ${
                    !form.description.trim()
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532]"
                  }`}
                  required
                />
              </div>

              {/* Responsibilities */}
              <div className="md:col-span-2">
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Key Responsibilities (One per line)
                </label>
                <textarea
                  value={form.responsibilities}
                  onChange={(e) => updateField("responsibilities", e.target.value)}
                  placeholder="- Develop and maintain scalable web features&#10;- Collaborate with product designers"
                  rows={3}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none resize-y"
                />
              </div>

              {/* Requirements */}
              <div className="md:col-span-2">
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Requirements / Qualifications (One per line)
                </label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => updateField("requirements", e.target.value)}
                  placeholder="- Strong fundamentals in Data Structures and Algorithms&#10;- Excellent communication skills"
                  rows={3}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none resize-y"
                />
              </div>

              {/* Benefits */}
              <div className="md:col-span-2">
                <label className="admin-micro-label text-black/50 dark:text-white/50 font-semibold mb-1 block">
                  Perks & Benefits (One per line)
                </label>
                <textarea
                  value={form.benefits}
                  onChange={(e) => updateField("benefits", e.target.value)}
                  placeholder="- Health insurance&#10;- Flexible working hours"
                  rows={2}
                  className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#071532] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none resize-y"
                />
              </div>
            </div>

            {/* Actions: Save Draft vs Publish */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => navigate(`/admin/hiring/${roleId}`)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCreateJobWithStatus("Draft")}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition disabled:opacity-50"
                >
                  {submitting ? "Saving Draft..." : "Save Draft"}
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateJobWithStatus("Published")}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiCheck className="w-3.5 h-3.5" />
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
