import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { invalidateDashboardCache } from "./dashboardController.js";
import College from "../models/College.js";
import Student from "../models/Student.js";
import Project from "../models/Project.js";
import ProjectDay from "../models/ProjectDay.js";
import ProjectTask from "../models/ProjectTask.js";
import { syncProgramEnrollment } from "../utils/programEnrollment.js";
import StudentProject from "../models/StudentProject.js";
import {
  buildUnifiedProfile,
  ensureStudentForUser,
  getUnifiedProfileForUser,
} from "../utils/userProfile.js";


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
      declarationAccepted,
      onboardingCompleted,
      completeOnboarding,
    } = req.body;

    const shouldCompleteOnboarding = onboardingCompleted === true || completeOnboarding === true;

    const emailCheck = (email || "").trim().toLowerCase();
    if (!emailCheck) {
      return res.status(400).json({ message: "Email is required" });
    }

    const verifiedEmail = await getVerifiedEmailFromReq(req);
    const isGoogleAuthUser = Boolean(req.body.isGoogleUser || req.body.authProvider === "google" || req.body.authProvider === "firebase");
    const isVerifiedSession = Boolean((verifiedEmail && verifiedEmail === emailCheck) || isGoogleAuthUser);

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

    // A draft account must not require or invent a college/batch. The
    // college is resolved only when onboarding is explicitly completed.
    const collegeNameText = (collegeName || "").trim();
    let college = null;
    if (shouldCompleteOnboarding) {
      const resolvedCollegeName = collegeNameText || "TechLearn College";
      college = await College.findOne({ name: { $regex: new RegExp(`^${escapeRegex(resolvedCollegeName)}$`, "i") } });
      if (!college) {
        college = await College.create({
          name: resolvedCollegeName,
          code: resolvedCollegeName.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase() || "TLC",
          status: "Active",
        });
      }
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
      if (req.body.targetRoleOther || req.body.otherTargetRole) targetUser.otherTargetRole = req.body.targetRoleOther || req.body.otherTargetRole;
      if (placementCategory) targetUser.placementCategory = placementCategory;
      if (Array.isArray(targetCompanies)) targetUser.targetCompanies = targetCompanies;
      if (placementTimeline) targetUser.placementTimeline = placementTimeline;
      if (learningPath) targetUser.learningPath = learningPath;
      if (programSelection) targetUser.programSelection = programSelection;
      if (shouldCompleteOnboarding && !targetUser.onboardingCompleted) {
        targetUser.onboardingCompleted = true;
        targetUser.onboardingCompletedAt = new Date();
      }

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
        otherTargetRole: req.body.targetRoleOther || req.body.otherTargetRole || "",
        placementCategory: placementCategory || "",
        targetCompanies: Array.isArray(targetCompanies) ? targetCompanies : [],
        placementTimeline: placementTimeline || "",
        learningPath: learningPath || "",
        personalizedDetail: personalizedDetail || "",
        programSelection: programSelection || "Placement Sprint",
        placementReadiness: placementReadiness || "",
        dailyCommitment: dailyCommitment || "",
        declarationAccepted: declarationAccepted || false,
        // New accounts are not put into a cohort implicitly. A batch is only
        // written by an explicit admin enrollment or an imported record.
        batchId: null,
        onboardingCompleted: shouldCompleteOnboarding,
        onboardingCompletedAt: shouldCompleteOnboarding ? new Date() : null,
      });

      await targetUser.save();
    }

    const token = generatorToken(targetUser._id);

    // Check if an admin already created a student profile for this email.
    // Draft accounts intentionally do not create a duplicate Student row.
    let student = await Student.findOne({ email: emailCheck });

    if (!shouldCompleteOnboarding) {
      if (student && (!student.userId || String(student.userId) !== String(targetUser._id))) {
        student.userId = targetUser._id;
        await student.save();
      }
      const importedDraft = student
        ? await Student.findById(student._id)
          .populate("collegeId", "name")
          .populate("batchId", "name startDate expiryDate status")
          .populate("programId", "name programType duration durationDays status visibility")
          .lean()
        : null;
      const draftToken = generatorToken(targetUser._id);
      return res.status(201).json({
        message: "Draft account created successfully",
        token: draftToken,
        user: {
          ...buildUnifiedProfile({ user: targetUser, student: importedDraft }),
          onboardingCompleted: false,
          onboardingCompletedAt: null,
        },
      });
    }

    if (student) {
      // Link the existing student profile to the new user account
      student.userId = targetUser._id;
      student.collegeId = student.collegeId || college?._id;
      // Imported enrollment data remains authoritative. Only fill missing
      // profile fields; never overwrite an imported batch or program.
      student.programSelection = student.programSelection || targetUser.programSelection;
      if (!student.degree && targetUser.degree) student.degree = targetUser.degree;
      if (!student.branch && targetUser.branch) student.branch = targetUser.branch;
      if (!student.graduationYear && targetUser.graduationYear) student.graduationYear = targetUser.graduationYear;
      student.learningGoal = targetUser.learningGoal;
      student.skills = targetUser.skills;
      student.targetRole = targetUser.targetRole;
      student.otherTargetRole = targetUser.otherTargetRole;
      student.placementCategory = targetUser.placementCategory;
      student.targetCompanies = targetUser.targetCompanies;
      student.placementTimeline = targetUser.placementTimeline;
      student.learningPath = targetUser.learningPath;
      student.onboardingCompleted = true;
      student.onboardingCompletedAt = targetUser.onboardingCompletedAt;
      await student.save();
    } else {
      // Create matching Student record
      student = await Student.create({
        collegeId: college._id,
        userId: targetUser._id,
        name: `${trimmedFirstName} ${trimmedLastName}`.trim().replace(/\.$/, ""),
        email: emailCheck,
        degree: targetUser.degree || "",
        branch: targetUser.branch || "",
        graduationYear: targetUser.graduationYear || null,
        primaryTrack: "General Track",
        programSelection: targetUser.programSelection,
        learningGoal: targetUser.learningGoal,
        skills: targetUser.skills,
        targetRole: targetUser.targetRole,
        otherTargetRole: targetUser.otherTargetRole,
        placementCategory: targetUser.placementCategory,
        targetCompanies: targetUser.targetCompanies,
        placementTimeline: targetUser.placementTimeline,
        learningPath: targetUser.learningPath,
        onboardingCompleted: true,
        onboardingCompletedAt: targetUser.onboardingCompletedAt,
        status: "Active",
      });
    }

    const enrolledPrograms = await syncProgramEnrollment({
      user: targetUser,
      student,
      programId: student.programId || targetUser.programId,
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
        collegeName: targetUser.collegeName,
        degree: targetUser.degree,
        branch: targetUser.branch,
        graduationYear: targetUser.graduationYear,
        programSelection: targetUser.programSelection,
        programId: targetUser.programId || enrolledList[0]?._id || null,
        learningGoal: targetUser.learningGoal,
        learningPath: targetUser.learningPath,
        targetRole: targetUser.targetRole,
        otherTargetRole: targetUser.otherTargetRole,
        placementCategory: targetUser.placementCategory,
        targetCompanies: targetUser.targetCompanies || [],
        placementTimeline: targetUser.placementTimeline || "",
        skills: targetUser.skills || [],
        onboardingCompleted: true,
        onboardingCompletedAt: targetUser.onboardingCompletedAt,
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
    let student = await Student.findOne({ email: user.email.toLowerCase() });

    const isProfileComplete = Boolean(
      user.onboardingCompleted ||
      student?.onboardingCompleted
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        name: fullName || user.firstName,
        email: user.email,
        authProvider: user.authProvider || "local",
        photoUrl: user.avatar || "",
        avatar: user.avatar || "",
        role: user.role,
        isClub: user.isClub,
        collegeName: student?.collegeName || user.collegeName || "",
        degree: student?.degree || user.degree || "",
        branch: student?.branch || user.branch || "",
        graduationYear: student?.graduationYear || user.graduationYear || null,
        targetRole: student?.targetRole || user.targetRole || student?.otherTargetRole || user.otherTargetRole || "",
        otherTargetRole: student?.otherTargetRole || user.otherTargetRole || "",
        learningGoal: student?.learningGoal || user.learningGoal || "",
        placementCategory: student?.placementCategory || user.placementCategory || "",
        targetCompanies: student?.targetCompanies?.length ? student.targetCompanies : (user.targetCompanies || []),
        placementTimeline: student?.placementTimeline || user.placementTimeline || "",
        skills: student?.skills?.length ? student.skills : (user.skills || []),
        programId: user.programId || student?.programId || null,
        batchId: user.batchId || student?.batchId || null,
        isEnrolledStudent: user.isClub || Boolean(user.batchId) || Boolean(student),
        onboardingCompleted: isProfileComplete,
        onboardingCompletedAt: user.onboardingCompletedAt || student?.onboardingCompletedAt || (isProfileComplete ? user.updatedAt : null),
        profile: buildUnifiedProfile({ user, student }),
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

const saveProfileState = async ({ req, completeOnboarding }) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const {
    skills,
    targetRole,
    otherTargetRole,
    targetRoleOther,
    placementCategory,
    targetCompanies,
    placementTimeline,
    learningPath,
    learningGoal,
    collegeName,
    degree,
    branch,
    graduationYear,
    programSelection,
  } = req.body || {};

  let student = await Student.findOne({
    $or: [
      { userId: user._id },
      ...(user.email ? [{ email: user.email.toLowerCase() }] : []),
    ],
  }).populate("collegeId", "name");

  // Imported student enrollment data is authoritative. Copy it into the
  // authenticated user only when the user record is missing that value.
  if (student?.collegeId?.name && !user.collegeName) user.collegeName = student.collegeId.name;
  if (student?.degree && !user.degree) user.degree = student.degree;
  if (student?.branch && !user.branch) user.branch = student.branch;
  if (student?.graduationYear && !user.graduationYear) user.graduationYear = student.graduationYear;
  if (student?.programId && !user.programId) user.programId = student.programId;
  if (student?.batchId && !user.batchId) user.batchId = student.batchId;

  if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : [];
  if (targetRole !== undefined) user.targetRole = targetRole;
  if (otherTargetRole !== undefined || targetRoleOther !== undefined) {
    user.otherTargetRole = otherTargetRole || targetRoleOther || "";
  }
  if (placementCategory !== undefined) user.placementCategory = placementCategory;
  if (targetCompanies !== undefined) user.targetCompanies = Array.isArray(targetCompanies) ? targetCompanies : [];
  if (placementTimeline !== undefined) user.placementTimeline = placementTimeline;
  if (learningPath !== undefined) user.learningPath = learningPath;
  if (learningGoal !== undefined) user.learningGoal = learningGoal;
  if (collegeName && !student?.collegeId?._id) user.collegeName = String(collegeName).trim();
  if (degree && !student?.degree) user.degree = degree;
  if (branch && !student?.branch) user.branch = branch;
  if (graduationYear && !student?.graduationYear) user.graduationYear = Number(graduationYear);
  if (programSelection && !student?.programId) user.programSelection = programSelection;

  if (completeOnboarding) {
    user.onboardingCompleted = true;
    user.onboardingCompletedAt = user.onboardingCompletedAt || new Date();
  }

  await user.save();

  if (completeOnboarding) {
    student = await ensureStudentForUser({ user, student, collegeModel: College });
  }

  if (student) {
    student.userId = user._id;
    // Keep enrollment fields untouched; only synchronize learner profile data.
    student.skills = user.skills;
    student.targetRole = user.targetRole;
    student.otherTargetRole = user.otherTargetRole;
    student.placementCategory = user.placementCategory;
    student.targetCompanies = user.targetCompanies;
    student.placementTimeline = user.placementTimeline;
    student.learningPath = user.learningPath;
    if (!student.degree && user.degree) student.degree = user.degree;
    if (!student.branch && user.branch) student.branch = user.branch;
    if (!student.graduationYear && user.graduationYear) student.graduationYear = user.graduationYear;
    if (learningGoal !== undefined || completeOnboarding) student.learningGoal = user.learningGoal;
    if (completeOnboarding) {
      student.onboardingCompleted = true;
      student.onboardingCompletedAt = user.onboardingCompletedAt;
    }
    await student.save();
  }

  let enrolledPrograms = [];
  if (completeOnboarding && student) {
    // Passing null explicitly preserves the individual schedule. A batch is
    // used only when the imported/admin enrollment already has one.
    // Leave the value undefined when no legacy batch is present so the
    // enrollment helper can preserve an existing per-program batch schedule.
    // A genuinely new enrollment still resolves to an individual schedule.
    const enrollmentBatchId = student.batchId || user.batchId || undefined;
    const enrolled = await syncProgramEnrollment({
      user,
      student,
      batchId: enrollmentBatchId,
      programId: student.programId || user.programId || null,
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
    enrolledPrograms = Array.isArray(enrolled) ? enrolled : [enrolled].filter(Boolean);
  }

  invalidateDashboardCache(userId);
  const profileData = await getUnifiedProfileForUser(userId);

  return {
    user: profileData?.profile || buildUnifiedProfile({ user, student }),
    profile: profileData?.profile || buildUnifiedProfile({ user, student }),
    assignedPrograms: enrolledPrograms,
  };
};

// 📌 GET /api/users/profile
export const getCurrentUserProfile = async (req, res) => {
  try {
    const profileData = await getUnifiedProfileForUser(req.user._id);
    if (!profileData) return res.status(404).json({ success: false, message: "User profile not found" });
    return res.json({ success: true, profile: profileData.profile, user: profileData.profile });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to load profile" });
  }
};

// 📌 PUT /api/users/onboarding/draft
export const saveOnboardingDraft = async (req, res) => {
  try {
    const result = await saveProfileState({ req, completeOnboarding: false });
    return res.json({ success: true, message: "Onboarding progress saved", ...result });
  } catch (error) {
    console.error("Save onboarding draft error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to save onboarding progress" });
  }
};

// 📌 PUT /api/users/preferences
export const updatePreferences = async (req, res) => {
  try {
    // Existing clients omit the flag; preserve their completion behaviour.
    const completeOnboarding = req.body?.completeOnboarding !== false && req.body?.onboardingCompleted !== false;
    const result = await saveProfileState({ req, completeOnboarding });
    return res.json({
      success: true,
      message: completeOnboarding ? "Preferences updated and programs matched successfully" : "Onboarding progress saved",
      ...result,
    });
  } catch (error) {
    console.error("Update Preferences Error:", error);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to update preferences" });
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

