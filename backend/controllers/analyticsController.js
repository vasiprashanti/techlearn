import mongoose from "mongoose";
import { Parser } from "json2csv";

// IMPORTANT: Assumes a "Submission" model that matches TRD Section 5 schema requirements
import Submission from "../models/Submission.js"; 
import Student from "../models/Student.js";

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
                from: "students", // MongoDB lowercase pluralized collection name
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
 * 2. Leaderboard API
 * Paginated isolated batch ranking. target < 200ms query performance.
 */
export const getLeaderboard = async (req, res) => {
    try {
        const { batchId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        if (!batchId) return res.status(400).json({ message: "Batch ID is required." });

        const skip = (page - 1) * limit;

        const pipeline = buildRankingPipeline(batchId);
        
        // Add pagination
        pipeline.push(
            { $skip: skip },
            { $limit: limit }
        );

        const leaderboard = await Submission.aggregate(pipeline);

        return res.status(200).json({
            message: "Leaderboard fetched successfully",
            page,
            limit,
            data: leaderboard
        });

    } catch (error) {
        console.error("Leaderboard Error:", error);
        return res.status(500).json({ message: "Server error fetching leaderboard.", error: error.message });
    }
};

/**
 * 3. Day-wise Score API
 * Fetches the specific student's score trend sequence line across working days.
 */
export const getDayWiseScore = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;

        if (!batchId || !studentId) {
            return res.status(400).json({ message: "Batch ID and Student ID are required." });
        }

        const scores = await Submission.find(
            { batchId, studentId },
            { workingDay: 1, totalScore: 1, status: 1, _id: 0 }
        ).sort({ workingDay: 1 });

        return res.status(200).json({
            message: "Day-wise score fetched",
            data: scores
        });

    } catch (error) {
        console.error("Day-wise Score Error:", error);
        return res.status(500).json({ message: "Server error fetching day scores.", error: error.message });
    }
};

/**
 * 4. Weekly Matrix API
 * Aggregates the last 7 working days to show student Passed/Failed/Missed states.
 */
export const getWeeklyMatrix = async (req, res) => {
    try {
        const { batchId, studentId } = req.params;
        const currentWorkingDay = parseInt(req.query.currentWorkingDay);

        if (!batchId || !studentId || isNaN(currentWorkingDay)) {
            return res.status(400).json({ message: "Batch ID, Student ID, and Current Working Day are required." });
        }

        const startDay = Math.max(0, currentWorkingDay - 6); // Last 7 days

        const submissions = await Submission.find({
            batchId,
            studentId,
            workingDay: { $gte: startDay, $lte: currentWorkingDay }
        }).select("workingDay status").sort({ workingDay: 1 });

        // Map statuses to day map explicitly, treating missing days as 'Missed'
        const matrixMap = {};
        for(let d = startDay; d <= currentWorkingDay; d++) {
            matrixMap[d] = "Missed";
        }

        submissions.forEach(sub => {
            matrixMap[sub.workingDay] = sub.status;
        });

        return res.status(200).json({
            message: "Weekly matrix fetched",
            startDay,
            currentWorkingDay,
            matrix: matrixMap
        });

    } catch (error) {
         console.error("Weekly Matrix Error:", error);
         return res.status(500).json({ message: "Server error fetching matrix.", error: error.message });
    }
};

/**
 * 5. CSV Export API
 * Exports the full batch leaderboard as CSV.
 */
export const exportBatchReportCSV = async (req, res) => {
    try {
        const { batchId } = req.params;
        
        if (!batchId) return res.status(400).json({ message: "Batch ID is required." });

        const pipeline = buildRankingPipeline(batchId);
        // Do NOT paginate to get the full report
        
        const fullLeaderboard = await Submission.aggregate(pipeline);

        if (!fullLeaderboard.length) {
            return res.status(404).json({ message: "No data available for this batch." });
        }

        // Map fields explicitly if needed
        const csvFields = ["name", "email", "rollNo", "streak", "totalCorrect", "totalScore", "avgExecutionTime", "earliestSubmission"];
        
        const json2csvParser = new Parser({ fields: csvFields });
        const csvData = json2csvParser.parse(fullLeaderboard);

        res.header('Content-Type', 'text/csv');
        res.attachment(`trace_batch_${batchId}_report.csv`);
        return res.send(csvData);

    } catch (error) {
         console.error("CSV Export Error:", error);
         return res.status(500).json({ message: "Server error during CSV export.", error: error.message });
    }
};
