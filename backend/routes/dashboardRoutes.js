import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/", protect, getDashboardData);

export default dashboardRouter;
