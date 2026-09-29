import mongoose from "mongoose";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import Program from "../models/Program.js";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Student from "../models/Student.js";
import College from "../models/College.js";
import PricingExitFeedback from "../models/PricingExitFeedback.js";
import { upsertProgramEnrollment, syncPrimaryProgramPointers } from "../utils/programEnrollment.js";
import { normalizeProgramType } from "../utils/programTypeNormalization.js";
import { resolveConfiguredProgramPricingPlan } from "../utils/programPricing.js";
import {
  isCapturedPaymentForRecord,
  isPaymentForRecord,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
} from "../utils/razorpayVerification.js";
import {
  buildCapturedCoursePurchaseQuery,
  isCoursePurchasePayment,
  isPaidCourseAvailableForPurchase,
} from "../utils/coursePurchase.js";

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
  const type = normalizeProgramType(program?.programType) === "Skill" ? "Skill" : "Placement";
  const hasConfiguredPlans = Array.isArray(program?.pricingPlans) && program.pricingPlans.length > 0;
  if (hasConfiguredPlans) return resolveConfiguredProgramPricingPlan(program, planId);
  const defaults = DEFAULT_PRICING_PLANS[type];
  const requested = String(planId || "").toLowerCase();
  return requested
    ? defaults.find((plan) => String(plan.key || "").toLowerCase() === requested) || null
    : defaults[0] || null;
};

const activateProgramEnrollmentForPayment = async ({ payment, user, student }) => {
  if (!payment.programId) throw new Error("The captured payment has no associated Program.");

  const program = await Program.findById(payment.programId);
  if (!program) throw new Error("The Program associated with this payment no longer exists.");

  const resolvedStudent = student
    || (payment.studentId ? await Student.findById(payment.studentId) : null)
    || await Student.findOne({ userId: payment.userId });
  if (!resolvedStudent) throw new Error("The learner record for this payment could not be found.");

  const resolvedUser = user || { _id: payment.userId };
  const enrollment = await upsertProgramEnrollment({
    user: resolvedUser,
    student: resolvedStudent,
    program,
    accessTier: "Member",
    source: "payment",
  });
  if (!enrollment) throw new Error("Program enrollment could not be activated.");

  await syncPrimaryProgramPointers({ user: resolvedUser, student: resolvedStudent });
  payment.enrollmentId = enrollment._id;
  await payment.save();
  return enrollment;
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

    const type = normalizeProgramType(program?.programType || requestedType) || "Placement";

    const plan = getPricingPlan(program, planId);
    if (!plan || !Number.isFinite(Number(plan.price)) || Number(plan.price) <= 0) {
      return res.status(400).json({ success: false, message: "The selected pricing plan is unavailable." });
    }
    return res.json({
      success: true,
      programType: type,
      plan: plan.title,
      price: Number(plan.price),
      currency: "INR",
      refundPolicy: "No refunds or cancellations after purchase",
    });
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
    const { courseId, programId, planId, programType: requestedProgramType } = req.body;

    if (courseId && programId) {
      return res.status(400).json({ success: false, message: "Choose either a Course or a Program for checkout." });
    }

    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ success: false, message: "A valid courseId is required." });
      }

      const course = await Course.findById(courseId);
      if (!isPaidCourseAvailableForPurchase(course)) {
        return res.status(400).json({ success: false, message: "This course is not currently available for paid checkout." });
      }
      const availableTopicCount = await Topic.countDocuments({
        _id: { $in: course.topicIds },
        courseId: course._id,
      });
      if (!availableTopicCount) {
        return res.status(400).json({ success: false, message: "This course has no published learning content yet." });
      }
      const linkedPrograms = await Program.find({
        status: "Active",
        $or: [
          { courseIds: course._id },
          ...(course.programIds?.length ? [{ _id: { $in: course.programIds } }] : []),
        ],
      }).select("visibility pricingType").lean();
      const hasRestrictedProgramLink = linkedPrograms.some(
        (linkedProgram) => linkedProgram.visibility !== "Public" || linkedProgram.pricingType === "Paid"
      );
      if ((course.assignedBatchIds || []).length > 0 || hasRestrictedProgramLink) {
        return res.status(403).json({
          success: false,
          message: "This course is provided through its Program or batch. Enroll in that Program to access it.",
        });
      }

      const amount = Number(course.price);
      const currency = "INR";
      const purchaseQuery = buildCapturedCoursePurchaseQuery({ userId: user._id, courseId: course._id });
      const completedPurchase = await Payment.findOne(purchaseQuery).select("_id").lean();
      if (completedPurchase) {
        return res.status(409).json({ success: false, alreadyPurchased: true, message: "You already have access to this course." });
      }

      const razorpay = getRazorpayInstance();
      if (!razorpay) {
        return res.status(503).json({ success: false, message: "Razorpay is not configured on the server." });
      }

      // Reuse an outstanding order for the same course/price when a learner
      // retries after a closed checkout, avoiding duplicate pending orders.
      const openPayment = await Payment.findOne({
        userId: user._id,
        courseId: course._id,
        paymentPurpose: "CoursePurchase",
        status: { $in: ["created", "pending"] },
        amount,
        currency,
        razorpayOrderId: { $exists: true, $ne: "" },
      }).sort({ createdAt: -1 });

      if (openPayment) {
        return res.json({
          success: true,
          paymentId: openPayment._id,
          orderId: openPayment.razorpayOrderId,
          amount,
          currency,
          key: process.env.RAZORPAY_KEY_ID,
          planName: course.title,
          productType: "course",
          reused: true,
        });
      }

      const student = await getOrCreateStudentForUser(user);
      const receipt = `rcpt_${Date.now()}_${String(user._id).slice(-8)}`;
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt,
        notes: {
          userId: String(user._id),
          studentId: String(student._id),
          courseId: String(course._id),
          productType: "course",
          courseTitle: course.title,
        },
      });

      const payment = await Payment.create({
        userId: user._id,
        studentId: student._id,
        courseId: course._id,
        paymentPurpose: "CoursePurchase",
        plan: course.title,
        amount,
        currency,
        status: "created",
        paymentDate: null,
        razorpayOrderId: razorpayOrder.id,
        transactionId: razorpayOrder.id,
        paymentType: "Razorpay",
      });

      return res.status(201).json({
        success: true,
        paymentId: payment._id,
        orderId: razorpayOrder.id,
        amount,
        currency,
        key: process.env.RAZORPAY_KEY_ID,
        planName: course.title,
        productType: "course",
      });
    }

    if (!programId && !planId) {
      return res.status(400).json({ success: false, message: "programId or planId is required" });
    }

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
    let programType = normalizeProgramType(rawType) || "Placement";

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

    // Only use a plan explicitly defined by this Program (or the legacy
    // program-type defaults when the Program has no custom pricing plans).
    const selectedPlan = getPricingPlan(program, planId);
    if (!selectedPlan || !Number.isFinite(Number(selectedPlan.price)) || Number(selectedPlan.price) <= 0) {
      return res.status(400).json({ success: false, message: "The selected pricing plan is unavailable." });
    }
    const amount = Number(selectedPlan.price);
    const planName = selectedPlan.title;

    const currency = "INR";
    const receipt = `rcpt_${user._id}_${Date.now()}`;
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({ success: false, message: "Razorpay is not configured on the server." });
    }

    const student = await getOrCreateStudentForUser(user);
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt,
      notes: {
        userId: user._id.toString(),
        studentId: student._id.toString(),
        programId: program._id.toString(),
        programType,
        planName,
        refundPolicy: "No refunds or cancellations after purchase",
      },
    });
    const razorpayOrderId = razorpayOrder.id;

    // Create Payment Record in DB
    const payment = await Payment.create({
      userId: user._id,
      studentId: student._id,
      programId: program._id,
      paymentPurpose: "ProgramEnrollment",
      plan: planName,
      programType,
      amount,
      currency,
      status: "created",
      paymentDate: null,
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
      key: process.env.RAZORPAY_KEY_ID,
      programType,
      planName,
      refundPolicy: "No refunds or cancellations after purchase",
    });
  } catch (error) {
    console.error("createPaymentOrder error:", error.message);
    res.status(500).json({ success: false, message: "Order creation failed." });
  }
};

/**
 * POST /api/payments/verify
 * Verified server-side signature and activates enrollment automatically
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const user = req.user;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Razorpay order, payment, and signature values are required." });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }
    if (String(payment.userId) !== String(user._id)) {
      return res.status(403).json({ success: false, message: "You do not own this payment." });
    }

    const isCoursePurchase = isCoursePurchasePayment(payment);
    if (!isCoursePurchase && !payment.programId) {
      return res.status(400).json({ success: false, message: "This payment is not a Course or Program checkout." });
    }
    if (["refunded", "partially_refunded", "rejected"].includes(payment.status)) {
      return res.status(409).json({ success: false, message: "This payment cannot activate access." });
    }

    if (payment.status === "captured") {
      const enrollment = isCoursePurchase
        ? null
        : await activateProgramEnrollmentForPayment({ payment, user });
      return res.json({
        success: true,
        message: "Payment already verified",
        payment,
        enrollment,
        courseId: isCoursePurchase ? payment.courseId : undefined,
        hasAccess: isCoursePurchase,
        refundPolicy: "No refunds or cancellations after purchase",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ success: false, message: "Razorpay verification is not configured on the server." });
    }

    if (!verifyRazorpayCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret: keySecret,
    })) {
      return res.status(400).json({ success: false, message: "Payment signature verification failed." });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({ success: false, message: "Razorpay is not configured on the server." });
    }

    let razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    if (!isPaymentForRecord(razorpayPayment, payment)) {
      return res.status(400).json({ success: false, message: "The payment details do not match this order." });
    }
    if (razorpayPayment.status === "failed") {
      payment.status = "failed";
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save();
      return res.status(402).json({ success: false, message: "Razorpay reports that this payment failed." });
    }
    if (razorpayPayment.status === "authorized") {
      try {
        razorpayPayment = await razorpay.payments.capture(
          razorpay_payment_id,
          Math.round(Number(payment.amount) * 100),
          payment.currency || "INR"
        );
      } catch (captureError) {
        // A concurrent webhook or dashboard capture may have completed it;
        // re-fetch before treating capture failure as a pending payment.
        razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
        if (razorpayPayment.status !== "captured") {
          console.warn("Razorpay capture pending:", captureError.message);
        }
      }
    }

    if (razorpayPayment.status !== "captured") {
      payment.status = "pending";
      payment.razorpayPaymentId = razorpay_payment_id;
      await payment.save();
      return res.status(202).json({
        success: false,
        pending: true,
        message: "Payment is not captured yet. Access will activate after confirmation.",
      });
    }
    if (!isCapturedPaymentForRecord(razorpayPayment, payment)) {
      return res.status(400).json({ success: false, message: "Razorpay has not confirmed the captured amount for this order." });
    }

    payment.status = "captured";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paymentDate = new Date();
    await payment.save();

    let enrollment = null;
    if (!isCoursePurchase) {
      const student = await getOrCreateStudentForUser(user);
      enrollment = await activateProgramEnrollmentForPayment({ payment, user, student });
    }

    res.json({
      success: true,
      message: isCoursePurchase
        ? "Payment verified successfully. Course access is now active."
        : "Payment verified successfully and program enrollment activated!",
      payment,
      enrollment,
      courseId: isCoursePurchase ? payment.courseId : undefined,
      hasAccess: isCoursePurchase,
      refundPolicy: "No refunds or cancellations after purchase",
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed." });
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay Webhook listener for background event handling & idempotency
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({ message: "Razorpay webhook verification is not configured." });
    }
    if (!verifyRazorpayWebhookSignature({
      rawBody: req.rawBody,
      signature: req.headers["x-razorpay-signature"],
      secret: webhookSecret,
    })) {
      return res.status(400).json({ message: "Invalid webhook signature." });
    }

    const { event, payload } = req.body;

    if (event === "payment.captured" && payload?.payment?.entity) {
      const entity = payload.payment.entity;
      const orderId = entity.order_id;
      if (!entity.id || !orderId) return res.status(400).json({ message: "Captured payment or order ID is missing." });
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (!payment) return res.status(404).json({ message: "Payment order not found." });
      if (["refunded", "partially_refunded", "rejected"].includes(payment.status)) {
        return res.status(409).json({ message: "This payment cannot activate access." });
      }
      if (!isCapturedPaymentForRecord(entity, payment)) {
        return res.status(400).json({ message: "Captured payment details do not match the order." });
      }
      if (payment.status === "captured" && payment.razorpayPaymentId && payment.razorpayPaymentId !== entity.id) {
        return res.status(409).json({ message: "A different payment is already recorded for this order." });
      }

      const wasAlreadyCaptured = payment.status === "captured";
      payment.status = "captured";
      payment.razorpayPaymentId = entity.id;
      if (!wasAlreadyCaptured) payment.paymentDate = new Date();
      await payment.save();
      if (!isCoursePurchasePayment(payment)) {
        if (!payment.programId) return res.status(400).json({ message: "Captured payment is not linked to a Course or Program." });
        await activateProgramEnrollmentForPayment({ payment });
      }
    } else if (event === "payment.failed" && payload?.payment?.entity) {
      const entity = payload.payment.entity;
      const orderId = entity.order_id;
      if (!entity.id || !orderId) return res.status(400).json({ message: "Failed payment or order ID is missing." });
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && isPaymentForRecord(entity, payment) && payment.status !== "captured") {
        payment.status = "failed";
        payment.razorpayPaymentId = entity.id;
        await payment.save();
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook handler error" });
  }
};

/**
 * POST /api/payments/exit-feedback
 * Stores user pricing drop-off exit feedback
 */
export const savePricingExitFeedback = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const {
      programId,
      selectedPlan,
      reason,
      customReason,
      source = "pricing",
      targetRole,
      opportunity,
      targetCompanies,
      skill,
    } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Feedback reason is required" });
    }

    if (!["pricing", "contextual_onboarding"].includes(source)) {
      return res.status(400).json({ success: false, message: "Invalid feedback source" });
    }

    const student = userId ? await Student.findOne({ userId }) : null;

    const feedback = await PricingExitFeedback.create({
      userId,
      studentId: student?._id || null,
      programId: programId || null,
      selectedPlan,
      reason,
      customReason: customReason || "",
      source,
      targetRole: targetRole || "",
      opportunity: opportunity || "",
      targetCompanies: Array.isArray(targetCompanies) ? targetCompanies : [],
      skill: skill || "",
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
