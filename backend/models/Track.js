import mongoose from "mongoose";

const trackSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },

    trackType: {
      type: String,
      enum: ["Core", "DSA", "SQL"],
      required: true,
    },

    durationDays: {
      type: Number,
      required: true,
    },

    orderedQuestionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    isLockedAfterActivation: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Track", trackSchema);