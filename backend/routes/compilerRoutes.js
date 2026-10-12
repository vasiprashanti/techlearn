import express from "express";
import { compileCode } from "../controllers/codeCompilerController.js";
import { authRateLimit } from "../middleware/authRateLimit.js";

const router = express.Router();

// Public route, but limited per client so the shared compiler quota cannot be drained.
router.post("/compile", authRateLimit({ name: "compile", windowMs: 60 * 1000, perIp: 40, perEmail: 40, message: "You are running code too quickly. Please wait a moment." }), compileCode);

export default router;
