import mongoose from "mongoose";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import { expireAllActiveBatches } from "../utils/batchLifecycle.js";

/**
 * GET /api/programs/assigned
 * Protected student endpoint returning all programs assigned to the authenticated user.
 */
export const getAssignedPrograms = async (req, res) => {
  try {
    await expireAllActiveBatches();
    const userId = req.user._id;

    // Find all active enrollment records for this user
    const enrollments = await ProgramEnrollment.find({ userId, status: "Active" })
      .populate({
        path: "programId",
        select: "_id name description programType duration status visibility pricingType programFee courseIds roadmapIds projectIds certificateTemplateIds",
        populate: [
          { path: "courseIds", select: "_id title level courseType numTopics" },
          { path: "roadmapIds", select: "_id title status" },
          { path: "projectIds", select: "_id title category duration_days status" },
        ],
      })
      .lean();

    let assignedPrograms = enrollments
      .map((e) => e.programId)
      .filter((p) => p && p.status === "Active" && p.visibility === "Public");
    const enrollmentByProgramId = new Map(
      enrollments
        .filter((enrollment) => enrollment.programId)
        .map((enrollment) => [String(enrollment.programId?._id || enrollment.programId), enrollment])
    );

    // Legacy fallback: if no ProgramEnrollment records, check user's direct programId
    if (assignedPrograms.length === 0 && req.user.programId) {
      const legacyProg = await Program.findOne({
        _id: req.user.programId,
        status: "Active",
        visibility: "Public",
      })
        .populate("courseIds", "_id title level courseType numTopics")
        .populate("roadmapIds", "_id title status")
        .populate("projectIds", "_id title category duration_days status")
        .lean();

      if (legacyProg) {
        assignedPrograms = [legacyProg];
      }
    }

    const activeProgramId = String(req.user.programId || assignedPrograms[0]?._id || "");

    const formattedPrograms = assignedPrograms.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      programType: p.programType,
      duration: p.duration,
      status: p.status,
      visibility: p.visibility,
      pricingType: p.pricingType,
      programFee: p.programFee,
      courseCount: Array.isArray(p.courseIds) ? p.courseIds.length : 0,
      roadmapCount: Array.isArray(p.roadmapIds) ? p.roadmapIds.length : 0,
      projectCount: Array.isArray(p.projectIds) ? p.projectIds.length : 0,
      certificateCount: Array.isArray(p.certificateTemplateIds) ? p.certificateTemplateIds.length : 0,
      courses: p.courseIds || [],
      roadmaps: p.roadmapIds || [],
      projects: p.projectIds || [],
      batchId: enrollmentByProgramId.get(String(p._id))?.batchId || null,
      scheduleType: enrollmentByProgramId.get(String(p._id))?.batchId ? "batch" : "individual",
      individualStartDate: enrollmentByProgramId.get(String(p._id))?.individualStartDate
        || enrollmentByProgramId.get(String(p._id))?.assignedAt
        || null,
      isActive: String(p._id) === activeProgramId,
    }));

    res.json({
      success: true,
      programs: formattedPrograms,
      activeProgramId,
    });
  } catch (error) {
    console.error("Error fetching assigned programs:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch assigned programs" });
  }
};

/**
 * POST /api/programs/select-active
 * Selects an assigned program as the user's active program for dashboard viewing.
 * Validates ownership server-side.
 */
export const selectActiveProgram = async (req, res) => {
  try {
    await expireAllActiveBatches();
    const userId = req.user._id;
    const { programId } = req.body;

    if (!programId || !mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Valid programId is required" });
    }

    // Verify active enrollment server-side
    const enrollment = await ProgramEnrollment.findOne({ userId, programId, status: "Active" });
    const isLegacyMatch = String(req.user.programId) === String(programId);

    if (!enrollment && !isLegacyMatch) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have an active enrollment in this program",
      });
    }

    const program = await Program.findOne({ _id: programId, status: "Active", visibility: "Public" }).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found or inactive" });
    }

    // Update User and Student primary programId
    await Promise.all([
      User.updateOne({ _id: userId }, { programId }),
      Student.updateOne({ userId }, { programId }),
    ]);

    invalidateDashboardCache(userId);

    res.json({
      success: true,
      message: "Active program updated successfully",
      activeProgram: {
        _id: program._id,
        name: program.name,
        programType: program.programType,
      },
    });
  } catch (error) {
    console.error("Error selecting active program:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to select active program" });
  }
};

/**
 * GET /api/programs/:programId
 * Student program detail route with program-scoped access control
 */
export const getProgramDetailForStudent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programId } = req.params;

    await expireAllActiveBatches();

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID" });
    }

    // Program-scoped access check for non-admin users
    if (req.user.role !== "admin") {
      const isEnrolled = await ProgramEnrollment.exists({ userId, programId, status: "Active" });
      const isLegacy = String(req.user.programId) === String(programId);

      if (!isEnrolled && !isLegacy) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have access to this program",
        });
      }
    }

    const programQuery = { _id: programId };
    if (req.user.role !== "admin") {
      programQuery.status = "Active";
      programQuery.visibility = "Public";
    }

    const program = await Program.findOne(programQuery)
      .populate("courseIds", "_id title description level courseType numTopics")
      .populate("roadmapIds", "_id title status")
      .populate("projectIds", "_id title category duration_days status")
      .lean();

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found or inaccessible" });
    }

    res.json({
      success: true,
      program,
    });
  } catch (error) {
    console.error("Error fetching program detail:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch program detail" });
  }
};
