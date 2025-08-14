import mongoose from "mongoose";
import Notes from "../models/Notes.js";
import UserProgress from "../models/UserProgress.js";
import Topic from "../models/Topic.js";

export const getMcqByCourseId = async (req, res) => {
  try {
    const { courseId, topicId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid Course Id" });
    }
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "Invalid Topic Id" });
    }

    // Find topic and populate notes
    const topic = await Topic.findById(topicId).populate("notesId");
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // If notes exist and have checkpointMcqs, return them
    if (
      topic.notesId &&
      Array.isArray(topic.notesId.checkpointMcqs) &&
      topic.notesId.checkpointMcqs.length > 0
    ) {
      return res.status(200).json({
        topicId: topic._id,
        notesId: topic.notesId._id,
        checkpointMcqs: topic.notesId.checkpointMcqs,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error Fetching MCQ", error: error.message });
  }
};

// POST /api/notes/:notesId/checkpoint-mcq/:checkpointMcqId/submit
export const submitCheckpointMcq = async (req, res) => {
  const userId = req.user._id;
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

  // Progress tracking
  let userProgress = await UserProgress.findOne({ userId });
  if (!userProgress) {
    userProgress = new UserProgress({ userId });
  }

  //to track which mcqs the user has already attempted
  const notesIdStr = notesId.toString();
  const answered = userProgress.answeredCheckpointMcqs.get(notesIdStr) || [];
  if (answered.includes(checkpointMcqId)) {
    return res
      .status(400)
      .json({ message: "Already answered this checkpoint MCQ" });
  }

  // Check answer
  const selectedOptionNumber = parseInt(selectedOption);
  const isCorrect = mcq.correctAnswer === selectedOptionNumber;
  const xpAwarded = isCorrect ? 10 : 0;

  // Update progress
  answered.push(checkpointMcqId);
  userProgress.answeredCheckpointMcqs.set(notesIdStr, answered);

  // XP per course
  if (courseId) {
    const courseIdStr = courseId.toString();
    const currentXP = userProgress.courseXP.get(courseIdStr) || 0;
    userProgress.courseXP.set(courseIdStr, currentXP + xpAwarded);
  }
  await userProgress.save();

  return res.status(200).json({
    isCorrect,
    correctAnswer: mcq.correctAnswer,
    xpAwarded,
    explanation: mcq.explanation || null,
    checkpointMcqId,
    notesId,
  });
};
