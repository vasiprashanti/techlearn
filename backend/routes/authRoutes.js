import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import nodemailer from "nodemailer";
import admin from "../utils/firebaseAdmin.js";

import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const client = new OAuth2Client();
const SALT_ROUNDS = 10;

/* -------- JWT helper -------- */
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/* ========== REGISTER ========== */
router.post("/register", async function register(req, res) {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const formattedEmail = email.trim().toLowerCase();
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

/* ========== LOGIN ========== */
router.post("/login", async function login(req, res) {
  try {
    const { email, password } = req.body;
    const formattedEmail = email.trim().toLowerCase();

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const emailRegex = /^[\w.-]+@(gmail|outlook|yahoo)\.com$/;
    if (!emailRegex.test(formattedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: formattedEmail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Please log in with Google" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        photoUrl: user.photoUrl || "",
        role: user.role,
        isClub: user.isClub,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ========== GOOGLE OAUTH ========== */
router.post("/google", async function googleLogin(req, res) {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName: name.split(" ")[0],
        lastName: name.split(" ")[1] || "",
        email,
        password: "",
      });
    }

    const jwtToken = generateToken(user._id);
    return res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(401).json({ message: "Google authentication failed" });
  }
});

/* ========== FIREBASE AUTH ========== */
router.post("/firebase", async (req, res) => {
  const { idToken } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name } = decodedToken;
    const [firstName, ...rest] = name?.split(" ") || ["", ""];
    const lastName = rest.join(" ");

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required from Firebase" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: "",
      });
    }

    const token = generateToken(user._id);
    return res.status(200).json({
      message: "Firebase login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Firebase login error: ", err);
    return res.status(401).json({ message: "Firebase authentication failed!" });
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
      { new: true }
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
