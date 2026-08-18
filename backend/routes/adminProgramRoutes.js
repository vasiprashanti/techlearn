import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
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

const router = express.Router();

// Apply auth middleware to all program endpoints
router.use(protect, isAdmin);

// Program CRUD routes
router.get("/", listPrograms);
router.post("/", createProgram);
router.get("/:programId/blueprints", listBlueprints);
router.post("/:programId/blueprints", createBlueprint);
router.patch("/:programId/blueprints/:blueprintId", updateBlueprint);
router.delete("/:programId/blueprints/:blueprintId", deleteBlueprint);
router.get("/:programId/performance", getProgramPerformance);
router.post("/:programId/performance/sync", syncProgramPerformanceReport);
router.get("/:programId", getProgramById);
router.patch("/:programId", updateProgram);
router.delete("/:programId", deleteProgram);

// Attachment routes
router.get("/:programId/available/:entityType", getAvailableEntities);
router.post("/:programId/attachments/:entityType", attachEntities);
router.delete("/:programId/attachments/:entityType/:entityId", detachEntity);

export default router;
