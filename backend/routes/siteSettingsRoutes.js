import express from "express";
import { getHomepagePricing, saveHomepagePricing } from "../controllers/siteSettingsController.js";
import { isAdmin, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/homepage-pricing", getHomepagePricing);
router.put("/homepage-pricing", protect, isAdmin, saveHomepagePricing);

export default router;
