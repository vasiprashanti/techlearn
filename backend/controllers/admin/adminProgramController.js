import mongoose from "mongoose";
import Program from "../../models/Program.js";
import Batch from "../../models/Batch.js";
import Student from "../../models/Student.js";
import Course from "../../models/Course.js";
import Roadmap from "../../models/Roadmap.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import CertificateTemplate from "../../models/CertificateTemplate.js";
import Project from "../../models/Project.js";
// Whitelist mapping for attachment entity types
export const ENTITY_CONFIG = {
  batches: {
    model: Batch,
    fieldKey: "batchIds",
    labelField: "name",
    selectFields: "_id name startDate expiryDate status",
  },
  students: {
    model: Student,
    fieldKey: "studentIds",
    labelField: "name",
    selectFields: "_id name email rollNo status",
  },
  courses: {
    model: Course,
    fieldKey: "courseIds",
    labelField: "title",
    selectFields: "_id title level courseType numTopics status",
  },
  roadmaps: {
    model: Roadmap,
    fieldKey: "roadmapIds",
    labelField: "title",
    selectFields: "_id title status createdAt",
  },
  "track-templates": {
    model: TrackTemplate,
    fieldKey: "trackTemplateIds",
    labelField: "name",
    selectFields: "_id name trackType status createdAt",
  },
  certificates: {
    model: CertificateTemplate,
    fieldKey: "certificateTemplateIds",
    labelField: "name",
    selectFields: "_id name description status",
  },
  projects: {
    model: Project,
    fieldKey: "projectIds",
    labelField: "title",
    selectFields: "_id title category duration_days status",
  },
};

/**
 * GET /api/admin/programs
 * Search, filter (programType, month, status), sort, paginate programs
 */
export const listPrograms = async (req, res) => {
  try {
    const {
      search = "",
      programType = "",
      month = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Search filter
    const safeSearch =
      typeof search === "string"
        ? search.trim()
        : "";
    if (safeSearch) {
      const searchRegex = new RegExp(safeSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: searchRegex }, { description: searchRegex }, { programType: searchRegex }];
    }

    // Program Type filter
    if (typeof programType === "string" && programType.trim()) {
      query.programType = programType.trim();
    }
    // Status filter
    // if (status.trim()) {
    //   query.status = status.trim();
    // }
    const allowedStatus = ["Draft", "Active", "Archived"];

    if (typeof status === "string" && status.trim()) {
      if (!allowedStatus.includes(status.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      query.status = status.trim();
    }

    // Month filter based on createdAt (expected format: YYYY-MM or MM)
    if (typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month.trim())) {
      const parts = month.trim().split("-");
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10) - 1; // 0-indexed
        const startDate = new Date(Date.UTC(year, monthNum, 1));
        const endDate = new Date(Date.UTC(year, monthNum + 1, 0, 23, 59, 59, 999));
        query.createdAt = { $gte: startDate, $lte: endDate };
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = new Set([
      "name",
      "programType",
      "duration",
      "status",
      "visibility",
      "createdAt",
      "updatedAt",
    ]);
    const sortOptions = {};
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "createdAt";
    //sortOptions[safeSortBy] = sortOrder === "asc" ? 1 : -1;
    const safeSortOrder =
      sortOrder === "asc"
        ? "asc"
        : sortOrder === "desc"
          ? "desc"
          : "desc";

    sortOptions[safeSortBy] =
      safeSortOrder === "asc" ? 1 : -1;
    const totalPrograms = await Program.countDocuments(query);
    const rawPrograms = await Program.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const programs = rawPrograms.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      programType: p.programType,
      duration: p.duration,
      status: p.status,
      visibility: p.visibility,
      pricingType: p.pricingType,
      programFee: p.programFee,
      studentCount: Array.isArray(p.studentIds) ? p.studentIds.length : 0,
      batchCount: Array.isArray(p.batchIds) ? p.batchIds.length : 0,
      courseCount: Array.isArray(p.courseIds) ? p.courseIds.length : 0,
      roadmapCount: Array.isArray(p.roadmapIds) ? p.roadmapIds.length : 0,
      trackTemplateCount: Array.isArray(p.trackTemplateIds) ? p.trackTemplateIds.length : 0,
      certificateTemplateCount: Array.isArray(p.certificateTemplateIds) ? p.certificateTemplateIds.length : 0,
      projectCount: Array.isArray(p.projectIds) ? p.projectIds.length : 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json({
      success: true,
      programs,
      pagination: {
        total: totalPrograms,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalPrograms / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error listing programs:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch programs" });
  }
};

/**
 * POST /api/admin/programs
 * Create a new program
 */
export const createProgram = async (req, res) => {
  try {
    const { name, description, programType, duration, status, visibility, pricingType, programFee, } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Program name is required",
      });
    }
    if (typeof programType !== "string" || !programType.trim()) {
      return res.status(400).json({
        success: false,
        message: "Program type is required",
      });
    }
    if (typeof duration !== "string" || !duration.trim()) {
      return res.status(400).json({
        success: false,
        message: "Duration is required",
      });
    }
    const allowedStatus = ["Draft", "Active", "Archived"];
    if (status !== undefined && !allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }
    const allowedVisibility = ["Public", "Private"];
    if (visibility !== undefined && !allowedVisibility.includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visibility",
      });
    }
    const allowedPricing = ["Free", "Paid"];
    if (pricingType !== undefined && !allowedPricing.includes(pricingType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pricing type",
      });
    }
    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message: "Description must be a string",
      });
    }
    let parsedFee = 0;
    if (pricingType === "Paid") {
      parsedFee = Number(programFee);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({
          success: false,
          message: "Program fee must be a non-negative number for Paid programs",
        });
      }
    }
    const program = new Program({
      name: name.trim(),
      description: (description || "").trim(),
      programType: programType.trim(),
      duration: duration.trim(),
      status: status || "Draft",
      visibility: visibility || "Public",
      pricingType: pricingType || "Free",
      programFee: pricingType === "Paid" ? parsedFee : 0,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null,
    });
    await program.save();
    res.status(201).json({
      success: true,
      message: "Program created successfully",
      program,
    });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create program",
    });
  }
};
/**
 * GET /api/admin/programs/:programId
 * Get a single program by ID with populated attachment sections
 */
export const getProgramById = async (req, res) => {
  try {
    const { programId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }
    const program = await Program.findById(programId)
      .populate("batchIds", ENTITY_CONFIG.batches.selectFields)
      .populate("studentIds", ENTITY_CONFIG.students.selectFields)
      .populate("courseIds", ENTITY_CONFIG.courses.selectFields)
      .populate("roadmapIds", ENTITY_CONFIG.roadmaps.selectFields)
      .populate("trackTemplateIds", ENTITY_CONFIG["track-templates"].selectFields)
      .populate("certificateTemplateIds", ENTITY_CONFIG.certificates.selectFields)
      .populate("projectIds", ENTITY_CONFIG.projects.selectFields)
      .lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }
    res.json({
      success: true,
      program,
    });
  } catch (error) {
    console.error("Error getting program detail:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch program detail" });
  }
};
/**
 * PATCH /api/admin/programs/:programId
 * Update program metadata and pricing
 */
export const updateProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }
    const {
      name, description, programType, duration, status, visibility, pricingType, programFee, } = req.body;
    //if (name !== undefined) program.name = name.trim();
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Program name cannot be empty",
        });
      }
      program.name = name.trim();
    }
    //if (description !== undefined) program.description = description.trim();
    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string",
        });
      }
      program.description = description.trim();
    }
    //if (programType !== undefined) program.programType = programType.trim();
    if (programType !== undefined) {
      if (typeof programType !== "string" || !programType.trim()) {
        return res.status(400).json({
          success: false,
          message: "Program type cannot be empty",
        });
      }

      program.programType = programType.trim();
    }
    //if (duration !== undefined) program.duration = duration.trim();
    if (duration !== undefined) {
      if (typeof duration !== "string" || !duration.trim()) {
        return res.status(400).json({
          success: false,
          message: "Duration cannot be empty",
        });
      }

      program.duration = duration.trim();
    }
    //if (status !== undefined) program.status = status;
    const allowedStatus = ["Draft", "Active", "Archived"];
    if (status !== undefined) {
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }
      program.status = status;
    }
    // if (visibility !== undefined) program.visibility = visibility;
    const allowedVisibility = ["Public", "Private"];
    if (visibility !== undefined) {
      if (!allowedVisibility.includes(visibility)) {
        return res.status(400).json({
          success: false,
          message: "Invalid visibility",
        });
      }
      program.visibility = visibility;
    }
    const allowedPricing = ["Free", "Paid"];
    if (pricingType !== undefined) {
      if (!allowedPricing.includes(pricingType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid pricing type",
        });
      }
      program.pricingType = pricingType;
      if (pricingType === "Paid") {
        const parsedFee = Number(programFee);
        if (isNaN(parsedFee) || parsedFee < 0) {
          return res.status(400).json({
            success: false,
            message: "Program fee must be a non-negative number for Paid programs",
          });
        }
        program.programFee = parsedFee;
      } else {
        program.programFee = 0;
      }
    }
    else if (program.pricingType === "Paid" && programFee !== undefined) {
      const parsedFee = Number(programFee);
      if (isNaN(parsedFee) || parsedFee < 0) {
        return res.status(400).json({
          success: false,
          message: "Program fee must be a non-negative number for Paid programs",
        });
      }
      program.programFee = parsedFee;
    }
    program.updatedBy = req.user?._id || program.updatedBy;
    await program.save();
    res.json({
      success: true,
      message: "Program updated successfully",
      program,
    });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update program",
    });
  }
};
/**
 * DELETE /api/admin/programs/:programId
 * Delete Program (never deletes attached entities)
 */
export const deleteProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }
    const program = await Program.findByIdAndDelete(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }
    res.json({
      success: true,
      message: "Program deleted successfully (attached resources were preserved)",
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete program" });
  }
};
/**
 * GET /api/admin/programs/:programId/available/:entityType
 * Search and paginate attachable entities for a Program
 */
export const getAvailableEntities = async (req, res) => {
  try {
    const { programId, entityType } = req.params;
    const { search = "", page = 1, limit = 20 } = req.query;
    if (!ENTITY_CONFIG[entityType]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported entity type '${entityType}'. Supported: ${Object.keys(ENTITY_CONFIG).join(", ")}`,
      });
    }
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }
    const program = await Program.findById(programId).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }
    const config = ENTITY_CONFIG[entityType];
    const attachedIds = (program[config.fieldKey] || []).map((id) => id.toString());
    const searchQuery = {};
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (entityType === "students") {
        searchQuery.$or = [{ name: searchRegex }, { email: searchRegex }, { rollNo: searchRegex }];
      } else {
        searchQuery[config.labelField] = searchRegex;
      }
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const totalCount = await config.model.countDocuments(searchQuery);
    const items = await config.model
      .find(searchQuery)
      .select(config.selectFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    const formattedItems = items.map((item) => ({
      ...item,
      isAttached: attachedIds.includes(item._id.toString()),
    }));
    res.json({
      success: true,
      items: formattedItems,
      attachedIds,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching available entities:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch available entities" });
  }
};
/**
 * POST /api/admin/programs/:programId/attachments/:entityType
 * Attach one or multiple existing entities to a Program
 */
export const attachEntities = async (req, res) => {
  try {
    const { programId, entityType } = req.params;
    const { ids } = req.body;

    if (!ENTITY_CONFIG[entityType]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported entity type '${entityType}'`,
      });
    }
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID format" });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "ids array is required and cannot be empty" });
    }
    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Every id in ids must be a valid ObjectId",
        invalidIds,
      });
    }
    const validIds = [...new Set(ids.map((id) => id.toString()))];
    const config = ENTITY_CONFIG[entityType];
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }
    // Verify ALL requested entities exist
    const existingEntities = await config.model
      .find({ _id: { $in: validIds } })
      .select("_id")
      .lean();
    if (existingEntities.length !== validIds.length) {
      const foundIds = existingEntities.map((e) => e._id.toString());
      const missingIds = validIds.filter(
        (id) => !foundIds.includes(id)
      );
      return res.status(404).json({
        success: false,
        message: "One or more requested resources do not exist.",
        missingIds,
      });
    }
    const attachedIds = (program[config.fieldKey] || []).map((id) =>
      id.toString()
    );
    const duplicateIds = validIds.filter((id) =>
      attachedIds.includes(id)
    );
    if (duplicateIds.length > 0) {
      return res.status(409).json({
        success: false,
        message: "One or more resources are already attached.",
        duplicateIds,
      });
    }
    program[config.fieldKey].push(
      ...existingEntities.map((e) => e._id)
    );
    program.updatedBy = req.user?._id || null;
    await program.save();
    await program.populate(
      config.fieldKey,
      config.selectFields
    );
    res.json({
      success: true,
      message: `${validIds.length} ${entityType} attached successfully.`,
      program,
      attachedEntities: program[config.fieldKey],
    });
  } catch (error) {
    console.error("Error attaching entities:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to attach entities" });
  }
};

/**
 * DELETE /api/admin/programs/:programId/attachments/:entityType/:entityId
 * Detach an existing entity from a Program (without deleting the entity itself)
 */
export const detachEntity = async (req, res) => {
  try {
    const { programId, entityType, entityId } = req.params;

    if (!ENTITY_CONFIG[entityType]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported entity type '${entityType}'`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(programId) || !mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    // const config = ENTITY_CONFIG[entityType];

    // const updateQuery = {};
    // updateQuery[config.fieldKey] = entityId;
    const config = ENTITY_CONFIG[entityType];

    const program = await Program.findById(programId);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }
    const attachedIds = (program[config.fieldKey] || []).map((id) =>
      id.toString()
    );
    if (!attachedIds.includes(entityId)) {
      return res.status(404).json({
        success: false,
        message: `${entityType} is not attached to this program`,
      });
    }
    program[config.fieldKey] = program[config.fieldKey].filter(
      (id) => id.toString() !== entityId
    );
    program.updatedBy = req.user?._id || null;
    await program.save();
    await program.populate(
      config.fieldKey,
      config.selectFields
    );
    res.json({
      success: true,
      message: `Successfully detached entity from ${entityType}`,
      program,
    });
  } catch (error) {
    console.error("Error detaching entity:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to detach entity" });
  }
};
