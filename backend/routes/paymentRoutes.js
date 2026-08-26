import { Router } from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  initiatePayment,
  submitPayment,
  getAllPayments,
  paymentConfirmation,
} from "../controllers/paymentController.js";
import {
  checkPaymentEligibility,
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  savePricingExitFeedback,
} from "../controllers/programPaymentController.js";

const paymentRouter = Router();

// Program Razorpay Payment Routes
paymentRouter.get("/eligibility", protect, checkPaymentEligibility);
paymentRouter.post("/create-order", protect, createPaymentOrder);
paymentRouter.post("/verify", protect, verifyPayment);
paymentRouter.post("/webhook", handleRazorpayWebhook);
paymentRouter.post("/exit-feedback", protect, savePricingExitFeedback);

// Legacy / Certificate Payment Routes
paymentRouter.get("/:courseId/initiate", protect, initiatePayment);
paymentRouter.post("/Pay", protect, submitPayment);
paymentRouter.get("/all", protect, isAdmin, getAllPayments);
paymentRouter.patch(
  "/:paymentId/confirm",
  protect,
  isAdmin,
  paymentConfirmation,
);

export default paymentRouter;
