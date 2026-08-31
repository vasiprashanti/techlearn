import express from "express";

import {
  listActiveJobs,
  getActiveJobById,
  listRecommendedJobs,
  getJobFilters,
  getHiringCalendar,
  getJobApplicationUrl,
  getJobCategories,
} from "../controllers/hiringController.js";
import {
  protect,
  isAdmin,
} from "../middleware/authMiddleware.js";

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
  protect,
  isAdmin,
  createJob
);

router.post(
  "/admin/jobs/parse-markdown",
  upload.single("file"),
  parseJobMarkdown
);

router.get(
  "/admin/jobs",
  protect,
  isAdmin,
  listJobs
);

router.get(
  "/admin/jobs/:jobId",
  protect,
  isAdmin,
  getJobById
);

router.put(
  "/admin/jobs/:jobId",
  protect,
  isAdmin,
  updateJob
);

router.patch(
  "/admin/jobs/:jobId/status",
  protect,
  isAdmin,
  updateJobStatus
);

router.delete(
  "/admin/jobs/:jobId",
  protect,
  isAdmin,
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

router.get(
  "/jobs/categories",
  getJobCategories
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
  protect,
  isAdmin,
  createRole
);

router.get(
  "/admin/roles",
  protect,
  isAdmin,
  listRoles
);

router.get(
  "/admin/roles/:roleId",
  protect,
  isAdmin,
  getRoleById
);

router.put(
  "/admin/roles/:roleId",
  protect,
  isAdmin,
  updateRole
);

router.delete(
  "/admin/roles/:roleId",
  protect,
  isAdmin,
  deleteRole
);
/*
 * ============================================================
 * ADMIN JOB LOGO UPLOAD
 * ============================================================
 */

router.post(
  "/admin/jobs/logo",
  protect,
  isAdmin,
  upload.single("logo"),
  uploadJobLogoFile
);

router.post(
  "/admin/jobs/parse-markdown",
  protect,
  isAdmin,
  upload.single("file"),
  parseJobMarkdown
);

export default router;