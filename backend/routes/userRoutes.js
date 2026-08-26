import express from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  updatePreferences,
  getCurrentUserProfile,
  saveOnboardingDraft,
  updateProgramTier,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

userRoutes.put("/user/:id", updateUserProfile);
userRoutes.get("/profile", protect, getCurrentUserProfile);
userRoutes.put("/onboarding/draft", protect, saveOnboardingDraft);
userRoutes.put("/preferences", protect, updatePreferences);
userRoutes.post("/update-program-tier", protect, updateProgramTier);

export default userRoutes;

