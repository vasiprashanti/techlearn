console.log("FRONTEND_URL from env:", process.env.FRONTEND_URL);
import CollegeMcq from "../models/CollegeMcq.js";
import StudentMcqSubmission from "../models/StudentMcqSubmission.js";
import { sendMail } from "../utils/mailer.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Optimized in-memory OTP store with automatic cleanup
const otpStore = new Map();

// Clean expired OTPs every 2 minutes for efficiency
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [key, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(key);
      cleanedCount++;
    }
  }
}, 2 * 60 * 1000);

// Helper function to check if MCQ is still active based on duration
const isMcqActive = (mcq) => {
  const now = new Date();
  const mcqStartTime = new Date(mcq.date);
  const mcqEndTime = new Date(mcq.date.getTime() + mcq.duration * 60 * 1000);
  return now >= mcqStartTime && now <= mcqEndTime;
};

// Helper function to get detailed MCQ time status
const getMcqTimeStatus = (mcq) => {
  const now = new Date();
  const mcqStartTime = new Date(mcq.date);
  const mcqEndTime = new Date(mcq.date.getTime() + mcq.duration * 60 * 1000);

  const hasStarted = now >= mcqStartTime;
  const hasExpired = now > mcqEndTime;
  const isActive = hasStarted && !hasExpired;

  return {
    hasStarted,
    hasExpired,
    isActive,
    remainingMinutes: isActive
      ? Math.max(0, Math.floor((mcqEndTime - now) / (1000 * 60)))
      : 0,
    minutesUntilStart: !hasStarted
      ? Math.max(0, Math.floor((mcqStartTime - now) / (1000 * 60)))
      : 0,
  };
};

// Admin: Create a new college MCQ
export const createCollegeMcq = async (req, res) => {
  try {
    const { title, college, date, duration, questions } = req.body;

    // Validate required fields
    if (
      !title ||
      !college ||
      !date ||
      !duration ||
      !questions ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and questions array cannot be empty",
      });
    }

    // Validate questions format
    for (const question of questions) {
      if (
        !question.text ||
        !question.options ||
        question.options.length !== 4
      ) {
        return res.status(400).json({
          success: false,
          message: "Each question must have text and exactly 4 options",
        });
      }
      if (question.correct < 0 || question.correct > 3) {
        return res.status(400).json({
          success: false,
          message: "Correct answer index must be between 0 and 3",
        });
      }
    }

    // Generate unique link ID
    const linkId = crypto.randomBytes(8).toString("hex");

    const collegeMcq = new CollegeMcq({
      title,
      college,
      date: new Date(date),
      duration,
      questions,
      linkId,
    });

    await collegeMcq.save();

    res.status(201).json({
      success: true,
      message: "College MCQ created successfully",
      data: {
        id: collegeMcq._id,
        title: collegeMcq.title,
        college: collegeMcq.college,
        linkId: collegeMcq.linkId,
        // Return the access link
        accessLink: `${process.env.FRONTEND_URL}/mcq/${collegeMcq.linkId}`,
      },
    });
  } catch (error) {
    console.error("Error creating college MCQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create college MCQ",
      error: error.message,
    });
  }
};

// Admin: Update a college MCQ
export const updateCollegeMcq = async (req, res) => {
  try {
    const { mcqId } = req.params;
    const { title, college, date, duration, questions, isActive } = req.body;

    // Check if MCQ exists
    const existingMcq = await CollegeMcq.findById(mcqId);
    if (!existingMcq) {
      return res.status(404).json({
        success: false,
        message: "College MCQ not found",
      });
    }

    // Validate questions format if provided
    if (questions && questions.length > 0) {
      for (const question of questions) {
        if (
          !question.text ||
          !question.options ||
          question.options.length !== 4
        ) {
          return res.status(400).json({
            success: false,
            message: "Each question must have text and exactly 4 options",
          });
        }
        if (question.correct < 0 || question.correct > 3) {
          return res.status(400).json({
            success: false,
            message: "Correct answer index must be between 0 and 3",
          });
        }
      }
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (college !== undefined) updateData.college = college;
    if (date !== undefined) updateData.date = new Date(date);
    if (duration !== undefined) updateData.duration = duration;
    if (questions !== undefined) updateData.questions = questions;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the MCQ
    const updatedMcq = await CollegeMcq.findByIdAndUpdate(mcqId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "College MCQ updated successfully",
      data: {
        id: updatedMcq._id,
        title: updatedMcq.title,
        college: updatedMcq.college,
        date: updatedMcq.date,
        duration: updatedMcq.duration,
        questions: updatedMcq.questions,
        isActive: updatedMcq.isActive,
        linkId: updatedMcq.linkId,
        totalAttempts: updatedMcq.totalAttempts,
        accessLink: `${process.env.FRONTEND_URL}/mcq/${updatedMcq.linkId}`,
      },
    });
  } catch (error) {
    console.error("Error updating college MCQ:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update college MCQ",
      error: error.message,
    });
  }
};

// Student: Send OTP to email for college MCQ access
export const sendCollegeMcqOTP = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const collegeMcq = await CollegeMcq.findOne({ linkId });
    if (!collegeMcq) {
      return res.status(404).json({
        success: false,
        message: "College MCQ not found",
      });
    }

    // Check if college MCQ is still active based on duration
    const timeStatus = getMcqTimeStatus(collegeMcq);
    if (!timeStatus.isActive) {
      if (!timeStatus.hasStarted) {
        return res.status(425).json({
          success: false,
          message: `College MCQ has not started yet. Test will begin in ${timeStatus.minutesUntilStart} minutes.`,
          timeStatus,
        });
      } else {
        return res.status(410).json({
          success: false,
          message: "College MCQ has expired",
          timeStatus,
        });
      }
    }

    // Check if student has already submitted (one submission per MCQ per student)
    const existingSubmission = await StudentMcqSubmission.findOne({
      collegeMcqId: collegeMcq._id,
      studentEmail: email,
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this college MCQ",
      });
    }

    // Generate simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP for secure storage
    const otpHash = await bcrypt.hash(otp, 10);

    // Store hashed OTP in memory with expiration
    const otpKey = `${email}-${linkId}`;
    otpStore.set(otpKey, {
      hash: otpHash,
      email: email,
      collegeMcqId: collegeMcq._id,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send OTP via email with try-catch for email service
    try {
      const emailSubject = `OTP for ${collegeMcq.title} - ${collegeMcq.college}`;
      const emailText = `
Your OTP for accessing the college MCQ "${collegeMcq.title}" is: ${otp}

This OTP is valid for 10 minutes.

College MCQ Details:
- College: ${collegeMcq.college}
- Duration: ${collegeMcq.duration} minutes
- Questions: ${collegeMcq.questions.length}

Do not share this OTP with anyone.
      `;

      await sendMail(email, emailSubject, emailText);

      res.status(200).json({
        success: true,
        message: "OTP sent successfully to your email",
      });
    } catch (emailError) {
      // Remove OTP from store if email fails
      otpStore.delete(otpKey);
      console.error("Email service error:", emailError);

      res.status(503).json({
        success: false,
        message: "Failed to send OTP email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Student: Verify OTP and get college MCQ access
export const verifyOTPAndGetCollegeMcq = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    if (typeof otp !== "string" || otp.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-digit OTP is required",
      });
    }

    const sanitizedOtp = otp.trim();

    // Find the college MCQ
    const collegeMcq = await CollegeMcq.findOne({ linkId });
    if (!collegeMcq) {
      return res.status(404).json({
        success: false,
        message: "College MCQ not found",
      });
    }

    // Check if college MCQ is still active based on duration
    const timeStatus = getMcqTimeStatus(collegeMcq);
    if (!timeStatus.isActive) {
      if (!timeStatus.hasStarted) {
        return res.status(425).json({
          success: false,
          message: `College MCQ has not started yet. Test will begin in ${timeStatus.minutesUntilStart} minutes.`,
          timeStatus,
        });
      } else {
        return res.status(410).json({
          success: false,
          message: "College MCQ has expired",
          timeStatus,
        });
      }
    }

    // Verify OTP from memory store
    const otpKey = `${email}-${linkId}`;
    const otpRecord = otpStore.get(otpKey);

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    if (Date.now() > otpRecord.expiresAt) {
      // Clean up expired OTP
      otpStore.delete(otpKey);
      return res.status(410).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Verify OTP using bcrypt.compare for security
    const isOtpValid = await bcrypt.compare(sanitizedOtp, otpRecord.hash);
    if (!isOtpValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    // Remove OTP from store after successful verification (consume OTP)
    otpStore.delete(otpKey);

    // Return college MCQ data without correct answers
    const mcqData = {
      id: collegeMcq._id,
      title: collegeMcq.title,
      college: collegeMcq.college,
      duration: collegeMcq.duration,
      questions: collegeMcq.questions.map((q, index) => ({
        id: index,
        text: q.text,
        options: q.options,
        difficulty: q.difficulty,
        tags: q.tags,
        // Don't include correct answer
      })),
      timeLimit: collegeMcq.duration * 60, // convert to seconds
    };

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      collegeMcq: mcqData,
      studentEmail: email,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Student: Submit college MCQ answers
export const submitCollegeMcqAnswers = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email, answers } = req.body;

    if (!email || !answers) {
      return res.status(400).json({
        success: false,
        message: "Email and answers are required",
      });
    }

    // Find the college MCQ
    const collegeMcq = await CollegeMcq.findOne({ linkId });
    if (!collegeMcq) {
      return res.status(404).json({
        success: false,
        message: "College MCQ not found",
      });
    }

    // Check if college MCQ is still active based on duration
    const timeStatus = getMcqTimeStatus(collegeMcq);
    if (!timeStatus.isActive) {
      if (!timeStatus.hasStarted) {
        return res.status(425).json({
          success: false,
          message: `College MCQ has not started yet. Test will begin in ${timeStatus.minutesUntilStart} minutes.`,
          timeStatus,
        });
      } else {
        return res.status(410).json({
          success: false,
          message: "College MCQ has expired",
          timeStatus,
        });
      }
    }

    // Basic validation for answers array
    if (
      !Array.isArray(answers) ||
      answers.length !== collegeMcq.questions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid answers array. Must match number of questions.",
      });
    }

    // Check if student has already submitted (one submission per MCQ per student)
    const existingSubmission = await StudentMcqSubmission.findOne({
      collegeMcqId: collegeMcq._id,
      studentEmail: email,
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this college MCQ",
      });
    }

    // Validate each answer against question options
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = collegeMcq.questions[i];

      if (!question) {
        return res.status(400).json({
          success: false,
          message: `Question at index ${i} does not exist`,
        });
      }

      if (answer >= question.options.length) {
        return res.status(400).json({
          success: false,
          message: `Answer at index ${i} is out of range for available options`,
        });
      }
    }

    // Calculate score
    let correctAnswers = 0;
    const processedAnswers = answers.map((answer, index) => {
      const question = collegeMcq.questions[index];
      const isCorrect = question && question.correct === answer;
      if (isCorrect) correctAnswers++;

      return {
        questionIndex: index,
        selectedOption: answer,
        isCorrect,
      };
    });

    const score = correctAnswers;

    // Double-check no submission exists (race condition prevention)
    const doubleCheckSubmission = await StudentMcqSubmission.findOne({
      collegeMcqId: collegeMcq._id,
      studentEmail: email,
    });

    if (doubleCheckSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this college MCQ",
      });
    }

    // Save submission
    const submission = new StudentMcqSubmission({
      collegeMcqId: collegeMcq._id,
      studentEmail: email,
      answers: processedAnswers,
      score,
    });

    await submission.save();

    // Update total attempts count
    await CollegeMcq.findByIdAndUpdate(collegeMcq._id, {
      $inc: { totalAttempts: 1 },
    });

    // Calculate performance details
    const totalQuestions = collegeMcq.questions.length;
    const percentage = ((score / totalQuestions) * 100).toFixed(1);

    // Return success response WITH student results
    res.status(201).json({
      success: true,
      message: "Your answers have been submitted successfully!",
      results: {
        score: score,
        totalQuestions: totalQuestions,
        percentage: `${percentage}%`,
        correctAnswers: correctAnswers,
        wrongAnswers: totalQuestions - correctAnswers,
      },
      submissionId: `${linkId}-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      mcqInfo: {
        title: collegeMcq.title,
        college: collegeMcq.college,
      },
    });
  } catch (error) {
    console.error("Error submitting college MCQ:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during submission",
    });
  }
};

// Admin: Get all college MCQs with summary
export const getAllCollegeMcqs = async (req, res) => {
  try {
    const mcqs = await CollegeMcq.find()
      .select(
        "title college date duration totalAttempts isActive linkId createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: mcqs,
    });
  } catch (error) {
    console.error("Error fetching all college MCQs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin: Get student scores for a specific college MCQ
export const getCollegeMcqScores = async (req, res) => {
  try {
    const { mcqId } = req.params;

    // Validate MCQ ID
    if (!mcqId || !mcqId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid MCQ ID",
      });
    }

    // Check if MCQ exists
    const mcq = await CollegeMcq.findById(mcqId);
    if (!mcq) {
      return res.status(404).json({
        success: false,
        message: "College MCQ not found",
      });
    }

    // Get all submissions for this MCQ
    const submissions = await StudentMcqSubmission.find({ collegeMcqId: mcqId })
      .select("studentEmail score")
      .sort({ submittedAt: -1 })
      .lean();

    // Format submissions for response - only email and score
    const studentScores = submissions.map((submission) => ({
      studentEmail: submission.studentEmail,
      score: submission.score,
    }));

    res.status(200).json({
      success: true,
      data: {
        mcqInfo: {
          title: mcq.title,
          college: mcq.college,
          duration: mcq.duration,
          totalStudentsAttempted: submissions.length,
        },
        studentScores: studentScores,
      },
    });
  } catch (error) {
    console.error("Error fetching college MCQ scores:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin: Delete a college MCQ and its submissions
export const deleteCollegeMcq = async (req, res) => {
  try {
    const { mcqId } = req.params;

    // Validate MCQ ID
    if (!mcqId || !mcqId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid MCQ ID",
      });
    }

    // Check if MCQ exists
    const mcq = await CollegeMcq.findById(mcqId);
    if (!mcq) {
      return res.status(404).json({
        success: false,
        message: "College MCQ not found",
      });
    }

    // Delete all submissions associated with this MCQ
    const submissionsDeleteResult = await StudentMcqSubmission.deleteMany({
      collegeMcqId: mcqId,
    });

    // Delete the MCQ itself
    await CollegeMcq.findByIdAndDelete(mcqId);

    res.status(200).json({
      success: true,
      message: "College MCQ deleted successfully",
      deletedData: {
        mcqTitle: mcq.title,
        mcqCollege: mcq.college,
        submissionsDeleted: submissionsDeleteResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error deleting college MCQ:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
