import { Router } from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  initiatePayment,
  submitPayment,
  getAllPayments,
  paymentConfirmation,
} from "../controllers/paymentController.js";

const paymentRouter = Router();

// Combined endpoint: Check eligibility and allow payment if eligible
paymentRouter.get("/:courseId/initiate", protect, initiatePayment);

// Only after the eligibility is confirmed, this button is enabled
paymentRouter.post("/Pay", protect, submitPayment);

// Admin routes
paymentRouter.get("/payments", protect, isAdmin, getAllPayments);
paymentRouter.patch(
  "/payments/:paymentId",
  protect,
  isAdmin,
  paymentConfirmation
);

export default paymentRouter;
