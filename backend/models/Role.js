import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate Role Categories
roleSchema.index({ roleName: 1 }, { unique: true });

export default mongoose.model("Role", roleSchema);