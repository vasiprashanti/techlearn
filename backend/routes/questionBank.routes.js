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
import {
  startSubmission,
  runCode,
  submitSolution,
  submitMcqAnswer,
  getSubmission,
} from '../controllers/questionBankSubmissionController.js';
import {
  getBatchSubmissions,
  getStudentSubmissions,
  getCategorySubmissions,
  getBatchStats,
  getStudentProgress,
  getPlatformAnalytics,
} from '../controllers/submissionAnalyticsController.js';

const router = express.Router();

const adminAuth = [protect, isAdmin];
const studentAuth = [protect];

// ===== CATEGORY ROUTES =====
router.post('/categories', adminAuth, createCategory);
router.get('/categories', adminAuth, getCategories);
router.get('/categories/:id', adminAuth, getCategoryById);
router.put('/categories/:id', adminAuth, updateCategory);
router.delete('/categories/:id', adminAuth, deleteCategory);

// ===== QUESTION ROUTES =====
router.post('/categories/:categoryId/questions', adminAuth, createQuestion);
router.get('/categories/:categoryId/questions', adminAuth, getQuestionsByCategory);

router.get('/questions/:questionId', getQuestionById);
router.get('/questions/:questionId/admin', adminAuth, getQuestionByIdAdmin);
router.put('/questions/:questionId', adminAuth, updateQuestion);
router.delete('/questions/:questionId', adminAuth, deleteQuestion);

// ===== SUBMISSION ROUTES (Student) =====
// Start a new submission attempt
router.post('/submissions/questions/:questionId/start', studentAuth, startSubmission);

// Run code against visible test cases only
router.post('/submissions/:submissionId/run', studentAuth, runCode);

// Submit final solution (tests against all test cases)
router.post('/submissions/:submissionId/submit', studentAuth, submitSolution);

// Submit MCQ answer with centralized submission tracking
router.post('/submissions/questions/:questionId/mcq', studentAuth, submitMcqAnswer);

// Get submission details
router.get('/submissions/:submissionId', studentAuth, getSubmission);

// ===== SUBMISSION ANALYTICS ROUTES (Admin) =====
// Batch-wise submissions
router.get('/admin/submissions/batch/:batchId', adminAuth, getBatchSubmissions);

// Student-wise submissions
router.get('/admin/submissions/student/:studentId', adminAuth, getStudentSubmissions);

// Category-wise submissions
router.get('/admin/submissions/category/:categoryId', adminAuth, getCategorySubmissions);

// Batch analytics
router.get('/admin/submissions/batch/:batchId/stats', adminAuth, getBatchStats);

// Student progress dashboard
router.get('/admin/submissions/student/:studentId/progress', adminAuth, getStudentProgress);

// Platform-wide analytics
router.get('/admin/submissions/stats/analytics', adminAuth, getPlatformAnalytics);

export default router;
