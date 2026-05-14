import express from "express";
import { getPublicLeaderboard } from "../controllers/leaderboardController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const leaderboardRouter = express.Router();

leaderboardRouter.get("/", optionalProtect, getPublicLeaderboard);

export default leaderboardRouter;
