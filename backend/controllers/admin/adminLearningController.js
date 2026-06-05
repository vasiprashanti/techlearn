import mongoose from "mongoose";
import Question from "../../models/Questions.js";
import Category from "../../models/Category.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import Track from "../../models/Track.js";
import Batch from "../../models/Batch.js";
import Resource from "../../models/Resource.js";
import { v2 as cloudinary } from "cloudinary";
import FinalTest from "../../models/FinalTest.js";
import CertificateTemplate from "../../models/CertificateTemplate.js";
import IssuedCertificate from "../../models/IssuedCertificate.js";
import { writeAuditLog } from "../../utils/auditLogger.js";
import {
  buildCentralQuestionPayload,
  formatQuestionForAdmin,
  normalizeCategoryType,
} from "../../utils/questionBank.js";
import { validateTrackTemplateQuestionAssignment } from "../../utils/trackTemplateValidation.js";
import {
  CATEGORY_SLUG_BY_TITLE,
  assertObjectId,
  getActorName,
  getCategoryTitle,
  getTrackTemplateIconKey,
  listKnownQuestionCategories,
  slugifyCategory,
} from "./adminCommon.js";

const normalizeTrackType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("daily challenge")) return "Daily Challenge";
  if (normalized.includes("daily task")) return "Daily Task";
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

  const normalizedType = (template.trackType === "Daily Challenge" || template.trackType === "Daily Task")
    ? template.trackType
    : normalizeTrackType(template.category);
  let orderedQuestionIds = [];
  if (normalizedType === "Daily Task") {
    orderedQuestionIds = (template.dayAssignments || [])
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .flatMap((assignment) => (assignment.tasks || []).map((t) => t.questionId))
      .filter(Boolean);
  } else {
    orderedQuestionIds = [...(template.dayAssignments || [])]
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map((assignment) => assignment.questionId)
      .filter(Boolean);
  }

  await Track.findOneAndUpdate(
    {
      batchId: template.batchId,
      trackType: normalizedType,
    },
    {
      $set: {
        durationDays: Number(template.totalDays || orderedQuestionIds.length || 1),
        orderedQuestionIds,
      },
    },
    { new: true, upsert: true }
  );

  if (normalizedType === "Daily Challenge") {
    await Batch.findByIdAndUpdate(template.batchId, {
      $set: { assignedDailyChallengeTrack: template._id },
    });
  } else if (normalizedType === "Daily Task") {
    await Batch.findByIdAndUpdate(template.batchId, {
      $set: { assignedDailyTaskTrack: template._id },
    });
  }
};

const logTrackTemplateEvent = async ({ verb, action, detail, actor, metadata = {}, entityId = null }) => {
  await writeAuditLog({
    verb,
    entityType: "TrackTemplate",
    entityId,
    action,
    detail,
    actor,
    metadata,
  });
};

const logTrackTemplateValidationFailure = async ({ templateId, action, detail, actor, metadata = {} }) => {
  await writeAuditLog({
    verb: "Validation Failed",
    entityType: "TrackTemplate",
    entityId: templateId,
    action,
    detail,
    actor,
    metadata: {
      ...metadata,
      outcome: "rejected",
    },
  });
};

const detectResourceType = (file = {}) => {
  const name = String(file.originalname || "").toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();
  if (mime.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/.test(name)) return "Video";
  if (mime.includes("sheet") || /\.(xls|xlsx|csv)$/.test(name)) return "Sheet";
  if (mime.includes("pdf") || /\.pdf$/.test(name)) return "PDF";
  return "Link";
};

const uploadResourceFile = async (file) => {
  if (!file?.buffer) return null;
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return {
      secure_url: `data:${file.mimetype || "application/octet-stream"};base64,${file.buffer.toString("base64")}`,
    };
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: "techlearn/resources",
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(file.buffer);
  });
};

export const listQuestionCategories = async (req, res) => {
  try {
    const categories = await listKnownQuestionCategories();
    const data = await Promise.all(
      categories.map(async (category) => {
        const questionFilter = {
          $or: [
            { categoryId: category.id },
            { categorySlug: category.slug },
          ],
        };
        const [total, active] = await Promise.all([
          Question.countDocuments(questionFilter),
          Question.countDocuments({
            ...questionFilter,
            status: "Active",
            isActive: { $ne: false },
          }),
        ]);

        return {
          id: category.id,
          slug: category.slug,
          title: category.title,
          subtitle: category.subtitle,
          total,
          active,
          icon: category.icon,
          categoryType: category.categoryType,
        };
      })
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listQuestionCategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch question categories." });
  }
};

const removeQuestionAssignmentAcrossTemplates = async (questionId) => {
  await TrackTemplate.updateMany({}, { $pull: { dayAssignments: { questionId } } });
};

export const createQuestionCategory = async (req, res) => {
  try {
    const { title, subtitle, icon } = req.body;
    const categoryType = normalizeCategoryType(req.body.categoryType);

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Category title is required." });
    }

    if (!categoryType) {
      return res.status(400).json({ success: false, message: "A valid categoryType is required." });
    }

    const slug = slugifyCategory(title);
    if (!slug) {
      return res.status(400).json({ success: false, message: "Category title must contain letters or numbers." });
    }

    const existingBySlug = await Category.findOne({ slug }).lean();
    if (existingBySlug) {
      return res.status(409).json({ success: false, message: "A category with this title already exists." });
    }

    const category = await Category.create({
      slug,
      title: title.trim(),
      description: subtitle?.trim() || "Custom question category",
      icon: icon || "chart",
      categoryType,
      createdBy: req.user?._id,
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
        subtitle: category.description,
        total: 0,
        active: 0,
        icon: category.icon,
        categoryType: category.categoryType,
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

    if (req.body.categoryType) {
      return res.status(400).json({
        success: false,
        message: "categoryType cannot be changed after category creation.",
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Question category not found." });
    }

    const nextTitle = req.body.title?.trim() || category.title;
    const nextSubtitle = req.body.subtitle?.trim() || category.description;
    const nextIcon = req.body.icon || category.icon;

    const nextSlug = slugifyCategory(nextTitle);
    if (!nextSlug) {
      return res.status(400).json({ success: false, message: "Category title must contain letters or numbers." });
    }

    const duplicate = await Category.findOne({
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
    category.description = nextSubtitle;
    category.icon = nextIcon;
    await category.save();

    await Question.updateMany(
      {
        $or: [{ categoryId: category._id }, { categorySlug: previousSlug }, { categoryTitle: previousTitle }],
      },
      {
        $set: {
          categoryId: category._id,
          categoryType: category.categoryType,
          categorySlug: category.slug,
          categoryTitle: category.title,
          trackType: category.title,
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
        subtitle: category.description,
        icon: category.icon,
        categoryType: category.categoryType,
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

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Question category not found." });
    }

    const activeQuestions = await Question.countDocuments({
      $or: [{ categoryId: category._id }, { categorySlug: category.slug }, { categoryTitle: category.title }],
      isActive: { $ne: false },
    });

    if (activeQuestions > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a category that still has active questions. Delete or archive the questions first.",
      });
    }

    await Category.findByIdAndDelete(category._id);

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
    const query = { isActive: { $ne: false } };
    let category = null;

    if (req.query.categorySlug) {
      category = await Category.findOne({ slug: req.query.categorySlug }).lean();
      if (!category) {
        return res.status(404).json({ success: false, message: "Question category not found." });
      }
      query.$or = [{ categoryId: category._id }, { categorySlug: category.slug }];
    }

    if (req.query.categoryId) {
      if (!assertObjectId(req.query.categoryId, "categoryId", res)) return;
      category = await Category.findById(req.query.categoryId).lean();
      if (!category) {
        return res.status(404).json({ success: false, message: "Question category not found." });
      }
      query.categoryId = category._id;
      delete query.$or;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.difficulty) query.difficulty = req.query.difficulty;

    const questions = await Question.find(query)
      .select("+content.hiddenTestCases +content.correctOption +content.referenceSolution")
      .populate("categoryId", "title slug categoryType")
      .sort({ createdAt: -1 })
      .lean();
    const data = questions.map((question) => formatQuestionForAdmin(question, question.categoryId || category));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listQuestionsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch questions." });
  }
};

export const createQuestionAdmin = async (req, res) => {
  try {
    const { title, categorySlug, categoryId } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Question title is required." });
    }

    let category = null;
    if (categoryId) {
      if (!assertObjectId(categoryId, "categoryId", res)) return;
      category = await Category.findById(categoryId);
    } else if (categorySlug) {
      category = await Category.findOne({ slug: categorySlug });
    }

    if (!category) {
      return res.status(400).json({ success: false, message: "Selected central Question Bank category does not exist." });
    }

    const payload = buildCentralQuestionPayload({ category, body: req.body });
    const question = await Question.create(payload);

    await writeAuditLog({
      verb: "Created",
      entityType: "Question",
      entityId: question._id,
      action: "Created question",
      detail: question.title,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: formatQuestionForAdmin(question, category) });
  } catch (error) {
    console.error("createQuestionAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to create question.", error: error.message });
  }
};

export const getQuestionDetailAdmin = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!assertObjectId(questionId, "questionId", res)) return;

    const question = await Question.findById(questionId)
      .select("+content.hiddenTestCases +content.correctOption +content.referenceSolution")
      .populate("categoryId", "title slug categoryType")
      .lean();
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    return res.status(200).json({
      success: true,
      data: formatQuestionForAdmin(question, question.categoryId),
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

    const existing = await Question.findById(questionId)
      .select("+content.hiddenTestCases +content.correctOption +content.referenceSolution");

    if (!existing) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    const category = await Category.findById(existing.categoryId || req.body.categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: "Question must belong to an existing central category." });
    }

    const payload = buildCentralQuestionPayload({
      category,
      body: req.body,
      existingQuestion: existing,
    });

    const question = await Question.findByIdAndUpdate(questionId, { $set: payload }, { new: true, runValidators: true });

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

    return res.status(200).json({ success: true, data: formatQuestionForAdmin(question, category) });
  } catch (error) {
    console.error("updateQuestionAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to update question.", error: error.message });
  }
};

export const deleteQuestionAdmin = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!assertObjectId(questionId, "questionId", res)) return;

    const question = await Question.findByIdAndUpdate(
      questionId,
      { $set: { isActive: false, status: "Archived" } },
      { new: true }
    );
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    await removeQuestionAssignmentAcrossTemplates(question._id);

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

    const trackType = req.body.trackType || "Daily Challenge";
    if (trackType === "Daily Challenge" || trackType === "Daily Task") {
      const existing = await TrackTemplate.findOne({
        batchId,
        trackType,
        status: "Active",
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A batch cannot have multiple ${trackType} tracks simultaneously.`,
        });
      }
    }

    const schedule = resolveTemplateSchedule(req.body);
    if (schedule.error) {
      return res.status(400).json({ success: false, message: schedule.error });
    }

    const dayAssignments = [];
    for (let i = 1; i <= schedule.totalDays; i++) {
      dayAssignments.push({
        dayNumber: i,
        questionId: null,
        tasks: [],
      });
    }

    const template = await TrackTemplate.create({
      name: name.trim(),
      trackType: req.body.trackType || "Daily Challenge",
      description: description?.trim() || `${schedule.totalDays}-day ${category} track template`,
      category: category.trim(),
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      batchId,
      totalDays: schedule.totalDays,
      status: status || "Active",
      iconKey: iconKey || getTrackTemplateIconKey(category),
      dayAssignments,
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
      .populate("dayAssignments.tasks.questionId")
      .lean();
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    let questionFilter = { status: "Active", isActive: { $ne: false } };
    if (template.trackType === "Daily Task") {
      if (template.category && template.category !== "Daily Task") {
        const categoriesList = template.category.split(",").map((c) => c.trim()).filter(Boolean);
        if (categoriesList.length > 0) {
          const dbCategories = await Category.find({ title: { $in: categoriesList } }).lean();
          const categoryIds = dbCategories.map((c) => c._id);
          const categorySlugs = dbCategories.map((c) => c.slug);
          questionFilter.$or = [
            { categoryId: { $in: categoryIds } },
            { categorySlug: { $in: categorySlugs } },
          ];
        }
      }
    } else {
      const categorySlug = CATEGORY_SLUG_BY_TITLE[template.category] || slugifyCategory(template.category);
      const category = await Category.findOne({ slug: categorySlug }).lean();
      questionFilter = category
        ? { $or: [{ categoryId: category._id }, { categorySlug: category.slug }], status: "Active", isActive: { $ne: false } }
        : { categorySlug, status: "Active", isActive: { $ne: false } };
    }
    const availableQuestions = await Question.find(questionFilter).populate("categoryId", "title slug categoryType").lean();

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
        trackType: template.trackType || "Daily Challenge",
        dayAssignments: (template.dayAssignments || []).map((assignment) => ({
          dayNumber: assignment.dayNumber,
          questionId: assignment.questionId?._id || assignment.questionId,
          questionTitle: assignment.questionId?.title || "",
          difficulty: assignment.questionId?.difficulty || "",
          track: getCategoryTitle(assignment.questionId || {}),
          tasks: (assignment.tasks || []).map((t) => ({
            taskType: t.taskType,
            questionId: t.questionId?._id || t.questionId,
            questionTitle: t.questionId?.title || "Task Question",
          })),
        })),
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

    const nextTrackType = req.body.trackType || template.trackType;
    const nextBatchId = req.body.batchId || template.batchId;
    if (nextTrackType === "Daily Challenge" || nextTrackType === "Daily Task") {
      const existing = await TrackTemplate.findOne({
        _id: { $ne: templateId },
        batchId: nextBatchId,
        trackType: nextTrackType,
        status: "Active",
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A batch cannot have multiple ${nextTrackType} tracks simultaneously.`,
        });
      }
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
      if (schedule.totalDays !== template.totalDays) {
        const currentDaysCount = template.dayAssignments.length;
        if (schedule.totalDays > currentDaysCount) {
          for (let i = currentDaysCount + 1; i <= schedule.totalDays; i++) {
            template.dayAssignments.push({
              dayNumber: i,
              questionId: null,
              tasks: [],
            });
          }
        } else if (schedule.totalDays < currentDaysCount) {
          template.dayAssignments = template.dayAssignments.filter(
            (assignment) => assignment.dayNumber <= schedule.totalDays
          );
        }
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

    // Clean up references in Batch
    await Batch.updateMany(
      { assignedDailyTaskTrack: templateId },
      { $unset: { assignedDailyTaskTrack: "" } }
    );
    await Batch.updateMany(
      { assignedDailyChallengeTrack: templateId },
      { $unset: { assignedDailyChallengeTrack: "" } }
    );

    // Clean up corresponding synced Track
    const normalizedType = template.trackType === "Daily Task" ? "Daily Task" : "Daily Challenge";
    await Track.deleteMany({
      batchId: template.batchId,
      trackType: normalizedType,
    });

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
    const { dayNumber, questionId, taskType } = req.body;
    if (!assertObjectId(templateId, "templateId", res) || !assertObjectId(questionId, "questionId", res)) return;

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const normalizedDayNumber = Number(dayNumber);

    if (template.trackType === "Daily Task") {
      if (!taskType) {
        return res.status(400).json({ success: false, message: "taskType is required for Daily Tasks." });
      }

      const existingDayIndex = template.dayAssignments.findIndex(
        (assignment) => assignment.dayNumber === normalizedDayNumber
      );

      if (existingDayIndex >= 0) {
        const dayAssignment = template.dayAssignments[existingDayIndex];
        const existingTaskIndex = dayAssignment.tasks.findIndex(
          (t) => String(t.questionId) === String(questionId) && t.taskType === taskType
        );

        if (existingTaskIndex === -1) {
          dayAssignment.tasks.push({ taskType, questionId });
        }
      } else {
        template.dayAssignments.push({
          dayNumber: normalizedDayNumber,
          tasks: [{ taskType, questionId }],
        });
      }
    } else {
      const validation = await validateTrackTemplateQuestionAssignment({ templateId, dayNumber, questionId });
      if (!validation.valid) {
        await logTrackTemplateValidationFailure({
          templateId,
          action: "Assign track template day rejected",
          detail: validation.message,
          actor: req.user,
          metadata: { dayNumber, questionId },
        });
        return res.status(validation.status || 400).json({ success: false, message: validation.message });
      }

      const { normalizedDayNumber: valDayNumber } = validation;

      const existingIndex = template.dayAssignments.findIndex(
        (assignment) => assignment.dayNumber === valDayNumber
      );
      if (existingIndex >= 0) {
        template.dayAssignments[existingIndex].questionId = questionId;
      } else {
        template.dayAssignments.push({ dayNumber: valDayNumber, questionId });
      }
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
    await logTrackTemplateEvent({
      verb: "Updated",
      action: "Assigned question to track template day",
      detail: `Day ${normalizedDayNumber}`,
      actor: req.user,
      entityId: template._id,
      metadata: { dayNumber: normalizedDayNumber, questionId },
    });
    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    if (error?.name === "VersionError") {
      await logTrackTemplateValidationFailure({
        templateId: req.params.templateId,
        action: "Assign track template day conflict",
        detail: "Concurrent update detected while assigning a question to a track template day.",
        actor: req.user,
        metadata: { dayNumber: req.body?.dayNumber, questionId: req.body?.questionId },
      });
      return res.status(409).json({ success: false, message: "Track template was modified by another request. Please retry." });
    }
    console.error("assignTrackTemplateDay error:", error);
    return res.status(500).json({ success: false, message: "Failed to assign track template day." });
  }
};

export const removeTrackTemplateDay = async (req, res) => {
  try {
    const { templateId, dayNumber } = req.params;
    const { questionId } = req.query;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const targetDayNumber = Number(dayNumber);
    const dayIndex = template.dayAssignments.findIndex(
      (assignment) => assignment.dayNumber === targetDayNumber
    );

    if (dayIndex >= 0) {
      if (questionId) {
        template.dayAssignments[dayIndex].tasks = template.dayAssignments[dayIndex].tasks.filter(
          (t) => String(t.questionId) !== String(questionId)
        );
      } else {
        template.dayAssignments[dayIndex].questionId = null;
        template.dayAssignments[dayIndex].tasks = [];
      }
    }
    await template.save();
    await syncTemplateToTrack(template);
    await logTrackTemplateEvent({
      verb: "Updated",
      action: "Removed day from track template",
      detail: `Day ${dayNumber}`,
      actor: req.user,
      entityId: template._id,
      metadata: { dayNumber },
    });

    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    if (error?.name === "VersionError") {
      await logTrackTemplateValidationFailure({
        templateId: req.params.templateId,
        action: "Remove track template day conflict",
        detail: "Concurrent update detected while removing a track template day.",
        actor: req.user,
        metadata: { dayNumber: req.params.dayNumber },
      });
      return res.status(409).json({ success: false, message: "Track template was modified by another request. Please retry." });
    }
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

    const seenDayNumbers = new Set();
    const seenQuestionIds = new Set();
    for (let index = 0; index < orderedDayAssignments.length; index += 1) {
      const assignment = orderedDayAssignments[index] || {};
      const dayNumber = Number(assignment.dayNumber || index + 1);
      const questionId = assignment.questionId;

      const validation = await validateTrackTemplateQuestionAssignment({
        templateId,
        dayNumber,
        questionId,
      });
      if (!validation.valid) {
        await logTrackTemplateValidationFailure({
          templateId,
          action: "Reorder track template rejected",
          detail: validation.message,
          actor: req.user,
          metadata: { dayNumber, questionId, index },
        });
        return res.status(validation.status || 400).json({ success: false, message: validation.message });
      }

      if (seenDayNumbers.has(dayNumber)) {
        await logTrackTemplateValidationFailure({
          templateId,
          action: "Reorder track template rejected",
          detail: "Duplicate dayNumber values are not allowed in a track template.",
          actor: req.user,
          metadata: { dayNumber, questionId, index },
        });
        return res.status(400).json({ success: false, message: "Duplicate dayNumber values are not allowed in a track template." });
      }
      if (seenQuestionIds.has(String(questionId))) {
        await logTrackTemplateValidationFailure({
          templateId,
          action: "Reorder track template rejected",
          detail: "Duplicate question assignments are not allowed in a track template.",
          actor: req.user,
          metadata: { dayNumber, questionId, index },
        });
        return res.status(400).json({ success: false, message: "Duplicate question assignments are not allowed in a track template." });
      }

      seenDayNumbers.add(dayNumber);
      seenQuestionIds.add(String(questionId));
    }

    template.dayAssignments = orderedDayAssignments.map((assignment, index) => ({
      dayNumber: Number(assignment.dayNumber || index + 1),
      questionId: assignment.questionId,
    }));
    await template.save();
    await syncTemplateToTrack(template);
    await logTrackTemplateEvent({
      verb: "Updated",
      action: "Reordered track template questions",
      detail: template.name,
      actor: req.user,
      entityId: template._id,
      metadata: { dayAssignments: template.dayAssignments.length },
    });

    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    if (error?.name === "VersionError") {
      await logTrackTemplateValidationFailure({
        templateId: req.params.templateId,
        action: "Reorder track template conflict",
        detail: "Concurrent update detected while reordering track template questions.",
        actor: req.user,
        metadata: { orderedDayAssignments: Array.isArray(req.body?.orderedDayAssignments) ? req.body.orderedDayAssignments.length : 0 },
      });
      return res.status(409).json({ success: false, message: "Track template was modified by another request. Please retry." });
    }
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

    const uploaded = req.file ? await uploadResourceFile(req.file) : null;
    const resource = await Resource.create({
      title: title.trim(),
      category: category.trim(),
      type: uploaded ? detectResourceType(req.file) : type,
      url: uploaded?.secure_url || url || "",
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

    const uploaded = req.file ? await uploadResourceFile(req.file) : null;
    const update = {
      title: req.body.title?.trim(),
      category: req.body.category?.trim(),
      type: uploaded ? detectResourceType(req.file) : req.body.type,
    };

    if (uploaded?.secure_url || req.body.url !== undefined) {
      update.url = uploaded?.secure_url || req.body.url || "";
    }

    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);

    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { $set: update },
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
