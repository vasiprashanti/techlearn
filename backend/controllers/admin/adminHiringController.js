import mongoose from "mongoose";
import { parseJobMarkdownFile } from "../../config/jobMarkdownParser.js";
import Job from "../../models/Job.js";
import Role from "../../models/Role.js";

const ALLOWED_STATUS = ["Draft", "Published", "Closed"];
const ALLOWED_ROLE_STATUS = ["Active", "Archived"];
/**
 * GET /api/admin/jobs
 * List jobs with search, filters, sorting and pagination
 */
export const listJobs = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      roleId = "",
      companyName = "",
      companyType = "",
      experience = "",
      workMode = "",
      jobType = "",
      location = "",
      sortBy = "createdAt",
      sortOrder = "desc",
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
        { JID: searchRegex },
        { companyName: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { jobType: searchRegex },
      ];
    }

    // Status filter
    if (status) {
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      query.status = status;
    }

    // Role filter
    if (roleId) {
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      query.roleId = roleId;
    }

    // Text filters
    const textFilters = {
      companyName,
      companyType,
      experience,
      workMode,
      jobType,
      location,
    };

    for (const [field, value] of Object.entries(textFilters)) {
      if (typeof value === "string" && value.trim()) {
        query[field] = new RegExp(
          value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        );
      }
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "companyName",
      "title",
      "location",
      "status",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort field",
      });
    }

    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const pageNum = Math.max(
      1,
      parseInt(page, 10) || 1
    );

    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit, 10) || 10)
    );

    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate("roleId", "roleName")
        .sort({ [sortBy]: sortDirection })
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
 * Create a new Job
 */
export const createJob = async (req, res) => {
  try {
    const {
      roleId,
      companyName,
      companyLogo,
      parsedData,
      status,
      allowDuplicate = false,
    } = req.body;

    // Role validation
    if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Valid roleId is required",
      });
    }

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Company validation
    if (
      typeof companyName !== "string" ||
      !companyName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    // Parsed Markdown data validation
    if (
      !parsedData ||
      typeof parsedData !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Parsed Markdown data is required",
      });
    }

    const {
      title,
      companyType,
      jobType,
      workMode,
      location,
      experience,
      salary,
      skills,
      education,
      eligibleBranches,
      graduationYear,
      eligibility,
      description,
      responsibilities,
      requirements,
      benefits,
      applicationUrl,
      applicationDeadline,
    } = parsedData;

    // Required fields from Markdown
    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job title is required",
      });
    }

    if (
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job description is required",
      });
    }

    if (
      typeof jobType !== "string" ||
      !jobType.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Job type is required",
      });
    }

    if (
      typeof location !== "string" ||
      !location.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Location is required",
      });
    }

    if (
      typeof applicationUrl !== "string" ||
      !applicationUrl.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Application URL is required",
      });
    }

    // Status validation
    if (!ALLOWED_STATUS.includes(status || "Draft")) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Convert arrays safely
    const normalizeArray = (value) => {
      if (!Array.isArray(value)) {
        return [];
      }

      return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    };

    const parsedSkills = normalizeArray(skills);
    const parsedBranches = normalizeArray(
      eligibleBranches
    );
    const parsedResponsibilities =
      normalizeArray(responsibilities);
    const parsedRequirements =
      normalizeArray(requirements);
    const parsedBenefits =
      normalizeArray(benefits);

    // Duplicate detection
    const duplicateQuery = {
      roleId,
      companyName: {
        $regex: `^${companyName
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      title: {
        $regex: `^${title
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    };

    if (applicationUrl.trim()) {
      duplicateQuery.applicationUrl =
        applicationUrl.trim();
    }

    const duplicateJob = await Job.findOne(
      duplicateQuery
    )
      .populate("roleId", "roleName")
      .lean();

    if (duplicateJob && allowDuplicate !== true) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message: "Potential duplicate job found",
        existingJob: duplicateJob,
      });
    }

    // Create Job
    const job = new Job({
      roleId,

      companyName: companyName.trim(),

      companyLogo:
        typeof companyLogo === "string"
          ? companyLogo.trim()
          : "",

      title: title.trim(),

      companyType:
        typeof companyType === "string"
          ? companyType.trim()
          : "",

      jobType: jobType.trim(),

      workMode:
        typeof workMode === "string"
          ? workMode.trim()
          : "",

      location: location.trim(),

      experience:
        typeof experience === "string"
          ? experience.trim()
          : "",

      salary:
        typeof salary === "string"
          ? salary.trim()
          : "",

      skills: parsedSkills,

      education:
        typeof education === "string"
          ? education.trim()
          : "",

      eligibleBranches: parsedBranches,

      graduationYear:
        typeof graduationYear === "string"
          ? graduationYear.trim()
          : "",

      eligibility:
        typeof eligibility === "string"
          ? eligibility.trim()
          : "",

      description: description.trim(),

      responsibilities:
        parsedResponsibilities,

      requirements:
        parsedRequirements,

      benefits: parsedBenefits,

      applicationUrl:
        applicationUrl.trim(),

      applicationDeadline:
        applicationDeadline
          ? new Date(applicationDeadline)
          : null,

      status: status || "Draft",

      publishedAt:
        status === "Published"
          ? new Date()
          : null,

      createdBy:
        req.user?._id || null,

      updatedBy:
        req.user?._id || null,
    });

    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    console.error(
      "Error creating job:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message:
          "A job with this JID already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create job",
    });
  }
};
/**
 * GET /api/admin/jobs/:jobId
 * Get a single Job
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

    const job = await Job.findById(jobId)
      .populate("roleId", "roleName")
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
/**
 * PUT /api/admin/jobs/:jobId
 * Update a Job
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
      "roleId",
      "companyName",
      "companyLogo",
      "title",
      "companyType",
      "jobType",
      "workMode",
      "location",
      "experience",
      "salary",
      "skills",
      "education",
      "eligibleBranches",
      "graduationYear",
      "eligibility",
      "description",
      "responsibilities",
      "requirements",
      "benefits",
      "applicationUrl",
      "applicationDeadline",
      "status",
    ];

    // Update only fields supplied in the request
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

    // Validate Role if it was changed
    if (req.body.roleId !== undefined) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.roleId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await Role.findById(req.body.roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }
    }

    // Required fields
    if (!job.companyName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

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

    if (!job.applicationUrl?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Application URL is required",
      });
    }

    // Status validation
    if (!ALLOWED_STATUS.includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Array validation
    const arrayFields = [
      "skills",
      "eligibleBranches",
      "responsibilities",
      "requirements",
      "benefits",
    ];

    for (const field of arrayFields) {
      if (!Array.isArray(job[field])) {
        return res.status(400).json({
          success: false,
          message: `${field} must be an array`,
        });
      }
    }

    // Update publish date when status changes
    if (job.status === "Published" && !job.publishedAt) {
      job.publishedAt = new Date();
    }

    if (job.status !== "Published") {
      job.publishedAt = null;
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
 * PATCH /api/admin/jobs/:jobId/status
 * Update Job status
 */
export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    job.status = status;

    if (status === "Published") {
      job.publishedAt = job.publishedAt || new Date();
    } else {
      job.publishedAt = null;
    }

    job.updatedBy = req.user?._id || job.updatedBy;

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job status updated successfully",
      data: job,
    });
  } catch (error) {
    console.error("Error updating job status:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update job status",
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
/**
 * POST /api/admin/hiring/roles
 * Create a new Role
 */
export const createRole = async (req, res) => {
  try {
    const {
      roleName,
      description,
      image,
      status,
    } = req.body;

    if (typeof roleName !== "string" || !roleName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    if (
      status !== undefined &&
      !ALLOWED_ROLE_STATUS.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role status",
      });
    }

    const normalizedRoleName = roleName.trim();

    const existingRole = await Role.findOne({
      roleName: {
        $regex: `^${normalizedRoleName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },
    });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: "Role already exists",
      });
    }

    const role = new Role({
      roleName: normalizedRoleName,

      description:
        typeof description === "string"
          ? description.trim()
          : "",

      image:
        typeof image === "string"
          ? image.trim()
          : "",

      status: status || "Active",
    });

    await role.save();

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error("Error creating role:", error);

    // Handles MongoDB unique index violation
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Role already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create role",
    });
  }
};


/**
 * GET /api/admin/hiring/roles
 * Get all Roles
 */
export const listRoles = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (typeof search === "string" && search.trim()) {
      const safeSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.roleName = new RegExp(safeSearch, "i");
    }

    if (typeof status === "string" && status.trim()) {
      if (!ALLOWED_ROLE_STATUS.includes(status.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      query.status = status.trim();
    }

    const pageNum = Math.max(
      1,
      parseInt(page, 10) || 1
    );

    const limitNum = Math.max(
      1,
      Math.min(100, parseInt(limit, 10) || 10)
    );

    const skip = (pageNum - 1) * limitNum;

    const [roles, total] = await Promise.all([
      Role.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),

      Role.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: roles,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error listing roles:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch roles",
    });
  }
};


/**
 * GET /api/admin/hiring/roles/:roleId
 * Get one Role
 */
export const getRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID format",
      });
    }

    const role = await Role.findById(roleId).lean();

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch role",
    });
  }
};


/**
 * PUT /api/admin/hiring/roles/:roleId
 * Update Role
 */
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID format",
      });
    }

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "roleName"
      )
    ) {
      if (
        typeof req.body.roleName !== "string" ||
        !req.body.roleName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Role name is required",
        });
      }

      const normalizedRoleName =
        req.body.roleName.trim();

      const duplicateRole = await Role.findOne({
        _id: { $ne: roleId },
        roleName: {
          $regex: `^${normalizedRoleName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
      });

      if (duplicateRole) {
        return res.status(409).json({
          success: false,
          message: "Another role with this name already exists",
        });
      }

      role.roleName = normalizedRoleName;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "description"
      )
    ) {
      role.description =
        typeof req.body.description === "string"
          ? req.body.description.trim()
          : "";
    }

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "image"
      )
    ) {
      role.image =
        typeof req.body.image === "string"
          ? req.body.image.trim()
          : "";
    }

    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "status"
      )
    ) {
      if (
        !ALLOWED_ROLE_STATUS.includes(req.body.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid role status",
        });
      }

      role.status = req.body.status;
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    console.error("Error updating role:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Role already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update role",
    });
  }
};


/**
 * DELETE /api/admin/hiring/roles/:roleId
 * Delete Role
 */
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID format",
      });
    }

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Do not allow deleting a Role that still contains Jobs.
    const jobCount = await Job.countDocuments({
      roleId,
    });

    if (jobCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete role because jobs are associated with it",
        jobCount,
      });
    }

    await Role.findByIdAndDelete(roleId);

    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting role:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete role",
    });
  }
};
/**
 * POST /api/admin/jobs/parse-markdown
 * Upload and parse Job Markdown file
 */
export const parseJobMarkdown = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No Markdown file uploaded",
      });
    }

    // Only allow .md files
    const extension = req.file.originalname
      .split(".")
      .pop()
      .toLowerCase();

    if (extension !== "md") {
      return res.status(400).json({
        success: false,
        message: "Only .md files are allowed",
      });
    }

    const result = parseJobMarkdownFile(req.file.path);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to parse Markdown file",
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job Markdown parsed successfully",
      data: result.data,
    });
  } catch (error) {
    console.error(
      "Error parsing Job Markdown:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to parse Job Markdown",
    });
  }
};
