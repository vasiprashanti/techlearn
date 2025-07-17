import MidProjectModel from "../models/MidProject.js";

export const getAllMidProjects = async (req, res) => {
  try {
    const mid_projects = await MidProjectModel.find();
    res.json(mid_projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to load projects" });
  }
};

export const getMidProject = async (req, res) => {
  try {
    const MidProjectId = req.params.id;
    const project = await MidProjectModel.findById(MidProjectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: "Error in Project Loading by id" });
  }
};
