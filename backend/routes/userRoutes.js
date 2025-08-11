import express from "express";
import {
  registerUser,
  loginUser,
  updateUserProfile,
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/login", loginUser);

userRoutes.put("/user/:id", updateUserProfile);

export default userRoutes;
