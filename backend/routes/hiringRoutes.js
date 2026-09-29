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
  parseJobText,
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
  protect,
  isAdmin,
  upload.single("file"),
  parseJobMarkdown
);

router.post(
  "/admin/jobs/parse-text",
  protect,
  isAdmin,
  parseJobText
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
 * - search
 * - category (jobs | internships | freelance)
 * - jobType
 * - location
 * - experience
 * - workMode
 * - sort (newest | oldest | deadline)
 * - pagination
 */
router.get("/jobs", listActiveJobs);

/*
 * Get unique filter values.
 */
router.get("/jobs/filters", getJobFilters);

/*
 * Get application deadline calendar.
 */
router.get(
  "/jobs/calendar",
  getHiringCalendar
);

/*
 * Recommended jobs for student.
 * Requires user authentication.
 */
router.get(
  "/jobs/recommended",
  protect,
  listRecommendedJobs
);

/*
 * Get role categories with job counts.
 */
router.get(
  "/jobs/categories",
  getJobCategories
);

/*
 * Get job details.
 */
router.get(
  "/jobs/:jobId",
  getActiveJobById
);

/*
 * Get application URL.
 */
router.get(
  "/jobs/:jobId/apply",
  protect,
  getJobApplicationUrl
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

export default router;