import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract", "", null],
      default: "Full-time",
    },
    description: { type: String, default: "", trim: true },
    role: { type: String, default: "", trim: true },
    skills: { type: [String], default: [] },
    applyUrl: { type: String, default: "", trim: true },
    status: { type: String, enum: ["Draft", "Active", "Closed"], default: "Active", index: true },
    postedAt: { type: Date, default: Date.now, index: true },
    closesAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ title: "text", company: "text", description: "text", role: "text", skills: "text" });

export default mongoose.model("Job", jobSchema);
