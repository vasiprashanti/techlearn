import mongoose from "mongoose";

const collegeMcqSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    questions: [
      {
        text: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
            required: true,
          },
        ],
        correct: {
          type: Number, // index of correct option
          required: true,
        },
        difficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"],
          default: "Medium",
        },
        tags: [
          {
            type: String,
            trim: true,
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Unique link identifier for this quiz
    linkId: {
      type: String,
      unique: true,
      required: true,
    },
    // Results tracking
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

collegeMcqSchema.index({ college: 1 });
collegeMcqSchema.index({ date: 1, duration: 1 });

const CollegeMcq = mongoose.model("CollegeMcq", collegeMcqSchema);
export default CollegeMcq;
