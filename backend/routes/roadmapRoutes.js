import express from "express";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import {
  getPublishedRoadmapById,
  getRoadmapsForYou,
  listPublishedRoadmaps,
} from "../controllers/roadmapController.js";

const router = express.Router();

router.get("/for-you", protect, getRoadmapsForYou);
router.get("/published", optionalProtect, listPublishedRoadmaps);
router.get("/:roadmapId", optionalProtect, getPublishedRoadmapById);

export default router;
