import mongoose from "mongoose";
import Roadmap from "../models/Roadmap.js";
import Batch from "../models/Batch.js";
import Program from "../models/Program.js";
import Sequence from "../models/Sequence.js";
import Student from "../models/Student.js";
import { writeAuditLog } from "../utils/auditLogger.js";
import { resolveProgramSchedule } from "../utils/programSchedule.js";
import {
  formatRoadmapDuration,
  isRoadmapBranchEligible,
  isRoadmapTargetRoleMatch,
  normalizeRoadmapBranches,
} from "../utils/roadmapEligibility.js";

const ROADMAP_STATUSES = ["Active", "Draft", "Archived"];
const ROADMAP_DURATION_UNITS = ["days", "weeks", "months"];

const getId = (value) => value?._id || value?.id || value || null;

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeBatchIds = (value) => [
  ...new Set(
    (Array.isArray(value) ? value : [])
      .map((id) => String(getId(id) || "").trim())
      .filter(Boolean)
  ),
];

const normalizeStatus = (value) => {
  const status = ROADMAP_STATUSES.find(
    (candidate) => candidate.toLowerCase() === String(value || "").trim().toLowerCase()
  );
  return status || "";
};

const normalizeDurationUnit = (value) => {
  const unit = String(value || "").trim().toLowerCase();
  return ROADMAP_DURATION_UNITS.includes(unit) ? unit : "";
};

const isTruthy = (value) => value === true || ["true", "1", "yes"].includes(String(value || "").toLowerCase());

const assertValidBatchIds = async (batchIds) => {
  if (batchIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    const error = new Error("One or more assigned batches are invalid.");
    error.status = 400;
    throw error;
  }

  if (!batchIds.length) return [];

  const batches = await Batch.find({ _id: { $in: batchIds } }).select("_id name").lean();
  if (batches.length !== batchIds.length) {
    const error = new Error("One or more assigned batches were not found.");
    error.status = 404;
    throw error;
  }

  return batches;
};

const formatRoadmap = (roadmap) => {
  const raw = roadmap?.toObject ? roadmap.toObject() : roadmap || {};
  const roadmapId = raw.roadmapId || raw.rid || raw.RID || "";
  const numericDuration = Number(raw.duration);
  const assignedBatchIds = Array.isArray(raw.assignedBatchIds) ? raw.assignedBatchIds : [];

  return {
    id: raw._id,
    roadmapId,
    rid: roadmapId,
    RID: roadmapId,
    title: raw.title || "",
    description: raw.description || "",
    targetRole: raw.targetRole || "",
    duration: Number.isFinite(numericDuration) ? numericDuration : null,
    durationUnit: raw.durationUnit || "",
    durationLabel: formatRoadmapDuration({ duration: raw.duration, durationUnit: raw.durationUnit }),
    markdownBody: raw.markdownBody || "",
    markdownFile: raw.markdownFile || raw.markdownFileName || "",
    branches: normalizeRoadmapBranches(raw.branches),
    assignedBatchIds: assignedBatchIds.map((batch) => batch?._id || batch),
    assignedBatches: assignedBatchIds
      .filter((batch) => batch && typeof batch === "object" && batch.name)
      .map((batch) => ({ id: batch._id, name: batch.name })),
    status: raw.status || "Active",
    publishedAt: raw.publishedAt || null,
    updatedAt: raw.updatedAt,
    createdAt: raw.createdAt,
    // Read-only legacy fields keep older clients from breaking. New CRUD
    // requests no longer expose or write note attachments.
    attachedNoteTitle: raw.attachedNoteTitle || "",
    attachedNoteDay: raw.attachedNoteDay || null,
  };
};

const nextRoadmapId = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const sequence = await Sequence.findOneAndUpdate(
      { _id: "roadmap" },
      { $inc: { value: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    const candidate = `RID-${String(sequence.value).padStart(6, "0")}`;
    const alreadyUsed = await Roadmap.exists({ roadmapId: candidate });
    if (!alreadyUsed) return candidate;
  }

  const error = new Error("Could not allocate a unique roadmap ID.");
  error.status = 500;
  throw error;
};

const findPotentialDuplicate = async ({ title, targetRole, excludeId = null }) => {
  const query = {
    title: { $regex: new RegExp(`^${escapeRegex(title)}$`, "i") },
    targetRole: { $regex: new RegExp(`^${escapeRegex(targetRole)}$`, "i") },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Roadmap.findOne(query).sort({ updatedAt: -1 }).lean();
};

const buildRoadmapInput = ({ body = {}, existing = null } = {}) => {
  const getValue = (key, fallback = "") =>
    body[key] !== undefined ? body[key] : existing?.[key] ?? fallback;

  const title = String(getValue("title")).trim();
  const description = String(getValue("description")).trim();
  const targetRole = String(getValue("targetRole")).trim();
  const markdownBody = String(getValue("markdownBody")).trim();
  const duration = Number(getValue("duration"));
  const durationUnit = normalizeDurationUnit(getValue("durationUnit"));
  const status = normalizeStatus(getValue("status", "Active")) || "Active";
  const markdownFile = String(
    getValue("markdownFile", getValue("markdownFileName", ""))
  ).trim();
  const branches = normalizeRoadmapBranches(getValue("branches", []));
  const assignedBatchIds = normalizeBatchIds(getValue("assignedBatchIds", []));

  if (!title) return { error: "Roadmap title is required." };
  if (!targetRole) return { error: "Target role is required." };
  if (!markdownBody) return { error: "A Markdown file is required." };
  // There is deliberately no fixed roadmap length or upper bound.
  if (!Number.isFinite(duration) || duration <= 0) {
    return { error: "Duration must be a positive number." };
  }
  if (!durationUnit) return { error: "Duration unit must be Days, Weeks, or Months." };
  if (!ROADMAP_STATUSES.includes(status)) return { error: "Invalid roadmap status." };

  return {
    value: {
      title,
      description,
      targetRole,
      duration,
      durationUnit,
      markdownBody,
      markdownFile,
      branches,
      assignedBatchIds,
      status,
    },
  };
};

const duplicateResponse = ({ res, duplicate }) => res.status(409).json({
  success: false,
  code: "ROADMAP_DUPLICATE",
  duplicate: true,
  message: "A roadmap with this title and target role already exists.",
  data: { existing: formatRoadmap(duplicate) },
});

const populateRoadmap = (roadmapId) => Roadmap.findById(roadmapId)
  .populate("assignedBatchIds", "name")
  .lean();

export const listRoadmapsAdmin = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find()
      .populate("assignedBatchIds", "name")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: roadmaps.map(formatRoadmap) });
  } catch (error) {
    console.error("listRoadmapsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch roadmaps." });
  }
};

export const getRoadmapAdmin = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ success: false, message: "Invalid roadmapId." });
    }

    const roadmap = await populateRoadmap(roadmapId);
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found." });
    return res.status(200).json({ success: true, data: formatRoadmap(roadmap) });
  } catch (error) {
    console.error("getRoadmapAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch roadmap." });
  }
};

export const createRoadmapAdmin = async (req, res) => {
  try {
    const parsed = buildRoadmapInput({ body: req.body });
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });

    const { value } = parsed;
    await assertValidBatchIds(value.assignedBatchIds);

    const duplicate = await findPotentialDuplicate(value);
    if (duplicate && !isTruthy(req.body.allowDuplicate)) return duplicateResponse({ res, duplicate });

    const roadmap = await Roadmap.create({
      roadmapId: await nextRoadmapId(),
      ...value,
      publishedAt: value.status === "Active" ? new Date() : null,
      createdBy: req.user?._id || null,
    });

    await writeAuditLog({
      verb: "Created",
      entityType: "Roadmap",
      entityId: roadmap._id,
      action: "Created roadmap",
      detail: `${roadmap.title} (${roadmap.targetRole})`,
      actor: req.user,
    });

    const populated = await populateRoadmap(roadmap._id);
    return res.status(201).json({ success: true, data: formatRoadmap(populated) });
  } catch (error) {
    console.error("createRoadmapAdmin error:", error);
    const status = error.code === 11000 ? 409 : (error.status || error.statusCode || 500);
    return res.status(status).json({
      success: false,
      ...(error.code === 11000 ? { code: "ROADMAP_DUPLICATE" } : {}),
      message: error.code === 11000 ? "A roadmap with this generated ID already exists." : (error.message || "Failed to create roadmap."),
    });
  }
};

export const updateRoadmapAdmin = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ success: false, message: "Invalid roadmapId." });
    }

    const existing = await Roadmap.findById(roadmapId);
    if (!existing) return res.status(404).json({ success: false, message: "Roadmap not found." });

    const parsed = buildRoadmapInput({ body: req.body, existing });
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { value } = parsed;
    await assertValidBatchIds(value.assignedBatchIds);

    const duplicate = await findPotentialDuplicate({ ...value, excludeId: roadmapId });
    if (duplicate && !isTruthy(req.body.allowDuplicate)) return duplicateResponse({ res, duplicate });

    Object.assign(existing, value);
    if (!existing.roadmapId) existing.roadmapId = await nextRoadmapId();
    existing.publishedAt = value.status === "Active" ? (existing.publishedAt || new Date()) : null;
    await existing.save();

    await writeAuditLog({
      verb: "Updated",
      entityType: "Roadmap",
      entityId: existing._id,
      action: "Updated roadmap",
      detail: `${existing.title} (${existing.targetRole})`,
      actor: req.user,
    });

    const populated = await populateRoadmap(existing._id);
    return res.status(200).json({ success: true, data: formatRoadmap(populated) });
  } catch (error) {
    console.error("updateRoadmapAdmin error:", error);
    const status = error.code === 11000 ? 409 : (error.status || error.statusCode || 500);
    return res.status(status).json({
      success: false,
      ...(error.code === 11000 ? { code: "ROADMAP_DUPLICATE" } : {}),
      message: error.code === 11000 ? "A roadmap with this title or generated ID already exists." : (error.message || "Failed to update roadmap."),
    });
  }
};

export const updateRoadmapStatusAdmin = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const status = normalizeStatus(req.body?.status);
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ success: false, message: "Invalid roadmapId." });
    }
    if (!status) return res.status(400).json({ success: false, message: "Invalid roadmap status." });

    const existing = await Roadmap.findById(roadmapId);
    if (!existing) return res.status(404).json({ success: false, message: "Roadmap not found." });

    const update = {
      status,
      publishedAt: status === "Active" ? (existing.publishedAt || new Date()) : null,
    };
    if (!existing.roadmapId) update.roadmapId = await nextRoadmapId();

    // Legacy records may not have the new required fields yet, so a status
    // change must not be blocked by full-document validation.
    const roadmap = await Roadmap.findByIdAndUpdate(roadmapId, { $set: update }, { new: true })
      .populate("assignedBatchIds", "name")
      .lean();

    await writeAuditLog({
      verb: "Updated",
      entityType: "Roadmap",
      entityId: roadmap._id,
      action: `Changed roadmap status to ${status}`,
      detail: roadmap.title,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: formatRoadmap(roadmap) });
  } catch (error) {
    console.error("updateRoadmapStatusAdmin error:", error);
    return res.status(error.status || error.statusCode || 500).json({ success: false, message: error.message || "Failed to update roadmap status." });
  }
};

export const deleteRoadmapAdmin = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ success: false, message: "Invalid roadmapId." });
    }

    const roadmap = await Roadmap.findByIdAndDelete(roadmapId);
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found." });

    await writeAuditLog({
      verb: "Deleted",
      entityType: "Roadmap",
      entityId: roadmap._id,
      action: "Deleted roadmap",
      detail: roadmap.title,
      actor: req.user,
    });

    return res.status(200).json({ success: true, message: "Roadmap deleted successfully." });
  } catch (error) {
    console.error("deleteRoadmapAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete roadmap." });
  }
};

const findStudentForUser = async (user) => {
  const identifiers = [
    user?.email ? { email: String(user.email).trim().toLowerCase() } : null,
    user?._id ? { userId: user._id } : null,
  ].filter(Boolean);
  if (!identifiers.length) return null;

  return Student.findOne({ $or: identifiers })
    .select("_id batchId programId programSelection branch targetRole")
    .lean();
};

const getViewerContext = async (user) => {
  if (!user) return { student: null, schedule: null, batchExpired: false };
  const student = await findStudentForUser(user);
  const schedule = await resolveProgramSchedule({ user, student });
  const program = schedule?.programId
    ? await Program.findById(schedule.programId).select("_id roadmapIds").lean()
    : null;
  return { student, schedule, program, batchExpired: Boolean(schedule.batchExpired) };
};

const isRoadmapEligibleForViewer = ({ roadmap, user, student, schedule, programOwned = false }) => {
  // Published roadmaps are public to signed-out visitors. Once a learner is
  // authenticated, branch and legacy batch restrictions are enforced here.
  if (!user) return true;

  const assignedBatchIds = normalizeBatchIds(roadmap?.assignedBatchIds);
  if (assignedBatchIds.length && !programOwned) {
    const currentBatchId = schedule?.batchId ? String(getId(schedule.batchId)) : "";
    if (!currentBatchId || !assignedBatchIds.includes(currentBatchId)) return false;
  }

  return isRoadmapBranchEligible({ roadmap, user, student });
};

const findProgramRoadmaps = async ({ program, user, student, schedule }) => {
  const roadmapIds = (program?.roadmapIds || [])
    .map((roadmap) => getId(roadmap))
    .filter(Boolean);
  if (!roadmapIds.length) return [];

  const roadmaps = await Roadmap.find({
    _id: { $in: roadmapIds },
    status: "Active",
  }).lean();
  const order = new Map(roadmapIds.map((id, index) => [String(id), index]));

  return roadmaps
    .filter((roadmap) => isRoadmapEligibleForViewer({
      roadmap,
      user,
      student,
      schedule,
      programOwned: true,
    }))
    .sort((first, second) => (order.get(String(first._id)) ?? 0) - (order.get(String(second._id)) ?? 0));
};

const findActiveRoleRoadmap = async ({ targetRole, user, student, schedule }) => {
  if (!targetRole) return null;

  const candidates = await Roadmap.find({
    status: "Active",
    targetRole: { $regex: new RegExp(`^${escapeRegex(targetRole)}$`, "i") },
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();

  return candidates.find((roadmap) =>
    isRoadmapTargetRoleMatch(roadmap.targetRole, targetRole)
      && isRoadmapEligibleForViewer({ roadmap, user, student, schedule })
  ) || null;
};

export const getRoadmapsForYou = async (req, res) => {
  try {
    const { student, schedule, program, batchExpired } = await getViewerContext(req.user);
    if (batchExpired) {
      return res.status(403).json({ success: false, message: "This batch has ended and roadmap access has been revoked." });
    }

    // A concrete Program owns the learner's roadmap access. Do not substitute
    // an unrelated role-matched or legacy batch roadmap when the selected
    // Program has no roadmap attached.
    if (schedule?.programId) {
      const programRoadmap = (await findProgramRoadmaps({
        program,
        user: req.user,
        student,
        schedule,
      }))[0] || null;
      return res.status(200).json({
        success: true,
        data: programRoadmap ? formatRoadmap(programRoadmap) : null,
        targetRole: student?.targetRole?.trim() || req.user?.targetRole?.trim() || "",
        reason: programRoadmap ? null : "no-program-roadmap",
      });
    }

    const targetRole = student?.targetRole?.trim() || req.user?.targetRole?.trim() || "";
    if (!targetRole) {
      return res.status(200).json({ success: true, data: null, targetRole: "", reason: "missing-target-role" });
    }

    const roadmap = await findActiveRoleRoadmap({ targetRole, user: req.user, student, schedule });
    return res.status(200).json({
      success: true,
      data: roadmap ? formatRoadmap(roadmap) : null,
      targetRole,
      reason: roadmap ? null : "no-matching-roadmap",
    });
  } catch (error) {
    console.error("getRoadmapsForYou error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch your roadmap." });
  }
};

export const listPublishedRoadmaps = async (req, res) => {
  try {
    const { student, schedule, program, batchExpired } = await getViewerContext(req.user);
    if (batchExpired) {
      return res.status(403).json({ success: false, message: "This batch has ended and roadmap access has been revoked." });
    }

    const roadmaps = schedule?.programId
      ? await findProgramRoadmaps({ program, user: req.user, student, schedule })
      : await Roadmap.find({ status: "Active" })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    const eligible = roadmaps.filter((roadmap) =>
      isRoadmapEligibleForViewer({
        roadmap,
        user: req.user,
        student,
        schedule,
        programOwned: Boolean(schedule?.programId),
      })
    ).map(formatRoadmap);

    return res.status(200).json({ success: true, data: eligible });
  } catch (error) {
    console.error("listPublishedRoadmaps error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch published roadmaps." });
  }
};

export const getPublishedRoadmapById = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(404).json({ success: false, message: "Roadmap not found." });
    }

    const roadmap = await Roadmap.findOne({ _id: roadmapId, status: "Active" }).lean();
    if (!roadmap) return res.status(404).json({ success: false, message: "Roadmap not found." });

    const { student, schedule, program, batchExpired } = await getViewerContext(req.user);
    const programRoadmapIds = new Set(
      (program?.roadmapIds || []).map((programRoadmap) => String(getId(programRoadmap)))
    );
    if (
      batchExpired
      || (schedule?.programId && !programRoadmapIds.has(String(roadmap._id)))
      || !isRoadmapEligibleForViewer({
        roadmap,
        user: req.user,
        student,
        schedule,
        programOwned: Boolean(schedule?.programId),
      })
    ) {
      return res.status(404).json({ success: false, message: "Roadmap not found." });
    }

    return res.status(200).json({ success: true, data: formatRoadmap(roadmap) });
  } catch (error) {
    console.error("getPublishedRoadmapById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch roadmap." });
  }
};

export const getCurrentUserRoadmap = async (req, res) => {
  try {
    const { student, schedule, program: viewerProgram, batchExpired } = await getViewerContext(req.user);
    if (batchExpired) {
      return res.status(403).json({
        success: false,
        message: "This batch has ended and program access has been revoked.",
      });
    }

    const batch = schedule?.batchId
      ? await Batch.findById(schedule.batchId)
        .select("_id name startDate releaseTime assignedTrackTemplateAt programSelection")
        .lean()
      : null;
    const program = schedule?.programId
      ? await Program.findById(schedule.programId)
        .select("_id name programType roadmapIds")
        .lean()
      : null;

    if (schedule?.programId) {
      const programRoadmap = (await findProgramRoadmaps({
        program: program || viewerProgram,
        user: req.user,
        student,
        schedule,
      }))[0] || null;
      if (programRoadmap) {
        return res.status(200).json({
          success: true,
          data: {
            ...formatRoadmap(programRoadmap),
            scheduleType: schedule.scheduleType || "individual",
            programId: schedule.programId,
          },
        });
      }

      return res.status(200).json({ success: true, data: null });
    }

    // Legacy batch-specific roadmaps still apply to batches that predate the
    // concrete Program relationship.
    if (schedule?.batchId) {
      const roadmap = await Roadmap.findOne({ assignedBatchIds: schedule.batchId, status: "Active" })
        .sort({ updatedAt: -1 })
        .populate("assignedBatchIds", "name")
        .lean();
      if (roadmap) {
        return res.status(200).json({
          success: true,
          data: { ...formatRoadmap(roadmap), scheduleType: "batch", programId: null },
        });
      }
    }

    const targetRole = student?.targetRole?.trim() || req.user?.targetRole?.trim() || "";
    const personalizedRoadmap = await findActiveRoleRoadmap({
      targetRole,
      user: req.user,
      student,
      schedule,
    });
    if (personalizedRoadmap) {
      return res.status(200).json({
        success: true,
        data: {
          ...formatRoadmap(personalizedRoadmap),
          scheduleType: schedule?.scheduleType || "individual",
          programId: schedule?.programId || null,
        },
      });
    }

    const programRoadmaps = (program?.roadmapIds || [])
      .filter((roadmap) => roadmap && (roadmap.status || "Active") === "Active")
      .filter((roadmap) => isRoadmapEligibleForViewer({ roadmap, user: req.user, student, schedule }))
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    if (programRoadmaps[0]) {
      return res.status(200).json({
        success: true,
        data: {
          ...formatRoadmap(programRoadmaps[0]),
          scheduleType: schedule?.scheduleType || "individual",
          programId: schedule?.programId || null,
        },
      });
    }

    // Legacy fallback for programs created before roadmapIds were attached.
    const programSelection = program?.programType
      || student?.programSelection
      || batch?.programSelection
      || req.user?.programSelection
      || "Placement Sprint";
    const searchTitles = programSelection === "Placement Sprint"
      ? ["Placement Sprint"]
      : programSelection === "Full Stack Project Program"
        ? ["Full Stack Project Program", "Project Sprint"]
        : programSelection === "Both"
          ? ["Placement Sprint", "Project Sprint", "Full Stack Project Program"]
          : [programSelection];

    for (const title of searchTitles) {
      const defaultRoadmap = await Roadmap.findOne({
        title: { $regex: new RegExp(`^${escapeRegex(title)}$`, "i") },
        status: "Active",
      }).sort({ updatedAt: -1 }).lean();
      if (defaultRoadmap && isRoadmapEligibleForViewer({ roadmap: defaultRoadmap, user: req.user, student, schedule })) {
        return res.status(200).json({
          success: true,
          data: {
            ...formatRoadmap(defaultRoadmap),
            scheduleType: schedule?.scheduleType || "individual",
            programId: schedule?.programId || null,
          },
        });
      }
    }

    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    console.error("getCurrentUserRoadmap error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assigned roadmap." });
  }
};
