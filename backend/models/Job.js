import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    // Unique Hiring Job ID
    JID: {
      type: String,
      unique: true,
      index: true,
    },

    // Role Category relationship
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    companyLogo: {
      type: String,
      default: "",
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    companyType: {
      type: String,
      default: "",
      trim: true,
    },

    jobType: {
      type: String,
      required: true,
      trim: true,
    },

    workMode: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    salary: {
      type: String,
      default: "",
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    education: {
      type: String,
      default: "",
      trim: true,
    },

    eligibleBranches: {
      type: [String],
      default: [],
    },

    graduationYear: {
      type: String,
      default: "",
      trim: true,
    },

    eligibility: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    responsibilities: {
      type: [String],
      default: [],
    },

    requirements: {
      type: [String],
      default: [],
    },

    benefits: {
      type: [String],
      default: [],
    },

    applicationUrl: {
      type: String,
      required: true,
      trim: true,
    },

    applicationDeadline: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Draft", "Published", "Active", "Closed", "Archived"],
      default: "Draft",
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    // Compatibility fields with main
    company: {
      type: String,
      trim: true,
    },
    employmentType: {
      type: String,
      default: "Full-time",
    },
    role: {
      type: String,
      default: "",
    },
    applyUrl: {
      type: String,
      default: "",
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
    closesAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Generate JID automatically before saving.
 *
 * Example:
 * JID-000001
 * JID-000002
 */
jobSchema.pre("save", async function (next) {
  if (!this.isNew || this.JID) {
    return next();
  }

  try {
    const lastJob = await mongoose
      .model("Job")
      .findOne({})
      .sort({ createdAt: -1 })
      .select("JID")
      .lean();

    let nextNumber = 1;

    if (lastJob?.JID) {
      const match = lastJob.JID.match(/JID-(\d+)/);

      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    this.JID = `JID-${String(nextNumber).padStart(6, "0")}`;

    next();
  } catch (error) {
    next(error);
  }
});

// Useful for Role-wise job listing
jobSchema.index({ roleId: 1, createdAt: -1 });

// Useful for company/title searches
jobSchema.index({ companyName: 1, title: 1 });

// Useful for published job listing
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, postedAt: -1 });

export default mongoose.model("Job", jobSchema);
