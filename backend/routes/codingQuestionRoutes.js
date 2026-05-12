import express from "express";
import {
  createCodingQuestionSession,
  getCodingQuestionDetail,
  listCodingQuestions,
} from "../controllers/codingQuestionController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listCodingQuestions);
router.get("/:questionId", getCodingQuestionDetail);
router.post("/:questionId/session", optionalProtect, createCodingQuestionSession);

export default router;
