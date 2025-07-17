import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import UserProgress from "../models/UserProgress.js";
import { sendPaymentStatusEmail } from "../utils/sendCertificate.js";

// Helper function to check eligibility (without sending response)
const getEligibilityData = async (userId, courseId) => {
  // Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error("Invalid course ID");
  }

  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

  // Calculate total possible XP
  let totalQuizXP = 0;
  let totalExerciseXP = 0;
  for (const topic of course.topics) {
    if (topic.quizId) {
      const quiz = await Quiz.findById(topic.quizId);
      if (quiz) totalQuizXP += quiz.questions.length * 10;
    }
    if (topic.exerciseId) {
      totalExerciseXP += 10;
    }
  }
  const totalPossibleXP = totalQuizXP + totalExerciseXP;

  // Fetch user progress
  const userProgress = await UserProgress.findOne({ userId });
  const courseIdStr = courseId.toString();
  const userQuizXP = userProgress?.courseXP.get(courseIdStr) || 0;
  const userExerciseXP = userProgress?.exerciseXP.get(courseIdStr) || 0;
  const userTotalXP = userQuizXP + userExerciseXP;

  // Set eligibility threshold (e.g., 80%)
  // Removed requiredXP as per user request
  return {
    eligible: userTotalXP >= Math.floor(totalPossibleXP * 0.8),
    userTotalXP,
    totalPossibleXP,
    details: { userQuizXP, userExerciseXP, totalQuizXP, totalExerciseXP },
  };
};

// Combined endpoint: Check eligibility and initiate payment if eligible
export const initiatePayment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    if (!userId || !courseId) {
      return res.status(400).json({ message: "Missing user or course ID" });
    }

    // Check eligibility first
    const eligibilityData = await getEligibilityData(userId, courseId);

    if (!eligibilityData.eligible) {
      // Use 200 OK for eligibility check, even if not eligible
      return res.status(200).json({
        message:
          "Not eligible for certificate yet. Complete all quizzes and exercises first.",
        eligible: false,
        ...eligibilityData,
        paymentAllowed: false,
      });
    }

    // Check if user already has a pending/approved payment for this course
    const existingUserPayment = await Payment.findOne({
      userId,
      courseId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingUserPayment) {
      return res.status(400).json({
        message:
          "You already have a pending or approved payment for this course",
        eligible: true,
        paymentAllowed: false,
        existingPayment: existingUserPayment,
      });
    }

    // User is eligible and can proceed with payment
    res.json({
      message: "Eligible for certificate. You can proceed with payment.",
      eligible: true,
      paymentAllowed: true,
      ...eligibilityData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Payment initiation failed", error: error.message });
  }
};

// Simplified payment submission endpoint - no eligibility check needed
export const submitPayment = async (req, res) => {
  try {
    const { transactionId, paymentType, courseId } = req.body;
    const userId = req.user._id;

    // Input validation
    if (!transactionId || !paymentType || !courseId) {
      return res.status(400).json({
        message: "Transaction ID, payment type, and course ID are required",
      });
    }

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check for duplicate transaction ID
    const existingPayment = await Payment.findOne({
      transactionId: transactionId.trim(),
    });
    if (existingPayment) {
      return res.status(400).json({ message: "Transaction ID already exists" });
    }

    // Check if user already has a pending/approved payment for this course
    const existingUserPayment = await Payment.findOne({
      userId,
      courseId,
      status: { $in: ["pending", "approved"] },
    });
    if (existingUserPayment) {
      return res.status(400).json({
        message:
          "You already have a pending or approved payment for this course",
      });
    }

    // Create payment
    const paymentData = {
      userId,
      transactionId: transactionId.trim(),
      paymentType: paymentType.trim(),
      courseId,
    };

    const payment = await Payment.create(paymentData);
    res.status(201).json({
      success: true,
      message: "Payment submitted successfully",
      payment,
    });
  } catch (error) {
    console.error("Payment submission error:", error);
    res
      .status(500)
      .json({ message: "Payment submission failed", error: error.message });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "firstName lastName email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    if (!payments || payments.length === 0) {
      return res
        .status(200)
        .json({ message: "No payments found", payments: [] });
    }

    res.json({ count: payments.length, payments });
  } catch (error) {
    console.error("Get payments error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch payments", error: error.message });
  }
};

export const paymentConfirmation = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    // Validate paymentId
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
    }

    const payment = await Payment.findById(paymentId).populate(
      "userId",
      "firstName email"
    );
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check if payment is already processed
    if (payment.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Payment has already been processed" });
    }

    payment.status = status;
    await payment.save();

    // Send email notification
    await sendPaymentStatusEmail({ user: payment.userId, status });

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return res
      .status(500)
      .json({ message: "Payment confirmation failed", error: error.message });
  }
};
