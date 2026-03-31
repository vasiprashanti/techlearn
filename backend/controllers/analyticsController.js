import mongoose from "mongoose";
import { Parser } from "json2csv";
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


/**
 * Helper: Builds the ranking aggregation pipeline based on TRD Section 8 rules:
 * 1. Total Correct (DESC)
 * 2. Accuracy % / Score (DESC)
 * 3. Average Submission Time (ASC)
 * 4. Earliest Submission Timestamp (ASC)
 */
export const buildRankingPipeline = (batchId) => {
    return [
        {
            $match: {
                batchId: new mongoose.Types.ObjectId(batchId)
            }
        },
        {
            $group: {
                _id: "$studentId",
                totalCorrect: {
                    $sum: { $cond: [{ $eq: ["$status", "Passed"] }, 1, 0] }
                },
                totalScore: { $sum: "$totalScore" },
                avgExecutionTime: { $avg: "$executionTime" },
                earliestSubmission: { $min: "$submittedAt" }
            }
        },
        {
            $lookup: {
                from: "students",
                localField: "_id",
                foreignField: "_id",
                as: "studentInfo"
            }
        },
        {
            $unwind: "$studentInfo"
        },
        {
            $project: {
                studentId: "$_id",
                name: "$studentInfo.name",
                email: "$studentInfo.email",
                rollNo: "$studentInfo.rollNo",
                streak: "$studentInfo.streak",
                totalCorrect: 1,
                totalScore: 1,
                avgExecutionTime: 1,
                earliestSubmission: 1,
                _id: 0
            }
        },
        {
            $sort: {
                totalCorrect: -1,         // 1. Total Correct (DESC)
                totalScore: -1,           // 2. Accuracy/Score (DESC)
                avgExecutionTime: 1,      // 3. Average Submission Time (ASC)
                earliestSubmission: 1     // 4. Earliest Submission Timestamp (ASC)
            }
        }
    ];
};

/**
 * @desc    Paginated batch leaderboard fetching
 * @route   GET /api/admin/analytics/leaderboard/:batchId
 */
export const getLeaderboard = async (req, res) => {
    try {
        const { batchId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (!batchId) return res.status(400).json({ success: false, message: "Batch ID is required." });

        const skip = (page - 1) * limit;

        const pipeline = buildRankingPipeline(batchId);
        pipeline.push(
            { $skip: skip },
            { $limit: limit }
        );

        const leaderboard = await Submission.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            message: "Leaderboard fetched successfully",
            page,
            limit,
            data: leaderboard
        });

    } catch (error) {
        console.error("Leaderboard Error:", error);
        return res.status(500).json({ success: false, message: "Server error fetching leaderboard.", error: error.message });
    }
};

/**
 * @desc    Day-wise scoring logic mapping for specific student trajectory
 * @route   GET /api/admin/analytics/score/:batchId/:studentId
 */
export const getDayWiseScore = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;

        if (!batchId || !studentId) {
            return res.status(400).json({ success: false, message: "Batch ID and Student ID are required." });
        }

        const scores = await Submission.find(
            { batchId, studentId },
            { workingDay: 1, totalScore: 1, status: 1, _id: 0 }
        ).sort({ workingDay: 1 });

        return res.status(200).json({
            success: true,
            data: scores
        });

    } catch (error) {
        console.error("Day-wise Score Error:", error);
        return res.status(500).json({ success: false, message: "Server error fetching day scores.", error: error.message });
    }
};

/**
 * @desc    Aggregates last 7 days for a student into Passed/Failed/Missed matrix
 * @route   GET /api/admin/analytics/matrix/:batchId/:studentId?currentWorkingDay=X
 */
export const getWeeklyMatrix = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;
        const currentWorkingDay = parseInt(req.query.currentWorkingDay);

        if (!batchId || !studentId || isNaN(currentWorkingDay)) {
            return res.status(400).json({ success: false, message: "Batch ID, Student ID, and currentWorkingDay required." });
        }

        const startDay = Math.max(0, currentWorkingDay - 6);

        const submissions = await Submission.find({
            batchId,
            studentId,
            workingDay: { $gte: startDay, $lte: currentWorkingDay }
        }).select("workingDay status").sort({ workingDay: 1 });

        const matrixMap = {};
        for (let d = startDay; d <= currentWorkingDay; d++) {
            matrixMap[d] = "Missed";
        }

        submissions.forEach(sub => {
            matrixMap[sub.workingDay] = sub.status;
        });

        return res.status(200).json({
            success: true,
            startDay,
            currentWorkingDay,
            matrix: matrixMap
        });

    } catch (error) {
        console.error("Weekly Matrix Error:", error);
        return res.status(500).json({ success: false, message: "Server error fetching matrix.", error: error.message });
    }
};

/**
 * @desc    Pipes all fully evaluated leaderboard rankings immediately to CSV format
 * @route   GET /api/admin/analytics/export/:batchId
 */
export const exportBatchReportCSV = async (req, res) => {
    try {
        const { batchId } = req.params;

        if (!batchId) return res.status(400).json({ success: false, message: "Batch ID is required." });

        const pipeline = buildRankingPipeline(batchId);

        const fullLeaderboard = await Submission.aggregate(pipeline);

        if (!fullLeaderboard.length) {
            return res.status(404).json({ success: false, message: "No data available for this batch." });
        }

        const csvFields = ["name", "email", "rollNo", "streak", "totalCorrect", "totalScore", "avgExecutionTime", "earliestSubmission"];

        const json2csvParser = new Parser({ fields: csvFields });
        const csvData = json2csvParser.parse(fullLeaderboard);

        res.header('Content-Type', 'text/csv');
        res.attachment(`trace_batch_${batchId}_report.csv`);
        return res.send(csvData);

    } catch (error) {
        console.error("CSV Export Error:", error);
        return res.status(500).json({ success: false, message: "Server error during CSV export.", error: error.message });
    }
};
