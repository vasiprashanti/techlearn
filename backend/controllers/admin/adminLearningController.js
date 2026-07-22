import mongoose from "mongoose";
import Question from "../../models/Questions.js";
import Category from "../../models/Category.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import Track from "../../models/Track.js";
import Batch from "../../models/Batch.js";
import Resource from "../../models/Resource.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import FinalTest from "../../models/FinalTest.js";
import CertificateTemplate from "../../models/CertificateTemplate.js";
import IssuedCertificate from "../../models/IssuedCertificate.js";
import { writeAuditLog } from "../../utils/auditLogger.js";
import {
  buildCentralQuestionPayload,
  formatQuestionForAdmin,
  normalizeCategoryType,
} from "../../utils/questionBank.js";
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

const resolveTemplateDuration = ({ totalDays, durationDays }) => {
  const resolvedTotalDays = Number(durationDays || totalDays || 0);
  if (!Number.isInteger(resolvedTotalDays) || resolvedTotalDays < 1) {
    return { error: "totalDays must be at least 1." };
  }
  return { totalDays: resolvedTotalDays };
};

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveTemplateCategories = async (categoryNames = []) => {
  const names = categoryNames.map((name) => String(name || "").trim()).filter(Boolean);
  const slugs = names.map((name) => slugifyCategory(name)).filter(Boolean);
  if (!names.length) return [];

  return Category.find({
    $or: [
      { slug: { $in: slugs } },
      { title: { $in: names } },
      ...names.map((name) => ({ title: new RegExp(`^${escapeRegex(name)}$`, "i") })),
    ],
  }).lean();
};

const syncTemplateToTrack = async (template) => {
  if (!template?.batchId) return;

  const normalizedType = (template.trackType === "Daily Challenge" || template.trackType === "Daily Task")
    ? template.trackType
    : normalizeTrackType(template.category);
  let orderedQuestionIds = [];
  if (normalizedType === "Daily Task" || normalizedType === "Daily Challenge") {
    orderedQuestionIds = (template.dayAssignments || [])
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .flatMap((assignment) => {
        if (assignment.tasks && assignment.tasks.length > 0) {
          return assignment.tasks.map((t) => t.questionId);
        }
        return [assignment.questionId];
      })
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

  if (normalizedType === "Daily Challenge" || normalizedType === "Daily Task") {
    const trackField = normalizedType === "Daily Challenge"
      ? "assignedDailyChallengeTrack"
      : "assignedDailyTaskTrack";
    const assignedAtField = normalizedType === "Daily Challenge"
      ? "assignedDailyChallengeTrackAt"
      : "assignedDailyTaskTrackAt";
    const batch = await Batch.findById(template.batchId).select(`${trackField} ${assignedAtField}`).lean();
    if (batch) {
      const isNewAssignment = String(batch[trackField] || "") !== String(template._id);
      await Batch.findByIdAndUpdate(template.batchId, {
        $set: {
          [trackField]: template._id,
          ...(isNewAssignment || !batch[assignedAtField] ? { [assignedAtField]: new Date() } : {}),
        },
      });
    }
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
  let fileBuffer = file?.buffer;
  if (!fileBuffer && file?.path) {
    try {
      fileBuffer = await fs.promises.readFile(file.path);
    } catch (err) {
      console.error("Failed to read resource temp file:", err);
    }
  }

  if (!fileBuffer) return null;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return {
      secure_url: `data:${file.mimetype || "application/octet-stream"};base64,${fileBuffer.toString("base64")}`,
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
      .end(fileBuffer);
  });
};

export const listQuestionCategories = async (req, res) => {
  try {
    const includeDrafts = req.query.includeDrafts === "true" || req.query.includeAll === "true" || req.query.all === "true";
    const categories = await listKnownQuestionCategories({ includeDrafts });
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
          status: category.status,
          visibility: category.visibility || "Both",
          usage: category.usage || category.visibility || "Both",
          batches: category.batches || [],
          bannerImage: category.bannerImage || "",
          defaultIcon: category.defaultIcon || "Code",
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

const normalizeCategoryStatus = (status, fallback = "Draft") => {
  const normalized = String(status || fallback).trim();
  return ["Active", "Draft", "Archived"].includes(normalized) ? normalized : fallback;
};

export const createQuestionCategory = async (req, res) => {
  try {
    const { title, subtitle, icon, status, visibility, usage, batches, bannerImage, defaultIcon } = req.body;
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

    const resolvedUsage = usage || visibility || "Both";

    let parsedBatches = batches || [];
    if (typeof batches === "string") {
      try {
        parsedBatches = JSON.parse(batches);
      } catch (e) {
        parsedBatches = batches.split(",").map(id => id.trim()).filter(Boolean);
      }
    }

    let resolvedBannerImage = bannerImage || "";
    if (req.file) {
      const uploadRes = await uploadResourceFile(req.file);
      if (uploadRes?.secure_url) {
        resolvedBannerImage = uploadRes.secure_url;
      }
    }

    const category = await Category.create({
      slug,
      title: title.trim(),
      description: subtitle || "",
      icon: icon || "chart",
      categoryType,
      status: normalizeCategoryStatus(status),
      usage: resolvedUsage,
      visibility: resolvedUsage,
      batches: parsedBatches,
      bannerImage: resolvedBannerImage,
      defaultIcon: defaultIcon || "Code",
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
        status: category.status,
        visibility: category.visibility,
        usage: category.usage,
        batches: category.batches,
        bannerImage: category.bannerImage,
        defaultIcon: category.defaultIcon,
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

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Question category not found." });
    }

    if (req.body.categoryType && req.body.categoryType !== category.categoryType) {
      return res.status(400).json({
        success: false,
        message: "categoryType cannot be changed after category creation.",
      });
    }

    const nextTitle = req.body.title?.trim() || category.title;
    const nextSubtitle = req.body.subtitle !== undefined ? req.body.subtitle : category.description;
    const nextIcon = req.body.icon || category.icon;
    const nextStatus = normalizeCategoryStatus(req.body.status, category.status);

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
    category.status = nextStatus;

    if (req.body.usage !== undefined) {
      category.usage = req.body.usage;
      category.visibility = req.body.usage;
    } else if (req.body.visibility !== undefined) {
      category.usage = req.body.visibility;
      category.visibility = req.body.visibility;
    }

    if (req.body.batches !== undefined) {
      let parsedBatches = req.body.batches;
      if (typeof parsedBatches === "string") {
        try {
          parsedBatches = JSON.parse(parsedBatches);
        } catch (e) {
          parsedBatches = parsedBatches.split(",").map(id => id.trim()).filter(Boolean);
        }
      }
      category.batches = parsedBatches;
    }
    
    if (req.file) {
      const uploadRes = await uploadResourceFile(req.file);
      if (uploadRes?.secure_url) {
        category.bannerImage = uploadRes.secure_url;
      }
    } else if (req.body.bannerImage !== undefined) {
      category.bannerImage = req.body.bannerImage;
    }

    if (req.body.defaultIcon !== undefined) {
      category.defaultIcon = req.body.defaultIcon;
    }

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
        status: category.status,
        visibility: category.visibility,
        usage: category.usage,
        batches: category.batches,
        bannerImage: category.bannerImage,
        defaultIcon: category.defaultIcon,
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

    // Archive associated questions
    await Question.updateMany(
      {
        $or: [{ categoryId: category._id }, { categorySlug: category.slug }, { categoryTitle: category.title }],
      },
      { $set: { isActive: false, status: "Archived" } }
    );

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
      const slugs = req.query.categorySlug.split(",").map((s) => s.trim()).filter(Boolean);
      if (slugs.length > 1) {
        const categories = await Category.find({ slug: { $in: slugs } }).lean();
        const categoryIds = categories.map((c) => c._id);
        const categorySlugs = categories.map((c) => c.slug);
        query.$or = [
          { categoryId: { $in: categoryIds } },
          { categorySlug: { $in: categorySlugs } }
        ];
      } else if (slugs.length === 1) {
        category = await Category.findOne({ slug: slugs[0] }).lean();
        if (!category) {
          return res.status(404).json({ success: false, message: "Question category not found." });
        }
        query.$or = [{ categoryId: category._id }, { categorySlug: category.slug }];
      }
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
    if (req.query.search) {
      const expression = new RegExp(req.query.search.trim(), "i");
      query.$and = [...(query.$and || []), { $or: [{ title: expression }, { tags: expression }, { description: expression }] }];
    }

    if (req.query.tag) {
      query.tags = new RegExp(`^${String(req.query.tag).trim()}$`, "i");
    }

    const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };
    const sortKey = req.query.sort || "newest";
    const sortOptions = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, prompt: { description: 1, title: 1 } };
    const questions = await Question.find(query)
      .select("+content.hiddenTestCases +content.correctOption +content.referenceSolution")
      .populate("categoryId", "title slug categoryType")
      .sort(sortOptions[sortKey] || sortOptions.newest)
      .lean();
    const sortedQuestions = ["easy-hard", "hard-easy"].includes(sortKey)
      ? questions.sort((a, b) => {
          const left = difficultyRank[a.difficulty] || 99;
          const right = difficultyRank[b.difficulty] || 99;
          return sortKey === "easy-hard" ? left - right : right - left;
        })
      : questions;
    const data = sortedQuestions.map((question) => formatQuestionForAdmin(question, question.categoryId || category));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listQuestionsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch questions." });
  }
};

export const createQuestionAdmin = async (req, res) => {
  try {
    const incomingQuestions = Array.isArray(req.body.questions) ? req.body.questions : null;
    if (incomingQuestions) {
      const createdQuestions = [];
      for (const questionBody of incomingQuestions) {
        const categoryId = questionBody.categoryId || req.body.categoryId;
        const categorySlug = questionBody.categorySlug || req.body.categorySlug;
        let category = null;
        if (categoryId) {
          if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: "categoryId must be a valid ObjectId." });
          }
          category = await Category.findById(categoryId);
        } else if (categorySlug) {
          category = await Category.findOne({ slug: categorySlug });
        }
        if (!category) {
          return res.status(400).json({ success: false, message: "Selected central Question Bank category does not exist." });
        }

        const payload = await buildCentralQuestionPayload({ category, body: { ...req.body, ...questionBody } });
        const question = await Question.create(payload);
        createdQuestions.push(formatQuestionForAdmin(question, category));
      }

      await writeAuditLog({
        verb: "Created",
        entityType: "Question",
        action: "Bulk created questions",
        detail: `${createdQuestions.length} questions`,
        actor: req.user,
      });

      return res.status(201).json({ success: true, data: createdQuestions });
    }

    const { title, categorySlug, categoryId, description, problemDescription } = req.body;

    if (!title?.trim() && !description && !problemDescription) {
      return res.status(400).json({ success: false, message: "Question title or prompt description is required." });
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

    const payload = await buildCentralQuestionPayload({ category, body: req.body });
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

export const getQuestionCategoryUsage = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!assertObjectId(categoryId, "categoryId", res)) return;

    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).json({ success: false, message: "Question category not found." });
    }

    const questionFilter = {
      isActive: { $ne: false },
      $or: [{ categoryId: category._id }, { categorySlug: category.slug }, { categoryTitle: category.title }],
    };

    const [totalQuestions, activeQuestions, easyQuestions, mediumQuestions, hardQuestions, templates, batches] = await Promise.all([
      Question.countDocuments(questionFilter),
      Question.countDocuments({ ...questionFilter, status: "Active" }),
      Question.countDocuments({ ...questionFilter, difficulty: "Easy" }),
      Question.countDocuments({ ...questionFilter, difficulty: "Medium" }),
      Question.countDocuments({ ...questionFilter, difficulty: "Hard" }),
      TrackTemplate.find({
        $or: [
          { category: category.title },
          { category: { $regex: new RegExp(`(^|,\\s*)${category.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s*,|$)`, "i") } },
        ],
      }).lean(),
      Batch.find({ assignedTrackTemplate: { $ne: null } })
        .populate("collegeId", "name")
        .populate("assignedTrackTemplate", "name category status")
        .lean(),
    ]);

    const templateIds = templates.map((template) => template._id);
    const categoryBatches = batches.filter((batch) => templateIds.some((id) => String(id) === String(batch.assignedTrackTemplate?._id)));
    const studentsReached = categoryBatches.reduce((sum, batch) => sum + Number(batch.batchSize || batch.students?.length || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          totalQuestions,
          activeQuestions,
          easyQuestions,
          mediumQuestions,
          hardQuestions,
          usedInTrackTemplates: templates.length,
          activeTracks: templates.filter((template) => template.status === "Active").length,
          activeBatches: categoryBatches.length,
          studentsReached,
        },
        trackTemplates: templates.map((template) => ({
          id: template._id,
          name: template.name,
          status: template.status,
          students: studentsReached,
        })),
        batches: categoryBatches.map((batch) => ({
          id: batch._id,
          name: batch.name,
          college: batch.collegeId?.name || batch.college || "",
          students: batch.batchSize || batch.students?.length || 0,
        })),
      },
    });
  } catch (error) {
    console.error("getQuestionCategoryUsage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch category usage analytics." });
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

    const payload = await buildCentralQuestionPayload({
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
    const data = templates.map((template) => {
      const effectiveType = template.trackType
        ? template.trackType
        : (template.category === "Daily Task" ? "Daily Task" : "Daily Challenge");
      return {
        id: template._id,
        name: template.name,
        description: template.description,
        totalDays: template.totalDays,
        questionsAssigned: (template.dayAssignments || []).reduce((count, day) => count + (day.questionId ? 1 : 0) + (day.tasks?.length || 0), 0),
        status: template.status,
        category: template.category,
        iconKey: template.iconKey || getTrackTemplateIconKey(template.category),
        batchId: template.batchId?._id || template.batchId,
        assignedBatch: template.batchId?.name || "",
        trackType: effectiveType,
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listTrackTemplates error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch track templates." });
  }
};

export const createTrackTemplate = async (req, res) => {
  try {
    const { name, description, status, iconKey, batchId, defaultReleaseTime } = req.body;
    const category = req.body.category || req.body.trackType;

    if (!name?.trim() || !category?.trim()) {
      return res.status(400).json({ success: false, message: "Template name and category/trackType are required." });
    }

    // Verify category doesn't have "Practice" visibility
    const categoriesList = category.split(",").map((c) => c.trim()).filter(Boolean);
    const dbCategories = await resolveTemplateCategories(categoriesList);
    const hasPracticeCategory = dbCategories.some((cat) => cat.visibility === "Practice");
    if (hasPracticeCategory) {
      return res.status(400).json({
        success: false,
        message: "Templates cannot be associated with categories configured for 'Practice' visibility.",
      });
    }

    if (batchId) {
      if (!assertObjectId(batchId, "batchId", res)) return;
      const batch = await Batch.findById(batchId).lean();
      if (!batch) return res.status(404).json({ success: false, message: "Assigned batch not found." });
    }

    // Disabled: A batch can have multiple track templates in draft/active status; active tracking is determined by single select in batch form.

    const duration = resolveTemplateDuration(req.body);
    if (duration.error) {
      return res.status(400).json({ success: false, message: duration.error });
    }

    const dayAssignments = [];
    for (let i = 1; i <= duration.totalDays; i++) {
      dayAssignments.push({
        dayNumber: i,
        questionId: null,
        tasks: [],
        releaseTimeOverride: null,
      });
    }

    const template = await TrackTemplate.create({
      name: name.trim(),
      trackType: req.body.trackType || "Daily Challenge",
     description: description?.trim() || `${duration.totalDays}-day ${category} track template`,
      category: categoriesList
        .map((name) => dbCategories.find((cat) => (
          cat.slug === slugifyCategory(name) || cat.title.toLowerCase() === name.toLowerCase()
        ))?.title || name)
        .join(", "),
      batchId: batchId || null,
      totalDays: duration.totalDays,
      status: status || "Active",
      iconKey: iconKey || getTrackTemplateIconKey(category),
      dayAssignments,
      defaultReleaseTime: defaultReleaseTime || "00:00",
      versionHistory: [{ version: 1, label: "v1 - Initial template", changedBy: getActorName(req.user) }],
    });

    if (template.batchId) await syncTemplateToTrack(template);

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
      .populate("batchId", "name startDate expiryDate assignedTrackTemplateIds assignedTrackTemplate assignedDailyTaskTrack assignedDailyChallengeTrack assignedTrackTemplateAt assignedDailyTaskTrackAt assignedDailyChallengeTrackAt")
      .populate("dayAssignments.questionId")
      .populate("dayAssignments.tasks.questionId")
      .populate("dayAssignments.tasks.batchId", "name")
      .lean();
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const effectiveType = template.trackType
      ? template.trackType
      : (template.category === "Daily Task" ? "Daily Task" : "Daily Challenge");

    let questionFilter = { status: "Active", isActive: { $ne: false } };
    if (effectiveType === "Daily Task" || effectiveType === "Daily Challenge") {
      if (template.category) {
        const categoriesList = template.category.split(",").map((c) => c.trim()).filter(Boolean);
        const questionCategories = categoriesList.filter((name) => !["daily task", "daily challenge"].includes(name.toLowerCase()));
        if (questionCategories.length > 0) {
          const dbCategories = await resolveTemplateCategories(questionCategories);
          const categoryIds = dbCategories.map((c) => c._id);
          const categorySlugs = [...new Set([
            ...dbCategories.map((c) => c.slug),
            ...questionCategories.map((name) => slugifyCategory(name)),
          ].filter(Boolean))];
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

    const batch = template.batchId;
    let isCurrentlyAssigned = false;
    if (batch) {
      const activeIds = [
        ...(batch.assignedTrackTemplateIds || []),
        batch.assignedTrackTemplate,
        batch.assignedDailyTaskTrack,
        batch.assignedDailyChallengeTrack,
      ].filter(Boolean).map(id => String(id));
      isCurrentlyAssigned = activeIds.includes(String(template._id));
    }

    return res.status(200).json({
      success: true,
      data: {
        id: template._id,
        name: template.name,
        description: template.description,
        totalDays: template.totalDays,
        questionsAssigned: (template.dayAssignments || []).reduce(
          (count, assignment) => count + (assignment.questionId ? 1 : 0) + (assignment.tasks?.length || 0),
          0
        ),
        status: template.status,
        category: template.category,
        iconKey: template.iconKey || getTrackTemplateIconKey(template.category),
        batchId: template.batchId?._id || template.batchId,
        assignedBatch: isCurrentlyAssigned ? (template.batchId?.name || "") : "",
        batchStartDate: isCurrentlyAssigned ? (template.batchId?.startDate || null) : null,
        batchExpiryDate: isCurrentlyAssigned ? (template.batchId?.expiryDate || null) : null,
        assignedAt: isCurrentlyAssigned ? (
          template.trackType === "Daily Task"
            ? template.batchId?.assignedDailyTaskTrackAt || template.batchId?.assignedTrackTemplateAt || null
            : template.batchId?.assignedDailyChallengeTrackAt || template.batchId?.assignedTrackTemplateAt || null
        ) : null,
        versionHistory: template.versionHistory || [],
        trackType: effectiveType,
        dayAssignments: (template.dayAssignments || []).map((assignment) => ({
          dayNumber: assignment.dayNumber,
          questionId: assignment.questionId?._id || assignment.questionId,
          questionTitle: assignment.questionId?.title || "",
          difficulty: assignment.questionId?.difficulty || "",
          track: getCategoryTitle(assignment.questionId || {}),
          tasks: (assignment.tasks || []).map((t) => ({
            taskType: t.taskType,
            questionId: t.questionId?._id || t.questionId,
            batchId: t.batchId?._id || t.batchId || template.batchId?._id || template.batchId,
            batchName: t.batchId?.name || template.batchId?.name || "",
            questionTitle: t.questionId?.title || "Task Question",
            xpValue: Number(t.xpValue || 0),
            status: t.status || "Published",
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
          qid: question.qid,
          title: question.title,
          description: question.description,
          tags: question.tags || [],
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

export const duplicateTrackTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const source = await TrackTemplate.findById(templateId).lean();
    if (!source) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const copy = await TrackTemplate.create({
      name: `${source.name} Copy`,
      trackType: source.trackType,
      description: source.description || "",
      category: source.category,
      batchId: null,
      totalDays: source.totalDays,
      status: "Draft",
      iconKey: source.iconKey || "code",
      dayAssignments: source.dayAssignments || [],
      versionHistory: [{ version: 1, label: "v1 - Duplicated template", changedBy: getActorName(req.user) }],
    });

    await writeAuditLog({
      verb: "Created",
      entityType: "TrackTemplate",
      entityId: copy._id,
      action: "Duplicated track template",
      detail: copy.name,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: copy });
  } catch (error) {
    console.error("duplicateTrackTemplate error:", error);
    return res.status(500).json({ success: false, message: "Failed to duplicate track template." });
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

    const currentTrackType = template.trackType
      ? template.trackType
      : (template.category === "Daily Task" ? "Daily Task" : "Daily Challenge");

    const nextTrackType = req.body.trackType || currentTrackType;
    const nextBatchId = req.body.batchId || template.batchId;
    // Disabled: A batch can have multiple track templates in draft/active status; active tracking is determined by single select in batch form.

    if (req.body.name) template.name = req.body.name.trim();
    if (req.body.description !== undefined) template.description = req.body.description?.trim() || "";
    if (req.body.category !== undefined) {
      const nextCategory = req.body.category.trim();
      if (nextCategory) {
        const categoriesList = nextCategory.split(",").map((c) => c.trim()).filter(Boolean);
        const dbCategories = await resolveTemplateCategories(categoriesList);
        const hasPracticeCategory = dbCategories.some((cat) => cat.visibility === "Practice");
        if (hasPracticeCategory) {
          return res.status(400).json({
            success: false,
            message: "Templates cannot be associated with categories configured for 'Practice' visibility.",
          });
        }
        template.category = categoriesList
          .map((name) => dbCategories.find((cat) => (
            cat.slug === slugifyCategory(name) || cat.title.toLowerCase() === name.toLowerCase()
          ))?.title || name)
          .join(", ");
        template.iconKey = req.body.iconKey || getTrackTemplateIconKey(template.category);
      } else {
        template.category = req.body.trackType || template.trackType || "Daily Challenge";
        template.iconKey = req.body.iconKey || getTrackTemplateIconKey(template.category);
      }
    }
    if (req.body.batchId) {
      if (!assertObjectId(req.body.batchId, "batchId", res)) return;
      const batch = await Batch.findById(req.body.batchId).lean();
      if (!batch) {
        return res.status(404).json({ success: false, message: "Assigned batch not found." });
      }
      template.batchId = req.body.batchId;
    }
    if (req.body.trackType) {
      template.trackType = req.body.trackType;
      if (!req.body.category) {
        template.category = req.body.trackType.trim();
        template.iconKey = req.body.iconKey || getTrackTemplateIconKey(template.category);
      }
    }
    if (req.body.status) template.status = req.body.status;
    if (req.body.defaultReleaseTime !== undefined) {
      template.defaultReleaseTime = req.body.defaultReleaseTime || "00:00";
    }

    if (req.body.totalDays || req.body.durationDays) {
      const duration = resolveTemplateDuration({
        totalDays: req.body.totalDays || template.totalDays,
        durationDays: req.body.durationDays,
      });
      if (duration.error) {
        return res.status(400).json({ success: false, message: duration.error });
      }
      if (duration.totalDays !== template.totalDays) {
        const currentDaysCount = template.dayAssignments.length;
        if (duration.totalDays > currentDaysCount) {
          for (let i = currentDaysCount + 1; i <= duration.totalDays; i++) {
            template.dayAssignments.push({
              dayNumber: i,
              questionId: null,
              tasks: [],
              releaseTimeOverride: null,
            });
          }
        } else if (duration.totalDays < currentDaysCount) {
          template.dayAssignments = template.dayAssignments.filter(
            (assignment) => assignment.dayNumber <= duration.totalDays
          );
        }
      }
      template.totalDays = duration.totalDays;
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
    const { dayNumber, questionId, questionIds, taskType, status, batchId } = req.body;
    const requestedQuestionIds = Array.isArray(questionIds) && questionIds.length ? questionIds : [questionId].filter(Boolean);
    if (!assertObjectId(templateId, "templateId", res)) return;
    if (!requestedQuestionIds.length || requestedQuestionIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: "At least one valid questionId is required." });
    }

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const normalizedDayNumber = Number(dayNumber);
    const questionDocs = await Question.find({ _id: { $in: requestedQuestionIds } })
      .select("_id xpValue xp_value xp points categoryType")
      .lean();
    const questionXpById = new Map(
      questionDocs.map((question) => [
        String(question._id),
        Number(question.xpValue ?? question.xp_value ?? question.xp ?? question.points ?? 10) || 10,
      ])
    );

    if (template.trackType === "Daily Task" || template.trackType === "Daily Challenge") {
      let dayAssignment = template.dayAssignments.find((assignment) => assignment.dayNumber === normalizedDayNumber);
      if (!dayAssignment) {
        template.dayAssignments.push({ dayNumber: normalizedDayNumber, tasks: [] });
        dayAssignment = template.dayAssignments.find((assignment) => assignment.dayNumber === normalizedDayNumber);
      }

      const assignedQuestionIds = new Set(
        template.dayAssignments.flatMap((assignment) => [
          assignment.questionId ? String(assignment.questionId) : null,
          ...(assignment.tasks || []).map((task) => String(task.questionId)),
        ]).filter(Boolean)
      );

      requestedQuestionIds.forEach((id) => {
        if (assignedQuestionIds.has(String(id))) return;
        const qDoc = questionDocs.find((q) => String(q._id) === String(id));
        let resolvedTaskType = "Coding";
        if (qDoc?.categoryType === "MCQ") {
          resolvedTaskType = taskType === "Aptitude" || taskType === "Core CS" ? taskType : "MCQ";
        } else {
          resolvedTaskType = taskType === "SQL" || taskType === "Debugging" ? taskType : "Coding";
        }

        dayAssignment.tasks.push({
          taskType: resolvedTaskType,
          questionId: id,
          batchId: batchId || template.batchId || null,
          xpValue: questionXpById.get(String(id)) || 10,
          status: status || "Published",
        });
      });
    } else {
      if (!Number.isFinite(normalizedDayNumber) || normalizedDayNumber < 1 || normalizedDayNumber > template.totalDays) {
        return res.status(400).json({ success: false, message: "Day number must be within the template duration." });
      }
      if (normalizedDayNumber + requestedQuestionIds.length - 1 > template.totalDays) {
        return res.status(400).json({
          success: false,
          message: "Selected questions exceed the remaining days in this template.",
        });
      }

      const assignedQuestionIds = new Set(
        template.dayAssignments.flatMap((assignment) => [
          assignment.questionId ? String(assignment.questionId) : null,
          ...(assignment.tasks || []).map((task) => String(task.questionId)),
        ]).filter(Boolean)
      );

      requestedQuestionIds.forEach((id, index) => {
        if (assignedQuestionIds.has(String(id))) return;
        const targetDayNumber = normalizedDayNumber + index;
        const existingIndex = template.dayAssignments.findIndex((assignment) => assignment.dayNumber === targetDayNumber);
        if (existingIndex >= 0) {
          template.dayAssignments[existingIndex].questionId = id;
        } else {
          template.dayAssignments.push({ dayNumber: targetDayNumber, questionId: id });
        }
        assignedQuestionIds.add(String(id));
      });
    }

    template.dayAssignments.sort((a, b) => a.dayNumber - b.dayNumber);
    const nextVersion = (template.versionHistory?.length || 0) + 1;
    template.versionHistory = [
      {
        version: nextVersion,
        label: `v${nextVersion} - Assigned ${requestedQuestionIds.length} question${requestedQuestionIds.length === 1 ? "" : "s"} to day ${dayNumber}`,
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
      metadata: { dayNumber: normalizedDayNumber, questionIds: requestedQuestionIds },
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
    const { title, category, type, url, attachedNoteTitle, attachedNoteDay } = req.body;
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
      attachedNoteTitle: attachedNoteTitle?.trim() || "",
      attachedNoteDay: attachedNoteDay ? Number(attachedNoteDay) : null,
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
      attachedNoteTitle: req.body.attachedNoteTitle?.trim(),
      attachedNoteDay: req.body.attachedNoteDay ? Number(req.body.attachedNoteDay) : null,
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

export const bulkDeleteTrackTemplatesAdmin = async (req, res) => {
  try {
    const { templateIds } = req.body;
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      return res.status(400).json({ success: false, message: "templateIds must be a non-empty array." });
    }

    for (const templateId of templateIds) {
      if (!assertObjectId(templateId, "templateId", res)) return;
    }

    const templates = await TrackTemplate.find({ _id: { $in: templateIds } }).lean();
    if (!templates.length) {
      return res.status(404).json({ success: false, message: "No track templates found for the provided IDs." });
    }

    await TrackTemplate.deleteMany({ _id: { $in: templateIds } });

    // Clean up references in Batch
    await Batch.updateMany(
      { assignedDailyTaskTrack: { $in: templateIds } },
      { $unset: { assignedDailyTaskTrack: "" } }
    );
    await Batch.updateMany(
      { assignedDailyChallengeTrack: { $in: templateIds } },
      { $unset: { assignedDailyChallengeTrack: "" } }
    );

    // Clean up corresponding synced Tracks
    const batchIds = templates.map((t) => t.batchId).filter(Boolean);
    if (batchIds.length > 0) {
      await Track.deleteMany({
        batchId: { $in: batchIds },
        trackType: { $in: ["Daily Task", "Daily Challenge"] },
      });
    }

    for (const template of templates) {
      await writeAuditLog({
        verb: "Deleted",
        entityType: "TrackTemplate",
        entityId: template._id,
        action: "Deleted track template in bulk",
        detail: template.name,
        actor: req.user,
      });
    }

    return res.status(200).json({ success: true, message: `${templates.length} track templates deleted successfully.` });
  } catch (error) {
    console.error("bulkDeleteTrackTemplatesAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to bulk delete track templates." });
  }
};

export const bulkDeleteQuestionCategoriesAdmin = async (req, res) => {
  try {
    const { categoryIds } = req.body;
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ success: false, message: "categoryIds must be a non-empty array." });
    }

    for (const categoryId of categoryIds) {
      if (!assertObjectId(categoryId, "categoryId", res)) return;
    }

    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    if (!categories.length) {
      return res.status(404).json({ success: false, message: "No question categories found for the provided IDs." });
    }

    const categorySlugs = categories.map((c) => c.slug).filter(Boolean);
    const categoryTitles = categories.map((c) => c.title).filter(Boolean);

    // Deactivate/archive associated questions for all selected categories
    await Question.updateMany(
      {
        $or: [
          { categoryId: { $in: categoryIds } },
          { categorySlug: { $in: categorySlugs } },
          { categoryTitle: { $in: categoryTitles } },
        ],
      },
      { $set: { isActive: false, status: "Archived" } }
    );

    await Category.deleteMany({ _id: { $in: categoryIds } });

    for (const category of categories) {
      await writeAuditLog({
        verb: "Deleted",
        entityType: "QuestionCategory",
        entityId: category._id,
        action: "Deleted question category in bulk",
        detail: category.title,
        actor: req.user,
      });
    }

    return res.status(200).json({ success: true, message: `${categories.length} question categories deleted successfully.` });
  } catch (error) {
    console.error("bulkDeleteQuestionCategoriesAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to bulk delete question categories." });
  }
};

export const moveQuestionsAdmin = async (req, res) => {
  try {
    const { questionIds, targetCategoryId } = req.body;
    if (!targetCategoryId) {
      return res.status(400).json({ success: false, message: "Target category is required." });
    }
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ success: false, message: "Question IDs must be a non-empty array." });
    }

    const targetCategory = await Category.findById(targetCategoryId);
    if (!targetCategory) {
      return res.status(404).json({ success: false, message: "Target category not found." });
    }

    // Find all questions to move
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: "No questions found to move." });
    }

    // Verify types match
    const targetType = String(targetCategory.categoryType || "").toUpperCase();
    for (const q of questions) {
      const qType = String(q.categoryType || "").toUpperCase();
      if (qType !== targetType) {
        return res.status(400).json({
          success: false,
          message: `Cannot move question '${q.title || q.question}' of type ${qType} to category of type ${targetType}. Types must match.`
        });
      }
    }

    // Perform the move by updating categoryId and categorySlug and categoryTitle
    await Question.updateMany(
      { _id: { $in: questionIds } },
      {
        $set: {
          categoryId: targetCategory._id,
          categorySlug: targetCategory.slug,
          categoryTitle: targetCategory.title,
        }
      }
    );

    // Audit log
    try {
      for (const q of questions) {
        await writeAuditLog({
          verb: "Updated",
          entityType: "Question",
          entityId: q._id,
          action: "Moved question to another category",
          detail: `Moved question from category ID ${q.categoryId} to ${targetCategory.title}`,
          actor: req.user,
        });
      }
    } catch (auditError) {
      console.error("Failed to write audit log for moved questions:", auditError);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully moved ${questions.length} questions to category '${targetCategory.title}'.`
    });
  } catch (error) {
    console.error("moveQuestionsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Server error moving questions." });
  }
};

export const updateTrackTemplateDayOverride = async (req, res) => {
  try {
    const { templateId, dayNumber } = req.params;
    const { releaseTimeOverride } = req.body;
    if (!assertObjectId(templateId, "templateId", res)) return;

    const template = await TrackTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const normalizedDayNumber = Number(dayNumber);
    let dayAssignment = template.dayAssignments.find((assignment) => assignment.dayNumber === normalizedDayNumber);
    if (!dayAssignment) {
      template.dayAssignments.push({
        dayNumber: normalizedDayNumber,
        tasks: [],
        releaseTimeOverride: null,
      });
      dayAssignment = template.dayAssignments.find((assignment) => assignment.dayNumber === normalizedDayNumber);
    }

    dayAssignment.releaseTimeOverride = releaseTimeOverride || null;

    const nextVersion = (template.versionHistory?.length || 0) + 1;
    template.versionHistory = [
      {
        version: nextVersion,
        label: `v${nextVersion} - Updated release time override for day ${dayNumber} to ${releaseTimeOverride || "default"}`,
        changedBy: getActorName(req.user),
        changedAt: new Date(),
      },
      ...(template.versionHistory || []),
    ];

    await template.save();
    await syncTemplateToTrack(template);

    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error("updateTrackTemplateDayOverride error:", error);
    return res.status(500).json({ success: false, message: "Failed to update release time override." });
  }
};

