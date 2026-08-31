import express from "express";
//import { submitTestimonial } from "../controllers/testimonialController.js";
import {
  submitTestimonial,
  getTestimonialStatus,
} from "../controllers/testimonialController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/status", protect, getTestimonialStatus);
router.post("/", protect, submitTestimonial);
export default router;