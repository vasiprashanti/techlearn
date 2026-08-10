import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { invalidateDashboardCache } from "./dashboardController.js";
import College from "../models/College.js";
import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import Project from "../models/Project.js";
import ProjectDay from "../models/ProjectDay.js";
import ProjectTask from "../models/ProjectTask.js";
import { syncProgramEnrollment } from "../utils/programEnrollment.js";
import StudentProject from "../models/StudentProject.js";


// JWT token generator
const generatorToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation helper
const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return passwordRegex.test(password);
};


const ensureDefaultProjectExists = async () => {
  try {
    let project = await Project.findOne({ status: "Published" });
    if (project) {
      return project;
    }

    // Create default project
    project = await Project.create({
      title: "Full Stack Web Development Project",
      description: "Build a complete real-world MERN application from scratch.",
      category: "Web Development",
      duration_days: 5,
      xp_requirement: 500,
      overview_markdown_content: "# Full Stack Project Guide\nWelcome to the Full Stack Project! Over the next 5 days, you will build a full-featured task manager web app.",
      status: "Published"
    });

    const day1 = await ProjectDay.create({
      project_id: project._id,
      day_number: 1,
      topic_title: "Project Initialization and Git Setup",
      notes_markdown: "# Day 1: Setup\nIn today's lesson, you will initialize the project and setup your Git repository."
    });
    await ProjectTask.create({ project_day_id: day1._id, task_description: "Initialize Git repository", xp_value: 100 });
    await ProjectTask.create({ project_day_id: day1._id, task_description: "Setup package.json and install Express", xp_value: 100 });

    const day2 = await ProjectDay.create({
      project_id: project._id,
      day_number: 2,
      topic_title: "Database Connectivity and User Model",
      notes_markdown: "# Day 2: MongoDB\nConnect the express server to Mongo and define your first database schemas."
    });
    await ProjectTask.create({ project_day_id: day2._id, task_description: "Create MongoDB connection string", xp_value: 100 });
    await ProjectTask.create({ project_day_id: day2._id, task_description: "Define Mongoose User schema", xp_value: 100 });

    const day3 = await ProjectDay.create({
      project_id: project._id,
      day_number: 3,
      topic_title: "Authentication Routes and JWT",
      notes_markdown: "# Day 3: Auth\nImplement secure register and login endpoints using bcrypt and jsonwebtoken."
    });
    await ProjectTask.create({ project_day_id: day3._id, task_description: "Create signup and login controllers", xp_value: 100 });
    await ProjectTask.create({ project_day_id: day3._id, task_description: "Test endpoints using Postman", xp_value: 100 });

    const day4 = await ProjectDay.create({
      project_id: project._id,
      day_number: 4,
      topic_title: "Frontend React Boilerplate",
      notes_markdown: "# Day 4: Frontend Setup\nSetup your client-side React app using Vite and configure routing."
    });
    await ProjectTask.create({ project_day_id: day4._id, task_description: "Bootstrap project using Vite", xp_value: 100 });
    await ProjectTask.create({ project_day_id: day4._id, task_description: "Create routing and basic layouts", xp_value: 100 });

    const day5 = await ProjectDay.create({
      project_id: project._id,
      day_number: 5,
      topic_title: "Frontend API Integration",
      notes_markdown: "# Day 5: End-to-end Integration\nConnect frontend components to backend authentication APIs."
    });
    await ProjectTask.create({ project_day_id: day5._id, task_description: "Create API services for authentication", xp_value: 100 });
    await ProjectTask.create({ project_day_id: day5._id, task_description: "Deploy to Vercel and render stats", xp_value: 100 });

    return project;
  } catch (err) {
    console.error("Seeding default project failed:", err);
    return null;
  }
};

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDefaultBatchWindow = () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + 59);
  expiryDate.setHours(23, 59, 59, 999);
  return { startDate, expiryDate };
};

const getVerifiedEmailFromReq = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          const u = await User.findById(decoded.id).select("email").lean();
          if (u?.email) return u.email.toLowerCase();
        }
      }
    }
    if (req.body?.idToken && admin?.auth) {
      const decodedFirebase = await admin.auth().verifyIdToken(req.body.idToken);
      if (decodedFirebase?.email) return decodedFirebase.email.toLowerCase();
    }
  } catch (err) {
    // Token invalid or unverified
  }
  return null;
};

export const registerUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      fullName, 
      email, 
      password, 
      confirmPassword, 
      isClub,
      mobileNumber,
      collegeName,
      degreeBranch,
      graduationYear,
      degree,
      branch,
      learningGoal,
      skills,
      targetRole,
      placementCategory,
      targetCompanies,
      placementTimeline,
      learningPath,
      programSelection,
      personalizedDetail,
      placementReadiness,
      dailyCommitment,
      declarationAccepted
    } = req.body;

    const emailCheck = (email || "").trim().toLowerCase();
    if (!emailCheck) {
      return res.status(400).json({ message: "Email is required" });
    }

    const verifiedEmail = await getVerifiedEmailFromReq(req);
    const isVerifiedSession = Boolean(verifiedEmail && verifiedEmail === emailCheck);

    if (!isVerifiedSession) {
      if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Password and Confirm Password are required" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      if (!isValidEmail(emailCheck)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      if (!isValidPassword(password)) {
        return res.status(400).json({
          message: "Password must be at least 6 characters with one letter and one number",
        });
      }
    }

    // Handle names
    let trimmedFirstName = "";
    let trimmedLastName = "";
    if (fullName) {
      const parts = fullName.trim().split(" ");
      trimmedFirstName = parts[0];
      trimmedLastName = parts.slice(1).join(" ") || ".";
    } else {
      trimmedFirstName = (firstName || "User").trim();
      trimmedLastName = (lastName || "").trim();
    }

    // Resolve or create College
    const collegeNameText = (collegeName || "TechLearn College").trim();
    let college = await College.findOne({ name: { $regex: new RegExp(`^${escapeRegex(collegeNameText)}$`, "i") } });
    if (!college) {
      college = await College.create({
        name: collegeNameText,
        code: collegeNameText.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "TLC",
        status: "Active",
      });
    }

    // Resolve or create Batch
    let batch = await Batch.findOne({ collegeId: college._id, name: "Cohort 1" });
    if (!batch) {
      const { startDate, expiryDate } = getDefaultBatchWindow();
      batch = await Batch.create({
        name: "Cohort 1",
        collegeId: college._id,
        startDate,
        expiryDate,
        releaseTime: "00:00",
        status: "Active",
        assignedTrack: programSelection || "Placement Sprint",
      });
    }

    let targetUser = await User.findOne({ email: emailCheck });

    if (targetUser) {
      if (!isVerifiedSession) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Update existing verified Google/Firebase or session user with onboarding answers
      if (trimmedFirstName) targetUser.firstName = trimmedFirstName;
      if (trimmedLastName) targetUser.lastName = trimmedLastName;
      if (collegeNameText) targetUser.collegeName = collegeNameText;
      if (degree) targetUser.degree = degree;
      if (branch) targetUser.branch = branch;
      if (degreeBranch) targetUser.degreeBranch = degreeBranch;
      if (graduationYear) targetUser.graduationYear = Number(graduationYear);
      if (learningGoal) targetUser.learningGoal = learningGoal;
      if (Array.isArray(skills)) targetUser.skills = skills;
      if (targetRole) targetUser.targetRole = targetRole;
      if (placementCategory) targetUser.placementCategory = placementCategory;
      if (Array.isArray(targetCompanies)) targetUser.targetCompanies = targetCompanies;
      if (placementTimeline) targetUser.placementTimeline = placementTimeline;
      if (learningPath) targetUser.learningPath = learningPath;

      await targetUser.save();
    } else {
      const rawPassword = password || "UserAuthAccount123!";
      const hashedPassword = await bcrypt.hash(rawPassword, 12);

      targetUser = new User({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: emailCheck,
        password: hashedPassword,
        authProvider: isVerifiedSession ? "google" : "local",
        isClub: isClub || false,
        mobileNumber: mobileNumber || "",
        collegeName: collegeNameText,
        degree: degree || "",
        branch: branch || "",
        degreeBranch: degreeBranch || (degree && branch ? `${degree} ${branch}` : degree || branch || ""),
        graduationYear: graduationYear ? Number(graduationYear) : null,
        learningGoal: learningGoal || "",
        skills: Array.isArray(skills) ? skills : [],
        targetRole: targetRole || "",
        placementCategory: placementCategory || "",
        targetCompanies: Array.isArray(targetCompanies) ? targetCompanies : [],
        placementTimeline: placementTimeline || "",
        learningPath: learningPath || "",
        personalizedDetail: personalizedDetail || "",
        programSelection: programSelection || "Placement Sprint",
        placementReadiness: placementReadiness || "",
        dailyCommitment: dailyCommitment || "",
        declarationAccepted: declarationAccepted || false,
        batchId: batch._id,
      });

      await targetUser.save();
    }

    const token = generatorToken(targetUser._id);

    // Check if an admin already created a student profile for this email
    let student = await Student.findOne({ email: emailCheck });

    if (student) {
      // Link the existing student profile to the new user account
      student.userId = targetUser._id;
      student.collegeId = student.collegeId || college._id;
      student.batchId = student.batchId || batch._id;
      student.programSelection = targetUser.programSelection;
      student.learningGoal = targetUser.learningGoal;
      student.skills = targetUser.skills;
      student.targetRole = targetUser.targetRole;
      student.placementCategory = targetUser.placementCategory;
      student.targetCompanies = targetUser.targetCompanies;
      student.placementTimeline = targetUser.placementTimeline;
      student.learningPath = targetUser.learningPath;
      await student.save();
    } else {
      // Create matching Student record
      student = await Student.create({
        collegeId: college._id,
        batchId: batch._id,
        userId: targetUser._id,
        name: `${trimmedFirstName} ${trimmedLastName}`.trim().replace(/\.$/, ""),
        email: emailCheck,
        primaryTrack: "General Track",
        programSelection: targetUser.programSelection,
        learningGoal: targetUser.learningGoal,
        skills: targetUser.skills,
        targetRole: targetUser.targetRole,
        placementCategory: targetUser.placementCategory,
        targetCompanies: targetUser.targetCompanies,
        placementTimeline: targetUser.placementTimeline,
        learningPath: targetUser.learningPath,
        status: "Active",
      });
    }

    const enrolledPrograms = await syncProgramEnrollment({
      user: targetUser,
      student,
      batchId: student.batchId || batch._id,
      programSelection: targetUser.programSelection,
      onboardingData: req.body,
    });

    const enrolledList = Array.isArray(enrolledPrograms) ? enrolledPrograms : [enrolledPrograms].filter(Boolean);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        name: `${targetUser.firstName} ${targetUser.lastName}`.trim().replace(/\.$/, ""),
        email: targetUser.email,
        programSelection: targetUser.programSelection,
        programId: targetUser.programId || enrolledList[0]?._id || null,
        learningGoal: targetUser.learningGoal,
        learningPath: targetUser.learningPath,
        targetRole: targetUser.targetRole,
        skills: targetUser.skills || [],
      },
      assignedPrograms: enrolledList,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generatorToken(user._id);
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    // res.status(200).json({
    //   message: "Login successful",
    //   user: {
    //     id: user._id,
    //     firstName: user.firstName,
    //     email: user.email,
    //     role: user.role, // From main repo
    //     isClub: user.isClub, // From backend_web
    //   },
    //   token,
    // });
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        name: fullName || user.firstName,
        email: user.email,
        photoUrl: user.avatar || "",
        avatar: user.avatar || "",
        role: user.role,
        isClub: user.isClub,
        targetRole: user.targetRole || "",
        learningGoal: user.learningGoal || "",
        programId: user.programId || null,
        isEnrolledStudent: user.isClub || Boolean(user.batchId),
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// 📌 PUT /api/user/:id
export const updateUserProfile = async (req, res) => {
  const { id } = req.params;
  const { photoUrl, firstName, lastName, dateOfBirth, gender } = req.body;

  try {
    const updatedFields = {};

    if (photoUrl) {
      updatedFields.photoUrl = photoUrl;
      updatedFields.avatar = photoUrl;
    }
    if (firstName) updatedFields.firstName = firstName;
    if (lastName) updatedFields.lastName = lastName;
    if (dateOfBirth) updatedFields.dateOfBirth = dateOfBirth;
    if (gender) updatedFields.gender = gender;

    const updatedUser = await User.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Invalidate dashboard cache for this user so they get the fresh profile avatar
    invalidateDashboardCache(id);

    res.json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📌 PUT /api/users/preferences
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      skills,
      targetRole,
      placementCategory,
      targetCompanies,
      placementTimeline,
      learningPath,
      learningGoal,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : [];
    if (targetRole !== undefined) user.targetRole = targetRole;
    if (placementCategory !== undefined) user.placementCategory = placementCategory;
    if (targetCompanies !== undefined) user.targetCompanies = Array.isArray(targetCompanies) ? targetCompanies : [];
    if (placementTimeline !== undefined) user.placementTimeline = placementTimeline;
    if (learningPath !== undefined) user.learningPath = learningPath;
    if (learningGoal !== undefined) user.learningGoal = learningGoal;

    await user.save();

    let student = await Student.findOne({ userId: user._id });
    if (!student && user.email) {
      student = await Student.findOne({ email: user.email.toLowerCase() });
    }

    if (student) {
      student.skills = user.skills;
      student.targetRole = user.targetRole;
      student.placementCategory = user.placementCategory;
      student.targetCompanies = user.targetCompanies;
      student.placementTimeline = user.placementTimeline;
      student.learningPath = user.learningPath;
      if (learningGoal) student.learningGoal = user.learningGoal;
      await student.save();
    }

    // Re-run program matching
    const enrolledPrograms = await syncProgramEnrollment({
      user,
      student,
      batchId: student?.batchId || user.batchId,
      programSelection: user.programSelection,
      onboardingData: {
        learningGoal: user.learningGoal,
        placementCategory: user.placementCategory,
        targetCompanies: user.targetCompanies,
        skills: user.skills,
        targetRole: user.targetRole,
        learningPath: user.learningPath,
      },
    });

    invalidateDashboardCache(userId);

    res.json({
      message: "Preferences updated and programs matched successfully",
      user,
      assignedPrograms: enrolledPrograms,
    });
  } catch (error) {
    console.error("Update Preferences Error:", error);
    res.status(500).json({ message: error.message || "Failed to update preferences" });
  }
};

/**
 * POST /api/users/update-program-tier
 * Updates program tier subscription for user (Placement vs Skill)
 */
export const updateProgramTier = async (req, res) => {
  try {
    const userId = req.user._id;
    const { planId, learningGoal, targetRole, selectedSkill } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (learningGoal) user.learningGoal = learningGoal;
    if (targetRole) user.targetRole = targetRole;
    if (selectedSkill && (!user.skills || user.skills.length === 0)) {
      user.skills = [selectedSkill];
    }
    user.learningPath = planId;

    await user.save();
    invalidateDashboardCache(userId);

    res.json({
      success: true,
      message: "Program tier updated successfully",
      user: {
        _id: user._id,
        learningGoal: user.learningGoal,
        targetRole: user.targetRole,
        learningPath: user.learningPath,
      },
    });
  } catch (error) {
    console.error("Update Program Tier Error:", error);
    res.status(500).json({ message: error.message || "Failed to update program tier" });
  }
};

