import mongoose from "mongoose";
import Submission from "../models/Submission.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Track from "../models/Track.js";

// ---------------------------------------------------------------------------
// @desc    List submissions with optional filters
// @route   GET /api/admin/submission/list
// @access  Private/Admin
//
// Query params (all optional):
//   batchId    - filter by batch
//   trackId    - filter by track
//   studentId  - filter by a specific student
//   workingDay - filter by day number (integer)
//   status     - filter by status: Passed | Failed | Timeout | Error
//   page       - page number, default 1
//   limit      - results per page, default 20, max 100
// ---------------------------------------------------------------------------
export const listSubmissions = async (req, res) => {
    try {
        const {
            batchId,
            trackId,
            studentId,
            workingDay,
            status,
            page = 1,
            limit = 20,
        } = req.query;

        // ---- Build filter ----
        const filter = {};

        if (batchId) {
            if (!mongoose.Types.ObjectId.isValid(batchId)) {
                return res.status(400).json({ success: false, message: "Invalid batchId format." });
            }
            filter.batchId = new mongoose.Types.ObjectId(batchId);
        }

        if (trackId) {
            if (!mongoose.Types.ObjectId.isValid(trackId)) {
                return res.status(400).json({ success: false, message: "Invalid trackId format." });
            }
            filter.trackId = new mongoose.Types.ObjectId(trackId);
        }

        if (studentId) {
            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({ success: false, message: "Invalid studentId format." });
            }
            filter.studentId = new mongoose.Types.ObjectId(studentId);
        }

        if (workingDay !== undefined) {
            const day = parseInt(workingDay, 10);
            if (isNaN(day) || day < 1) {
                return res.status(400).json({ success: false, message: "workingDay must be a positive integer." });
            }
            filter.workingDay = day;
        }

        const VALID_STATUSES = ["Passed", "Failed", "Timeout", "Error"];
        if (status) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}.`,
                });
            }
            filter.status = status;
        }

        // ---- Pagination ----
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // ---- Query — run count and data fetch in parallel ----
        const [total, submissions] = await Promise.all([
            Submission.countDocuments(filter),
            Submission.find(filter)
                .sort({ submittedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("studentId", "name email rollNo")
                .populate("batchId", "name status")
                .populate("trackId", "trackType")
                .populate("questionId", "title")
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                submissions,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        console.error("listSubmissions error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch submissions.", error: error.message });
    }
};

// ---------------------------------------------------------------------------
// @desc    Get a single submission by its ID
// @route   GET /api/admin/submission/:submissionId
// @access  Private/Admin
// ---------------------------------------------------------------------------
export const getSubmissionById = async (req, res) => {
    try {
        const { submissionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({ success: false, message: "Invalid submissionId format." });
        }

        const submission = await Submission.findById(submissionId)
            .populate("studentId", "name email rollNo status streak")
            .populate("batchId", "name status startDate expiryDate")
            .populate("trackId", "trackType durationDays")
            .populate("questionId", "title")
            .lean();

        if (!submission) {
            return res.status(404).json({ success: false, message: "Submission not found." });
        }

        return res.status(200).json({ success: true, data: submission });
    } catch (error) {
        console.error("getSubmissionById error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch submission.", error: error.message });
    }
};
