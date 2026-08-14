import express from "express";
import {
  listActiveJobs,
  getActiveJobById,
} from "../controllers/hiringController.js";
import {
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
  createJob,
  listJobs,
  getJobById,
  updateJob,
  deleteJob,
  updateJobStatus,
  parseJobMarkdown,
  uploadJobLogoFile,
} from "../controllers/admin/adminHiringController.js";
import upload from "../config/multerConfig.js";
const router = express.Router();

// Admin Hiring Job APIs
router.post("/admin/jobs", createJob);
router.get("/admin/jobs", listJobs);
router.get("/admin/jobs/:jobId", getJobById);
router.put("/admin/jobs/:jobId", updateJob);
router.patch("/admin/jobs/:jobId/status",updateJobStatus);
router.delete("/admin/jobs/:jobId", deleteJob);

// User-side Hiring APIs
router.get("/jobs", listActiveJobs);
router.get("/jobs/:jobId", getActiveJobById);
// Admin Hiring Role APIs
router.post("/admin/roles", createRole);
router.get("/admin/roles", listRoles);
router.get("/admin/roles/:roleId", getRoleById);
router.put("/admin/roles/:roleId", updateRole);
router.delete("/admin/roles/:roleId", deleteRole);
router.post(
  "/admin/jobs/logo",
  upload.single("logo"),
  uploadJobLogoFile
);
export default router;