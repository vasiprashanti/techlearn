import express from "express";
import {
  compileCode,
  getCompilerAllowanceStatus,
  checkQueueStatus,
} from "../controllers/codeCompilerController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";
import { authRateLimit } from "../middleware/authRateLimit.js";

const router = express.Router();

// Get personal / device allowance and quota status
router.get("/status", optionalProtect, getCompilerAllowanceStatus);

// Check queue status for queued execution
router.get("/queue/:queueId", optionalProtect, checkQueueStatus);

// Compile route with optional authentication & rate limit
router.post(
  "/compile",
  optionalProtect,
  authRateLimit({
    name: "compile",
    windowMs: 60 * 1000,
    perIp: 60,
    perEmail: 60,
    message: "You are running code too quickly. Please wait a moment.",
  }),
  compileCode
);

export default router;

