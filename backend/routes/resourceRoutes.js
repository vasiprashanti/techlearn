import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { listUserResources, recordUserResourceView } from "../controllers/resourceController.js";

const router = express.Router();

router.use(protect);
router.get("/", listUserResources);
router.post("/:resourceId/view", recordUserResourceView);

export default router;
