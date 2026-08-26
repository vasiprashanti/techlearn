import mongoose from "mongoose";
import Program from "../../models/Program.js";
import ProgramReadinessLead from "../../models/ProgramReadinessLead.js";

export const listProgramReadinessLeads = async (req, res) => {
  try {
    const { programId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return res.status(400).json({ success: false, message: "Invalid program ID." });
    }

    const program = await Program.findById(programId).select("_id name programType").lean();
    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found." });
    }

    const leads = await ProgramReadinessLead.find({ programId })
      .populate("userId", "firstName lastName name email targetRole targetCompanies learningGoal")
      .populate("assignmentId", "status programDay requestedQuestionCount generatedQuestionCount completedAt")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,
      program,
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error("Error loading program readiness leads:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load readiness leads.",
    });
  }
};
