import mongoose from "mongoose";
import Notes from "../models/Notes.js";
import UserProgress from "../models/UserProgress.js";
import Topic from "../models/Topic.js";

export const submitCheckpointMcq = async (req, res) => {
  try {
    const user = req.user || null; // guest if null
    const userId = user ? user._id : null;
    const { notesId, checkpointMcqId } = req.params;
    const { selectedOption } = req.body;

    if (!mongoose.Types.ObjectId.isValid(notesId)) {
      return res.status(400).json({ message: "Invalid notesId" });
    }

    const notes = await Notes.findById(notesId);
    if (!notes) return res.status(404).json({ message: "Notes not found" });

    const mcq = notes.checkpointMcqs.find(
      (m) => m.checkpointMcqId === checkpointMcqId
    );
    if (!mcq)
      return res.status(404).json({ message: "Checkpoint MCQ not found" });

    // Find topic and course for XP tracking
    const topic = await Topic.findOne({ notesId: notes._id });
    const courseId = topic ? topic.courseId : null;

    // Validate selected option
    if (selectedOption === undefined || selectedOption === null) {
      return res
        .status(400)
        .json({ message: "selectedOption is required in request body" });
    }

    const selectedOptionNumber = Number.parseInt(selectedOption);
    const safeSelectedOption = Number.isNaN(selectedOptionNumber)
      ? -1
      : selectedOptionNumber;
    const isCorrect = mcq.correctAnswer === safeSelectedOption;
    const xpAwarded = isCorrect ? 10 : 0;

    // Guests: Just show right/wrong answer, no progress saved
    if (!user) {
      return res.status(200).json({
        isCorrect,
        correctAnswer: mcq.correctAnswer,
        xpAwarded: 0, // No XP for guests
        explanation: mcq.explanation || null,
        checkpointMcqId,
        notesId,
        saved: false,
        userType: "guest",
        message: "Sign up to save progress and earn XP!",
      });
    }

    // Ensure userProgress exists
    let userProgress = await UserProgress.findOne({ userId });
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
    }

    const notesIdStr = notesId.toString();
    const answered = userProgress.answeredCheckpointMcqs.get(notesIdStr) || [];
    const isClub = user.isClub;

    // For logged-in non-club users: limit to 5 MCQs per course
    if (!isClub) {
      // Count total MCQs answered for this course across all topics
      let totalAnsweredForCourse = 0;

      // Get all topics for this course
      const allTopicsForCourse = await Topic.find({ courseId });
      const allNotesIdsForCourse = allTopicsForCourse
        .map((topic) => topic.notesId?.toString())
        .filter(Boolean);

      // Count answered MCQs across all topics in this course
      for (const notesIdForCourse of allNotesIdsForCourse) {
        const answeredForNotes =
          userProgress.answeredCheckpointMcqs.get(notesIdForCourse) || [];
        totalAnsweredForCourse += answeredForNotes.length;
      }

      // Check if user has reached the 5 MCQ limit for this course
      if (totalAnsweredForCourse >= 5 && !answered.includes(checkpointMcqId)) {
        return res.status(200).json({
          isCorrect,
          correctAnswer: mcq.correctAnswer,
          xpAwarded: 0,
          explanation: mcq.explanation || null,
          checkpointMcqId,
          notesId,
          saved: false,
          userType: "logged-in",
          limitReached: true,
          message:
            "You've reached the limit of 5 MCQs per course. Upgrade to Club membership for unlimited access!",
          upgradePrompt:
            "🚀 Join Club for unlimited MCQs, exercises, and full progress tracking!",
        });
      }

      // Save answer if not already saved and within limit
      if (!answered.includes(checkpointMcqId)) {
        answered.push(checkpointMcqId);
        userProgress.answeredCheckpointMcqs.set(notesIdStr, answered);
      }

      // Award XP for logged-in users
      if (courseId) {
        const courseIdStr = courseId.toString();
        const currentXP = userProgress.courseXP.get(courseIdStr) || 0;
        userProgress.courseXP.set(courseIdStr, currentXP + xpAwarded);
      }

      await userProgress.save();

      // Get updated courseXP for frontend display
      const courseXPObject = {};
      if (userProgress.courseXP) {
        for (const [courseId, xp] of userProgress.courseXP) {
          courseXPObject[courseId] = xp;
        }
      }

      return res.status(200).json({
        isCorrect,
        correctAnswer: mcq.correctAnswer,
        xpAwarded,
        explanation: mcq.explanation || null,
        checkpointMcqId,
        notesId,
        saved: true,
        userType: "logged-in",
        courseXP: courseXPObject,
        mcqsUsed:
          totalAnsweredForCourse + (answered.includes(checkpointMcqId) ? 0 : 1),
        mcqsRemaining: Math.max(0, 5 - (totalAnsweredForCourse + 1)),
        message:
          totalAnsweredForCourse + 1 >= 4
            ? "Almost at your limit! Upgrade to Club for unlimited access."
            : "Progress saved!",
      });
    }

    // Club members: Unlimited access with full features
    if (!answered.includes(checkpointMcqId)) {
      answered.push(checkpointMcqId);
      userProgress.answeredCheckpointMcqs.set(notesIdStr, answered);
    }

    // Award XP for club members
    if (courseId) {
      const courseIdStr = courseId.toString();
      const currentXP = userProgress.courseXP.get(courseIdStr) || 0;
      userProgress.courseXP.set(courseIdStr, currentXP + xpAwarded);
    }

    await userProgress.save();

    // Get updated courseXP for frontend display
    const courseXPObject = {};
    if (userProgress.courseXP) {
      for (const [courseId, xp] of userProgress.courseXP) {
        courseXPObject[courseId] = xp;
      }
    }

    return res.status(200).json({
      isCorrect,
      correctAnswer: mcq.correctAnswer,
      xpAwarded,
      explanation: mcq.explanation || null,
      checkpointMcqId,
      notesId,
      saved: true,
      userType: "club",
      courseXP: courseXPObject,
      message: "Progress saved! Thanks for being a Club member! 🌟",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getMcqByCourseId = async (req, res) => {
  try {
    const { courseId, topicId } = req.params;

    // Validate topicId
    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "Invalid topicId" });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const notes = await Notes.findById(topic.notesId);
    if (!notes) {
      return res.status(404).json({ message: "Notes not found" });
    }

    // If logged-in, fetch user's answered MCQs for this notesId
    const user = req.user || null;
    let answeredForUser = [];
    if (user) {
      const userProgress = await UserProgress.findOne({ userId: user._id });
      if (userProgress) {
        answeredForUser =
          userProgress.answeredCheckpointMcqs.get(notes._id.toString()) || [];
      }
    }

    // Build response: hide correctAnswer on GET; include attempted flag and locked flag for UI
    const mcqsWithoutAnswer = notes.checkpointMcqs.map((mcq) => ({
      question: mcq.question,
      options: mcq.options,
      explanation: mcq.explanation,
      checkpointMcqId: mcq.checkpointMcqId,
      attempted: answeredForUser.includes(mcq.checkpointMcqId),
      locked: false, // frontend will decide lock based on user role & position; can be set here if needed
    }));

    return res.status(200).json({
      parsedContent: notes.parsedContent,
      checkpointMcqs: mcqsWithoutAnswer,
    });
  } catch (err) {
    console.error("getMcqByCourseId error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
