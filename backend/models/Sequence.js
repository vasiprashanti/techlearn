import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema(
  {
    _id: String,
    value: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Sequence", sequenceSchema);
