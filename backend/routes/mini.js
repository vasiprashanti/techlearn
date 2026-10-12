import express from "express";
import { getAll, get, create, remove } from "../controllers/miniController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all mini projects
router.get("/", getAll);

// GET a single mini project by ID
router.get("/:id", get);

// CREATE a new mini project
router.post("/", protect, isAdmin, create);

// DELETE a mini project by ID
router.delete("/:id", protect, isAdmin, remove);

export default router;
