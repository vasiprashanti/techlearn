import CodingRound from "../models/CodingRound.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import crypto from "crypto";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
  isRoundActive,
  getRoundTimeStatus,
  validateSubmission,
} from "../utils/mcqCodingUtils.js";

// Helper function to convert IST to UTC
const convertISTToUTC = (istDateString) => {
  const istDate = new Date(istDateString);

  if (
    istDateString.includes("Z") ||
    istDateString.includes("+") ||
    istDateString.includes("-")
  ) {
    return istDate;
  }

  // Assume IST and convert to UTC
  const utcDate = new Date(istDate.getTime() - 5.5 * 60 * 60 * 1000);
  return utcDate;
};

// Create a new coding round
export const createCodingRound = async (req, res) => {
  try {
    const { title, college, date, duration, problems } = req.body;

    // Validate required fields
    if (
      !title ||
      !college ||
      !date ||
      !duration ||
      !problems ||
      problems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and problems array cannot be empty",
      });
    }

    // Validate problems format
    for (const problem of problems) {
      if (
        !problem.problemTitle ||
        !problem.description ||
        !problem.difficulty ||
        !problem.hiddenTestCases ||
        !Array.isArray(problem.hiddenTestCases)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each problem must have a title, description, difficulty, and hiddenTestCases array",
        });
      }
      // Optionally, check for at least one test case
      if (problem.hiddenTestCases.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Each problem must have at least one hidden test case",
        });
      }
    }

    // Convert IST to UTC for storage
    const linkId = crypto.randomBytes(8).toString("hex");
    const codingDate = convertISTToUTC(date);

    const codingRound = new CodingRound({
      title,
      college,
      date: codingDate,
      duration,
      problems,
      linkId,
    });

    await codingRound.save();

    res.status(201).json({
      success: true,
      message: "Coding round created successfully",
      data: {
        id: codingRound._id,
        title: codingRound.title,
        college: codingRound.college,
        linkId: codingRound.linkId,
        accessLink: `${process.env.FRONTEND_URL}/coding/${codingRound.linkId}`,
      },
    });
  } catch (error) {
    console.error("Error creating coding round:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coding round",
      error: error.message,
    });
  }
};

// Get all coding rounds
export const getAllCodingRounds = async (req, res) => {
  try {
    const codingRounds = await CodingRound.find()
      .select(
        "title college date duration totalAttempts isActive linkId createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: codingRounds,
    });
  } catch (error) {
    console.error("Error fetching all coding rounds:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a single coding round by linkId
export const getOneCodingRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }
    res.status(200).json({ success: true, data: codingRound });
  } catch (error) {
    console.error("Error fetching coding round:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Send OTP for coding round access
export const sendCodingRoundOTP = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }

    if (!isRoundActive(codingRound)) {
      return res
        .status(403)
        .json({ success: false, message: "Coding round not active" });
    }

    // Check if student has already submitted (one submission per coding round per student)
    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: email,
    });
    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this coding round",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    storeOTP(`${linkId}:${email}`, otp);
    await sendOTPEmail(email, otp, "Coding Round");

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP for Coding Round:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Verify OTP and get coding round access
export const verifyOTPAndGetCodingRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }

    if (!isRoundActive(codingRound)) {
      return res
        .status(403)
        .json({ success: false, message: "Coding round not active" });
    }

    const valid = verifyOTP(`${linkId}:${email}`, otp);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    res.json({ success: true, codingRound });
  } catch (error) {
    console.error("Error verifying OTP for Coding Round:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

// Submit coding round answers
export const submitCodingRoundAnswers = async (req, res) => {};

// Update a coding round by codingRoundId
export const updateCodingRound = async (req, res) => {
  try {
    const { codingRoundId } = req.params;
    const { title, college, date, duration, problems, isActive } = req.body;

    // Validate coding round ID
    if (!codingRoundId || !codingRoundId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coding round ID",
      });
    }

    // Check if coding round exists
    const existingCodingRound = await CodingRound.findById(codingRoundId);
    if (!existingCodingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    // Validate problems format if provided
    if (problems && problems.length > 0) {
      for (const problem of problems) {
        if (
          !problem.problemTitle ||
          !problem.description ||
          !problem.difficulty ||
          !problem.hiddenTestCases ||
          !Array.isArray(problem.hiddenTestCases)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each problem must have a title, description, difficulty, and hiddenTestCases array",
          });
        }
        if (problem.hiddenTestCases.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Each problem must have at least one hidden test case",
          });
        }
      }
    }

    // Prepare update data with IST to UTC conversion
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (college !== undefined) updateData.college = college;
    if (date !== undefined) updateData.date = convertISTToUTC(date);
    if (duration !== undefined) updateData.duration = duration;
    if (problems !== undefined) updateData.problems = problems;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the coding round
    const updatedCodingRound = await CodingRound.findByIdAndUpdate(
      codingRoundId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Coding round updated successfully",
      data: {
        id: updatedCodingRound._id,
        title: updatedCodingRound.title,
        college: updatedCodingRound.college,
        date: updatedCodingRound.date,
        duration: updatedCodingRound.duration,
        problems: updatedCodingRound.problems,
        isActive: updatedCodingRound.isActive,
        linkId: updatedCodingRound.linkId,
        totalAttempts: updatedCodingRound.totalAttempts,
        accessLink: `${process.env.FRONTEND_URL}/coding/${updatedCodingRound.linkId}`,
      },
    });
  } catch (error) {
    console.error("Error updating coding round:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coding round",
      error: error.message,
    });
  }
};

// Delete a coding round by codingRoundId
export const deleteCodingRound = async (req, res) => {
  try {
    const { codingRoundId } = req.params;

    // Validate coding round ID
    if (!codingRoundId || !codingRoundId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coding round ID",
      });
    }

    const codingRound = await CodingRound.findByIdAndDelete(codingRoundId);
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }

    // Also delete related submissions
    await StudentCodingSubmission.deleteMany({
      codingRoundId: codingRound._id,
    });

    res.status(200).json({
      success: true,
      message: "Coding round and related submissions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coding round:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin: Get student scores for a specific coding round
export const getCodingRoundScores = async (req, res) => {};
