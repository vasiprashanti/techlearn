import express from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  updatePreferences,
  updateProgramTier,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

userRoutes.put("/user/:id", updateUserProfile);
userRoutes.put("/preferences", protect, updatePreferences);
userRoutes.post("/update-program-tier", protect, updateProgramTier);

export default userRoutes;

