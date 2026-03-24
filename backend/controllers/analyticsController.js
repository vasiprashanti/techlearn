import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import Submission from "../models/Submission.js";

// ---------------------------------------------------------------------------
// Shared helper: resolve & validate the collegeId query param, then return
// all batchIds belonging to that college.  Returns null on validation failure
// (response already sent) or an object { collegeObjId, batchIds } on success.
// If the college has no batches at all, batchIds will be an empty array —
// callers must handle the empty-array case gracefully.
// ---------------------------------------------------------------------------
async function resolveCollegeBatchIds(req, res) {
  const { collegeId } = req.query;

  if (!collegeId) {
    res.status(400).json({
      success: false,
      message: "collegeId query parameter is required.",
    });
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(collegeId)) {
    res.status(400).json({
      success: false,
      message: "Invalid collegeId format. Must be a valid ObjectId.",
    });
    return null;
  }

  const collegeObjId = new mongoose.Types.ObjectId(collegeId);

  const batches = await Batch.find({ collegeId: collegeObjId }, { _id: 1 }).lean();
  const batchIds = batches.map((b) => b._id);

  return { collegeObjId, batchIds };
}

// ---------------------------------------------------------------------------
// @desc    Average totalScore per working day for the admin's college
// @route   GET /api/admin/analytics/score-trend
// @access  Private/Admin
//
// Response: [{ workingDay: 1, avgScore: 7.4 }, ...]
// ---------------------------------------------------------------------------
export const getScoreTrend = async (req, res) => {
  try {
    const resolved = await resolveCollegeBatchIds(req, res);
    if (!resolved) return;

    const { batchIds } = resolved;

    if (batchIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const pipeline = [
      // College isolation: only submissions from this college's batches
      { $match: { batchId: { $in: batchIds }, totalScore: { $exists: true, $ne: null } } },

      // Group by workingDay, compute average
      {
        $group: {
          _id: "$workingDay",
          avgScore: { $avg: "$totalScore" },
        },
      },

      // Shape and sort output
      {
        $project: {
          _id: 0,
          workingDay: "$_id",
          avgScore: { $round: ["$avgScore", 2] },
        },
      },
      { $sort: { workingDay: 1 } },
    ];

    const data = await Submission.aggregate(pipeline);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getScoreTrend error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch score trend.",
      error: err.message,
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Completion rate per working day — submitted students vs active total
// @route   GET /api/admin/analytics/completion-rate
// @access  Private/Admin
//
// Response: [{ workingDay: 1, submitted: 45, total: 60, completionRate: 75 }, ...]
//
// "submitted" = distinct students who have at least one submission on that day
// "total"     = count of Active students in the college's batches
// ---------------------------------------------------------------------------
export const getCompletionRate = async (req, res) => {
  try {
    const resolved = await resolveCollegeBatchIds(req, res);
    if (!resolved) return;

    const { batchIds } = resolved;

    if (batchIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Total active students for this college — denominator for every day
    const totalActive = await Student.countDocuments({
      batchId: { $in: batchIds },
      status: "Active",
    });

    if (totalActive === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Distinct submitting students per working day
    const pipeline = [
      { $match: { batchId: { $in: batchIds } } },

      // De-duplicate: one record per (student, day) pair
      {
        $group: {
          _id: { workingDay: "$workingDay", studentId: "$studentId" },
        },
      },

      // Count distinct students per day
      {
        $group: {
          _id: "$_id.workingDay",
          submitted: { $sum: 1 },
        },
      },

      // Attach total and compute rate
      {
        $project: {
          _id: 0,
          workingDay: "$_id",
          submitted: 1,
          total: { $literal: totalActive },
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ["$submitted", totalActive] }, 100] },
              2,
            ],
          },
        },
      },
      { $sort: { workingDay: 1 } },
    ];

    const data = await Submission.aggregate(pipeline);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getCompletionRate error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch completion rate.",
      error: err.message,
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Performance comparison across Core / DSA / SQL tracks
// @route   GET /api/admin/analytics/track-comparison
// @access  Private/Admin
//
// Response: [{ trackName: "DSA", avgScore: 6.8, completionRate: 70, avgExecutionTime: 340 }, ...]
//
// completionRate = (distinct submitting students / total active students) × 100
// avgExecutionTime is in ms, null-guarded
// ---------------------------------------------------------------------------
export const getTrackComparison = async (req, res) => {
  try {
    const resolved = await resolveCollegeBatchIds(req, res);
    if (!resolved) return;

    const { batchIds } = resolved;

    if (batchIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const totalActive = await Student.countDocuments({
      batchId: { $in: batchIds },
      status: "Active",
    });

    // Guard: avoid division by zero in completionRate projection
    const totalActiveForCalc = totalActive > 0 ? totalActive : 1;

    const pipeline = [
      { $match: { batchId: { $in: batchIds } } },

      // Join track to get trackType (Core / DSA / SQL)
      {
        $lookup: {
          from: "tracks",
          localField: "trackId",
          foreignField: "_id",
          as: "track",
        },
      },
      { $unwind: { path: "$track", preserveNullAndEmptyArrays: false } },

      // Group per (trackType, student) to count unique submitters,
      // and simultaneously accumulate score/executionTime per track
      {
        $group: {
          _id: {
            trackType: "$track.trackType",
            studentId: "$studentId",
          },
          // Keep score & executionTime at this granularity so we can re-group below
          scoreSum: { $sum: { $ifNull: ["$totalScore", 0] } },
          scoreCount: {
            $sum: { $cond: [{ $gt: [{ $ifNull: ["$totalScore", null] }, null] }, 1, 0] },
          },
          execTimeSum: { $sum: { $ifNull: ["$executionTime", 0] } },
          execTimeCount: {
            $sum: { $cond: [{ $gt: [{ $ifNull: ["$executionTime", null] }, null] }, 1, 0] },
          },
        },
      },

      // Roll up to track level
      {
        $group: {
          _id: "$_id.trackType",
          uniqueStudents: { $sum: 1 },
          totalScoreSum: { $sum: "$scoreSum" },
          totalScoreCount: { $sum: "$scoreCount" },
          totalExecSum: { $sum: "$execTimeSum" },
          totalExecCount: { $sum: "$execTimeCount" },
        },
      },

      {
        $project: {
          _id: 0,
          trackName: "$_id",
          avgScore: {
            $cond: [
              { $gt: ["$totalScoreCount", 0] },
              { $round: [{ $divide: ["$totalScoreSum", "$totalScoreCount"] }, 2] },
              null,
            ],
          },
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ["$uniqueStudents", totalActiveForCalc] }, 100] },
              2,
            ],
          },
          avgExecutionTime: {
            $cond: [
              { $gt: ["$totalExecCount", 0] },
              { $round: [{ $divide: ["$totalExecSum", "$totalExecCount"] }, 2] },
              null,
            ],
          },
        },
      },
      { $sort: { trackName: 1 } },
    ];

    const data = await Submission.aggregate(pipeline);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getTrackComparison error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch track comparison.",
      error: err.message,
    });
  }
};

// ---------------------------------------------------------------------------
// @desc    Total submission count per working day for the admin's college
// @route   GET /api/admin/analytics/submission-volume
// @access  Private/Admin
//
// Response: [{ workingDay: 1, totalSubmissions: 52 }, ...]
// ---------------------------------------------------------------------------
export const getSubmissionVolume = async (req, res) => {
  try {
    const resolved = await resolveCollegeBatchIds(req, res);
    if (!resolved) return;

    const { batchIds } = resolved;

    if (batchIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const pipeline = [
      { $match: { batchId: { $in: batchIds } } },

      {
        $group: {
          _id: "$workingDay",
          totalSubmissions: { $sum: 1 },
        },
      },

      {
        $project: {
          _id: 0,
          workingDay: "$_id",
          totalSubmissions: 1,
        },
      },
      { $sort: { workingDay: 1 } },
    ];

    const data = await Submission.aggregate(pipeline);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("getSubmissionVolume error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch submission volume.",
      error: err.message,
    });
  }
};
