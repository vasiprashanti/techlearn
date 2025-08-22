import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
  },
  mcqRound: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CollegeMcq",
    required: true,
  },
  codingRound: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CodingRound", // Placeholder for future implementation
    required: false,
  },
});

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const College = mongoose.model("College", collegeSchema);
export default College;
