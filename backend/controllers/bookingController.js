import Booking from "../models/Booking.js";
import Major from "../models/majorProject.js";

export const bookMajor = async (req, res) => {
  try {
    const { projectId, userEmail } = req.body;

    const project = await Major.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Always log the attempt
    await Booking.create({
      projectId,
      projectTitle: project.title,
      userEmail,
      status: project.isFree ? "confirmed" : "pending",
    });

    if (!project.isFree) {
      return res
        .status(403)
        .json({ message: "Membership required for this project" });
    }

    res.status(201).json({ message: "✅ Booking successful!" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "❌ Internal Server Error", error: err.message });
  }
};
