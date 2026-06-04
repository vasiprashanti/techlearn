import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import nodemailer from "nodemailer";
import admin from "../utils/firebaseAdmin.js";

import User from "../models/User.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const client = new OAuth2Client();
const SALT_ROUNDS = 10;

/* -------- JWT helper -------- */
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const mapUserToStudentCohort = async (user) => {
  if (!user?.email) return { user, student: null, batch: null };

  const student = await Student.findOne({ email: normalizeEmail(user.email) });
  if (!student) return { user, student: null, batch: null };

  const batch = await Batch.findById(student.batchId).lean();
  if (!batch) {
    const error = new Error("Your cohort exists, but the assigned batch was not found.");
    error.status = 404;
    throw error;
  }

  let changed = false;
  if (!student.userId || String(student.userId) !== String(user._id)) {
    student.userId = user._id;
    await student.save();
  }

  if (!user.batchId || String(user.batchId) !== String(student.batchId)) {
    user.batchId = student.batchId;
    changed = true;
  }

  if (batch.startDate && (!user.startDate || new Date(user.startDate).getTime() !== new Date(batch.startDate).getTime())) {
    user.startDate = batch.startDate;
    changed = true;
  }

  if (changed) {
    await user.save();
  }

  return { user, student, batch };
};

const formatAuthUser = (user, student = null, batch = null) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  photoUrl: user.photoUrl || "",
  role: user.role,
  isClub: user.isClub,
  batchId: user.batchId || student?.batchId || null,
  startDate: user.startDate || batch?.startDate || null,
});

/* ========== REGISTER ========== */
router.post("/register", async function register(req, res) {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const formattedEmail = normalizeEmail(email);
    const emailRegex = /^[\w.-]+@(gmail|outlook|yahoo)\.com$/;
    if (!emailRegex.test(formattedEmail)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email account" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const emailExists = await User.findOne({ email: formattedEmail });
    if (emailExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email: formattedEmail,
      password,
    });

    const token = generateToken(newUser._id);
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        email: newUser.email,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
//Tested and working fine

/* ========== LOGIN ========== */
router.post("/login", async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const formattedEmail = normalizeEmail(email);
    const emailRegex = /^[\w.-]+@(gmail|outlook|yahoo)\.com$/;
    if (!emailRegex.test(formattedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: formattedEmail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.password || ["google", "firebase"].includes(user.authProvider)) {
      return res.status(400).json({ message: "Please log in with Google" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      message: "Login successful",
      user: formatAuthUser(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
//Tested and working fine

/* ========== GOOGLE OAUTH ========== */
router.post("/google", async function googleLogin(req, res) {
  const { token } = req.body;
  try {
    if (!token) {
      return res.status(400).json({ message: "Google login failed: missing Google token." });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();
    const formattedEmail = normalizeEmail(email);

    if (!formattedEmail) {
      return res.status(400).json({ message: "Google login failed: email was not provided by Google." });
    }

    const [firstName, ...rest] = String(name || formattedEmail.split("@")[0]).split(" ");

    let user = await User.findOne({ email: formattedEmail });
    if (!user) {
      try {
        user = await User.create({
          firstName: firstName || "Student",
          lastName: rest.join(" "),
          email: formattedEmail,
          password: "",
          authProvider: "google",
          photoUrl: "/profile_avatars/nobackgroundavatar1.png",
          avatar: "/profile_avatars/nobackgroundavatar1.png",
        });
      } catch (error) {
        if (error?.code === 11000) {
          user = await User.findOne({ email: formattedEmail });
        } else {
          throw error;
        }
      }
    } else {
      user.authProvider = user.authProvider === "local" ? user.authProvider : "google";
      if (!user.photoUrl || !user.photoUrl.includes("/profile_avatars/")) {
        user.photoUrl = "/profile_avatars/nobackgroundavatar1.png";
      }
      if (!user.avatar || !user.avatar.includes("/profile_avatars/")) {
        user.avatar = "/profile_avatars/nobackgroundavatar1.png";
      }
      await user.save();
    }

    const mapped = await mapUserToStudentCohort(user);
    const jwtToken = generateToken(mapped.user._id);
    return res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user: formatAuthUser(mapped.user, mapped.student, mapped.batch),
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(err.status || 401).json({
      message: err.message || "Google login failed. Please try again.",
    });
  }
});

/* ========== FIREBASE AUTH ========== */
router.post("/firebase", async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;
    const [firstName, ...rest] = name?.split(" ") || ["", ""];
    const lastName = rest.join(" ");

    const ADMIN_UIDS = ["AQX8cieAI6NNMtVvNRlT47WxdLu1"];
    const isAdmin = ADMIN_UIDS.includes(decodedToken.uid);
    const assignedRole = isAdmin ? "admin" : "user";

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required from Firebase" });
    }

    const formattedEmail = normalizeEmail(email);
    let user = await User.findOne({ email: formattedEmail });

    if (!user) {
      try {
        user = await User.create({
          firstName,
          lastName,
          email: formattedEmail,
          password: "",
          authProvider: "firebase",
          photoUrl: "/profile_avatars/nobackgroundavatar1.png",
          avatar: "/profile_avatars/nobackgroundavatar1.png",
          role: assignedRole,
        });
      } catch (error) {
        if (error?.code === 11000) {
          user = await User.findOne({ email: formattedEmail });
        } else {
          throw error;
        }
      }
    } else {
      if (isAdmin && user.role !== "admin") user.role = "admin";
      if (!user.photoUrl || !user.photoUrl.includes("/profile_avatars/")) {
        user.photoUrl = "/profile_avatars/nobackgroundavatar1.png";
      }
      if (!user.avatar || !user.avatar.includes("/profile_avatars/")) {
        user.avatar = "/profile_avatars/nobackgroundavatar1.png";
      }
      if (user.authProvider !== "local") user.authProvider = "firebase";
      await user.save();
    }

    const mapped = await mapUserToStudentCohort(user);
    const token = generateToken(mapped.user._id);
    return res.status(200).json({
      message: "Firebase login successful",
      token,
      user: formatAuthUser(mapped.user, mapped.student, mapped.batch),
    });
  } catch (err) {
    console.error("Firebase login error: ", err);
    return res.status(err.status || 401).json({ message: err.message || "Google login failed. Please try again." });
  }
});

/* ========== CURRENT USER ========== */
router.get("/me", protect, async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    return res.status(200).json({
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
    });
  } catch (err) {
    console.error("Fetch user error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
//Tested and working fine

/* ========== FORGOT PASSWORD ========== */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `https://techlearnsolutions.com/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Link",
      html: `
        <p>Hello ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Reset email sent successfully" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});
//Tested and working fine

/* ========== RESET PASSWORD ========== */
router.post("/reset-password/:resetToken", async (req, res) => {
  const resetToken = req.params.resetToken;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.status(400).json({ message: "Please provide both passwords" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
//Tested and working fine

/* ========== UPDATE AVATAR ========== */
router.put("/avatar", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: "Avatar is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true },
    );

    return res.status(200).json({
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    return res.status(500).json({ message: "Server error updating avatar" });
  }
});

export default router;
