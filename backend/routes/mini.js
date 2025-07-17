import express from "express";
import { getAll, get, create, remove } from "../controllers/miniController.js";

const router = express.Router();

// GET all mini projects
router.get("/", getAll);

// GET a single mini project by ID
router.get("/:id", get);

// CREATE a new mini project
router.post("/", create);

// DELETE a mini project by ID
router.delete("/:id", remove);

export default router;
