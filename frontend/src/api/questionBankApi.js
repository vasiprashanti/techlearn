import { adminAPI } from '../services/adminApi';

export const questionBankApi = {
  listCategories: (params = {}) => adminAPI.getQuestionCategories(params),
  createCategory: (payload) => adminAPI.createQuestionCategory(payload),
  updateCategory: (categoryId, payload) => adminAPI.updateQuestionCategory(categoryId, payload),
  deleteCategory: (categoryId) => adminAPI.deleteQuestionCategory(categoryId),
  getCategoryUsage: (categoryId) => adminAPI.getQuestionCategoryUsage(categoryId),
  bulkDeleteCategories: (categoryIds) => adminAPI.bulkDeleteQuestionCategories(categoryIds),
  listQuestions: (params = {}) => adminAPI.getQuestions(params),
  createQuestion: (payload) => adminAPI.createQuestion(payload),
  bulkCreateQuestions: (payload) => adminAPI.bulkCreateQuestions(payload),
  updateQuestion: (questionId, payload) => adminAPI.updateQuestion(questionId, payload),
  deleteQuestion: (questionId) => adminAPI.deleteQuestion(questionId),
};

export default questionBankApi;
