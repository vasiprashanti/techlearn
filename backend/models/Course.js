import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic", // Reference to Topic model
      },
    ],
    numTopics: {
      type: Number,
      default: 0,
    },
    exerciseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    assignedBatchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    courseType: {
      type: String,
      enum: ["Self-paced", "Trainer-led"],
      default: "Self-paced",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    instructor: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    schedule: {
      type: String,
      default: "",
    },
    startDate: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
