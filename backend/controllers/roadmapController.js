import mongoose from "mongoose";
import Roadmap from "../models/Roadmap.js";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import StudentTrackAssignment from "../models/StudentTrackAssignment.js";
import { writeAuditLog } from "../utils/auditLogger.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const combineDateAndTime = (dateValue, timeValue = "00:00") => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();

  const [hours = "0", minutes = "0"] = String(timeValue || "00:00").split(":");
  date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return date;
};

const getCurrentDayFromAssignment = (assignment, batch) => {
  const assignmentDate = assignment?.assignedAt || assignment?.activatedAt || batch?.assignedTrackTemplateAt || batch?.startDate || new Date();
  const releaseStart = combineDateAndTime(assignmentDate, batch?.releaseTime || "00:00");
  const elapsedDays = Math.floor((Date.now() - releaseStart.getTime()) / DAY_MS);
  return Math.max(1, elapsedDays + 1);
};

const getTaskLabel = (task) => {
  const question = task?.questionId;
  if (!question || typeof question !== "object") return task?.taskType || "Assigned task";
  return question.prompt || question.question || question.title || question.tag || question.topic || task?.taskType || "Assigned task";
};

const buildActiveTrackRoadmap = (assignment, batch) => {
  const track = assignment?.trackTemplateId;
  if (!track || typeof track !== "object") return null;

  const currentDay = getCurrentDayFromAssignment(assignment, batch);
  const totalDays = Number(track.totalDays || track.dayAssignments?.length || 1);
  const dayMap = new Map((track.dayAssignments || []).map((day) => [Number(day.dayNumber), day]));

  const sections = Array.from({ length: totalDays }).map((_, index) => {
    const dayNumber = index + 1;
    const day = dayMap.get(dayNumber);
    const tasks = day?.tasks?.length
      ? day.tasks
      : day?.questionId
        ? [{ taskType: track.trackType || "Daily Challenge", questionId: day.questionId }]
        : [];
    const state = dayNumber < currentDay ? "Completed / revision available" : dayNumber === currentDay ? "Current day" : "Locked";
    const taskLines = tasks.length
      ? tasks.map((task, taskIndex) => `- ${taskIndex + 1}. ${getTaskLabel(task)}${task?.xpValue ? ` (${task.xpValue} XP)` : ""}`).join("\n")
      : "- Tasks will appear once this day is configured.";

    return `## Day ${dayNumber}\n\n**Status:** ${state}\n\n${taskLines}`;
  });

  return {
    title: track.name || "Current Active Track",
    description: `${track.trackType || "Track"} progress for ${batch?.name || "your batch"}. Day ${Math.min(currentDay, totalDays)} of ${totalDays}.`,
    markdownBody: sections.join("\n\n"),
    activeTrack: {
      id: track._id,
      name: track.name,
      trackType: track.trackType,
      category: track.category,
      currentDay: Math.min(currentDay, totalDays),
      totalDays,
      assignedAt: assignment.assignedAt,
      batchId: batch?._id || assignment.batchId,
      batchName: batch?.name || "",
    },
  };
};

const normalizeBatchIds = (value) => {
  const rawIds = Array.isArray(value) ? value : [];
  return [...new Set(rawIds.map((id) => String(id || "").trim()).filter(Boolean))];
};

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

const formatRoadmap = (roadmap) => ({
  id: roadmap._id,
  title: roadmap.title,
  description: roadmap.description || "",
  markdownBody: roadmap.markdownBody || "",
  assignedBatchIds: (roadmap.assignedBatchIds || []).map((batch) => batch?._id || batch),
  assignedBatches: (roadmap.assignedBatchIds || [])
    .filter((batch) => batch && typeof batch === "object")
    .map((batch) => ({
      id: batch._id,
      name: batch.name,
    })),
  status: roadmap.status || "Active",
  attachedNoteTitle: roadmap.attachedNoteTitle || "",
  attachedNoteDay: roadmap.attachedNoteDay || null,
  updatedAt: roadmap.updatedAt,
  createdAt: roadmap.createdAt,
});

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

export const createRoadmapAdmin = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const markdownBody = String(req.body.markdownBody || "").trim();
    const assignedBatchIds = normalizeBatchIds(req.body.assignedBatchIds);

    if (!title || !markdownBody) {
      return res.status(400).json({ success: false, message: "Roadmap title and markdown body are required." });
    }

    await assertValidBatchIds(assignedBatchIds);

    const roadmap = await Roadmap.create({
      title,
      description: String(req.body.description || "").trim(),
      markdownBody,
      assignedBatchIds,
      status: req.body.status || "Active",
      attachedNoteTitle: String(req.body.attachedNoteTitle || "").trim(),
      attachedNoteDay: req.body.attachedNoteDay ? Number(req.body.attachedNoteDay) : null,
      createdBy: req.user?._id || null,
    });

    await writeAuditLog({
      verb: "Created",
      entityType: "Roadmap",
      entityId: roadmap._id,
      action: "Created roadmap",
      detail: roadmap.title,
      actor: req.user,
    });

    const populated = await Roadmap.findById(roadmap._id).populate("assignedBatchIds", "name").lean();
    return res.status(201).json({ success: true, data: formatRoadmap(populated) });
  } catch (error) {
    console.error("createRoadmapAdmin error:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "Failed to create roadmap." });
  }
};

export const updateRoadmapAdmin = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ success: false, message: "Invalid roadmapId." });
    }

    const title = String(req.body.title || "").trim();
    const markdownBody = String(req.body.markdownBody || "").trim();
    const assignedBatchIds = normalizeBatchIds(req.body.assignedBatchIds);

    if (!title || !markdownBody) {
      return res.status(400).json({ success: false, message: "Roadmap title and markdown body are required." });
    }

    await assertValidBatchIds(assignedBatchIds);

    const roadmap = await Roadmap.findByIdAndUpdate(
      roadmapId,
      {
        $set: {
          title,
          description: String(req.body.description || "").trim(),
          markdownBody,
          assignedBatchIds,
          status: req.body.status || "Active",
          attachedNoteTitle: String(req.body.attachedNoteTitle || "").trim(),
          attachedNoteDay: req.body.attachedNoteDay ? Number(req.body.attachedNoteDay) : null,
        },
      },
      { new: true, runValidators: true }
    )
      .populate("assignedBatchIds", "name")
      .lean();

    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found." });
    }

    await writeAuditLog({
      verb: "Updated",
      entityType: "Roadmap",
      entityId: roadmap._id,
      action: "Updated roadmap",
      detail: roadmap.title,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: formatRoadmap(roadmap) });
  } catch (error) {
    console.error("updateRoadmapAdmin error:", error);
    return res.status(error.status || 500).json({ success: false, message: error.message || "Failed to update roadmap." });
  }
};

export const deleteRoadmapAdmin = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ success: false, message: "Invalid roadmapId." });
    }

    const roadmap = await Roadmap.findByIdAndDelete(roadmapId);
    if (!roadmap) {
      return res.status(404).json({ success: false, message: "Roadmap not found." });
    }

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



export const getCurrentUserRoadmap = async (req, res) => {
  try {
    let batchId = req.user?.batchId || null;
    let student = null;

    if (req.user?.email) {
      student = await Student.findOne({ email: String(req.user.email).trim().toLowerCase() })
        .select("_id batchId programSelection")
        .lean();
      if (student?.batchId) {
        batchId = student.batchId;
      }
    }

    if (!student && req.user?._id) {
      student = await Student.findOne({ userId: req.user._id })
        .select("_id batchId programSelection")
        .lean();
      if (student?.batchId) {
        batchId = student.batchId;
      }
    }

    let batch = null;
    if (batchId) {
      batch = await Batch.findById(batchId)
        .select("_id name startDate releaseTime assignedTrackTemplateAt programSelection")
        .lean();
    }

    // 1. If the student has an assigned roadmap, show that roadmap.
    if (batchId) {
      const roadmap = await Roadmap.findOne({
        assignedBatchIds: batchId,
        status: "Active",
      })
        .sort({ updatedAt: -1 })
        .populate("assignedBatchIds", "name")
        .lean();

      if (roadmap) {
        return res.status(200).json({ success: true, data: formatRoadmap(roadmap) });
      }
    }

    // 2. If no roadmap is assigned, detect the student’s batch/program.
    let program = "Placement Sprint";
    if (student?.programSelection) {
      program = student.programSelection;
    } else if (batch?.programSelection) {
      program = batch.programSelection;
    } else if (req.user?.programSelection) {
      program = req.user.programSelection;
    }

    // 3. Use the default roadmap for that program, such as Placement Sprint or Project Sprint.
    let searchTitles = [];
    if (program === "Placement Sprint") {
      searchTitles = ["Placement Sprint"];
    } else if (program === "Full Stack Project Program") {
      searchTitles = ["Full Stack Project Program", "Project Sprint"];
    } else if (program === "Both") {
      searchTitles = ["Placement Sprint", "Project Sprint", "Full Stack Project Program"];
    } else {
      searchTitles = [program];
    }

    let defaultRoadmap = null;
    for (const title of searchTitles) {
      defaultRoadmap = await Roadmap.findOne({
        title: { $regex: new RegExp(`^${title}$`, "i") },
        status: "Active",
      })
        .sort({ updatedAt: -1 })
        .lean();
      if (defaultRoadmap) {
        break;
      }
    }

    if (defaultRoadmap) {
      return res.status(200).json({ success: true, data: formatRoadmap(defaultRoadmap) });
    }

    // 4. If no default roadmap exists for that program yet, show a clean empty state.
    return res.status(200).json({ success: true, data: null });
  } catch (error) {
    console.error("getCurrentUserRoadmap error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assigned roadmap." });
  }
};
