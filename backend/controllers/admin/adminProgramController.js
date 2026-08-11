import mongoose from "mongoose";
import Program, { PROGRAM_TYPES } from "../../models/Program.js";
import Batch from "../../models/Batch.js";
import Student from "../../models/Student.js";
import Course from "../../models/Course.js";
import Roadmap from "../../models/Roadmap.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import CertificateTemplate from "../../models/CertificateTemplate.js";
import Project from "../../models/Project.js";
import User from "../../models/User.js";
import ProgramEnrollment from "../../models/ProgramEnrollment.js";
import {
  pauseProgramEnrollment,
  syncPrimaryProgramPointers,
  upsertProgramEnrollment,
} from "../../utils/programEnrollment.js";

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
    selectFields: "_id name email rollNo status batchId createdAt",
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
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: searchRegex }, { description: searchRegex }, { programType: searchRegex }];
    }

    // Program Type filter
    if (programType.trim()) {
      query.programType = programType.trim();
    }

    // Status filter
    if (status.trim()) {
      query.status = status.trim();
    }

    // Month filter based on createdAt (expected format: YYYY-MM or MM)
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month.trim())) {
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
    sortOptions[safeSortBy] = sortOrder === "asc" ? 1 : -1;

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
      learningGoals: p.learningGoals || [],
      placementCategories: p.placementCategories || [],
      targetCompanies: p.targetCompanies || [],
      skillTags: p.skillTags || [],
      targetRoles: p.targetRoles || [],
      accessTier: p.accessTier || "Both",
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
    const {
      name,
      description,
      programType,
      duration,
      status,
      visibility,
      pricingType,
      programFee,
      learningGoals,
      placementCategories,
      targetCompanies,
      skillTags,
      targetRoles,
      accessTier,
    } = req.body;

    if (!name || !programType || !duration) {
      return res.status(400).json({
        success: false,
        message: "Program name, program type, and duration are required",
      });
    }

    const normalizedProgramType = String(programType).trim();
    if (!PROGRAM_TYPES.includes(normalizedProgramType)) {
      return res.status(400).json({
        success: false,
        message: "Program type must be Placement or Skill",
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
      programType: normalizedProgramType,
      duration: duration.trim(),
      status: status || "Draft",
      visibility: visibility || "Public",
      pricingType: pricingType || "Free",
      programFee: pricingType === "Paid" ? parsedFee : 0,
      learningGoals: Array.isArray(learningGoals) ? learningGoals : [],
      placementCategories: Array.isArray(placementCategories) ? placementCategories : [],
      targetCompanies: Array.isArray(targetCompanies) ? targetCompanies : [],
      skillTags: Array.isArray(skillTags) ? skillTags : [],
      targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
      accessTier: accessTier || "Both",
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
    res.status(400).json({ success: false, message: error.message || "Failed to create program" });
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
      .populate({
        path: "studentIds",
        select: ENTITY_CONFIG.students.selectFields,
        populate: {
          path: "batchId",
          select: "_id name startDate expiryDate releaseTime",
        },
      })
      .populate("courseIds", ENTITY_CONFIG.courses.selectFields)
      .populate("roadmapIds", ENTITY_CONFIG.roadmaps.selectFields)
      .populate("trackTemplateIds", ENTITY_CONFIG["track-templates"].selectFields)
      .populate("certificateTemplateIds", ENTITY_CONFIG.certificates.selectFields)
      .populate("projectIds", ENTITY_CONFIG.projects.selectFields)
      .lean();

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    // Keep the program's learning path separate from its optional cohort
    // schedule. The enrollment record is the source of truth for the
    // student's access tier, individual start date, and selected batch.
    const enrollments = await ProgramEnrollment.find({ programId })
      .sort({ assignedAt: -1, createdAt: -1 })
      .populate("batchId", "_id name startDate expiryDate releaseTime")
      .lean();

    const enrollmentByStudentId = new Map();
    enrollments.forEach((enrollment) => {
      const studentId = enrollment.studentId?.toString();
      if (studentId && !enrollmentByStudentId.has(studentId)) {
        enrollmentByStudentId.set(studentId, enrollment);
      }
    });

    const programWithEnrollments = {
      ...program,
      studentIds: (program.studentIds || []).map((student) => ({
        ...student,
        enrollment: enrollmentByStudentId.get(student._id?.toString()) || null,
      })),
    };

    res.json({
      success: true,
      program: programWithEnrollments,
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
      name,
      description,
      programType,
      duration,
      status,
      visibility,
      pricingType,
      programFee,
      learningGoals,
      placementCategories,
      targetCompanies,
      skillTags,
      targetRoles,
      accessTier,
    } = req.body;

    if (name !== undefined) program.name = String(name).trim();
    if (description !== undefined) program.description = String(description).trim();
    if (programType !== undefined) {
      const normalizedProgramType = String(programType).trim();
      if (!PROGRAM_TYPES.includes(normalizedProgramType)) {
        return res.status(400).json({
          success: false,
          message: "Program type must be Placement or Skill",
        });
      }
      program.programType = normalizedProgramType;
    }
    if (duration !== undefined) program.duration = String(duration).trim();
    if (status !== undefined) program.status = status;
    if (visibility !== undefined) program.visibility = visibility;
    if (learningGoals !== undefined) program.learningGoals = Array.isArray(learningGoals) ? learningGoals : [];
    if (placementCategories !== undefined) program.placementCategories = Array.isArray(placementCategories) ? placementCategories : [];
    if (targetCompanies !== undefined) program.targetCompanies = Array.isArray(targetCompanies) ? targetCompanies : [];
    if (skillTags !== undefined) program.skillTags = Array.isArray(skillTags) ? skillTags : [];
    if (targetRoles !== undefined) program.targetRoles = Array.isArray(targetRoles) ? targetRoles : [];
    if (accessTier !== undefined) program.accessTier = accessTier;

    if (pricingType !== undefined) {
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
    } else if (program.pricingType === "Paid" && programFee !== undefined) {
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
    res.status(400).json({ success: false, message: error.message || "Failed to update program" });
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

    const program = await Program.findById(programId).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    // Verify target entities exist
    const existingEntities = await config.model.find({ _id: { $in: validIds } }).select("_id").lean();
    const existingEntityIds = existingEntities.map((e) => e._id);

    if (existingEntityIds.length === 0) {
      return res.status(404).json({ success: false, message: "None of the specified target entities were found" });
    }

    if (entityType === "students") {
      const rawBatchId = req.body?.batchId;
      let selectedBatch = null;
      if (rawBatchId && rawBatchId !== "null") {
        if (!mongoose.Types.ObjectId.isValid(rawBatchId)) {
          return res.status(400).json({ success: false, message: "Invalid batch ID format" });
        }
        selectedBatch = await Batch.findById(rawBatchId).lean();
        if (!selectedBatch) {
          return res.status(404).json({ success: false, message: "Batch not found" });
        }
      }

      const students = await Student.find({ _id: { $in: existingEntityIds } }).lean();
      for (const student of students) {
        if (selectedBatch && student.collegeId && selectedBatch.collegeId && String(student.collegeId) !== String(selectedBatch.collegeId)) {
          return res.status(400).json({
            success: false,
            message: `Selected batch does not belong to ${student.name || "one of the selected students"}.`,
          });
        }

        // Keep the legacy Student.batchId only as a compatibility pointer.
        // The enrollment created below is the authoritative program schedule.
        await Student.updateOne(
          { _id: student._id },
          {
            $set: {
              programId,
              ...(selectedBatch ? { batchId: selectedBatch._id } : {}),
            },
          }
        );

        const user = await User.findOne({
          $or: [
            ...(student.userId ? [{ _id: student.userId }] : []),
            ...(student.email ? [{ email: String(student.email).trim().toLowerCase() }] : []),
          ],
        }).select("_id").lean();

        if (user) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                programId,
                ...(selectedBatch ? { batchId: selectedBatch._id, startDate: selectedBatch.startDate } : {}),
              },
            }
          );
          await upsertProgramEnrollment({
            user,
            student,
            program,
            batchId: selectedBatch?._id || null,
            source: "admin",
          });
        }
      }

      const updatedProgram = await Program.findByIdAndUpdate(
        programId,
        {
          $addToSet: {
            studentIds: { $each: existingEntityIds },
            ...(selectedBatch ? { batchIds: selectedBatch._id } : {}),
          },
          $set: { updatedBy: req.user?._id || null },
        },
        { new: true, runValidators: true }
      )
        .populate(config.fieldKey, config.selectFields)
        .lean();

      return res.json({
        success: true,
        message: `Successfully enrolled ${existingEntityIds.length} student${existingEntityIds.length === 1 ? "" : "s"} ${selectedBatch ? "on the selected batch schedule" : "on individual program schedules"}.`,
        program: updatedProgram,
        attachedEntities: updatedProgram[config.fieldKey],
      });
    }

    const updateQuery = {};
    updateQuery[config.fieldKey] = { $each: existingEntityIds };

    const updatedProgram = await Program.findByIdAndUpdate(
      programId,
      {
        $addToSet: updateQuery,
        $set: { updatedBy: req.user?._id || null },
      },
      { new: true, runValidators: true }
    )
      .populate(config.fieldKey, config.selectFields)
      .lean();

    if (!updatedProgram) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    res.json({
      success: true,
      message: `Successfully attached ${existingEntityIds.length} ${entityType}`,
      program: updatedProgram,
      attachedEntities: updatedProgram[config.fieldKey],
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

    const config = ENTITY_CONFIG[entityType];

    if (entityType === "students") {
      const student = await Student.findById(entityId).lean();
      if (student) {
        const user = await User.findOne({
          $or: [
            ...(student.userId ? [{ _id: student.userId }] : []),
            ...(student.email ? [{ email: String(student.email).trim().toLowerCase() }] : []),
          ],
        }).select("_id").lean();
        await pauseProgramEnrollment({ student, user, programId });
        await syncPrimaryProgramPointers({ student, user });
      }
    }

    const updateQuery = {};
    updateQuery[config.fieldKey] = entityId;

    const updatedProgram = await Program.findByIdAndUpdate(
      programId,
      {
        $pull: updateQuery,
        $set: { updatedBy: req.user?._id || null },
      },
      { new: true, runValidators: true }
    )
      .populate(config.fieldKey, config.selectFields)
      .lean();

    if (!updatedProgram) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    res.json({
      success: true,
      message: `Successfully detached entity from ${entityType}`,
      program: updatedProgram,
    });
  } catch (error) {
    console.error("Error detaching entity:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to detach entity" });
  }
};
