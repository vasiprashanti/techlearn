import mongoose from "mongoose";

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
    code: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
  },
  { timestamps: true }
);

const College = mongoose.model("College", collegeSchema);
export default College;
