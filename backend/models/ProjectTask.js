import mongoose from "mongoose";

const projectTaskSchema = new mongoose.Schema(
  {
    project_day_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectDay",
      required: true,
      index: true,
    },
    task_description: {
      type: String,
      required: true,
      trim: true,
    },
    xp_value: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProjectTask", projectTaskSchema);
