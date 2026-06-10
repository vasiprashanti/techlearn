import mongoose from "mongoose";

const studentProjectSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    current_day: {
      type: Number,
      default: 1,
      min: 1,
    },
    progress_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Archived"],
      default: "Active",
      index: true,
    },
    assigned_at: {
      type: Date,
      default: Date.now,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Enforce single active project per student via pre-save hook
studentProjectSchema.pre("save", async function(next) {
  if (this.status === "Active") {
    const activeAssignment = await mongoose.models.StudentProject.findOne({
      student_id: this.student_id,
      status: "Active",
      _id: { $ne: this._id },
    });
    if (activeAssignment) {
      return next(new Error("Student already has an active project assignment."));
    }
  }
  next();
});

export default mongoose.model("StudentProject", studentProjectSchema);
