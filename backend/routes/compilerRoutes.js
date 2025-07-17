import express from "express";
import { compileCode } from "../controllers/codeCompilerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/compile", protect, compileCode); // Secure the route

export default router;
