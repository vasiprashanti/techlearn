import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import { createJobAdmin, updateJobAdmin, deleteJobAdmin } from "../controllers/jobController.js";

const router = express.Router();
router.use(protect, isAdmin);

router.post("/", createJobAdmin);
router.put("/:jobId", updateJobAdmin);
router.delete("/:jobId", deleteJobAdmin);

export default router;
