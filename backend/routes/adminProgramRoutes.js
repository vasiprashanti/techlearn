import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "../utils/rbac.js";
import {
  listPrograms,
  createProgram,
  getProgramById,
  updateProgram,
  deleteProgram,
  getAvailableEntities,
  attachEntities,
  detachEntity,
} from "../controllers/admin/adminProgramController.js";
import {
  listBlueprints,
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
} from "../controllers/admin/adminBlueprintController.js";
import {
  getProgramPerformance,
  syncProgramPerformanceReport,
} from "../controllers/admin/adminProgramPerformanceController.js";
import { listProgramReadinessLeads } from "../controllers/admin/adminProgramLearningController.js";

const router = express.Router();

// Apply auth middleware to all program endpoints
router.use(protect, isAdmin, requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_READ));

// Program CRUD routes
router.get("/", listPrograms);
router.post("/", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), createProgram);
router.get("/:programId/blueprints", listBlueprints);
router.post("/:programId/blueprints", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), createBlueprint);
router.patch("/:programId/blueprints/:blueprintId", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), updateBlueprint);
router.delete("/:programId/blueprints/:blueprintId", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), deleteBlueprint);
router.get("/:programId/performance", getProgramPerformance);
router.post("/:programId/performance/sync", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), syncProgramPerformanceReport);
router.get("/:programId/readiness-leads", listProgramReadinessLeads);
router.get("/:programId", getProgramById);
router.patch("/:programId", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), updateProgram);
router.delete("/:programId", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), deleteProgram);

// Attachment routes
router.get("/:programId/available/:entityType", getAvailableEntities);
router.post("/:programId/attachments/:entityType", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), attachEntities);
router.delete("/:programId/attachments/:entityType/:entityId", requireAdminPermission(ADMIN_PERMISSIONS.PROGRAMS_WRITE), detachEntity);

export default router;
