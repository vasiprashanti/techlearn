import express from "express";
import { addXP } from "../controllers/xpController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addXP);

export default router;
