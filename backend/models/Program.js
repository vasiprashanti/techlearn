import mongoose from "mongoose";
import {
  buildDefaultProgramPhases,
  parseDurationDays,
  PROGRAM_PHASE_TYPES,
  validateAndNormalizeProgramPhases,
} from "../utils/programPhases.js";

export const PROGRAM_TYPES = Object.freeze(["Placement", "Skill"]);
export const PROGRAM_PLACEMENT_CATEGORIES = Object.freeze(["On-Campus", "Off-Campus", "Both"]);

const pricingPlanSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    benefits: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

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
      enum: {
        values: PROGRAM_TYPES,
        message: "Program type must be Placement or Skill",
      },
      required: [true, "Program type is required"],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
    },
    // duration remains human-readable for existing consumers; durationDays is
    // the canonical value used to validate and schedule program phases.
    durationDays: {
      type: Number,
      min: [1, "Duration must be at least one day"],
      default: null,
    },
    phases: {
      type: [
        new mongoose.Schema(
          {
            phase: {
              type: String,
              enum: PROGRAM_PHASE_TYPES,
              required: true,
            },
            startDay: {
              type: Number,
              required: true,
              min: 1,
            },
            endDay: {
              type: Number,
              required: true,
              min: 1,
            },
          },
          { _id: false }
        ),
      ],
      default: [],
      validate: {
        validator: function validateProgramPhaseRanges(value) {
          if (!Array.isArray(value) || value.length === 0 || !this.durationDays) return true;
          return !validateAndNormalizeProgramPhases({
            programType: this.programType,
            durationDays: this.durationDays,
            phases: value,
          }).error;
        },
        message: "Program phases must be contiguous and cover the full duration",
      },
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
    // Admin-configurable annual plans. programFee remains a compatibility
    // fallback for older records that only had one price.
    pricingPlans: {
      type: [pricingPlanSchema],
      default: [],
    },
    learningGoals: [
      {
        type: String,
        trim: true,
      },
    ],
    placementCategories: [
      {
        type: String,
        enum: PROGRAM_PLACEMENT_CATEGORIES,
        trim: true,
      },
    ],
    targetCompanies: [
      {
        type: String,
        trim: true,
      },
    ],
    skillTags: [
      {
        type: String,
        trim: true,
      },
    ],
    targetRoles: [
      {
        type: String,
        trim: true,
      },
    ],
    // Legacy read compatibility only. New Program CRUD derives access from
    // pricingType and no longer exposes or writes this field.
    accessTier: {
      type: String,
      enum: ["Free", "Member", "Both"],
      select: false,
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

programSchema.pre("validate", function populateProgramStructure(next) {
  if (!this.durationDays && this.duration) {
    const parsedDurationDays = parseDurationDays(this.duration);
    if (parsedDurationDays) this.durationDays = parsedDurationDays;
  }

  if ((!Array.isArray(this.phases) || this.phases.length === 0) && this.programType && this.durationDays) {
    const defaultPhases = buildDefaultProgramPhases(this.programType, this.durationDays);
    if (defaultPhases.length) this.phases = defaultPhases;
  }

  if (this.pricingType === "Paid" && (!Array.isArray(this.pricingPlans) || this.pricingPlans.length === 0)) {
    this.pricingPlans = this.programType === "Skill"
      ? [
          { key: "skill-basic", title: "Skill Program", price: 399, benefits: ["Recorded videos", "1 live doubt session"] },
          { key: "skill-pro", title: "Skill Program Pro", price: 699, benefits: ["Recorded videos", "1 live doubt session"] },
        ]
      : [
          { key: "placement-basic", title: "Placement Program", price: 799, benefits: ["Recorded videos", "Live sessions"] },
          { key: "placement-pro", title: "Placement Program Pro", price: 1199, benefits: ["Recorded videos", "Live sessions"] },
        ];
  }

  next();
});

const Program = mongoose.model("Program", programSchema);

export default Program;
