import express from "express";
import { bookMajor } from "../controllers/bookingController.js";

const router = express.Router();

// Removed `auth` middleware
router.post("/booking", bookMajor);

export default router;
