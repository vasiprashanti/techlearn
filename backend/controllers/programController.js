import mongoose from "mongoose";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramWaitlistLead from "../models/ProgramWaitlistLead.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Blueprint from "../models/Blueprint.js";
import College from "../models/College.js";
import ProgramWaitlist from "../models/ProgramWaitlist.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import {
  getCurrentProgramAssignment,
  getOrCreateProgramAssignment,
  getProgramLearningContext,
} from "../services/programQuestionEngineService.js";
import { ensureReadinessLead } from "../services/programAssignmentService.js";
import { ensureStudentForUser } from "../utils/userProfile.js";
import { syncPrimaryProgramPointers, upsertProgramEnrollment } from "../utils/programEnrollment.js";
import { matchProgramsForUser } from "../utils/programMatching.js";

/**
 * GET /api/programs/public
 * Public endpoint to list all discoverable programs on Learn page.
 */
export const getPublicPrograms = async (req, res) => {
  try {
    const programs = await Program.find({
      status: "Active",
      visibility: "Public",
    })
      .select("_id name description programType duration durationDays phases pricingType programFee courseIds roadmapIds projectIds targetRoles targetCompanies")
      .populate("courseIds", "_id title level courseType numTopics")
      .populate("roadmapIds", "_id title status")
      .sort({ createdAt: -1 })
      .lean();

    const readinessIds = await Blueprint.find({
      programId: { $in: programs.map((p) => p._id) },
      blueprintType: { $in: ["day_0_readiness", "free_assessment"] },
      status: { $in: ["Active", "Draft"] },
    }).distinct("programId");
    const readinessSet = new Set(readinessIds.map((id) => String(id)));

    const formatted = programs.map((p) => ({
      ...p,
      hasFreeAssessment: readinessSet.has(String(p._id)),
    }));

    return res.json({ success: true, programs: formatted });
  } catch (error) {
    console.error("Error fetching public programs:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch programs." });
  }
};

/**
 * Public catalog used by Learn. It deliberately exposes only active/public
 * program metadata; enrollment and materials remain protected endpoints.
 */
export const getProgramCatalog = async (req, res) => {
  try {
    const programs = await Program.find({ status: "Active", visibility: "Public" })
      .select("_id name description programType duration durationDays pricingType programFee pricingPlans courseIds roadmapIds trackTemplateIds projectIds certificateTemplateIds")
      .populate("courseIds", "_id title description level courseType numTopics")
      .populate("roadmapIds", "_id title status")
      .populate("trackTemplateIds", "_id name trackType status")
      .populate("projectIds", "_id title category duration_days status")
      .lean();

    return res.json({
      success: true,
      programs: programs.map((program) => ({
        ...program,
        accessType: program.pricingType === "Free" ? "free" : "trainer-led",
        courseCount: program.courseIds?.length || 0,
        roadmapCount: program.roadmapIds?.length || 0,
        trackCount: program.trackTemplateIds?.length || 0,
        projectCount: program.projectIds?.length || 0,
        certificateCount: program.certificateTemplateIds?.length || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching public program catalog:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch program catalog." });
  }
};

/**
 * POST /api/programs/:programId/waitlist
 * Allows guests and users to join program waitlist.
 */
export const joinProgramWaitlist = async (req, res) => {
  try {
    const { programId } = req.params;
    const { name, email, phone, targetRole, targetCompany } = req.body;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: "Email is required to join waitlist." });
    }
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID." });
    }

    const program = await Program.findById(programId).lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found." });
    }

    const userId = req.user?._id || null;
    const normalizedEmail = String(email).trim().toLowerCase();

    const lead = await ProgramWaitlistLead.findOneAndUpdate(
      { programId, email: normalizedEmail },
      {
        $set: {
          name: name ? String(name).trim() : "",
          phone: phone ? String(phone).trim() : "",
          targetRole: targetRole ? String(targetRole).trim() : "",
          targetCompany: targetCompany ? String(targetCompany).trim() : "",
          userId,
          status: "Waitlisted",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: "Successfully joined the waitlist! We will notify you when batches open.",
      leadId: lead._id,
    });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to join waitlist." });
  }
};

/**
 * POST /api/programs/free-assessment/start
 * Protected endpoint to start/resume the Free Assessment with Target Role & Target Company.
 */
export const startFreeAssessment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetRole, targetCompany, programId: requestedProgramId } = req.body;

    let programId = requestedProgramId;
    if (!programId) {
      const publicPlacement = await Program.findOne({
        programType: "Placement",
        status: "Active",
        visibility: "Public",
      }).sort({ createdAt: -1 }).lean();

      if (!publicPlacement) {
        return res.status(404).json({ success: false, message: "No active Placement Program available." });
      }
      programId = publicPlacement._id;
    }

    // Update user's targetRole & targetCompanies if supplied
    const updates = {};
    if (targetRole && typeof targetRole === "string" && targetRole.trim()) {
      updates.targetRole = targetRole.trim();
    }
    if (targetCompany && typeof targetCompany === "string" && targetCompany.trim()) {
      updates.targetCompanies = [targetCompany.trim()];
    } else if (Array.isArray(targetCompany) && targetCompany.length > 0) {
      updates.targetCompanies = targetCompany.map((c) => String(c).trim()).filter(Boolean);
    }

    if (Object.keys(updates).length > 0) {
      await Promise.all([
        User.updateOne({ _id: userId }, { $set: updates }),
        Student.updateOne({ userId }, { $set: updates }),
      ]);
      Object.assign(req.user, updates);
    }

    const context = await getProgramLearningContext({
      user: req.user,
      programId,
      allowUnenrolled: true,
    });

    const assignment = await getOrCreateProgramAssignment({
      context,
      phase: "day_0_readiness",
      programDay: 0,
      allowDraft: req.user?.role === "admin",
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "No Free Assessment questions currently configured for this program.",
      });
    }

    await ensureReadinessLead({ context, assignment });

    const isCompleted = assignment.status === "Completed";
    const answeredCount = (assignment.questions || []).filter((q) => q.attempted).length;
    const correctCount = (assignment.questions || []).filter((q) => q.correct === true).length;
    const totalCount = (assignment.questions || []).length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    return res.json({
      success: true,
      programId,
      assignmentId: assignment._id,
      status: assignment.status,
      score: isCompleted ? (assignment.accuracy ?? score) : null,
      isCompleted,
      totalQuestions: totalCount,
      answeredQuestions: answeredCount,
    });
  } catch (error) {
    console.error("Error starting Free Assessment:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to start Free Assessment." });
  }
};

/**
 * GET /api/programs/recommendations
 * Return programs ordered by the authenticated learner's saved profile.
 * This is discovery only; it never creates an enrollment or grants access.
 */
export const getProgramRecommendations = async (req, res) => {
  try {
    const student = await Student.findOne({
      $or: [
        { userId: req.user._id },
        ...(req.user.email ? [{ email: String(req.user.email).trim().toLowerCase() }] : []),
      ],
    }).lean();

    const profile = student || req.user;
    const learningPath = String(profile.learningPath || req.user.learningPath || "").trim() || "Member";
    const programs = await matchProgramsForUser({
      learningGoal: profile.learningGoal || req.user.learningGoal || "",
      placementCategory: profile.placementCategory || req.user.placementCategory || "",
      targetCompanies: profile.targetCompanies || req.user.targetCompanies || [],
      skills: profile.skills || req.user.skills || [],
      targetRole: profile.targetRole || req.user.targetRole || "",
      learningPath,
    });

    return res.json({
      success: true,
      programs: programs.slice(0, 6).map((program, index) => ({
        ...program,
        accessType: program.pricingType === "Free" ? "free" : "trainer-led",
        courseCount: program.courseIds?.length || 0,
        roadmapCount: program.roadmapIds?.length || 0,
        trackCount: program.trackTemplateIds?.length || 0,
        projectCount: program.projectIds?.length || 0,
        certificateCount: program.certificateTemplateIds?.length || 0,
        isRecommended: index === 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching program recommendations:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch program recommendations." });
  }
};

/** Enroll an authenticated learner into a genuinely free program. */
export const enrollInFreeProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID." });
    }
    const program = await Program.findOne({
      _id: programId,
      status: "Active",
      visibility: "Public",
      pricingType: "Free",
    }).lean();
    if (!program) return res.status(404).json({ success: false, message: "Free program not found." });

    let student = await Student.findOne({
      $or: [{ userId: req.user._id }, { email: String(req.user.email || "").toLowerCase() }],
    });
    if (!req.user?.onboardingCompleted && !student?.onboardingCompleted) {
      return res.status(409).json({ success: false, message: "Complete onboarding before starting a program." });
    }
    student = await ensureStudentForUser({ user: req.user, student, collegeModel: College });
    if (!student) return res.status(409).json({ success: false, message: "A learner profile is required before enrollment." });

    if (!student.userId) {
      student.userId = req.user._id;
      await student.save();
    }

    const existingEnrollment = await ProgramEnrollment.findOne({
      userId: req.user._id,
      programId: program._id,
      status: { $in: ["Active", "Completed"] },
    }).lean();
    const existingBatchId = existingEnrollment
      && Object.prototype.hasOwnProperty.call(existingEnrollment, "batchId")
      ? existingEnrollment.batchId
      : (student.batchId || req.user.batchId || null);

    const enrollment = await upsertProgramEnrollment({
      user: req.user,
      student,
      program,
      // Repeating a free-enrollment action must not move a batch learner onto
      // an individual schedule. A schedule change is an explicit admin action.
      batchId: existingBatchId,
      accessTier: "Free",
      source: "onboarding",
    });
    await syncPrimaryProgramPointers({ user: req.user, student });
    invalidateDashboardCache(req.user._id);

    return res.status(201).json({
      success: true,
      enrollment: {
        id: enrollment?._id || null,
        programId: program._id,
        scheduleType: enrollment?.batchId ? "batch" : "individual",
        batchId: enrollment?.batchId || null,
        individualStartDate: enrollment?.individualStartDate || enrollment?.assignedAt || new Date(),
      },
      program,
    });
  } catch (error) {
    console.error("Error enrolling in free program:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to start free program." });
  }
};



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
         select: "_id name description programType duration durationDays phases status visibility pricingType programFee pricingPlans courseIds roadmapIds trackTemplateIds projectIds certificateTemplateIds",
        populate: [
          { path: "courseIds", select: "_id title level courseType numTopics" },
          { path: "roadmapIds", select: "_id title status" },
          { path: "projectIds", select: "_id title category duration_days status" },
        ],
      })
      .lean();

    let assignedPrograms = enrollments
      .filter((enrollment) => enrollment.programId
        && enrollment.programId.status === "Active"
        && enrollment.programId.visibility === "Public"
        && (enrollment.programId.pricingType !== "Paid" || enrollment.accessTier === "Member"))
      .map((e) => e.programId);
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

      if (legacyProg && (legacyProg.pricingType !== "Paid")) {
        assignedPrograms = [legacyProg];
      }
    }

    const preferredProgramId = String(req.user.programId || "");
    const activeProgramId = assignedPrograms.some((program) => String(program._id) === preferredProgramId)
      ? preferredProgramId
      : String(assignedPrograms[0]?._id || "");

    const formattedPrograms = assignedPrograms.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      programType: p.programType,
      duration: p.duration,
      durationDays: p.durationDays,
      phases: p.phases || [],
      status: p.status,
      visibility: p.visibility,
      pricingType: p.pricingType,
      programFee: p.programFee,
      pricingPlans: p.pricingPlans || [],
      courseCount: Array.isArray(p.courseIds) ? p.courseIds.length : 0,
      roadmapCount: Array.isArray(p.roadmapIds) ? p.roadmapIds.length : 0,
      projectCount: Array.isArray(p.projectIds) ? p.projectIds.length : 0,
      certificateCount: Array.isArray(p.certificateTemplateIds) ? p.certificateTemplateIds.length : 0,
      courses: p.courseIds || [],
      roadmaps: p.roadmapIds || [],
      projects: p.projectIds || [],
      trackTemplates: p.trackTemplateIds || [],
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
 * GET /api/programs/readiness-options
 * Return public Placement programs that have an active Day 0 Blueprint.
 */
export const getReadinessOptions = async (req, res) => {
  try {
    const programs = await Program.find({
      programType: "Placement",
      status: "Active",
      visibility: "Public",
    })
      .select("_id name description programType duration durationDays phases targetRoles targetCompanies")
      .sort({ createdAt: -1 })
      .lean();

    if (!programs.length) return res.json({ success: true, programs: [] });

    const configuredIds = await Blueprint.find({
      programId: { $in: programs.map((program) => program._id) },
      blueprintType: "day_0_readiness",
      status: "Active",
    }).distinct("programId");
    const configured = new Set(configuredIds.map((id) => String(id)));

    return res.json({
      success: true,
      programs: programs
        .filter((program) => configured.has(String(program._id)))
        .map((program) => ({ ...program, readinessAvailable: true })),
    });
  } catch (error) {
    console.error("Error fetching readiness options:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch readiness options." });
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
    if (req.user.role !== "admin" && program.pricingType === "Paid" && (!enrollment || enrollment.accessTier !== "Member")) {
      return res.status(403).json({ success: false, message: "Paid program access requires a verified enrollment" });
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
    let enrollment = null;
    if (req.user.role !== "admin") {
      enrollment = await ProgramEnrollment.findOne({ userId, programId, status: "Active" }).lean();
      const isEnrolled = Boolean(enrollment);
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
    if (req.user.role !== "admin" && program.pricingType === "Paid" && (!enrollment || enrollment.accessTier !== "Member")) {
      return res.status(403).json({ success: false, message: "Paid program access requires a verified enrollment" });
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
