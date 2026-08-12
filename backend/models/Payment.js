import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      index: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramEnrollment",
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    plan: {
      type: String,
      trim: true,
    },
    programType: {
      type: String,
      enum: ["Placement", "Skill"],
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    transactionId: {
      type: String,
      trim: true,
      sparse: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    paymentType: {
      type: String,
      trim: true,
      default: "Razorpay",
    },
    status: {
      type: String,
      enum: ["created", "pending", "captured", "approved", "failed", "rejected", "refunded", "partially_refunded"],
      default: "created",
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    refundStatus: {
      type: String,
      enum: ["none", "requested", "refunded", "partially_refunded"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
