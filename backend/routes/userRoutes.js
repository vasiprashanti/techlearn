import express from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
  updatePreferences,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

userRoutes.put("/user/:id", updateUserProfile);
userRoutes.put("/preferences", protect, updatePreferences);

export default userRoutes;
