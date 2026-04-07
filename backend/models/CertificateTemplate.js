import mongoose from "mongoose";

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    courseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("CertificateTemplate", certificateTemplateSchema);
