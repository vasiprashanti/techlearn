import express from "express";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import { listUserResources, recordUserResourceView } from "../controllers/resourceController.js";
import {
  getCurrentUserRoadmap,
  getPublishedRoadmapById,
  getRoadmapsForYou,
  listPublishedRoadmaps,
} from "../controllers/roadmapController.js";

const router = express.Router();

router.get("/roadmaps/current", protect, getCurrentUserRoadmap);
router.get("/roadmaps/for-you", protect, getRoadmapsForYou);
router.get("/roadmaps/published", optionalProtect, listPublishedRoadmaps);
router.get("/roadmaps/:roadmapId", optionalProtect, getPublishedRoadmapById);

router.use(protect);
router.get("/", listUserResources);
router.post("/:resourceId/view", recordUserResourceView);

export default router;
