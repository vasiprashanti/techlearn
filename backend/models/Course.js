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
      enum: ["Beginner", "Basic", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    topicIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Topic", // Reference to Topic model
      },
    ],
    numTopics: {
      type: Number,
      default: 0,
      min: [0, "Topics count cannot be negative"],
    },
    exerciseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    programIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
      },
    ],
    assignedBatchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    deliveryType: {
      type: String,
      enum: ["Self-Paced", "Structured", "Trainer-Led"],
      default: "Self-Paced",
    },
    courseType: {
      type: String,
      default: "Self-paced",
    },
    accessType: {
      type: String,
      enum: ["Free", "Paid"],
      default: "Free",
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Draft",
      index: true,
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
