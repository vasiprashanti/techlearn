import express from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile, // ✅ add this
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

// ✅ Add the PUT route for updating avatar or other fields
userRoutes.put("/user/:id", updateUserProfile);

export default userRoutes;
