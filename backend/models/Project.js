import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Java Full Stack", "Web Development", "AIML", "DSA Java", "DSA Python", "Python", "MERN", "Mini Projects", "Major Projects", "Other"],
      default: "Other",
    },
    duration_days: {
      type: Number,
      required: true,
      min: 1,
    },
    xp_requirement: {
      type: Number,
      required: true,
      default: 0,
    },
    overview_markdown_content: {
      type: String,
      default: "",
    },
    overview_markdown_file_url: {
      type: String,
      default: "",
    },
    overview_markdown_original_name: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
