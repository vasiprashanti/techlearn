import mongoose from "mongoose";
import Question from "../../models/Questions.js";
import QuestionCategory from "../../models/QuestionCategory.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import Track from "../../models/Track.js";
import Batch from "../../models/Batch.js";
import Resource from "../../models/Resource.js";
import FinalTest from "../../models/FinalTest.js";
import CertificateTemplate from "../../models/CertificateTemplate.js";
import IssuedCertificate from "../../models/IssuedCertificate.js";
import { writeAuditLog } from "../../utils/auditLogger.js";
import {
  QUESTION_CATEGORY_META,
  CATEGORY_SLUG_BY_TITLE,
  assertObjectId,
  getActorName,
  getCategorySlug,
  getCategoryTitle,
  getTrackTemplateIconKey,
  legacyVisibilityFromCategoryStatus,
  listKnownQuestionCategories,
  normalizeQuestionCategoryStatus,
  resolveCategoryStatusFromRequest,
  slugifyCategory,
} from "./adminCommon.js";

const normalizeTrackType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("dsa")) return "DSA";
  if (normalized.includes("sql")) return "SQL";
  return "Core";
};

const resolveTemplateSchedule = ({ startDate, endDate, totalDays, durationDays }) => {
  const parsedStartDate = startDate ? new Date(startDate) : null;
  const parsedEndDate = endDate ? new Date(endDate) : null;
  const requestedDuration = Number(durationDays || totalDays || 0);

  if (!parsedStartDate || Number.isNaN(parsedStartDate.getTime())) {
    return { error: "startDate must be a valid date." };
  }

  if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
    return { error: "endDate must be a valid date." };
  }

  if (parsedEndDate && parsedEndDate < parsedStartDate) {
    return { error: "endDate must be on or after startDate." };
  }

  if (!parsedEndDate && requestedDuration <= 0) {
    return { error: "Provide either endDate or durationDays/totalDays." };
  }

  const effectiveEndDate = parsedEndDate
    ? parsedEndDate
    : new Date(parsedStartDate.getTime() + (requestedDuration - 1) * 24 * 60 * 60 * 1000);

  const effectiveTotalDays = Math.max(
    1,
    parsedEndDate
      ? Math.floor((effectiveEndDate.getTime() - parsedStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
      : requestedDuration,
  );

  return {
    startDate: parsedStartDate,
    endDate: effectiveEndDate,
    totalDays: effectiveTotalDays,
  };
};

const syncTemplateToTrack = async (template) => {
  if (!template?.batchId) return;

  const orderedQuestionIds = [...(template.dayAssignments || [])]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((assignment) => assignment.questionId)
    .filter(Boolean);

  await Track.findOneAndUpdate(
    {
      batchId: template.batchId,
      trackType: normalizeTrackType(template.category),
    },
    {
      $set: {
        durationDays: Number(template.totalDays || orderedQuestionIds.length || 1),
        orderedQuestionIds,
      },
    },
    { new: true }
  );
};

const normalizeTestCases = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((testCase) => ({
    input: String(testCase?.input || ""),
    output: String(testCase?.output || ""),
    explanation: String(testCase?.explanation || ""),
  }));
};

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

/** Admin JSON row: stable `questionId` + `categoryId` for downstream systems (tracks, practice, analytics). */
const formatQuestionAdminPayload = (question, slugToCategoryIdMap = null) => {
  const slug = getCategorySlug(question);
  let categoryId = question.categoryId ? String(question.categoryId) : null;
  if (!categoryId && slugToCategoryIdMap instanceof Map) {
    const mapped = slugToCategoryIdMap.get(slug);
    if (mapped) categoryId = String(mapped);
  }
  return {
    questionId: question._id,
    id: question._id,
    categoryId,
    title: question.title,
    questionType: question.questionType || "Coding",
    difficulty: question.difficulty,
    track: getCategoryTitle(question),
    trackType: question.trackType || "",
    created: question.createdAt?.toISOString?.().slice(0, 10) || "",
    status: question.status || "Active",
    tags: question.tags || [],
    description: question.description || "",
    inputFormat: question.inputFormat || "",
    outputFormat: question.outputFormat || "",
    visibleTestCases: question.visibleTestCases || [],
    hiddenTestCases: question.hiddenTestCases || [],
    timeLimit: String(question.timeLimit || 1),
    memoryLimit: String(question.memoryLimit || 256),
    solved: String(question.solvedCount || 0),
    referenceLanguage: question.referenceLanguage || "C++",
    solutionCode: question.solutionCode || "",
    editorial: question.editorial || "",
    mcqOptions: question.mcqOptions || [],
    mcqCorrectIndex: typeof question.mcqCorrectIndex === "number" ? question.mcqCorrectIndex : null,
    mcqExplanation: question.mcqExplanation || "",
    notesMarkdown: question.notesMarkdown || "",
    categorySlug: slug,
    categoryTitle: question.categoryTitle || "",
  };
};

const loadSlugToCategoryIdMap = async (slugs = []) => {
  const uniq = [...new Set(slugs.map((s) => String(s || "").trim()).filter(Boolean))];
  if (!uniq.length) return new Map();
  const rows = await QuestionCategory.find({ slug: { $in: uniq } }).select("_id slug").lean();
  return new Map(rows.map((row) => [row.slug, row._id]));
};

export const listQuestionCategories = async (req, res) => {
  try {
    const grouped = await Question.aggregate([
      {
        $group: {
          _id: {
            $ifNull: ["$categorySlug", "$trackType"],
          },
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const groupMap = Object.fromEntries(grouped.map((entry) => [String(entry._id), entry]));
    const categories = await listKnownQuestionCategories();
    const data = categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      title: category.title,
      subtitle: category.subtitle,
      total: groupMap[category.slug]?.total || 0,
      active: groupMap[category.slug]?.active || 0,
      icon: category.icon,
      description: category.description,
      categoryType: category.categoryType || "Coding",
      status: category.status || "Active",
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listQuestionCategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch question categories." });
  }
};

export const createQuestionCategory = async (req, res) => {
  try {
    const { title, subtitle, description, icon, categoryType } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Category title is required." });
    }

    const slug = slugifyCategory(title);
    if (!slug) {
      return res.status(400).json({ success: false, message: "Category title must contain letters or numbers." });
    }

    const existingBySlug = await QuestionCategory.findOne({ slug }).lean();
    if (existingBySlug) {
      return res.status(409).json({ success: false, message: "A category with this title already exists." });
    }

    const nextStatus = resolveCategoryStatusFromRequest(req.body, null);
    const legacyVisibility = legacyVisibilityFromCategoryStatus(nextStatus);

    const category = await QuestionCategory.create({
      slug,
      title: title.trim(),
      subtitle: (description ?? subtitle)?.trim() || "Custom question category",
      icon: icon || "chart",
      categoryType: categoryType || "Coding",
      visibility: legacyVisibility,
      status: nextStatus,
    });

    await writeAuditLog({
      verb: "Created",
      entityType: "QuestionCategory",
      entityId: category._id,
      action: "Created question category",
      detail: category.title,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: category._id,
        slug: category.slug,
        title: category.title,
        subtitle: category.subtitle,
        description: category.subtitle,
        total: 0,
        active: 0,
        icon: category.icon,
        categoryType: category.categoryType,
        status: normalizeQuestionCategoryStatus(category.toObject()),
      },
    });
  } catch (error) {
    console.error("createQuestionCategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to create question category.", error: error.message });
  }
};

export const updateQuestionCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!assertObjectId(categoryId, "categoryId", res)) return;

    const category = await QuestionCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Question category not found." });
    }

    const nextTitle = req.body.title?.trim() || category.title;
    const nextSubtitle = (req.body.description ?? req.body.subtitle)?.trim() || category.subtitle;
    const nextIcon = req.body.icon || category.icon;
    const nextCategoryType = req.body.categoryType || category.categoryType || "Coding";
    const nextStatus = resolveCategoryStatusFromRequest(req.body, category.toObject());
    const legacyVisibility = legacyVisibilityFromCategoryStatus(nextStatus);

    const nextSlug = slugifyCategory(nextTitle);
    if (!nextSlug) {
      return res.status(400).json({ success: false, message: "Category title must contain letters or numbers." });
    }

    const duplicate = await QuestionCategory.findOne({
      _id: { $ne: category._id },
      $or: [{ slug: nextSlug }, { title: nextTitle }],
    }).lean();

    if (duplicate) {
      return res.status(409).json({ success: false, message: "A category with this title already exists." });
    }

    const previousSlug = category.slug;
    const previousTitle = category.title;

    category.slug = nextSlug;
    category.title = nextTitle;
    category.subtitle = nextSubtitle;
    category.icon = nextIcon;
    category.categoryType = nextCategoryType;
    category.visibility = legacyVisibility;
    category.status = nextStatus;
    await category.save();

    await Question.updateMany(
      {
        $or: [{ categorySlug: previousSlug }, { categoryTitle: previousTitle }, { categoryId: category._id }],
      },
      {
        $set: {
          categorySlug: category.slug,
          categoryTitle: category.title,
          categoryId: category._id,
        },
      }
    );

    await writeAuditLog({
      verb: "Updated",
      entityType: "QuestionCategory",
      entityId: category._id,
      action: "Updated question category",
      detail: category.title,
      actor: req.user,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: category._id,
        slug: category.slug,
        title: category.title,
        subtitle: category.subtitle,
        description: category.subtitle,
        icon: category.icon,
        categoryType: category.categoryType,
        status: normalizeQuestionCategoryStatus(category.toObject()),
      },
    });
  } catch (error) {
    console.error("updateQuestionCategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to update question category.", error: error.message });
  }
};

export const deleteQuestionCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!assertObjectId(categoryId, "categoryId", res)) return;

    const category = await QuestionCategory.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Question category not found." });
    }

    await Question.deleteMany({
      $or: [{ categorySlug: category.slug }, { categoryTitle: category.title }, { categoryId: category._id }],
    });

    await writeAuditLog({
      verb: "Deleted",
      entityType: "QuestionCategory",
      entityId: category._id,
      action: "Deleted question category",
      detail: category.title,
      actor: req.user,
    });

    return res.status(200).json({ success: true, message: "Question category deleted successfully." });
  } catch (error) {
    console.error("deleteQuestionCategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete question category.", error: error.message });
  }
};

export const listQuestionsAdmin = async (req, res) => {
  try {
    const query = {};

    if (req.query.categoryId) {
      if (!assertObjectId(req.query.categoryId, "categoryId", res)) return;
      const cat = await QuestionCategory.findById(req.query.categoryId).select("slug").lean();
      if (!cat) {
        return res.status(404).json({ success: false, message: "Question category not found." });
      }
      query.$or = [{ categoryId: cat._id }, { categorySlug: cat.slug }];
    } else if (req.query.categorySlug) {
      query.categorySlug = req.query.categorySlug;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.difficulty) query.difficulty = req.query.difficulty;
    if (req.query.questionType) query.questionType = req.query.questionType;

    const questions = await Question.find(query).sort({ createdAt: -1 }).lean();
    const slugMap = await loadSlugToCategoryIdMap(questions.map((q) => getCategorySlug(q)));
    const data = questions.map((question) => formatQuestionAdminPayload(question, slugMap));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listQuestionsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch questions." });
  }
};

export const createQuestionAdmin = async (req, res) => {
  try {
    const {
      questionType,
      title,
      difficulty,
      categorySlug,
      categoryTitle,
      tags,
      description,
      inputFormat,
      outputFormat,
      visibleTestCases,
      hiddenTestCases,
      timeLimit,
      memoryLimit,
      referenceLanguage,
      solutionCode,
      editorial,
      mcqOptions,
      mcqCorrectIndex,
      mcqExplanation,
      notesMarkdown,
      status,
      categoryId: categoryIdFromBody,
    } = req.body;

    const normalizedQuestionType = String(questionType || "Coding").trim() || "Coding";

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Question title is required." });
    }

    if (normalizedQuestionType === "Coding") {
      if (!String(description || "").trim()) {
        return res.status(400).json({ success: false, message: "Problem description is required." });
      }
    }

    if (normalizedQuestionType === "MCQ") {
      if (!String(description || "").trim()) {
        return res.status(400).json({ success: false, message: "MCQ question text is required." });
      }

      const normalizedOptions = Array.isArray(mcqOptions) ? mcqOptions.map((opt) => String(opt || "").trim()).filter(Boolean) : [];
      if (normalizedOptions.length < 2) {
        return res.status(400).json({ success: false, message: "Provide at least 2 MCQ options." });
      }

      const parsedCorrect = Number(mcqCorrectIndex);
      if (!Number.isInteger(parsedCorrect) || parsedCorrect < 0 || parsedCorrect >= normalizedOptions.length) {
        return res.status(400).json({ success: false, message: "Select a valid correct option." });
      }
    }

    if (normalizedQuestionType === "Notes") {
      if (!String(notesMarkdown || "").trim()) {
        return res.status(400).json({ success: false, message: "Notes markdown content is required." });
      }
    }

    let resolvedCategorySlug =
      categorySlug || CATEGORY_SLUG_BY_TITLE[categoryTitle] || slugifyCategory(categoryTitle) || "web-development";
    let resolvedCategoryTitle =
      categoryTitle || QUESTION_CATEGORY_META[resolvedCategorySlug]?.title || "General";
    let resolvedCategoryObjectId = null;

    if (categoryIdFromBody) {
      if (!mongoose.Types.ObjectId.isValid(String(categoryIdFromBody))) {
        return res.status(400).json({ success: false, message: "Invalid categoryId." });
      }
      const catById = await QuestionCategory.findById(categoryIdFromBody).lean();
      if (!catById) {
        return res.status(400).json({ success: false, message: "Category not found for categoryId." });
      }
      resolvedCategorySlug = catById.slug;
      resolvedCategoryTitle = catById.title;
      resolvedCategoryObjectId = catById._id;
    } else {
      if (categorySlug) {
        const categoryExists = await QuestionCategory.findOne({ slug: categorySlug }).select("_id").lean();
        if (!categoryExists) {
          return res.status(400).json({ success: false, message: "Selected category does not exist." });
        }
      }
      const catMatch = await QuestionCategory.findOne({ slug: resolvedCategorySlug }).select("_id").lean();
      resolvedCategoryObjectId = catMatch?._id || null;
    }

    const normalizedVisibleTestCases = normalizeTestCases(visibleTestCases);
    const normalizedHiddenTestCases = normalizeTestCases(hiddenTestCases);

    const question = await Question.create({
      title: title.trim(),
      questionType: normalizedQuestionType,
      difficulty: difficulty || "Easy",
      trackType: "",
      categorySlug: resolvedCategorySlug,
      categoryTitle: resolvedCategoryTitle,
      categoryId: resolvedCategoryObjectId,
      tags: tags || [],
      description: String(description || "").trim(),
      inputFormat: inputFormat || "",
      outputFormat: outputFormat || "",
      visibleTestCases: normalizedVisibleTestCases,
      hiddenTestCases: normalizedHiddenTestCases,
      timeLimit: parsePositiveNumber(timeLimit, 1),
      memoryLimit: parsePositiveNumber(memoryLimit, 256),
      referenceLanguage: referenceLanguage || "C++",
      solutionCode: solutionCode || "",
      editorial: editorial || "",
      mcqOptions: Array.isArray(mcqOptions) ? mcqOptions.map((opt) => String(opt || "").trim()).filter(Boolean) : [],
      mcqCorrectIndex: typeof mcqCorrectIndex === "number" ? mcqCorrectIndex : Number.isInteger(Number(mcqCorrectIndex)) ? Number(mcqCorrectIndex) : null,
      mcqExplanation: mcqExplanation || "",
      notesMarkdown: notesMarkdown || "",
      status: status || "Active",
    });

    await writeAuditLog({
      verb: "Created",
      entityType: "Question",
      entityId: question._id,
      action: "Created question",
      detail: question.title,
      actor: req.user,
    });

    return res.status(201).json({
      success: true,
      data: formatQuestionAdminPayload(question.toObject(), null),
    });
  } catch (error) {
    console.error("createQuestionAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to create question.", error: error.message });
  }
};

export const getQuestionDetailAdmin = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!assertObjectId(questionId, "questionId", res)) return;

    const question = await Question.findById(questionId).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    const slugMap = await loadSlugToCategoryIdMap([getCategorySlug(question)]);

    return res.status(200).json({
      success: true,
      data: formatQuestionAdminPayload(question, slugMap),
    });
  } catch (error) {
    console.error("getQuestionDetailAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch question details." });
  }
};

export const updateQuestionAdmin = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!assertObjectId(questionId, "questionId", res)) return;

    const normalizedQuestionType = String(req.body.questionType || "Coding").trim() || "Coding";

    const nextTitle = String(req.body.title || "").trim();
    const nextDescription = String(req.body.description || "").trim();

    if (!nextTitle) {
      return res.status(400).json({ success: false, message: "Question title is required." });
    }

    if (normalizedQuestionType === "Coding") {
      if (!nextDescription) {
        return res.status(400).json({ success: false, message: "Problem description is required." });
      }
    }

    if (normalizedQuestionType === "MCQ") {
      if (!nextDescription) {
        return res.status(400).json({ success: false, message: "MCQ question text is required." });
      }

      const normalizedOptions = Array.isArray(req.body.mcqOptions)
        ? req.body.mcqOptions.map((opt) => String(opt || "").trim()).filter(Boolean)
        : [];
      if (normalizedOptions.length < 2) {
        return res.status(400).json({ success: false, message: "Provide at least 2 MCQ options." });
      }

      const parsedCorrect = Number(req.body.mcqCorrectIndex);
      if (!Number.isInteger(parsedCorrect) || parsedCorrect < 0 || parsedCorrect >= normalizedOptions.length) {
        return res.status(400).json({ success: false, message: "Select a valid correct option." });
      }
    }

    if (normalizedQuestionType === "Notes") {
      if (!String(req.body.notesMarkdown || "").trim()) {
        return res.status(400).json({ success: false, message: "Notes markdown content is required." });
      }
    }

    const existing = await Question.findById(questionId).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    let resolvedCategorySlug =
      req.body.categorySlug?.trim() ||
      CATEGORY_SLUG_BY_TITLE[req.body.categoryTitle] ||
      (req.body.categoryTitle ? slugifyCategory(req.body.categoryTitle) : null) ||
      getCategorySlug(existing);

    let resolvedCategoryTitle =
      (typeof req.body.categoryTitle === "string" && req.body.categoryTitle.trim()) ||
      QUESTION_CATEGORY_META[resolvedCategorySlug]?.title ||
      existing.categoryTitle ||
      "General";

    let resolvedCategoryObjectId = existing.categoryId || null;

    if (req.body.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(String(req.body.categoryId))) {
        return res.status(400).json({ success: false, message: "Invalid categoryId." });
      }
      const catById = await QuestionCategory.findById(req.body.categoryId).lean();
      if (!catById) {
        return res.status(400).json({ success: false, message: "Category not found for categoryId." });
      }
      resolvedCategorySlug = catById.slug;
      resolvedCategoryTitle = catById.title;
      resolvedCategoryObjectId = catById._id;
    } else {
      if (req.body.categorySlug) {
        const categoryExists = await QuestionCategory.findOne({ slug: req.body.categorySlug }).select("_id").lean();
        if (!categoryExists) {
          return res.status(400).json({ success: false, message: "Selected category does not exist." });
        }
      }
      const catMatch = await QuestionCategory.findOne({ slug: resolvedCategorySlug }).select("_id").lean();
      resolvedCategoryObjectId = catMatch?._id || existing.categoryId || null;
    }

    const normalizedVisibleTestCases = normalizeTestCases(req.body.visibleTestCases);
    const normalizedHiddenTestCases = normalizeTestCases(req.body.hiddenTestCases);

    const question = await Question.findByIdAndUpdate(
      questionId,
      {
        $set: {
          title: nextTitle,
          questionType: normalizedQuestionType,
          difficulty: req.body.difficulty,
          categorySlug: resolvedCategorySlug,
          categoryTitle: resolvedCategoryTitle,
          categoryId: resolvedCategoryObjectId,
          tags: req.body.tags,
          description: nextDescription,
          inputFormat: req.body.inputFormat,
          outputFormat: req.body.outputFormat,
          visibleTestCases: normalizedVisibleTestCases,
          hiddenTestCases: normalizedHiddenTestCases,
          timeLimit: parsePositiveNumber(req.body.timeLimit, 1),
          memoryLimit: parsePositiveNumber(req.body.memoryLimit, 256),
          referenceLanguage: req.body.referenceLanguage || "C++",
          solutionCode: req.body.solutionCode || "",
          editorial: req.body.editorial || "",
          mcqOptions: Array.isArray(req.body.mcqOptions)
            ? req.body.mcqOptions.map((opt) => String(opt || "").trim()).filter(Boolean)
            : [],
          mcqCorrectIndex: typeof req.body.mcqCorrectIndex === "number"
            ? req.body.mcqCorrectIndex
            : Number.isInteger(Number(req.body.mcqCorrectIndex))
              ? Number(req.body.mcqCorrectIndex)
              : null,
          mcqExplanation: req.body.mcqExplanation || "",
          notesMarkdown: req.body.notesMarkdown || "",
          status: req.body.status || "Active",
        },
      },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    await writeAuditLog({
      verb: "Updated",
      entityType: "Question",
      entityId: question._id,
      action: "Updated question",
      detail: question.title,
      actor: req.user,
    });

    return res.status(200).json({
      success: true,
      data: formatQuestionAdminPayload(question.toObject(), null),
    });
  } catch (error) {
    console.error("updateQuestionAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to update question.", error: error.message });
  }
};

export const deleteQuestionAdmin = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!assertObjectId(questionId, "questionId", res)) return;

    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    await TrackTemplate.updateMany({}, { $pull: { dayAssignments: { questionId: question._id } } });

    await writeAuditLog({
      verb: "Deleted",
      entityType: "Question",
      entityId: question._id,
      action: "Deleted question",
      detail: question.title,
      actor: req.user,
    });

    return res.status(200).json({ success: true, message: "Question deleted successfully." });
  } catch (error) {
    console.error("deleteQuestionAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete question." });
  }
};

export const listTrackTemplates = async (req, res) => {
  try {
    const templates = await TrackTemplate.find().populate("batchId", "name").sort({ createdAt: -1 }).lean();
    const data = templates.map((template) => ({
      id: template._id,
      name: template.name,
      description: template.description,
      totalDays: template.totalDays,
      questionsAssigned: template.dayAssignments?.length || 0,
      status: template.status,
      category: template.category,
      iconKey: template.iconKey || getTrackTemplateIconKey(template.category),
      startDate: template.startDate,
      endDate: template.endDate,
      batchId: template.batchId?._id || template.batchId,
      assignedBatch: template.batchId?.name || "",
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listTrackTemplates error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch track templates." });
  }
};

export const createTrackTemplate = async (req, res) => {
  try {
    const { name, description, status, iconKey, batchId } = req.body;
    const category = req.body.category || req.body.trackType;

    if (!name?.trim() || !category?.trim() || !req.body.startDate || !batchId) {
      return res.status(400).json({ success: false, message: "Template name, category/trackType, startDate and batchId are required." });
    }

    if (!assertObjectId(batchId, "batchId", res)) return;

    const batch = await Batch.findById(batchId).lean();
    if (!batch) {
      return res.status(404).json({ success: false, message: "Assigned batch not found." });
    }

    const schedule = resolveTemplateSchedule(req.body);
    if (schedule.error) {
      return res.status(400).json({ success: false, message: schedule.error });
    }

    const template = await TrackTemplate.create({
      name: name.trim(),
      description: description?.trim() || `${schedule.totalDays}-day ${category} track template`,
      category: category.trim(),
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      batchId,
      totalDays: schedule.totalDays,
      status: status || "Active",
      iconKey: iconKey || getTrackTemplateIconKey(category),
      versionHistory: [{ version: 1, label: "v1 - Initial template", changedBy: getActorName(req.user) }],
    });

    await syncTemplateToTrack(template);

    await writeAuditLog({
      verb: "Created",
      entityType: "TrackTemplate",
      entityId: template._id,
      action: "Created track template",
      detail: template.name,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error("createTrackTemplate error:", error);
    return res.status(500).json({ success: false, message: "Failed to create track template.", error: error.message });
  }
};

export const getTrackTemplateDetail = async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const template = await TrackTemplate.findById(templateId)
      .populate("batchId", "name")
      .populate("dayAssignments.questionId")
      .lean();
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const categorySlug = CATEGORY_SLUG_BY_TITLE[template.category] || "web-development";
    const availableQuestions = await Question.find({ categorySlug, status: "Active" }).lean();

    return res.status(200).json({
      success: true,
      data: {
        id: template._id,
        name: template.name,
        description: template.description,
        totalDays: template.totalDays,
        questionsAssigned: template.dayAssignments?.length || 0,
        status: template.status,
        category: template.category,
        iconKey: template.iconKey || getTrackTemplateIconKey(template.category),
        startDate: template.startDate,
        endDate: template.endDate,
        batchId: template.batchId?._id || template.batchId,
        assignedBatch: template.batchId?.name || "",
        versionHistory: template.versionHistory || [],
        assignedQuestions: (template.dayAssignments || [])
          .sort((a, b) => a.dayNumber - b.dayNumber)
          .map((assignment) => ({
            dayNumber: assignment.dayNumber,
            id: assignment.questionId?._id,
            title: assignment.questionId?.title,
            difficulty: assignment.questionId?.difficulty,
            track: getCategoryTitle(assignment.questionId || {}),
          })),
        availableQuestions: availableQuestions.map((question) => ({
          id: question._id,
          title: question.title,
          difficulty: question.difficulty,
          track: getCategoryTitle(question),
        })),
      },
    });
  } catch (error) {
    console.error("getTrackTemplateDetail error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch track template details." });
  }
};

export const updateTrackTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    if (req.body.name) template.name = req.body.name.trim();
    if (req.body.description !== undefined) template.description = req.body.description?.trim() || "";
    if (req.body.category) {
      template.category = req.body.category.trim();
      template.iconKey = req.body.iconKey || getTrackTemplateIconKey(template.category);
    }
    if (req.body.batchId) {
      if (!assertObjectId(req.body.batchId, "batchId", res)) return;
      const batch = await Batch.findById(req.body.batchId).lean();
      if (!batch) {
        return res.status(404).json({ success: false, message: "Assigned batch not found." });
      }
      template.batchId = req.body.batchId;
    }
    if (req.body.trackType && !req.body.category) {
      template.category = req.body.trackType.trim();
      template.iconKey = req.body.iconKey || getTrackTemplateIconKey(template.category);
    }
    if (req.body.status) template.status = req.body.status;

    if (req.body.startDate || req.body.endDate || req.body.totalDays || req.body.durationDays) {
      const schedule = resolveTemplateSchedule({
        startDate: req.body.startDate || template.startDate,
        endDate: req.body.endDate || template.endDate,
        totalDays: req.body.totalDays || template.totalDays,
        durationDays: req.body.durationDays,
      });
      if (schedule.error) {
        return res.status(400).json({ success: false, message: schedule.error });
      }
      template.startDate = schedule.startDate;
      template.endDate = schedule.endDate;
      template.totalDays = schedule.totalDays;
    }

    const nextVersion = (template.versionHistory?.length || 0) + 1;
    template.versionHistory = [
      {
        version: nextVersion,
        label: `v${nextVersion} - Updated template metadata`,
        changedBy: getActorName(req.user),
        changedAt: new Date(),
      },
      ...(template.versionHistory || []),
    ];

    await template.save();
    await syncTemplateToTrack(template);

    await writeAuditLog({
      verb: "Updated",
      entityType: "TrackTemplate",
      entityId: template._id,
      action: "Updated track template",
      detail: template.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error("updateTrackTemplate error:", error);
    return res.status(500).json({ success: false, message: "Failed to update track template.", error: error.message });
  }
};

export const deleteTrackTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const template = await TrackTemplate.findByIdAndDelete(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    await writeAuditLog({
      verb: "Deleted",
      entityType: "TrackTemplate",
      entityId: template._id,
      action: "Deleted track template",
      detail: template.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, message: "Track template deleted successfully." });
  } catch (error) {
    console.error("deleteTrackTemplate error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete track template." });
  }
};

export const assignTrackTemplateDay = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { dayNumber, questionId } = req.body;
    if (!assertObjectId(templateId, "templateId", res) || !assertObjectId(questionId, "questionId", res)) return;

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const existingIndex = template.dayAssignments.findIndex(
      (assignment) => assignment.dayNumber === Number(dayNumber)
    );
    if (existingIndex >= 0) {
      template.dayAssignments[existingIndex].questionId = questionId;
    } else {
      template.dayAssignments.push({ dayNumber: Number(dayNumber), questionId });
    }

    template.dayAssignments.sort((a, b) => a.dayNumber - b.dayNumber);
    const nextVersion = (template.versionHistory?.length || 0) + 1;
    template.versionHistory = [
      {
        version: nextVersion,
        label: `v${nextVersion} - Assigned question to day ${dayNumber}`,
        changedBy: getActorName(req.user),
        changedAt: new Date(),
      },
      ...(template.versionHistory || []),
    ];

    await template.save();
    await syncTemplateToTrack(template);
    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error("assignTrackTemplateDay error:", error);
    return res.status(500).json({ success: false, message: "Failed to assign track template day." });
  }
};

export const removeTrackTemplateDay = async (req, res) => {
  try {
    const { templateId, dayNumber } = req.params;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    template.dayAssignments = template.dayAssignments.filter(
      (assignment) => assignment.dayNumber !== Number(dayNumber)
    );
    await template.save();
    await syncTemplateToTrack(template);

    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error("removeTrackTemplateDay error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove day assignment." });
  }
};

export const reorderTrackTemplateQuestions = async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const { orderedDayAssignments } = req.body;
    if (!Array.isArray(orderedDayAssignments)) {
      return res.status(400).json({ success: false, message: "orderedDayAssignments must be an array." });
    }

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    template.dayAssignments = orderedDayAssignments.map((assignment, index) => ({
      dayNumber: Number(assignment.dayNumber || index + 1),
      questionId: assignment.questionId,
    }));
    await template.save();
    await syncTemplateToTrack(template);

    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error("reorderTrackTemplateQuestions error:", error);
    return res.status(500).json({ success: false, message: "Failed to reorder track template questions." });
  }
};

export const listResourcesAdmin = async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: resources });
  } catch (error) {
    console.error("listResourcesAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch resources." });
  }
};

export const createResourceAdmin = async (req, res) => {
  try {
    const { title, category, type, url } = req.body;
    const allowedResourceCategories = ["Courses", "Important Topics", "Resume Templates"];
    if (!title?.trim() || !category?.trim() || !type) {
      return res.status(400).json({ success: false, message: "title, category and type are required." });
    }

    if (!allowedResourceCategories.includes(String(category).trim())) {
      return res.status(400).json({
        success: false,
        message: "category must be one of Courses, Important Topics, or Resume Templates.",
      });
    }

    const resource = await Resource.create({
      title: title.trim(),
      category: category.trim(),
      type,
      url: url || "",
      uploadedBy: req.user?._id || null,
    });

    await writeAuditLog({
      verb: "Created",
      entityType: "Resource",
      entityId: resource._id,
      action: "Added resource",
      detail: resource.title,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: resource });
  } catch (error) {
    console.error("createResourceAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to create resource.", error: error.message });
  }
};

export const updateResourceAdmin = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const allowedResourceCategories = ["Courses", "Important Topics", "Resume Templates"];
    if (!assertObjectId(resourceId, "resourceId", res)) return;

    const nextCategory = req.body.category?.trim();
    if (nextCategory && !allowedResourceCategories.includes(nextCategory)) {
      return res.status(400).json({
        success: false,
        message: "category must be one of Courses, Important Topics, or Resume Templates.",
      });
    }

    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      {
        $set: {
          title: req.body.title?.trim(),
          category: req.body.category?.trim(),
          type: req.body.type,
          url: req.body.url || "",
        },
      },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found." });
    }

    return res.status(200).json({ success: true, data: resource });
  } catch (error) {
    console.error("updateResourceAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to update resource." });
  }
};

export const deleteResourceAdmin = async (req, res) => {
  try {
    const { resourceId } = req.params;
    if (!assertObjectId(resourceId, "resourceId", res)) return;

    const resource = await Resource.findByIdAndDelete(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found." });
    }

    return res.status(200).json({ success: true, message: "Resource deleted successfully." });
  } catch (error) {
    console.error("deleteResourceAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete resource." });
  }
};

export const recordResourceView = async (req, res) => {
  try {
    const { resourceId } = req.params;
    if (!assertObjectId(resourceId, "resourceId", res)) return;
    const resource = await Resource.findByIdAndUpdate(resourceId, { $inc: { views: 1 } }, { new: true });
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found." });
    }
    return res.status(200).json({ success: true, data: resource });
  } catch (error) {
    console.error("recordResourceView error:", error);
    return res.status(500).json({ success: false, message: "Failed to record resource view." });
  }
};

export const getCertificatesPage = async (req, res) => {
  try {
    const [issuedCertificates, finalTests, templates] = await Promise.all([
      IssuedCertificate.find().sort({ issuedOn: -1 }).lean(),
      FinalTest.find().sort({ createdAt: -1 }).lean(),
      CertificateTemplate.find().sort({ createdAt: -1 }).populate("courseIds", "title").lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        issuedCertificates: issuedCertificates.map((certificate) => ({
          id: certificate._id,
          certificateId: certificate.certificateId,
          student: certificate.studentName,
          course: certificate.courseName,
          score: certificate.score,
          date: certificate.issuedOn,
          status: certificate.status,
        })),
        finalTests: finalTests.map((test) => ({
          id: test._id,
          title: test.title,
          course: test.courseName,
          passing: test.passingPercentage,
          attempts: test.attempts,
          questions: test.questions,
          timeLimitEnabled: test.timeLimitEnabled,
        })),
        templates: templates.map((template) => ({
          id: template._id,
          name: template.name,
          description: template.description,
          courses: template.courseIds?.length || 0,
          lastUpdated: template.updatedAt,
          status: template.status,
        })),
      },
    });
  } catch (error) {
    console.error("getCertificatesPage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch certificate data." });
  }
};

export const issueCertificateAdmin = async (req, res) => {
  try {
    const { studentName, courseName, score, userId, courseId } = req.body;
    if (!studentName?.trim() || !courseName?.trim()) {
      return res.status(400).json({ success: false, message: "studentName and courseName are required." });
    }

    const certificate = await IssuedCertificate.create({
      certificateId: `CERT-${Date.now()}`,
      studentName: studentName.trim(),
      courseName: courseName.trim(),
      score: Number(score || 0),
      userId: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : null,
    });

    await writeAuditLog({
      verb: "Issued",
      entityType: "Certificate",
      entityId: certificate._id,
      action: "Issued certificate",
      detail: `${certificate.studentName} - ${certificate.courseName}`,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    console.error("issueCertificateAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to issue certificate.", error: error.message });
  }
};

export const revokeCertificateAdmin = async (req, res) => {
  try {
    const { certificateId } = req.params;
    if (!assertObjectId(certificateId, "certificateId", res)) return;

    const certificate = await IssuedCertificate.findByIdAndUpdate(
      certificateId,
      { $set: { status: "Revoked" } },
      { new: true }
    );
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found." });
    }

    await writeAuditLog({
      verb: "Revoked",
      entityType: "Certificate",
      entityId: certificate._id,
      action: "Revoked certificate",
      detail: `${certificate.studentName} - ${certificate.courseName}`,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    console.error("revokeCertificateAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to revoke certificate." });
  }
};

export const restoreCertificateAdmin = async (req, res) => {
  try {
    const { certificateId } = req.params;
    if (!assertObjectId(certificateId, "certificateId", res)) return;

    const certificate = await IssuedCertificate.findByIdAndUpdate(
      certificateId,
      { $set: { status: "Active" } },
      { new: true }
    );
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found." });
    }

    await writeAuditLog({
      verb: "Restored",
      entityType: "Certificate",
      entityId: certificate._id,
      action: "Restored certificate",
      detail: `${certificate.studentName} - ${certificate.courseName}`,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    console.error("restoreCertificateAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to restore certificate." });
  }
};

export const createOrUpdateFinalTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const payload = {
      title: req.body.title?.trim() || "Final Assessment",
      courseId: req.body.courseId && mongoose.Types.ObjectId.isValid(req.body.courseId) ? req.body.courseId : null,
      courseName: req.body.courseName?.trim() || "General Course",
      passingPercentage: Number(req.body.passingPercentage || 70),
      attempts: Number(req.body.attempts || 0),
      timeLimitEnabled: Boolean(req.body.timeLimitEnabled),
      questions: Array.isArray(req.body.questions) ? req.body.questions : [],
    };

    let test;
    if (testId && mongoose.Types.ObjectId.isValid(testId)) {
      test = await FinalTest.findByIdAndUpdate(testId, { $set: payload }, { new: true, runValidators: true });
    } else {
      test = await FinalTest.create(payload);
    }

    await writeAuditLog({
      verb: testId ? "Updated" : "Created",
      entityType: "FinalTest",
      entityId: test._id,
      action: testId ? "Updated final test" : "Created final test",
      detail: test.title,
      actor: req.user,
    });

    return res.status(testId ? 200 : 201).json({ success: true, data: test });
  } catch (error) {
    console.error("createOrUpdateFinalTest error:", error);
    return res.status(500).json({ success: false, message: "Failed to save final test.", error: error.message });
  }
};

export const createOrUpdateCertificateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const payload = {
      name: req.body.name?.trim() || "Template",
      description: req.body.description?.trim() || "",
      courseIds: Array.isArray(req.body.courseIds)
        ? req.body.courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
        : [],
      status: req.body.status || "Active",
    };

    let template;
    if (templateId && mongoose.Types.ObjectId.isValid(templateId)) {
      template = await CertificateTemplate.findByIdAndUpdate(
        templateId,
        { $set: payload },
        { new: true, runValidators: true }
      );
    } else {
      template = await CertificateTemplate.create(payload);
    }

    await writeAuditLog({
      verb: templateId ? "Updated" : "Created",
      entityType: "CertificateTemplate",
      entityId: template._id,
      action: templateId ? "Updated certificate template" : "Created certificate template",
      detail: template.name,
      actor: req.user,
    });

    return res.status(templateId ? 200 : 201).json({ success: true, data: template });
  } catch (error) {
    console.error("createOrUpdateCertificateTemplate error:", error);
    return res.status(500).json({ success: false, message: "Failed to save certificate template.", error: error.message });
  }
};
