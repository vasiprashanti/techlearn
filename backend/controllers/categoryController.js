import Category from '../models/Category.js';
import Question from '../models/Question.js';
import { normalizeCategoryType } from '../utils/questionBank.js';

const generateSlug = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

/*
  POST /api/question-bank/categories
  Create a new category. Slug auto-generated from title if not provided.
 */
export const createCategory = async (req, res) => {
  try {
    const { title, slug, description, icon, visibility } = req.body;
    const categoryType = normalizeCategoryType(req.body.categoryType);

    if (!title || !categoryType) {
      return res.status(400).json({ success: false, message: 'title and a valid categoryType are required' });
    }

    const resolvedSlug = slug ? slug.toLowerCase().trim() : generateSlug(title);

    const existing = await Category.findOne({ slug: resolvedSlug });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Category with slug "${resolvedSlug}" already exists`,
      });
    }

    const category = await Category.create({
      title,
      slug: resolvedSlug,
      description,
      categoryType,
      icon,
      visibility,
      createdBy: req.user?._id || req.admin?._id,
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Slug must be unique' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
  GET /api/question-bank/categories
  Returns all categories with their live question counts.
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();
    const questionCounts = await Promise.all(
      categories.map((category) => Question.countDocuments({ categoryId: category._id }))
    );

    const data = categories.map((category, index) => ({
      ...category,
      questionCount: questionCounts[index],
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
  GET /api/question-bank/categories/:id
  Single category by Mongo _id, with question count.
 */
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const questionCount = await Question.countDocuments({ categoryId: category._id });

    return res.status(200).json({
      success: true,
      data: {
        ...category,
        questionCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
  PUT /api/question-bank/categories/:id
  Update category — categoryType is NOT updatable after creation.
 */
export const updateCategory = async (req, res) => {
  try {
    const { categoryType, ...allowedUpdates } = req.body;

    if (categoryType) {
      return res.status(400).json({
        success: false,
        message: 'categoryType cannot be changed after creation. Delete the category and recreate it.',
      });
    }

    if (allowedUpdates.title && !allowedUpdates.slug) {
      allowedUpdates.slug = generateSlug(allowedUpdates.title);
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Slug must be unique' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

/*
  DELETE /api/question-bank/categories/:id
  Blocked if questions exist under the category.
 */
export const deleteCategory = async (req, res) => {
  try {
    const count = await Question.countDocuments({ categoryId: req.params.id, isActive: true });

    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing questions. Remove questions first.',
      });
    }

    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
