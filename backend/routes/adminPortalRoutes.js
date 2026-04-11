import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  getAnalyticsPage,
  getDashboardPage,
  getSubmissionDetailPage,
  getSystemHealthPage,
  listSubmissionsPage,
} from "../controllers/admin/adminInsightsController.js";
import {
  activateBatchAdmin,
  createBatchAdmin,
  createCollege,
  createStudentAdmin,
  deleteBatchAdmin,
  deleteCollege,
  deleteStudentAdmin,
  getBatchDetail,
  getCollegeDetail,
  getStudentDetailAdmin,
  listBatches,
  listColleges,
  listStudentsAdmin,
  updateBatchAdmin,
  updateCollege,
  updateStudentAdmin,
} from "../controllers/admin/adminEntityController.js";
import {
  assignTrackTemplateDay,
  createOrUpdateCertificateTemplate,
  createOrUpdateFinalTest,
  createQuestionCategory,
  createQuestionAdmin,
  createResourceAdmin,
  createTrackTemplate,
  deleteQuestionCategory,
  deleteQuestionAdmin,
  deleteResourceAdmin,
  deleteTrackTemplate,
  getCertificatesPage,
  getQuestionDetailAdmin,
  getTrackTemplateDetail,
  issueCertificateAdmin,
  listQuestionCategories,
  listQuestionsAdmin,
  listResourcesAdmin,
  listTrackTemplates,
  recordResourceView,
  removeTrackTemplateDay,
  reorderTrackTemplateQuestions,
  restoreCertificateAdmin,
  revokeCertificateAdmin,
  updateQuestionAdmin,
  updateQuestionCategory,
  updateResourceAdmin,
  updateTrackTemplate,
} from "../controllers/admin/adminLearningController.js";
import {
  createNotificationAdmin,
  deleteNotificationAdmin,
  exportReport,
  getReportsPage,
  listAuditLogsAdmin,
  listNotificationsAdmin,
} from "../controllers/admin/adminOperationsController.js";

const router = express.Router();

router.use(protect, isAdmin);

router.get("/dashboard/overview", getDashboardPage);
router.get("/dashboard/analytics", getAnalyticsPage);
router.get("/dashboard/system-health", getSystemHealthPage);

router.get("/colleges", listColleges);
router.post("/colleges", createCollege);
router.get("/colleges/:collegeId", getCollegeDetail);
router.put("/colleges/:collegeId", updateCollege);
router.delete("/colleges/:collegeId", deleteCollege);

router.get("/batches", listBatches);
router.post("/batches", createBatchAdmin);
router.get("/batches/:batchId", getBatchDetail);
router.put("/batches/:batchId", updateBatchAdmin);
router.delete("/batches/:batchId", deleteBatchAdmin);
router.put("/batches/:batchId/activate", activateBatchAdmin);

router.get("/students", listStudentsAdmin);
router.post("/students", createStudentAdmin);
router.get("/students/:studentId", getStudentDetailAdmin);
router.put("/students/:studentId", updateStudentAdmin);
router.delete("/students/:studentId", deleteStudentAdmin);

router.get("/questions/categories", listQuestionCategories);
router.post("/questions/categories", createQuestionCategory);
router.put("/questions/categories/:categoryId", updateQuestionCategory);
router.delete("/questions/categories/:categoryId", deleteQuestionCategory);
router.get("/questions", listQuestionsAdmin);
router.post("/questions", createQuestionAdmin);
router.get("/questions/:questionId", getQuestionDetailAdmin);
router.put("/questions/:questionId", updateQuestionAdmin);
router.delete("/questions/:questionId", deleteQuestionAdmin);

router.get("/track-templates", listTrackTemplates);
router.post("/track-templates", createTrackTemplate);
router.get("/track-templates/:templateId", getTrackTemplateDetail);
router.put("/track-templates/:templateId", updateTrackTemplate);
router.delete("/track-templates/:templateId", deleteTrackTemplate);
router.post("/track-templates/:templateId/days", assignTrackTemplateDay);
router.delete("/track-templates/:templateId/days/:dayNumber", removeTrackTemplateDay);
router.put("/track-templates/:templateId/reorder", reorderTrackTemplateQuestions);

router.get("/resources", listResourcesAdmin);
router.post("/resources", createResourceAdmin);
router.put("/resources/:resourceId", updateResourceAdmin);
router.delete("/resources/:resourceId", deleteResourceAdmin);
router.post("/resources/:resourceId/view", recordResourceView);

router.get("/certificates", getCertificatesPage);
router.post("/certificates/issued", issueCertificateAdmin);
router.patch("/certificates/issued/:certificateId/revoke", revokeCertificateAdmin);
router.patch("/certificates/issued/:certificateId/restore", restoreCertificateAdmin);
router.post("/certificates/final-tests", createOrUpdateFinalTest);
router.put("/certificates/final-tests/:testId", createOrUpdateFinalTest);
router.post("/certificates/templates", createOrUpdateCertificateTemplate);
router.put("/certificates/templates/:templateId", createOrUpdateCertificateTemplate);

router.get("/submissions", listSubmissionsPage);
router.get("/submissions/:submissionId", getSubmissionDetailPage);

router.get("/notifications", listNotificationsAdmin);
router.post("/notifications", createNotificationAdmin);
router.delete("/notifications/:notificationId", deleteNotificationAdmin);

router.get("/audit-logs", listAuditLogsAdmin);

router.get("/reports", getReportsPage);
router.get("/reports/:type/export", exportReport);

export default router;
