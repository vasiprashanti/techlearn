import mongoose from "mongoose";
import Roadmap from "../models/Roadmap.js";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import { writeAuditLog } from "../utils/auditLogger.js";

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

    if (!batchId && req.user?.email) {
      const student = await Student.findOne({ email: String(req.user.email).trim().toLowerCase() })
        .select("batchId")
        .lean();
      batchId = student?.batchId || null;
    }

    if (!batchId) {
      return res.status(200).json({ success: true, data: null });
    }

    const roadmap = await Roadmap.findOne({
      assignedBatchIds: batchId,
      status: "Active",
    })
      .sort({ updatedAt: -1 })
      .populate("assignedBatchIds", "name")
      .lean();

    return res.status(200).json({ success: true, data: roadmap ? formatRoadmap(roadmap) : null });
  } catch (error) {
    console.error("getCurrentUserRoadmap error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assigned roadmap." });
  }
};
