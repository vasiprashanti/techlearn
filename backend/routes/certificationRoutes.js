import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { generateCertificateController } from "../controllers/certificationController.js";

const router = express.Router();
router.post("/generate", protect, generateCertificateController);
export default router;
