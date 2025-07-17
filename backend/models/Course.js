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
    topics: [
      //this is a topic sub document which which links to each of the following and has an id used for fetching quiz or exercise data
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        quizId: {
          type: mongoose.Schema.Types.ObjectId, //pointer for the quiz model
          ref: "Quiz",
        },
        exerciseId: {
          type: mongoose.Schema.Types.ObjectId, //pointer for the exercise model
          ref: "Exercise",
        },
        notesId: {
          type: mongoose.Schema.Types.ObjectId, // pointer for the notes model
          ref: "Notes",
        },
      },
    ],
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
