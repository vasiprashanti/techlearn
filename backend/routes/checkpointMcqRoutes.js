import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMcqByCourseId,
  submitCheckpointMcq,
} from "../controllers/checkpointMcqController.js";

const mcqRouter = express.Router();

//getmcqs
mcqRouter.get("/:courseId/topics/:topicId/mcqs", getMcqByCourseId);

//submit and check the mcq answer
mcqRouter.post(
  "/notes/:notesId/checkpoint-mcq/:checkpointMcqId/submit",
  protect,
  submitCheckpointMcq
);

export default mcqRouter;
