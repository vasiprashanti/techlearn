import MiniProject from "../models/miniProject.js";

export const getAll = async (req, res) => {
  try {
    const miniProjects = await MiniProject.find({});
    res.json(miniProjects);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const create = async (req, res) => {
  const { title, description, tags, image } = req.body;
  try {
    const mini = await MiniProject.create({ title, description, tags, image });
    res.json(mini);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const get = async (req, res) => {
  try {
    const mini = await MiniProject.findById(req.params.id);
    if (!mini) return res.status(404).json({ message: "Not found" });
    res.json(mini);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const remove = async (req, res) => {
  try {
    const mini = await MiniProject.findByIdAndDelete(req.params.id);
    if (!mini) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
