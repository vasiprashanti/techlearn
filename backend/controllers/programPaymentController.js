import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import Program from "../models/Program.js";
import Student from "../models/Student.js";
import College from "../models/College.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import PricingExitFeedback from "../models/PricingExitFeedback.js";
import { upsertProgramEnrollment, syncPrimaryProgramPointers } from "../utils/programEnrollment.js";

// Helper to get or initialize Razorpay instance safely
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  return new Razorpay({ key_id, key_secret });
};

const DEFAULT_PRICING_PLANS = {
  Placement: [
    { key: "placement-basic", title: "Placement Program", price: 799 },
    { key: "placement-pro", title: "Placement Program Pro", price: 1199 },
  ],
  Skill: [
    { key: "skill-basic", title: "Skill Program", price: 399 },
    { key: "skill-pro", title: "Skill Program Pro", price: 699 },
  ],
};

const getPricingPlan = (program, planId) => {
  const type = program?.programType === "Skill" ? "Skill" : "Placement";
  const configuredPlans = Array.isArray(program?.pricingPlans)
    ? program.pricingPlans.filter((plan) => plan.active !== false)
    : [];
  const configured = configuredPlans.length ? configuredPlans : DEFAULT_PRICING_PLANS[type];
  const requested = String(planId || "").toLowerCase();
  return configured.find((plan) => String(plan.key || "").toLowerCase() === requested)
    || configured.find((plan) => requested.includes("pro") && String(plan.key || "").toLowerCase().includes("pro"))
    || configured[0];
};

/**
 * Helper to ensure student record exists for a user
 */
const getOrCreateStudentForUser = async (user) => {
  let student = await Student.findOne({ userId: user._id });
  if (!student && user.email) {
    student = await Student.findOne({ email: user.email });
    if (student) {
      student.userId = user._id;
      await student.save();
    }
  }

  if (!student) {
    let collegeId = user.collegeId || user.college;
    if (!collegeId || !mongoose.Types.ObjectId.isValid(collegeId)) {
      let defaultCollege = await College.findOne();
      if (!defaultCollege) {
        defaultCollege = await College.create({ name: "Default College" });
      }
      collegeId = defaultCollege._id;
    }

    student = await Student.create({
      userId: user._id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Student",
      email: user.email || `user_${user._id}@techlearn.com`,
      collegeId,
      status: "Active",
    });
  }

  return student;
};

/**
 * GET /api/payments/eligibility
 * Determine trusted server price for user & program
 */
export const checkPaymentEligibility = async (req, res) => {
  try {
    const { programId, planId, programType: requestedType } = req.query;

    let program = null;
    if (programId) {
      if (!mongoose.Types.ObjectId.isValid(programId)) {
        return res.status(400).json({ success: false, message: "A valid programId is required." });
      }
      program = await Program.findOne({
        _id: programId,
        status: "Active",
        visibility: "Public",
      }).lean();
      if (!program) return res.status(404).json({ success: false, message: "The selected program is not available." });
      if (program.pricingType !== "Paid") {
        return res.status(400).json({ success: false, message: "This program does not require paid checkout." });
      }
    }

    const type = program?.programType || requestedType || "Placement";

    if (type === "Placement") {
      const plan = getPricingPlan(program, planId);
      return res.json({
        success: true,
        programType: "Placement",
        plan: plan.title,
        price: plan.price,
        currency: "INR",
        refundPolicy: "No refunds or cancellations after purchase",
      });
    } else {
      const plan = getPricingPlan(program, planId);
      return res.json({
        success: true,
        programType: "Skill",
        plan: plan.title,
        price: plan.price,
        currency: "INR",
        refundPolicy: "No refunds or cancellations after purchase",
      });
    }
  } catch (error) {
    console.error("checkPaymentEligibility error:", error);
    res.status(500).json({ success: false, message: "Error checking eligibility", error: error.message });
  }
};

/**
 * POST /api/payments/create-order
 * Validates program/plan/eligibility server-side and creates Razorpay Order
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const user = req.user;
    const { programId, planId, programType: requestedProgramType } = req.body;

    if (!programId && !planId) {
      return res.status(400).json({ success: false, message: "programId or planId is required" });
    }

    const student = await getOrCreateStudentForUser(user);

    let program = null;
    if (programId) {
      if (!mongoose.Types.ObjectId.isValid(programId)) {
        return res.status(400).json({ success: false, message: "A valid programId is required." });
      }
      program = await Program.findOne({
        _id: programId,
        status: "Active",
        visibility: "Public",
      });
      if (!program) {
        return res.status(404).json({ success: false, message: "The selected program is not available for checkout." });
      }
    }

    // Fallback program lookup by type if specific ID not provided
    let rawType = program?.programType || requestedProgramType || "";
    let programType = rawType.toLowerCase().includes("skill") ? "Skill" : "Placement";

    if (!program) {
      program = await Program.findOne({
        programType,
        status: "Active",
        visibility: "Public",
        pricingType: "Paid",
      });
    }

    if (!program || program.pricingType !== "Paid") {
      return res.status(400).json({ success: false, message: "A paid program is required for checkout." });
    }

    // Determine trusted server-side price
    let amount = 0;
    let planName = planId || "Basic";

    const selectedPlan = getPricingPlan(program, planId);
    amount = selectedPlan.price;
    planName = selectedPlan.title;

    const currency = "INR";
    const receipt = `rcpt_${user._id}_${Date.now()}`;

    let razorpayOrderId = null;
    const razorpay = getRazorpayInstance();

    if (razorpay) {
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // amount in paise
        currency,
        receipt,
        notes: {
          userId: user._id.toString(),
          studentId: student._id.toString(),
          programId: program?._id ? program._id.toString() : "",
          programType,
          planName,
          refundPolicy: "No refunds or cancellations after purchase",
        },
      });
      razorpayOrderId = razorpayOrder.id;
    } else {
      // Mock Razorpay Order ID when keys are not provided (Test/Dev Mode)
      razorpayOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // Create Payment Record in DB
    const payment = await Payment.create({
      userId: user._id,
      studentId: student._id,
      programId: program?._id || null,
      plan: planName,
      programType,
      amount,
      currency,
      status: "created",
      razorpayOrderId,
      transactionId: razorpayOrderId,
      paymentType: "Razorpay",
    });

    res.status(201).json({
      success: true,
      paymentId: payment._id,
      orderId: razorpayOrderId,
      amount,
      currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_mock_key",
      programType,
      planName,
      refundPolicy: "No refunds or cancellations after purchase",
    });
  } catch (error) {
    console.error("createPaymentOrder error stack:", error.stack || error);
    res.status(500).json({ success: false, message: "Order creation failed", error: error.message, stack: error.stack });
  }
};

/**
 * POST /api/payments/verify
 * Verified server-side signature and activates enrollment automatically
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, mock_success } = req.body;
    const user = req.user;

    if (!razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Razorpay Order ID is required" });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }
    if (String(payment.userId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: "You do not own this payment." });
    }

    // Check idempotency: If payment is already captured
    if (payment.status === "captured") {
      const enrollment = await ProgramEnrollment.findOne({
        userId: payment.userId,
        ...(payment.programId ? { programId: payment.programId } : {}),
      });
      return res.json({
        success: true,
        message: "Payment already verified",
        payment,
        enrollment,
        refundPolicy: "No refunds or cancellations after purchase",
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const isMock = razorpay_order_id.startsWith("order_mock_") || mock_success || !key_secret;

    if (!isMock) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({ success: false, message: "Invalid payment signature verification failed" });
      }
    }

    // Signature verified or test mode mock
    payment.status = "captured";
    payment.razorpayPaymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;
    payment.razorpaySignature = razorpay_signature || "mock_signature";
    payment.paymentDate = new Date();
    await payment.save();

    // Activate Program Enrollment
    const student = await getOrCreateStudentForUser(user);

    let program = null;
    if (payment.programId && mongoose.Types.ObjectId.isValid(payment.programId)) {
      program = await Program.findById(payment.programId);
    }
    if (!program && payment.programType) {
      program = await Program.findOne({
        programType: payment.programType,
        status: "Active",
        visibility: "Public",
        pricingType: "Paid",
      });
    }

    let enrollment = null;
    if (program) {
      enrollment = await upsertProgramEnrollment({
        user,
        student,
        program,
        accessTier: "Member",
        source: "payment",
      });

      // Synchronize student primary program pointers
      await syncPrimaryProgramPointers({ user, student });

      // Update payment record with enrollment ID
      if (enrollment) {
        payment.enrollmentId = enrollment._id;
        await payment.save();
      }
    }

    res.json({
      success: true,
      message: "Payment verified successfully and program enrollment activated!",
      payment,
      enrollment,
      refundPolicy: "No refunds or cancellations after purchase",
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay Webhook listener for background event handling & idempotency
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-razorpay-signature"];
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (signature !== expectedSignature) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }
    }

    const { event, payload } = req.body;

    if (event === "payment.captured" && payload?.payment?.entity) {
      const entity = payload.payment.entity;
      const orderId = entity.order_id;
      const paymentId = entity.id;

      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment) {
        if (payment.status !== "captured") {
          payment.status = "captured";
          payment.razorpayPaymentId = paymentId;
          payment.paymentDate = new Date();
          await payment.save();

          const student = await Student.findById(payment.studentId);
      const program = await Program.findOne({
        _id: payment.programId,
        status: "Active",
        visibility: "Public",
        pricingType: "Paid",
      });
          if (student && program) {
            const enrollment = await upsertProgramEnrollment({
              user: { _id: payment.userId },
              student,
              program,
              accessTier: "Member",
              source: "payment",
            });
            if (enrollment) {
              payment.enrollmentId = enrollment._id;
              await payment.save();
            }
          }
        }
      }
    } else if (event === "payment.failed" && payload?.payment?.entity) {
      const entity = payload.payment.entity;
      const orderId = entity.order_id;
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && payment.status !== "captured") {
        payment.status = "failed";
        await payment.save();
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook handler error", error: error.message });
  }
};

/**
 * POST /api/payments/exit-feedback
 * Stores user pricing drop-off exit feedback
 */
export const savePricingExitFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { programId, selectedPlan, reason, customReason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Feedback reason is required" });
    }

    const student = await Student.findOne({ userId });

    const feedback = await PricingExitFeedback.create({
      userId,
      studentId: student?._id || null,
      programId: programId || null,
      selectedPlan,
      reason,
      customReason: customReason || "",
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("savePricingExitFeedback error:", error);
    res.status(500).json({ success: false, message: "Failed to save feedback", error: error.message });
  }
};
