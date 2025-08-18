import mongoose from "mongoose";

const topicSchema = mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notes",
      required: false, // Allow temporary null during creation
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exercise",
      required: false,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: false, // Not all topics need quizzes
    },
    slug: {
      type: String, // to create a unique frontend friendly url for each topic
      required: true,
    },
    index: {
      type: Number,
      required: true, //to specify the order of topics in a course
    },
  },
  { timestamps: true }
);

const Topic = mongoose.model("Topic", topicSchema);
export default Topic;
