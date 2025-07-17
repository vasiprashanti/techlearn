import mongoose from "mongoose";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import UserProgress from "../models/UserProgress.js";
import {
  checkIfQuestionAnswered,
  recordQuizAttempt,
} from "./userProgressController.js";

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
    const course = await Course.findById(courseId)
      .populate("topics.quizId")
      .populate("topics.notesId");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const topics = course.topics.map((topic) => ({
      topicId: topic._id,
      title: topic.title,
      quizId: topic.quizId ? topic.quizId._id : null,
      notesId: topic.notesId ? topic.notesId._id : null,
      notes:
        topic.notesId && topic.notesId.content ? topic.notesId.content : null,
    }));

    res.status(200).json({
      _id: course._id,
      title: course.title,
      description: course.description,
      level: course.level,
      topics: topics,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching course details",
      error: error.message,
    });
  }
};

export const getQuizByCourseId = async (req, res) => {
  try {
    const { courseId, topicId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId))
      return res.status(400).json({ message: "Invalid Course Id" });
    if (!mongoose.Types.ObjectId.isValid(topicId))
      return res.status(400).json({ message: "Invalid Topic Id" });

    const quiz = await Quiz.findOne({ courseId, topicId });

    if (!quiz)
      return res.status(404).json({ message: "Quiz not found for this topic" });

    return res.status(200).json({
      quizId: quiz._id,
      topic: quiz.topicTitle,
      questions: quiz.questions.map(({ question, options, _id }) => ({
        question,
        options,
        _id,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error Fetching quiz", error: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { quizId, questionId, selectedOption } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const question = quiz.questions.id(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const isCorrect = question.correctAnswer === selectedOption;

    const alreadyAnswered = await checkIfQuestionAnswered({
      userId: req.user._id,
      quizId,
      questionId,
    });

    if (alreadyAnswered.error) {
      return res.status(400).json({ message: alreadyAnswered.error });
    }

    const xpAwarded = isCorrect ? 10 : 0;
    const result = await recordQuizAttempt({
      userId: req.user._id,
      courseId,
      quizId,
      questionId,
      xp: xpAwarded,
    });

    // ✅ Find next unanswered question
    const userProgress = await UserProgress.findOne({ userId: req.user._id });
    const answeredQuestionIds =
      userProgress.answeredQuestions.get(quizId.toString()) || [];

    let nextQuestionId = null;
    const isQuizComplete = answeredQuestionIds.length === quiz.questions.length;

    if (!isQuizComplete) {
      for (let i = 0; i < quiz.questions.length; i++) {
        const qId = quiz.questions[i]._id.toString();
        if (!answeredQuestionIds.some((id) => id.toString() === qId)) {
          nextQuestionId = quiz.questions[i]._id;
          break;
        }
      }
    }

    res.status(200).json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      xpAwarded,
      explanation: question.explanation || null,
      quizData: {
        quizId: quiz._id,
        totalQuestions: quiz.questions.length,
        answeredQuestions: result.totalAnswered,
        remainingQuestions: quiz.questions.length - result.totalAnswered,
        isQuizComplete: result.quizComplete,
        nextQuestionId: nextQuestionId,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Quiz submission failed", error: error.message });
  }
};
