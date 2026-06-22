import mongoose from "mongoose";

const studentTaskProgressSchema = new mongoose.Schema(
  {
    student_project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProject",
      required: true,
      index: true,
    },
    project_task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTask",
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    xp_awarded: {
      type: Boolean,
      default: false,
    },
    xp_awarded_value: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compounded unique index: one student project assignment should only have one record for a particular task
studentTaskProgressSchema.index({ student_project_id: 1, project_task_id: 1 }, { unique: true });

export default mongoose.model("StudentTaskProgress", studentTaskProgressSchema);
