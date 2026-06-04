import mongoose from "mongoose";
import Question from "../models/Questions.js";
import TrackTemplate from "../models/TrackTemplate.js";
import { normalizeCategoryType } from "./questionBank.js";

const normalizeText = (value = "") => String(value || "").trim().toLowerCase();

const inferAllowedCategoryTypes = (templateCategory = "") => {
  const normalized = normalizeText(templateCategory);

  if (
    normalized.includes("sql") ||
    normalized.includes("database") ||
    normalized.includes("notes") ||
    normalized.includes("theory") ||
    normalized.includes("interview notes")
  ) {
    return ["Notes"];
  }

  if (normalized.includes("aptitude") || normalized.includes("mcq")) {
    return ["MCQ"];
  }

  if (
    normalized.includes("data structures") ||
    normalized.includes("dsa") ||
    normalized.includes("algorithm") ||
    normalized.includes("coding") ||
    normalized.includes("java") ||
    normalized.includes("python") ||
    normalized.includes("web development") ||
    normalized.includes("machine learning")
  ) {
    return ["Coding"];
  }

  return ["Coding", "MCQ", "Notes"];
};

export const validateTrackTemplateQuestionAssignment = async ({ templateId, dayNumber, questionId, allowOverwrite = true }) => {
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    return { valid: false, status: 400, message: "Invalid templateId." };
  }

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return { valid: false, status: 400, message: "Invalid questionId." };
  }

  const template = await TrackTemplate.findById(templateId).lean();
  if (!template) {
    return { valid: false, status: 404, message: "Track template not found." };
  }

  const question = await Question.findById(questionId).populate("categoryId", "title slug categoryType visibility").lean();
  if (!question) {
    return { valid: false, status: 404, message: "Question not found." };
  }

  if (question.isActive === false || question.status === "Archived") {
    return { valid: false, status: 400, message: "Inactive or archived questions cannot be assigned to a track template." };
  }

  const normalizedCategoryType = normalizeCategoryType(question.categoryType || question.categoryId?.categoryType);
  if (!normalizedCategoryType) {
    return { valid: false, status: 400, message: "Question must have a valid categoryType before assignment." };
  }

  const allowedTypes = inferAllowedCategoryTypes(template.category);
  if (allowedTypes.length && !allowedTypes.includes(normalizedCategoryType)) {
    return {
      valid: false,
      status: 400,
      message: `Question type ${normalizedCategoryType} is not compatible with template category ${template.category}.`,
    };
  }

  const normalizedDayNumber = Number(dayNumber);
  if (!Number.isInteger(normalizedDayNumber) || normalizedDayNumber < 1) {
    return { valid: false, status: 400, message: "dayNumber must be a positive integer." };
  }

  const existingDayAssignment = (template.dayAssignments || []).find((assignment) => Number(assignment.dayNumber) === normalizedDayNumber);
  const duplicateQuestion = (template.dayAssignments || []).find(
    (assignment) => String(assignment.questionId) === String(questionId)
  );

  if (duplicateQuestion && (!allowOverwrite || String(existingDayAssignment?.questionId) !== String(questionId))) {
    return {
      valid: false,
      status: 409,
      message: "This question is already assigned in the template.",
    };
  }

  return {
    valid: true,
    template,
    question,
    normalizedCategoryType,
    normalizedDayNumber,
    existingDayAssignment,
  };
};
