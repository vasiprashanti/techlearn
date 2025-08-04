import mongoose from "mongoose";

const notesSchema = new mongoose.Schema(
  {
    parsedContent: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Notes = mongoose.model("Notes", notesSchema);
export default Notes;
