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
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
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
      programSelection,
      placementReadiness,
      dailyCommitment,
      declarationAccepted
    } = req.body;

    const emailCheck = (email || "").trim().toLowerCase();
    if (!emailCheck) {
      return res.status(400).json({ message: "Email is required" });
    }

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

    const existingUser = await User.findOne({ email: emailCheck });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
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
    let college = await College.findOne({ name: { $regex: new RegExp(`^${collegeNameText}$`, "i") } });
    if (!college) {
      college = await College.create({ name: collegeNameText });
    }

    // Resolve or create Batch
    let batch = await Batch.findOne({ collegeId: college._id, name: "Cohort 1" });
    if (!batch) {
      batch = await Batch.create({ name: "Cohort 1", collegeId: college._id });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: emailCheck,
      password: hashedPassword,
      isClub: isClub || false,
      mobileNumber: mobileNumber || "",
      collegeName: collegeNameText,
      degreeBranch: degreeBranch || "",
      graduationYear: graduationYear ? Number(graduationYear) : null,
      programSelection: programSelection || "Placement Sprint",
      placementReadiness: placementReadiness || "",
      dailyCommitment: dailyCommitment || "",
      declarationAccepted: declarationAccepted || false,
      batchId: batch._id,
    });

    await newUser.save();
    const token = generatorToken(newUser._id);

    // Create matching Student record
    const student = await Student.create({
      collegeId: college._id,
      batchId: batch._id,
      userId: newUser._id,
      name: `${trimmedFirstName} ${trimmedLastName}`.trim().replace(/\.$/, ""),
      email: emailCheck,
      primaryTrack: "General Track",
      status: "Active",
    });

    // Auto-assign project if they joined Full Stack Project Program or Both
    if (newUser.programSelection === "Full Stack Project Program" || newUser.programSelection === "Both") {
      const defaultProject = await ensureDefaultProjectExists();
      if (defaultProject) {
        await StudentProject.create({
          student_id: student._id,
          project_id: defaultProject._id,
          status: "Active",
          current_day: 1,
          progress_percentage: 0
        });
      }
    }

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        name: `${newUser.firstName} ${newUser.lastName}`.trim().replace(/\.$/, ""),
        email: newUser.email,
        programSelection: newUser.programSelection,
      },
      token,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server Error during registration" });
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
