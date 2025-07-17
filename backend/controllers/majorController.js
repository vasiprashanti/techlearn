import Major from "../models/Major.js";

// GET all major projects (public)
export const getMajorProjects = async (req, res) => {
  try {
    const majors = await Major.find({});
    res.json(majors);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// GET single major project (protected + club only)
export const getMajorProject = async (req, res) => {
  try {
    const major = await Major.findById(req.params.id);
    if (!major) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(major);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
