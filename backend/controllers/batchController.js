import mongoose from "mongoose";
import Batch, { BATCH_STATUS } from "../models/Batch.js";
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

// @desc    Activate a Batch and lock its Tracks
// @route   PUT /api/admin/batch/:batchId/activate
// @access  Private/Admin
export const activateBatch = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { batchId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return res.status(400).json({ success: false, message: "Invalid batch ID format." });
        }

        // Find the Batch
        const batch = await Batch.findById(batchId).session(session);
        if (!batch) {
            return res.status(404).json({ success: false, message: "Batch not found." });
        }

        // Check if the status allows activation (must be Draft)
        if (batch.status !== BATCH_STATUS.DRAFT) {
            return res.status(400).json({
                success: false,
                message: `Batch cannot be activated. Current status is ${batch.status}.`
            });
        }

        // Update Batch Status to ACTIVE
        batch.status = BATCH_STATUS.ACTIVE;
        await batch.save({ session });

        // Find all tracks belonging to this batch and lock them
        await Track.updateMany(
            { batchId: batch._id },
            { $set: { isLockedAfterActivation: true } },
            { session }
        );

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Batch activated and tracks locked successfully.",
            data: batch
        });

    } catch (error) {
        // Abort transaction on any failure
        await session.abortTransaction();
        session.endSession();
        console.error("Error in activateBatch:", error);
        res.status(500).json({
            success: false,
            message: "Failed to activate Batch. Server error.",
        });
    }
};

