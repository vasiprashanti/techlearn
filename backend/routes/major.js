import express from "express";
import Major from "../models/majorProject.js";
import { protect } from "../middleware/authMiddleware.js";
import clubMiddleware from "../middleware/clubMiddleware.js";

const router = express.Router();

// Public: Get all major projects
router.get("/build/major-projects", async (req, res) => {
  try {
    const projects = await Major.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Protected: Get single major project – club members only
router.get(
  "/build/major-project/:id",
  protect,
  clubMiddleware,
  async (req, res) => {
    try {
      const project = await Major.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (err) {
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// Add a major project (Admin or Dev use only – you can protect if needed)
router.post("/", async (req, res) => {
  try {
    const { title, description, isFree } = req.body;
    const newProject = new Major({ title, description, isFree });
    await newProject.save();
    res.json({ message: "Major project added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add major project" });
  }
});

export default router;
