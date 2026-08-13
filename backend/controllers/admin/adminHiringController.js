import mongoose from "mongoose";
import Job from "../../models/Job.js";

const ALLOWED_STATUS = ["Draft", "Active", "Archived"];

/**
 * GET /api/admin/jobs
 * List all jobs
 */
export const listJobs = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search
    if (typeof search === "string" && search.trim()) {
      const safeSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const searchRegex = new RegExp(safeSearch, "i");

      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { jobType: searchRegex },
      ];
    }

    // Status filter
    if (typeof status === "string" && status.trim()) {
      if (!ALLOWED_STATUS.includes(status.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      query.status = status.trim();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit, 10) || 10)
    );

    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),

      Job.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error listing jobs:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch jobs",
    });
  }
};


/**
 * POST /api/admin/jobs
 * Create a new job
 */
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      jobType,
      experience,
      salary,
      requirements,
      applyLink,
      status,
    } = req.body;

    // Required fields
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job title is required",
      });
    }

    if (typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    if (typeof location !== "string" || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    if (typeof jobType !== "string" || !jobType.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job type is required",
      });
    }

    if (typeof applyLink !== "string" || !applyLink.trim()) {
      return res.status(400).json({
        success: false,
        message: "Apply link is required",
      });
    }

    // Status validation
    if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Requirements validation
    let parsedRequirements = [];

    if (requirements !== undefined) {
      if (!Array.isArray(requirements)) {
        return res.status(400).json({
          success: false,
          message: "Requirements must be an array",
        });
      }

      parsedRequirements = requirements
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    const job = new Job({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      jobType: jobType.trim(),

      experience:
        typeof experience === "string"
          ? experience.trim()
          : "",

      salary:
        typeof salary === "string"
          ? salary.trim()
          : "",

      requirements: parsedRequirements,

      applyLink: applyLink.trim(),

      status: status || "Draft",

      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });

    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error creating job:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create job",
    });
  }
};


/**
 * GET /api/admin/jobs/:jobId
 * Get a single job
 */
export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    const job = await Job.findById(jobId).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching job:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job",
    });
  }
};


/**
 * PUT /api/admin/jobs/:jobId
 * Update a job
 */
export const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "location",
      "jobType",
      "experience",
      "salary",
      "requirements",
      "applyLink",
      "status",
    ];

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          field
        )
      ) {
        job[field] = req.body[field];
      }
    }

    // Required field validation
    if (!job.title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job title is required",
      });
    }

    if (!job.description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    if (!job.location?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    if (!job.jobType?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job type is required",
      });
    }

    if (!job.applyLink?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Apply link is required",
      });
    }

    if (!ALLOWED_STATUS.includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (!Array.isArray(job.requirements)) {
      return res.status(400).json({
        success: false,
        message: "Requirements must be an array",
      });
    }

    job.updatedBy = req.user?._id || job.updatedBy;

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error updating job:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update job",
    });
  }
};


/**
 * DELETE /api/admin/jobs/:jobId
 * Delete a job
 */
export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    const job = await Job.findByIdAndDelete(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete job",
    });
  }
};