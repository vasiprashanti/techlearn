import express from "express";
import { createBatch, activateBatch } from "../controllers/batchController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route:   POST /api/admin/batch/create
// Desc:    Create a new batch & auto-generate Core, DSA, SQL tracks
router.post("/create", protect, isAdmin, createBatch);

// Route:   PUT /api/admin/batch/:batchId/activate
// Desc:    Activate a Batch and lock its Tracks
router.put("/:batchId/activate", protect, isAdmin, activateBatch);

export default router;
