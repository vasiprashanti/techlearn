import mongoose from "mongoose";
import Question from "../../models/Questions.js";
import QuestionCategory from "../../models/QuestionCategory.js";
import TrackTemplate from "../../models/TrackTemplate.js";
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
  listKnownQuestionCategories,
  slugifyCategory,
} from "./adminCommon.js";

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
    const data = categories.map((category, index) => ({
      id: index + 1,
      slug: category.slug,
      title: category.title,
      subtitle: category.subtitle,
      total: groupMap[category.slug]?.total || 0,
      active: groupMap[category.slug]?.active || 0,
      icon: category.icon,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listQuestionCategories error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch question categories." });
  }
};

export const createQuestionCategory = async (req, res) => {
  try {
    const { title, subtitle, icon } = req.body;

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

    const category = await QuestionCategory.create({
      slug,
      title: title.trim(),
      subtitle: subtitle?.trim() || "Custom question category",
      icon: icon || "chart",
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
        total: 0,
        active: 0,
        icon: category.icon,
      },
    });
  } catch (error) {
    console.error("createQuestionCategory error:", error);
    return res.status(500).json({ success: false, message: "Failed to create question category.", error: error.message });
  }
};

export const listQuestionsAdmin = async (req, res) => {
  try {
    const query = {};
    if (req.query.categorySlug) query.categorySlug = req.query.categorySlug;
    if (req.query.status) query.status = req.query.status;
    if (req.query.difficulty) query.difficulty = req.query.difficulty;

    const questions = await Question.find(query).sort({ createdAt: -1 }).lean();
    const data = questions.map((question) => ({
      id: question._id,
      title: question.title,
      difficulty: question.difficulty,
      track: getCategoryTitle(question),
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
      categorySlug: getCategorySlug(question),
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listQuestionsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch questions." });
  }
};

export const createQuestionAdmin = async (req, res) => {
  try {
    const {
      title,
      difficulty,
      trackType,
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
      status,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Question title is required." });
    }

    const resolvedCategorySlug = categorySlug || CATEGORY_SLUG_BY_TITLE[categoryTitle] || slugifyCategory(categoryTitle) || "web-development";
    const resolvedCategoryTitle =
      categoryTitle || QUESTION_CATEGORY_META[resolvedCategorySlug]?.title || trackType || "General";

    const question = await Question.create({
      title: title.trim(),
      difficulty: difficulty || "Easy",
      trackType: trackType || resolvedCategoryTitle,
      categorySlug: resolvedCategorySlug,
      categoryTitle: resolvedCategoryTitle,
      tags: tags || [],
      description: description || "",
      inputFormat: inputFormat || "",
      outputFormat: outputFormat || "",
      visibleTestCases: visibleTestCases || [],
      hiddenTestCases: hiddenTestCases || [],
      timeLimit: Number(timeLimit || 1),
      memoryLimit: Number(memoryLimit || 256),
      referenceLanguage: referenceLanguage || "C++",
      solutionCode: solutionCode || "",
      editorial: editorial || "",
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

    return res.status(201).json({ success: true, data: question });
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

    return res.status(200).json({
      success: true,
      data: {
        id: question._id,
        title: question.title,
        difficulty: question.difficulty,
        track: getCategoryTitle(question),
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
        categorySlug: getCategorySlug(question),
      },
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

    const resolvedCategorySlug =
      req.body.categorySlug || CATEGORY_SLUG_BY_TITLE[req.body.categoryTitle] || slugifyCategory(req.body.categoryTitle) || undefined;

    const question = await Question.findByIdAndUpdate(
      questionId,
      {
        $set: {
          title: req.body.title?.trim(),
          difficulty: req.body.difficulty,
          trackType: req.body.trackType || req.body.categoryTitle,
          categorySlug: resolvedCategorySlug,
          categoryTitle: req.body.categoryTitle,
          tags: req.body.tags,
          description: req.body.description,
          inputFormat: req.body.inputFormat,
          outputFormat: req.body.outputFormat,
          visibleTestCases: req.body.visibleTestCases,
          hiddenTestCases: req.body.hiddenTestCases,
          timeLimit: Number(req.body.timeLimit || 1),
          memoryLimit: Number(req.body.memoryLimit || 256),
          referenceLanguage: req.body.referenceLanguage || "C++",
          solutionCode: req.body.solutionCode || "",
          editorial: req.body.editorial || "",
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

    return res.status(200).json({ success: true, data: question });
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
    const { name, description, category, totalDays, status, iconKey, startDate, endDate, batchId } = req.body;
    if (!name?.trim() || !category?.trim() || !startDate || !endDate || !batchId) {
      return res.status(400).json({ success: false, message: "Template name, category, startDate, endDate and batchId are required." });
    }

    if (!assertObjectId(batchId, "batchId", res)) return;

    const batch = await Batch.findById(batchId).lean();
    if (!batch) {
      return res.status(404).json({ success: false, message: "Assigned batch not found." });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ success: false, message: "startDate and endDate must be valid dates." });
    }
    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({ success: false, message: "endDate must be on or after startDate." });
    }

    const template = await TrackTemplate.create({
      name: name.trim(),
      description: description?.trim() || `${totalDays || 30}-day ${category} track template`,
      category: category.trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      batchId,
      totalDays: Number(totalDays || 30),
      status: status || "Active",
      iconKey: iconKey || getTrackTemplateIconKey(category),
      versionHistory: [{ version: 1, label: "v1 - Initial template", changedBy: getActorName(req.user) }],
    });

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
    if (req.body.description !== undefined) template.description = req.body.description.trim();
    if (req.body.category) {
      template.category = req.body.category.trim();
      template.iconKey = req.body.iconKey || getTrackTemplateIconKey(template.category);
    }
    if (req.body.startDate) {
      const parsedStartDate = new Date(req.body.startDate);
      if (Number.isNaN(parsedStartDate.getTime())) {
        return res.status(400).json({ success: false, message: "startDate must be a valid date." });
      }
      template.startDate = parsedStartDate;
    }
    if (req.body.endDate) {
      const parsedEndDate = new Date(req.body.endDate);
      if (Number.isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ success: false, message: "endDate must be a valid date." });
      }
      template.endDate = parsedEndDate;
    }
    if (req.body.batchId) {
      if (!assertObjectId(req.body.batchId, "batchId", res)) return;
      const batch = await Batch.findById(req.body.batchId).lean();
      if (!batch) {
        return res.status(404).json({ success: false, message: "Assigned batch not found." });
      }
      template.batchId = req.body.batchId;
    }
    if (req.body.totalDays) template.totalDays = Number(req.body.totalDays);
    if (req.body.status) template.status = req.body.status;

    if (template.endDate && template.startDate && template.endDate < template.startDate) {
      return res.status(400).json({ success: false, message: "endDate must be on or after startDate." });
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
    if (!title?.trim() || !category?.trim() || !type) {
      return res.status(400).json({ success: false, message: "title, category and type are required." });
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
    if (!assertObjectId(resourceId, "resourceId", res)) return;

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
