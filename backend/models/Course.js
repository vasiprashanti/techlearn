import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
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
    courseStatus: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
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
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: false, // Only one exercise per course
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
