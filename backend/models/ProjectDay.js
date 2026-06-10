import mongoose from "mongoose";

const projectDaySchema = new mongoose.Schema(
  {
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    day_number: {
      type: Number,
      required: true,
    },
    topic_title: {
      type: String,
      default: function() {
        return `Day ${this.day_number} Topic`;
      },
    },
    notes_markdown: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Enforce unique (project_id + day_number)
projectDaySchema.index({ project_id: 1, day_number: 1 }, { unique: true });

export default mongoose.model("ProjectDay", projectDaySchema);
