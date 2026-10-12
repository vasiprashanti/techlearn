import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { searchColleges, resolveCollege } from "../controllers/learnerCollegeController.js";

const learnerCollegeRoutes = express.Router();

learnerCollegeRoutes.get("/search", protect, searchColleges);
learnerCollegeRoutes.post("/resolve", protect, resolveCollege);

export default learnerCollegeRoutes;
