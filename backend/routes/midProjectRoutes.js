import express from "express";
import {
  getAllMidProjects,
  getMidProject,
} from "../controllers/midProjectController.js";
import { protect } from "../middleware/authMiddleware.js";
import clubMiddleware from "../middleware/clubMiddleware.js";

const router = express.Router();

router.get("/build/mid-projects", getAllMidProjects);

router.get("/build/mid-project/:id", protect, clubMiddleware, getMidProject);

export default router;
