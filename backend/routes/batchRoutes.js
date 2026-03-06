import express from "express";
import { createBatch } from "../controllers/batchController.js";
// import { protect, isAdmin } from "../middleware/authMiddleware.js"; // For future logic, currently just scaffolding the endpoint

const router = express.Router();

// Route:   POST /api/admin/batch/create
// Desc:    Create a new batch & auto-generate Core, DSA, SQL tracks
// TODO: Hook up `protect` and `isAdmin` middleware properly when fully testing
router.post("/create", createBatch);

export default router;
