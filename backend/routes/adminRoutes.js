import Router from "express";
import {
  getCourseTopicsForDashboard,
  editTopicDetails,
} from "../controllers/adminController.js";
import upload from "../config/multerConfig.js";

const adminRouter = Router();
adminRouter.get("/:courseId", getCourseTopicsForDashboard);
adminRouter.put("/topic/:topicId", upload.any(), editTopicDetails);

export default adminRouter;
