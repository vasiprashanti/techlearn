import { adminAPI } from '../services/adminApi';

export const questionBankApi = {
  listCategories: () => adminAPI.getQuestionCategories(),
  createCategory: (payload) => adminAPI.createQuestionCategory(payload),
  updateCategory: (categoryId, payload) => adminAPI.updateQuestionCategory(categoryId, payload),
  deleteCategory: (categoryId) => adminAPI.deleteQuestionCategory(categoryId),
  bulkDeleteCategories: (categoryIds) => adminAPI.bulkDeleteQuestionCategories(categoryIds),
  listQuestions: (params = {}) => adminAPI.getQuestions(params),
  createQuestion: (payload) => adminAPI.createQuestion(payload),
  updateQuestion: (questionId, payload) => adminAPI.updateQuestion(questionId, payload),
  deleteQuestion: (questionId) => adminAPI.deleteQuestion(questionId),
};

export default questionBankApi;
