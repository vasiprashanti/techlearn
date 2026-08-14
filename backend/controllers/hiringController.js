import mongoose from "mongoose";
import Job from "../models/Job.js";

/**
 * GET /api/jobs
 * Get all active jobs for the user-side Hiring page
 */
export const listActiveJobs = async (req, res) => {
  try {
   const jobs = await Job.find({ status: "Published" })
      .select(
        "title description location jobType experience salary requirements applicationUrl createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching active jobs:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch jobs",
    });
  }
};


/**
 * GET /api/jobs/:jobId
 * Get one active job
 */
export const getActiveJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    const job = await Job.findOne({
      _id: jobId,
      status: "Published",
    })
      .select(
        "title description location jobType experience salary requirements applicationUrl createdAt"
      )
      .lean();

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
    console.error("Error fetching active job:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job",
    });
  }
};