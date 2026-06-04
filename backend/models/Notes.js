import mongoose from "mongoose";

const notesSchema = new mongoose.Schema(
  {
    parsedContent: {
      type: String,
      required: true,
      trim: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    questionBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: false,
    },
    categoryType: {
      type: String,
      enum: ["Coding", "MCQ", "Notes"],
      default: "Notes",
    },
    checkpointMcqs: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true }, // index of correct option
        explanation: { type: String },
        checkpointMcqId: { type: String, required: true }, // unique per note
      },
    ],
  },
  { timestamps: true }
);

const Notes = mongoose.model("Notes", notesSchema);
export default Notes;
