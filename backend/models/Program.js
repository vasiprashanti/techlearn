import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    programType: {
      type: String,
      required: [true, "Program type is required"],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Archived"],
      default: "Draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
      index: true,
    },
    pricingType: {
      type: String,
      enum: ["Free", "Paid"],
      default: "Free",
    },
    programFee: {
      type: Number,
      default: 0,
      min: [0, "Program fee cannot be negative"],
      validate: {
        validator: function (value) {
          if (this.pricingType === "Paid") {
            return typeof value === "number" && !isNaN(value) && value >= 0;
          }
          return true;
        },
        message: "Program fee is required and must be non-negative for Paid programs",
      },
    },
    batchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    studentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    roadmapIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Roadmap",
      },
    ],
    trackTemplateIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TrackTemplate",
      },
    ],
    certificateTemplateIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CertificateTemplate",
      },
    ],
    projectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
programSchema.index({ name: 1 });
programSchema.index({ programType: 1 });
programSchema.index({ status: 1, programType: 1, createdAt: -1 });
programSchema.index({ name: "text", description: "text" });

const Program = mongoose.model("Program", programSchema);

export default Program;
