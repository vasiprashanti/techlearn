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
import { getProfileDetails, updateProfileDetails, requestAccountDeletion } from "../controllers/profileDetailsController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

userRoutes.put("/user/:id", protect, (req, res, next) => {
  // A learner may only edit their own record; admins may edit any.
  if (String(req.user._id) !== String(req.params.id) && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}, updateUserProfile);
userRoutes.get("/profile", protect, getCurrentUserProfile);
userRoutes.get("/profile/details", protect, getProfileDetails);
userRoutes.put("/profile/details", protect, updateProfileDetails);
userRoutes.post("/account-deletion-request", protect, requestAccountDeletion);
userRoutes.put("/onboarding/draft", protect, saveOnboardingDraft);
userRoutes.put("/preferences", protect, updatePreferences);
userRoutes.post("/update-program-tier", protect, updateProgramTier);

export default userRoutes;

