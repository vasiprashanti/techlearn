import { Router } from "express";
import { protect, optionalProtect, isAdmin } from "../middleware/authMiddleware.js";
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
// Exit feedback is also collected before signup, so preserve anonymous
// submissions and link them to a User when a valid token is available.
paymentRouter.post("/exit-feedback", optionalProtect, savePricingExitFeedback);

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
