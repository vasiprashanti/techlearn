import express from "express";

import {
  listActiveJobs,
  getActiveJobById,
  listRecommendedJobs,
  getJobFilters,
  getHiringCalendar,
  getJobApplicationUrl,
} from "../controllers/hiringController.js";

import { protect } from "../middleware/authMiddleware.js";

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

/*
 * ============================================================
 * ADMIN HIRING JOB APIs
 * ============================================================
 */

router.post(
  "/admin/jobs",
  createJob
);

router.get(
  "/admin/jobs",
  listJobs
);

router.get(
  "/admin/jobs/:jobId",
  getJobById
);

router.put(
  "/admin/jobs/:jobId",
  updateJob
);

router.patch(
  "/admin/jobs/:jobId/status",
  updateJobStatus
);

router.delete(
  "/admin/jobs/:jobId",
  deleteJob
);

/*
 * ============================================================
 * USER-SIDE HIRING APIs
 * ============================================================
 */

/*
 * Get all Published jobs.
 *
 * Supports:
 * search
 * category
 * jobType
 * location
 * experience
 * workMode
 * sort
 * page
 * limit
 */
router.get(
  "/jobs",
  listActiveJobs
);

/*
 * Get personalized jobs.
 *
 * Requires logged-in user.
 */
router.get(
  "/jobs/for-you",
  protect,
  listRecommendedJobs
);

/*
 * Get available filter options.
 */
router.get(
  "/jobs/filters",
  getJobFilters
);

/*
 * Get job deadlines for Calendar.
 */
router.get(
  "/jobs/calendar",
  getHiringCalendar
);

/*
 * Get application URL.
 */
router.get(
  "/jobs/:jobId/apply",
  getJobApplicationUrl
);

/*
 * Get complete job details.
 *
 * Keep this AFTER the specific routes above.
 */
router.get(
  "/jobs/:jobId",
  getActiveJobById
);

/*
 * ============================================================
 * ADMIN HIRING ROLE APIs
 * ============================================================
 */

router.post(
  "/admin/roles",
  createRole
);

router.get(
  "/admin/roles",
  listRoles
);

router.get(
  "/admin/roles/:roleId",
  getRoleById
);

router.put(
  "/admin/roles/:roleId",
  updateRole
);

router.delete(
  "/admin/roles/:roleId",
  deleteRole
);

/*
 * ============================================================
 * ADMIN JOB LOGO UPLOAD
 * ============================================================
 */

router.post(
  "/admin/jobs/logo",
  upload.single("logo"),
  uploadJobLogoFile
);

export default router;