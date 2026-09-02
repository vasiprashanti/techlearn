import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema(
  {
    // Human-readable, backend-generated identifier used by admin operations
    // and support conversations. It is sparse so legacy records created before
    // RID support can continue to exist until they are backfilled.
    roadmapId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    durationUnit: {
      type: String,
      enum: ["days", "weeks", "months"],
      required: true,
      lowercase: true,
      trim: true,
    },
    markdownBody: {
      type: String,
      required: true,
    },
    // The Markdown itself is stored in markdownBody. Keep the original file
    // name as metadata so the admin can identify or replace the upload.
    markdownFile: {
      type: String,
      default: "",
      trim: true,
    },
    // Empty means the roadmap is open to every branch. When populated, the
    // user-side API applies the existing learner branch profile to this list.
    branches: {
      type: [String],
      default: [],
      set: (value) => [...new Set((Array.isArray(value) ? value : []).map((branch) => String(branch || "").trim()).filter(Boolean))],
    },
    assignedBatchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    // Deprecated fields are retained for backwards-compatible reads of old
    // batch roadmaps. New CRUD requests do not write them.
    attachedNoteTitle: {
      type: String,
      default: "",
      trim: true,
    },
    attachedNoteDay: {
      type: Number,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

roadmapSchema.index({ assignedBatchIds: 1, status: 1, updatedAt: -1 });
roadmapSchema.index({ targetRole: 1, status: 1, updatedAt: -1 });
roadmapSchema.index({ branches: 1, status: 1, updatedAt: -1 });

export default mongoose.model("Roadmap", roadmapSchema);
