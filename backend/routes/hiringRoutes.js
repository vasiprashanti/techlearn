import express from "express";
import {
  listActiveJobs,
  getActiveJobById,
} from "../controllers/hiringController.js";

const router = express.Router();

// User-side Hiring APIs
router.get("/jobs", listActiveJobs);
router.get("/jobs/:jobId", getActiveJobById);

export default router;