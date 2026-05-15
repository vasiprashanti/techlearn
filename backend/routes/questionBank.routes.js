import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '../controllers/categoryController.js';
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestionByIdAdmin,
  getQuestionsByCategory,
  updateQuestion,
} from '../controllers/questionController.js';

const router = express.Router();

const adminAuth = [protect, isAdmin];

router.post('/categories', adminAuth, createCategory);
router.get('/categories', adminAuth, getCategories);
router.get('/categories/:id', adminAuth, getCategoryById);
router.put('/categories/:id', adminAuth, updateCategory);
router.delete('/categories/:id', adminAuth, deleteCategory);

router.post('/categories/:categoryId/questions', adminAuth, createQuestion);
router.get('/categories/:categoryId/questions', adminAuth, getQuestionsByCategory);

router.get('/questions/:questionId', getQuestionById);
router.get('/questions/:questionId/admin', adminAuth, getQuestionByIdAdmin);
router.put('/questions/:questionId', adminAuth, updateQuestion);
router.delete('/questions/:questionId', adminAuth, deleteQuestion);

export default router;
