import LearnerReport from "../models/LearnerReport.js";
import {
  getLearnerReports,
  getLearnerReport,
} from "../services/learnerReportService.js";

const sendError = (res, error, fallback) => {
  console.error(fallback, error);
  return res.status(Number(error?.statusCode) || 500).json({
    success: false,
    message: error?.message || fallback,
  });
};

export const listLearnerReports = async (req, res) => {
  try {
    const reports = await getLearnerReports({ user: req.user });
    return res.json({ success: true, reports });
  } catch (error) {
    return sendError(res, error, "Failed to load learner reports.");
  }
};

export const getLearnerReportByKey = async (req, res) => {
  try {
    const { kind, reportKey } = req.params;
    if (!["program", "practice", "assessment"].includes(kind)) {
      return res.status(400).json({ success: false, message: "Invalid report type." });
    }
    const report = await getLearnerReport({ user: req.user, kind, reportKey });
    if (!report) return res.status(404).json({ success: false, message: "Report not found." });
    return res.json({ success: true, report });
  } catch (error) {
    return sendError(res, error, "Failed to load learner report.");
  }
};

export const getStoredAssessmentReports = async (req, res) => {
  try {
    const reports = await LearnerReport.find({
      userId: req.user._id,
      kind: "assessment",
    })
      .sort({ generatedAt: -1, createdAt: -1 })
      .lean();
    return res.json({ success: true, reports });
  } catch (error) {
    return sendError(res, error, "Failed to load assessment history.");
  }
};
