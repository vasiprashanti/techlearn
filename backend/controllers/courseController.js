import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Quiz from "../models/Quiz.js";
import Notes from "../models/Notes.js";
import Exercise from "../models/Exercise.js";
import {
  checkIfQuestionAnswered,
  recordQuizAttempt,
} from "./userProgressController.js";
import {
  parseNotesMarkdownFile,
  parseMcqMarkdownFile,
} from "../config/unifiedMarkdownParser.js";

// admin specific functions
export const createCourseShell = async (req, res) => {
  try {
    const { title, description, level, numTopics } = req.body;

    // Validate required fields
    if (!title || !numTopics) {
      return res.status(400).json({
        message: "Title and number of topics are required",
      });
    }

    // Create course shell with empty topicIds and exerciseIds arrays
    const courseData = {
      title: title.trim(),
      description: description?.trim() || "No description provided",
      level: level,
      numTopics: parseInt(numTopics),
      topicIds: [], // Empty initially
      exerciseIds: [], // Empty initially
    };

    const newCourse = new Course(courseData);

    const savedCourse = await newCourse.save();

    res.status(201).json({
      success: true,
      message: "Course shell created successfully",
      courseId: savedCourse._id,
      course: {
        id: savedCourse._id,
        title: savedCourse.title,
        description: savedCourse.description,
        level: savedCourse.level,
        numTopics: savedCourse.numTopics,
        topicIds: savedCourse.topicIds,
        exerciseIds: savedCourse.exerciseIds,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create course",
      error: error.message,
      details: error.stack, // Remove this in production
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Find all topics for this course
    const topics = await Topic.find({ courseId });
    const topicIds = topics.map((topic) => topic._id);
    const notesIds = topics.map((topic) => topic.notesId).filter(Boolean);

    const deletedQuizzes = await Quiz.deleteMany({
      topicId: { $in: topicIds },
    });
    const deletedExercises = await Exercise.deleteMany({ courseId });
    const deletedNotes = await Notes.deleteMany({ _id: { $in: notesIds } });
    const deletedTopics = await Topic.deleteMany({ courseId });

    await Course.findByIdAndDelete(courseId);

    res.status(200).json({
      success: true,
      message: "Course and all related data deleted successfully",
      deletedCounts: {
        course: 1,
        topics: deletedTopics.deletedCount,
        quizzes: deletedQuizzes.deletedCount,
        exercises: deletedExercises.deletedCount,
        notes: deletedNotes.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      message: "Failed to delete course and related data",
      error: error.message,
    });
  }
};

//create multiple topics while also inserting the notes for them
export const addMultipleTopics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { topics } = req.body; // Array of {title, index, notesFilePath, quizFilePath}

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }
    if (!topics || topics.length === 0) {
      return res.status(400).json({
        message: "Topics array is required and cannot be empty",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const results = [];
    const errors = [];

    //Each topic is being processed sequentially
    for (const topicData of topics) {
      try {
        const { title, index, notesFilePath, mcqFilePath } = topicData;

        // Parse notes
        const notesResult = parseNotesMarkdownFile(notesFilePath, title);
        if (!notesResult.success) {
          errors.push({ index, title, error: notesResult.error });
          continue;
        }

        // Create topic first (without notesId and quizId)
        const topic = new Topic({
          courseId,
          title: notesResult.data.title,
          notesId: null, // Will be updated later
          quizId: null,
          slug: notesResult.data.slug,
          index: parseInt(index),
        });
        const savedTopic = await topic.save();

        // Now create notes with the topicId
        const notes = new Notes({
          parsedContent: notesResult.data.content,
          topicId: savedTopic._id,
        });
        const savedNotes = await notes.save();

        // Update topic with notesId
        await Topic.findByIdAndUpdate(savedTopic._id, {
          notesId: savedNotes._id,
        });

        // Now parse and insert MCQs, passing topicId
        let quizId = null;
        if (mcqFilePath) {
          const mcqResult = await parseMcqMarkdownFile(
            mcqFilePath,
            savedTopic._id
          );
          if (mcqResult.success) {
            quizId = mcqResult.quizId;
            // Update topic with quizId
            await Topic.findByIdAndUpdate(savedTopic._id, { quizId });
          }
        }

        await Course.findByIdAndUpdate(courseId, {
          $push: { topicIds: savedTopic._id },
        });

        results.push({
          id: savedTopic._id,
          title: savedTopic.title,
          slug: savedTopic.slug,
          index: savedTopic.index,
          notesId: savedNotes._id,
          quizId,
          status: "success",
        });
      } catch (error) {
        errors.push({
          index: topicData.index,
          title: topicData.title,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${results.length} topics successfully, ${errors.length} failed`,
      results,
      errors,
      summary: {
        total: topics.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create topics",
      error: error.message,
    });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json({ count: courses.length, courses });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch courses", error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  const { courseId } = req.params;
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Fetch topics using topicIds array and populate quizId and notesId
    const topics = await Topic.find({ _id: { $in: course.topicIds } })
      .populate("quizId")
      .populate("notesId");

    const formattedTopics = topics.map((topic) => ({
      topicId: topic._id,
      title: topic.title,
      quizId: topic.quizId ? topic.quizId._id : null,
      notesId: topic.notesId ? topic.notesId._id : null,
      notes:
        topic.notesId && topic.notesId.parsedContent
          ? topic.notesId.parsedContent
          : null,
      slug: topic.slug,
      index: topic.index,
    }));

    res.status(200).json({
      _id: course._id,
      title: course.title,
      description: course.description,
      level: course.level,
      exerciseIds: course.exerciseIds || [], // Include course-level exercise IDs
      topics: formattedTopics,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching course details",
      error: error.message,
    });
  }
};

//////get quizById moved to the checkpoint controller

// export const submitQuiz = async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const { quizId, questionId, selectedOption } = req.body;

//     const quiz = await Quiz.findById(quizId);
//     if (!quiz) return res.status(404).json({ message: "Quiz not found" });

//     const question = quiz.questions.id(questionId);
//     if (!question)
//       return res.status(404).json({ message: "Question not found" });

//     // FIX: Convert selectedOption to number for proper comparison
//     const selectedOptionNumber = parseInt(selectedOption);
//     const isCorrect = question.correctAnswer === selectedOptionNumber;

//     const alreadyAnswered = await checkIfQuestionAnswered({
//       userId: req.user._id,
//       quizId,
//       questionId,
//     });

//     if (alreadyAnswered.error) {
//       return res.status(400).json({ message: alreadyAnswered.error });
//     }

//     const xpAwarded = isCorrect ? 10 : 0;
//     const result = await recordQuizAttempt({
//       userId: req.user._id,
//       courseId,
//       quizId,
//       questionId,
//       xp: xpAwarded,
//     });

//     res.status(200).json({
//       isCorrect,
//       correctAnswer: question.correctAnswer,
//       xpAwarded,
//       explanation: question.explanation || null,
//       quizData: {
//         quizId: quiz._id,
//         totalQuestions: quiz.questions.length,
//         answeredQuestions: result.totalAnswered,
//         remainingQuestions: quiz.questions.length - result.totalAnswered,
//         isQuizComplete: result.quizComplete,
//       },
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Quiz submission failed", error: error.message });
//   }
// };
