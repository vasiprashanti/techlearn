import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import { useTheme } from "../../context/ThemeContext";
import { FiArrowLeft } from "react-icons/fi";
import { adminAPI } from "../../services/adminApi";

export default function EditHiringJob() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const navigate = useNavigate();
  const { roleId, jobId } = useParams();

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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminAPI.getJobById(jobId);

        const job = response?.data || response;

        setForm({
          companyName: job?.companyName || "",
          roleTitle: job?.title || "",
          jobType: job?.jobType || "",
          companyType: job?.companyType || "",
          workMode: job?.workMode || "",
          location: job?.location || "",
          experience: job?.experience || "",
          salary: job?.salary || "",
          education: job?.education || "",
          eligibleBranches: Array.isArray(job?.eligibleBranches)
            ? job.eligibleBranches.join(", ")
            : job?.eligibleBranches || "",
          graduationYear: job?.graduationYear || "",
          eligibility: job?.eligibility || "",
          description: job?.description || "",
          skills: Array.isArray(job?.skills)
            ? job.skills.join(", ")
            : job?.skills || "",
          responsibilities: Array.isArray(job?.responsibilities)
            ? job.responsibilities.join("\n")
            : job?.responsibilities || "",
          requirements: Array.isArray(job?.requirements)
            ? job.requirements.join("\n")
            : job?.requirements || "",
          benefits: Array.isArray(job?.benefits)
            ? job.benefits.join("\n")
            : job?.benefits || "",
          applicationUrl: job?.applicationUrl || "",
          applicationDeadline: job?.applicationDeadline
            ? String(job.applicationDeadline).slice(0, 10)
            : "",
          status: job?.status || "Draft",
        });
      } catch (err) {
        console.error("Failed to load job:", err);
        setError(err.message || "Failed to load job.");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  const handleSave = async () => {
    try {
      setSaving(true);

      await adminAPI.updateJob(jobId, {
        roleId,
        companyName: form.companyName.trim(),
        title: form.roleTitle.trim(),
        jobType: form.jobType,
        companyType: form.companyType.trim(),
        workMode: form.workMode,
        location: form.location.trim(),
        experience: form.experience.trim(),
        salary: form.salary.trim(),
        education: form.education.trim(),

        eligibleBranches: form.eligibleBranches
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        graduationYear: form.graduationYear.trim(),
        eligibility: form.eligibility.trim(),
        description: form.description.trim(),

        skills: form.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        responsibilities: form.responsibilities
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),

        requirements: form.requirements
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),

        benefits: form.benefits
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),

        applicationUrl: form.applicationUrl.trim(),
        applicationDeadline: form.applicationDeadline || null,
        status: form.status,
      });

      alert("Job updated successfully!");

      navigate(`/admin/hiring/${roleId}`);
    } catch (err) {
      console.error("Failed to update job:", err);
      alert(err.message || "Failed to update job.");
    } finally {
      setSaving(false);
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

          <button
            onClick={() => navigate(`/admin/hiring/${roleId}`)}
            className="flex items-center gap-2 mb-6 text-sm text-slate-500 dark:text-slate-300 hover:text-[#3C83F6]"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>

          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              Edit Job
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update the job opening details.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white/80 dark:bg-[#0b1b38] p-10 text-center text-sm text-slate-500">
              Loading job...
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-white/80 dark:bg-[#0b1b38] p-10 text-center text-sm text-red-500">
              {error}
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0b1b38] p-6 md:p-8">

              <div className="space-y-6">

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Company Name
                  </label>

                  <input
                    value={form.companyName}
                    onChange={(e) =>
                      updateField("companyName", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Job Title
                  </label>

                  <input
                    value={form.roleTitle}
                    onChange={(e) =>
                      updateField("roleTitle", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Job Type
                  </label>

                  <select
                    value={form.jobType}
                    onChange={(e) =>
                      updateField("jobType", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm"
                  >
                    <option value="">Select job type</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Location
                  </label>

                  <input
                    value={form.location}
                    onChange={(e) =>
                      updateField("location", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Salary
                  </label>

                  <input
                    value={form.salary}
                    onChange={(e) =>
                      updateField("salary", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
                  />
                </div>
                {/* Company Details */}
<div>
  <label className="block text-sm font-semibold mb-2">
    Company Type
  </label>

  <input
    value={form.companyType}
    onChange={(e) => updateField("companyType", e.target.value)}
    placeholder="e.g. MNC, Startup, Product Company"
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
  />
</div>

<div>
  <label className="block text-sm font-semibold mb-2">
    Work Mode
  </label>

  <select
    value={form.workMode}
    onChange={(e) => updateField("workMode", e.target.value)}
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm"
  >
    <option value="">Select work mode</option>
    <option value="On-site">On-site</option>
    <option value="Remote">Remote</option>
    <option value="Hybrid">Hybrid</option>
  </select>
</div>

<div>
  <label className="block text-sm font-semibold mb-2">
    Experience
  </label>

  <input
    value={form.experience}
    onChange={(e) => updateField("experience", e.target.value)}
    placeholder="e.g. Fresher / 0-2 years"
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
  />
</div>

<div className="pt-4 border-t border-black/10 dark:border-white/10">
  <h2 className="text-lg font-bold mb-4">
    Eligibility
  </h2>

  <div className="space-y-5">

    <div>
      <label className="block text-sm font-semibold mb-2">
        Education
      </label>

      <input
        value={form.education}
        onChange={(e) => updateField("education", e.target.value)}
        placeholder="e.g. B.Tech / B.E."
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold mb-2">
        Eligible Branches
      </label>

      <input
        value={form.eligibleBranches}
        onChange={(e) =>
          updateField("eligibleBranches", e.target.value)
        }
        placeholder="e.g. CSE, IT, ECE"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold mb-2">
        Graduation Year
      </label>

      <input
        value={form.graduationYear}
        onChange={(e) =>
          updateField("graduationYear", e.target.value)
        }
        placeholder="e.g. 2027"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold mb-2">
        Eligibility Criteria
      </label>

      <textarea
        value={form.eligibility}
        onChange={(e) =>
          updateField("eligibility", e.target.value)
        }
        rows={4}
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none resize-none"
      />
    </div>

  </div>
</div>

<div className="pt-4 border-t border-black/10 dark:border-white/10">
  <h2 className="text-lg font-bold mb-4">
    Job Details
  </h2>

  <div className="space-y-5">

    <div>
      <label className="block text-sm font-semibold mb-2">
        Description
      </label>

      <textarea
        value={form.description}
        onChange={(e) =>
          updateField("description", e.target.value)
        }
        rows={5}
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none resize-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold mb-2">
        Skills
      </label>

      <input
        value={form.skills}
        onChange={(e) =>
          updateField("skills", e.target.value)
        }
        placeholder="Python, React, SQL"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold mb-2">
        Responsibilities
      </label>

      <textarea
        value={form.responsibilities}
        onChange={(e) =>
          updateField("responsibilities", e.target.value)
        }
        rows={5}
        placeholder="One responsibility per line"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none resize-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold mb-2">
        Requirements
      </label>

      <textarea
        value={form.requirements}
        onChange={(e) =>
          updateField("requirements", e.target.value)
        }
        rows={5}
        placeholder="One requirement per line"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none resize-none"
      />
    </div>

    <div>
      <label className="block text-sm font-semibold mb-2">
        Benefits
      </label>

      <textarea
        value={form.benefits}
        onChange={(e) =>
          updateField("benefits", e.target.value)
        }
        rows={4}
        placeholder="One benefit per line"
        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none resize-none"
      />
    </div>

  </div>
</div>

<div>
  <label className="block text-sm font-semibold mb-2">
    Application Deadline
  </label>

  <input
    type="date"
    value={form.applicationDeadline}
    onChange={(e) =>
      updateField("applicationDeadline", e.target.value)
    }
    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm"
  />
</div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Application URL
                  </label>

                  <input
                    type="url"
                    value={form.applicationUrl}
                    onChange={(e) =>
                      updateField("applicationUrl", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateField("status", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071532] px-4 py-3 text-sm"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10">

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/admin/hiring/${roleId}`)
                    }
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={
                      saving ||
                      !form.companyName.trim() ||
                      !form.roleTitle.trim() ||
                      !form.jobType ||
                      !form.location.trim() ||
                      !form.applicationUrl.trim()
                    }
                    className="dashboard-primary-btn px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}