import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { listUserResources, recordUserResourceView } from "../controllers/resourceController.js";
import { getCurrentUserRoadmap } from "../controllers/roadmapController.js";

const router = express.Router();

router.use(protect);
router.get("/roadmaps/current", getCurrentUserRoadmap);
router.get("/", listUserResources);
router.post("/:resourceId/view", recordUserResourceView);

export default router;
