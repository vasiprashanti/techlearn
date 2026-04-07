import mongoose from "mongoose";

const questionCategorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      enum: ["code", "globe", "terminal", "database", "brain", "chart"],
      default: "chart",
    },
    status: {
      type: String,
      enum: ["Active", "Archived"],
      default: "Active",
    },
  },
  { timestamps: true }
);

questionCategorySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("QuestionCategory", questionCategorySchema);
