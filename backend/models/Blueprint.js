import mongoose from "mongoose";
import { BLUEPRINT_TYPES } from "../utils/blueprintTypes.js";

const blueprintConfigurationSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // Snapshot the display name while keeping Category as the source of truth
    // for question selection.
    category: {
      type: String,
      required: true,
      trim: true,
    },
    questionCount: {
      type: Number,
      required: true,
      min: [1, "Question count must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Question count must be a whole number",
      },
    },
  },
  { _id: false }
);

const blueprintSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Blueprint name is required"],
      trim: true,
    },
    blueprintType: {
      type: String,
      enum: BLUEPRINT_TYPES,
      required: [true, "Blueprint type is required"],
    },
    configurations: {
      type: [blueprintConfigurationSchema],
      required: [true, "At least one question configuration is required"],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one question configuration is required",
      },
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Archived"],
      default: "Draft",
    },
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

blueprintSchema.index({ programId: 1, blueprintType: 1 }, { unique: true });
blueprintSchema.virtual("totalQuestionCount").get(function getTotalQuestionCount() {
  return (this.configurations || []).reduce((sum, item) => sum + Number(item.questionCount || 0), 0);
});

const Blueprint = mongoose.model("Blueprint", blueprintSchema);

export default Blueprint;
