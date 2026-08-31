import Job from "../models/Job.js";

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const publicJobQuery = () => ({
  status: "Active",
  $or: [
    { closesAt: null },
    { closesAt: { $gt: new Date() } },
  ],
});

const serializeJob = (job) => ({
  id: job._id,
  title: job.title,
  company: job.company,
  location: job.location || "Location not specified",
  employmentType: job.employmentType || "Full-time",
  description: job.description || "",
  role: job.role || "",
  skills: Array.isArray(job.skills) ? job.skills : [],
  applyUrl: job.applyUrl || "",
  postedAt: job.postedAt || job.createdAt,
  closesAt: job.closesAt || null,
});

export const listPublicJobs = async (req, res) => {
  try {
    const query = publicJobQuery();
    const search = String(req.query.search || "").trim();
    const location = String(req.query.location || "").trim();
    const role = String(req.query.role || "").trim();

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      query.$and = [{ $or: [{ title: pattern }, { company: pattern }, { description: pattern }, { role: pattern }, { skills: pattern }] }];
    }
    if (location) query.location = new RegExp(escapeRegex(location), "i");
    if (role) query.role = new RegExp(escapeRegex(role), "i");

    const jobs = await Job.find(query).sort({ postedAt: -1, createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, jobs: jobs.map(serializeJob), personalized: false });
  } catch (error) {
    console.error("listPublicJobs error:", error);
    return res.status(500).json({ success: false, message: "Failed to load jobs." });
  }
};

export const listRecommendedJobs = async (_req, res) => {
  // Recommendations are intentionally empty until a real matching model is
  // introduced. Never show invented jobs in the user's personalized tab.
  return res.json({
    success: true,
    jobs: [],
    personalized: false,
    placeholder: true,
    message: "Complete your profile to unlock personalized job recommendations.",
  });
};

export const createJobAdmin = async (req, res) => {
  try {
    const { title, company } = req.body || {};
    if (!String(title || "").trim() || !String(company || "").trim()) {
      return res.status(400).json({ success: false, message: "Job title and company are required." });
    }
    const job = await Job.create({
      ...req.body,
      title: String(title).trim(),
      company: String(company).trim(),
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });
    return res.status(201).json({ success: true, job: serializeJob(job) });
  } catch (error) {
    console.error("createJobAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to create job." });
  }
};

export const updateJobAdmin = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.jobId,
      { $set: { ...req.body, updatedBy: req.user?._id || null } },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    return res.json({ success: true, job: serializeJob(job) });
  } catch (error) {
    console.error("updateJobAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to update job." });
  }
};

export const deleteJobAdmin = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.jobId, { $set: { status: "Closed", updatedBy: req.user?._id || null } }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found." });
    return res.json({ success: true, job: serializeJob(job) });
  } catch (error) {
    console.error("deleteJobAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to close job." });
  }
};
