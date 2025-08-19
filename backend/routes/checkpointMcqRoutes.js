import express from "express";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";
import {
  getMcqByCourseId,
  submitCheckpointMcq,
} from "../controllers/checkpointMcqController.js";

const mcqRouter = express.Router();

//getmcqs
mcqRouter.get(
  "/:courseId/topics/:topicId/mcqs",
  optionalProtect,
  getMcqByCourseId
);

//submit and check the mcq answer
mcqRouter.post(
  "/notes/:notesId/checkpoint-mcq/:checkpointMcqId/submit",
  optionalProtect,
  submitCheckpointMcq
);

export default mcqRouter;
