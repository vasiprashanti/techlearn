import mongoose from "mongoose";
import User from "../models/User.js";
import Student from "../models/Student.js";
import College from "../models/College.js";
import { getUnifiedProfileForUser } from "../utils/userProfile.js";
import { invalidateDashboardCache } from "./dashboardController.js";

const clean = (value, max = 120) => String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);

const cleanList = (value, maxItems = 30) => {
  const seen = new Set();
  const result = [];
  (Array.isArray(value) ? value : []).forEach((item) => {
    const text = clean(item, 60);
    const key = text.toLowerCase();
    if (text && !seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
  });
  return result.slice(0, maxItems);
};

const findStudent = (user) =>
  Student.findOne({
    $or: [{ userId: user._id }, ...(user.email ? [{ email: String(user.email).toLowerCase() }] : [])],
  }).populate("collegeId", "name");

const toIsoDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const buildDetails = async (user, student) => {
  const unified = await getUnifiedProfileForUser(user._id);
  const enrollment = unified?.profile?.enrollment || {};
  const collegeName = student?.collegeId?.name || user.collegeName || "";

  return {
    fullName: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || student?.name || "",
    email: user.email || "",
    dob: toIsoDate(user.dateOfBirth),
    country: user.country || "",
    avatar: user.photoUrl || user.avatar || "",
    college: collegeName
      ? { id: student?.collegeId?._id ? String(student.collegeId._id) : null, name: collegeName }
      : null,
    // A college assigned by an admin (batch/import) is authoritative.
    collegeLocked: Boolean(student?.collegeId?._id),
    degree: student?.degree || user.degree || "",
    branch: student?.branch || user.branch || "",
    graduationYear: student?.graduationYear || user.graduationYear || "",
    level: user.skillLevel || "",
    targetRole: student?.targetRole || user.targetRole || user.otherTargetRole || "",
    targetCompanies: (student?.targetCompanies?.length ? student.targetCompanies : user.targetCompanies) || [],
    currentSkills: (student?.skills?.length ? student.skills : user.skills) || [],
    skillsOfInterest: user.skillsOfInterest || [],
    daysPerWeek: user.daysPerWeek || "",
    hoursPerDay: user.hoursPerDay || "",
    remindersEnabled: user.remindersEnabled !== false,
    learningMode: user.learningPath || "Structured",
    accountStatus: "Active",
    programStatus: enrollment.status ? `${enrollment.status}${enrollment.program?.name ? ` - ${enrollment.program.name}` : ""}` : "No active Program",
  };
};

/** GET /api/users/profile/details */
export const getProfileDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const student = await findStudent(user);
    return res.json({ success: true, profile: await buildDetails(user, student) });
  } catch (error) {
    console.error("Get profile details error:", error);
    return res.status(500).json({ success: false, message: "Failed to load your profile." });
  }
};

/** PUT /api/users/profile/details - each user can only update their own record. */
export const updateProfileDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    const body = req.body || {};
    const student = await findStudent(user);

    if (body.fullName !== undefined) {
      const name = clean(body.fullName, 80);
      if (!name) return res.status(400).json({ success: false, message: "Full name is required." });
      const [first, ...rest] = name.split(" ");
      user.firstName = first;
      user.lastName = rest.join(" ");
      if (student) student.name = name;
    }

    if (body.dob !== undefined) {
      if (body.dob === "" || body.dob === null) {
        user.dateOfBirth = null;
      } else {
        const dob = new Date(`${body.dob}T00:00:00.000Z`);
        if (Number.isNaN(dob.getTime()) || dob > new Date()) {
          return res.status(400).json({ success: false, message: "Enter a valid date of birth." });
        }
        const eighteen = new Date();
        eighteen.setUTCFullYear(eighteen.getUTCFullYear() - 18);
        if (dob > eighteen) {
          return res.status(400).json({ success: false, message: "You must be at least 18 years old." });
        }
        user.dateOfBirth = dob;
      }
    }

    if (body.country !== undefined) user.country = clean(body.country, 60);
    if (body.level !== undefined) {
      const level = clean(body.level, 30);
      if (level && !["Beginner", "Basic", "Intermediate", "Advanced"].includes(level)) {
        return res.status(400).json({ success: false, message: "Invalid skill level." });
      }
      user.skillLevel = level;
    }

    if (body.degree !== undefined) {
      user.degree = clean(body.degree, 60);
      if (student) student.degree = user.degree;
    }
    if (body.branch !== undefined) {
      user.branch = clean(body.branch, 80);
      if (student) student.branch = user.branch;
    }
    if (body.graduationYear !== undefined) {
      const year = body.graduationYear === "" ? null : Number(body.graduationYear);
      if (year !== null && (!Number.isInteger(year) || year < 1990 || year > 2100)) {
        return res.status(400).json({ success: false, message: "Enter a valid graduation year." });
      }
      user.graduationYear = year;
      if (student) student.graduationYear = year;
    }

    if (body.targetRole !== undefined) {
      user.targetRole = clean(body.targetRole, 80);
      user.otherTargetRole = "";
      if (student) {
        student.targetRole = user.targetRole;
        student.otherTargetRole = "";
      }
    }
    if (body.targetCompanies !== undefined) {
      user.targetCompanies = cleanList(body.targetCompanies);
      if (student) student.targetCompanies = user.targetCompanies;
    }
    if (body.currentSkills !== undefined) {
      user.skills = cleanList(body.currentSkills);
      if (student) student.skills = user.skills;
    }
    if (body.skillsOfInterest !== undefined) user.skillsOfInterest = cleanList(body.skillsOfInterest);

    if (body.daysPerWeek !== undefined) {
      const days = body.daysPerWeek === "" ? null : Number(body.daysPerWeek);
      if (days !== null && (!Number.isInteger(days) || days < 1 || days > 7)) {
        return res.status(400).json({ success: false, message: "Days per week must be between 1 and 7." });
      }
      user.daysPerWeek = days;
    }
    if (body.hoursPerDay !== undefined) {
      const hours = body.hoursPerDay === "" ? null : Number(body.hoursPerDay);
      if (hours !== null && (!(hours > 0) || hours > 12)) {
        return res.status(400).json({ success: false, message: "Hours per day must be between 0.5 and 12." });
      }
      user.hoursPerDay = hours;
    }
    if (body.remindersEnabled !== undefined) user.remindersEnabled = Boolean(body.remindersEnabled);

    if (body.avatar !== undefined) {
      const avatar = clean(body.avatar, 200);
      if (avatar && !avatar.startsWith("/profile_avatars/")) {
        return res.status(400).json({ success: false, message: "Invalid avatar." });
      }
      if (avatar) {
        user.photoUrl = avatar;
        user.avatar = avatar;
      }
    }

    if (body.collegeId !== undefined && body.collegeId !== null && body.collegeId !== "") {
      if (!mongoose.Types.ObjectId.isValid(body.collegeId)) {
        return res.status(400).json({ success: false, message: "Invalid college." });
      }
      const college = await College.findById(body.collegeId).lean();
      if (!college) return res.status(400).json({ success: false, message: "That college no longer exists." });
      // An admin-assigned college stays authoritative; learners only fill an empty one.
      if (!student?.collegeId?._id) {
        user.collegeName = college.name;
        if (student) student.collegeId = college._id;
      }
    }

    await user.save();
    if (student) await student.save();
    invalidateDashboardCache(user._id);

    const fresh = await User.findById(user._id).select("-password").lean();
    const freshStudent = await findStudent(fresh);
    return res.json({ success: true, message: "Profile saved.", profile: await buildDetails(fresh, freshStudent) });
  } catch (error) {
    console.error("Update profile details error:", error);
    return res.status(500).json({ success: false, message: "Failed to save your profile." });
  }
};

/** POST /api/users/account-deletion-request - records the request; an admin completes it. */
export const requestAccountDeletion = async (req, res) => {
  try {
    const reason = clean(req.body?.reason, 80);
    if (!reason) return res.status(400).json({ success: false, message: "Please select a reason." });
    await User.updateOne(
      { _id: req.user._id },
      { $set: { deletionRequestedAt: new Date(), deletionReason: reason, deletionDetails: clean(req.body?.details, 500) } }
    );
    return res.json({ success: true, message: "Deletion request received. Our team will confirm by email." });
  } catch (error) {
    console.error("Account deletion request error:", error);
    return res.status(500).json({ success: false, message: "Could not submit your request." });
  }
};
