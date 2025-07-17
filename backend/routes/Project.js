import express from "express";
import Mini from "../models/miniProject.js";
import Major from "../models/majorProject.js";
import AccessLog from "../models/AccessLog.js";

const router = express.Router();

// Route: GET /api/project/:id
router.get("/project/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let project = await Mini.findById(id);
    if (project) {
      console.log(`User accessed project ID: ${id}`);
      console.log(`Project Type: Mini`);

      // ⏺ Log in MongoDB
      await AccessLog.create({ projectId: id, projectType: "Mini" });

      return res.json({ type: "mini", data: project });
    }

    project = await Major.findById(id);
    if (project) {
      console.log(`User accessed project ID: ${id}`);
      console.log(`Project Type: Major`);

      // ⏺ Log in MongoDB
      await AccessLog.create({ projectId: id, projectType: "Major" });

      return res.json({ type: "major", data: project });
    }

    res.status(404).json({ message: "Project not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
