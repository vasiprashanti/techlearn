import mongoose from "mongoose";
import Batch from "../models/Batch.js";
import Track from "../models/Track.js";
import College from "../models/College.js";

// @desc    Create a new Batch and automatically initialize Core, DSA, and SQL tracks
// @route   POST /api/admin/batches
// @access  Private/Admin
export const createBatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { collegeId, name, startDate, expiryDate, releaseTime } = req.body;

        // Validations
        if (!collegeId || !name || !startDate || !expiryDate || !releaseTime) {
            return res.status(400).json({ success: false, message: "Please provide all required fields." });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(collegeId)) {
            return res.status(400).json({ success: false, message: "Invalid college ID format." });
        }

        // Verify college exists
        const collegeExists = await College.findById(collegeId);
        if (!collegeExists) {
            return res.status(404).json({ success: false, message: "College not found." });
        }

        // 1. Create the Batch
        const newBatch = new Batch({
            collegeId,
            name,
            startDate,
            expiryDate,
            releaseTime,
            // status defaults to 'Draft' as per schema
        });

        const savedBatch = await newBatch.save({ session });

        // 2. Auto-generate the 3 Tracks (Core, DSA, SQL)
        const defaultTracks = [
            {
                batchId: savedBatch._id,
                trackType: "Core",
                durationDays: 0,
                orderedQuestionIds: []
            },
            {
                batchId: savedBatch._id,
                trackType: "DSA",
                durationDays: 0,
                orderedQuestionIds: []
            },
            {
                batchId: savedBatch._id,
                trackType: "SQL",
                durationDays: 0,
                orderedQuestionIds: []
            }
        ];

        const savedTracks = await Track.insertMany(defaultTracks, { session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Batch created successfully along with core tracks.",
            data: {
                batch: savedBatch,
                tracks: savedTracks
            }
        });

    } catch (error) {
        // Abort transaction on any failure
        await session.abortTransaction();
        session.endSession();
        console.error("Error in createBatch:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create Batch & Tracks. Server error.",
        });
    }
};
