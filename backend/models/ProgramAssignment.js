import mongoose from "mongoose";

const assignmentQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    categoryType: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    topic: {
      type: String,
      default: "",
      trim: true,
    },
    subtopic: {
      type: String,
      default: "",
      trim: true,
    },
    difficulty: {
      type: String,
      default: "Easy",
      trim: true,
    },
    selectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    attempted: {
      type: Boolean,
      default: false,
    },
    correct: {
      type: Boolean,
      default: null,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
    },
    accuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    timeSpentMs: {
      type: Number,
      default: null,
      min: 0,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
    },
    attemptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const programAssignmentSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramEnrollment",
      default: null,
    },
    blueprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blueprint",
      required: true,
    },
    phase: {
      type: String,
      enum: ["day_0_readiness", "revision", "company_preparation", "final_assessment"],
      required: true,
      index: true,
    },
    programDay: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ["Generated", "In Progress", "Completed", "Expired"],
      default: "Generated",
      index: true,
    },
    isLeadAssessment: {
      type: Boolean,
      default: false,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    learningGoal: {
      type: String,
      default: "",
      trim: true,
    },
    questions: {
      type: [assignmentQuestionSchema],
      default: [],
    },
    requestedQuestionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    generatedQuestionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shortfalls: {
      type: [
        new mongoose.Schema(
          {
            categoryId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Category",
              default: null,
            },
            category: {
              type: String,
              default: "",
              trim: true,
            },
            requested: {
              type: Number,
              default: 0,
              min: 0,
            },
            assigned: {
              type: Number,
              default: 0,
              min: 0,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

programAssignmentSchema.index(
  { programId: 1, userId: 1, phase: 1, programDay: 1 },
  { unique: true }
);
programAssignmentSchema.index({ programId: 1, userId: 1, status: 1, createdAt: -1 });
programAssignmentSchema.index({ "questions.questionId": 1 });

export default mongoose.model("ProgramAssignment", programAssignmentSchema);
