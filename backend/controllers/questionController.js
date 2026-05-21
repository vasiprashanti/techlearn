import Question from '../models/Question.js';
import Category from '../models/Category.js';
import { buildCentralQuestionPayload } from '../utils/questionBank.js';

/*
  POST /api/question-bank/categories/:categoryId/questions
  Creates a question scoped to a category.
  categoryType is copied from the parent Category — frontend never sends it.
 */
export const createQuestion = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }

    const payload = buildCentralQuestionPayload({ category, body: req.body });
    const question = await Question.create(payload);

    return res.status(201).json({ success: true, data: question });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/*
  GET /api/question-bank/categories/:categoryId/questions
  All active questions in a category — admin view.
  Excludes hidden test cases and correct options.
 */
export const getQuestionsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { difficulty, tags, page = 1, limit = 20 } = req.query;

    const filter = { categoryId, isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: tags.split(',') };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Question.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId).lean();

    if (!question || !question.isActive) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Sanitize sensitive fields before returning to client (student)
    if (question.content) {
      delete question.content.hiddenTestCases;
      delete question.content.correctOption;
      delete question.content.referenceSolution;
      delete question.content.explanation;
      delete question.content.solutionNotes;
    }

    // Also sanitize legacy/compatibility fields on the root level
    delete question.hiddenTestCases;
    delete question.solutionCode;
    delete question.editorial;

    return res.status(200).json({ success: true, data: question });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
  GET /api/question-bank/questions/:questionId/admin
  Admin-only: returns full question including hidden test cases and correct option.
  Used when admin edits an existing question.
 */
export const getQuestionByIdAdmin = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId)
      .select('+content.hiddenTestCases +content.correctOption +content.referenceSolution')
      .lean();

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    return res.status(200).json({ success: true, data: question });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
  PUT /api/question-bank/questions/:questionId
  Full update of a question.
  categoryType and categoryId cannot change.
 */
export const updateQuestion = async (req, res) => {
  try {
    const { categoryType, categoryId, ...updates } = req.body;

    if (categoryType || categoryId) {
      return res.status(400).json({
        success: false,
        message: 'categoryType and categoryId cannot be changed. Delete and recreate the question.',
      });
    }

    const existing = await Question.findById(req.params.questionId)
      .select('+content.hiddenTestCases +content.correctOption +content.referenceSolution');
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const category = await Category.findById(existing.categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found for this question' });
    }

    const nextPayload = buildCentralQuestionPayload({
      category,
      body: updates,
      existingQuestion: existing,
    });

    // Determine if we need to bump top-level version (title/description changes)
    const bumpVersion = (updates.title && updates.title !== existing.title) ||
      (updates.description && updates.description !== existing.description);

    // Determine if we need to bump contentVersion (testcases/timeLimit/memoryLimit/constraints changes)
    let bumpContent = false;
    if (nextPayload.content) {
      const c = nextPayload.content;
      if (c.visibleTestCases || c.hiddenTestCases || c.timeLimit !== undefined || c.memoryLimit !== undefined || c.constraints !== undefined) {
        bumpContent = true;
      }
    }

    const updateOps = { $set: nextPayload };
    if (bumpVersion) updateOps.$inc = { ...(updateOps.$inc || {}), version: 1 };
    if (bumpContent) updateOps.$inc = { ...(updateOps.$inc || {}), 'content.contentVersion': 1 };

    const updated = await Question.findByIdAndUpdate(
      req.params.questionId,
      updateOps,
      { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/*
  DELETE /api/question-bank/questions/:questionId
  Soft delete: sets isActive: false.
  Hard data is preserved for submission history integrity.
 */
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.questionId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Question deactivated. Submission history is preserved.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
