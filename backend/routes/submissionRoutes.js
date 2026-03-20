import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import { listSubmissions, getSubmissionById, filterSubmissions } from "../controllers/submissionController.js";


const submissionRouter = express.Router();

// GET /api/admin/submission/list
// Filtered, paginated list of submissions
submissionRouter.get("/list", protect, isAdmin, listSubmissions);

// GET /api/admin/submission/filter
// College-isolated, filtered, paginated submissions
submissionRouter.get("/filter", protect, isAdmin, filterSubmissions);

// GET /api/admin/submission/:submissionId
// Full detail for a single submission
submissionRouter.get("/:submissionId", protect, isAdmin, getSubmissionById);


export default submissionRouter;
