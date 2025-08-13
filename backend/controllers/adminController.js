import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Notes from "../models/Notes.js";
import Quiz from "../models/Quiz.js";
import Exercise from "../models/Exercise.js";
import {
  generateSlug,
  parseNotesMarkdown,
  parseQuizMarkdownFile,
  parseExerciseMarkdownFile,
} from "../config/unifiedMarkdownParser.js";
import fs from "fs";

export const getCourseTopicsForDashboard = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!courseId) {
      return res.status(400).json({ message: "course Id is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Invalid course Id" });
    const topics = await Topic.find({ _id: { $in: course.topicIds } });
    // Map to return topicId and topicName only
    const formattedTopics = topics.map((t) => ({
      topicId: t._id,
      topicName: t.title,
      topicSlug: t.slug,
    }));
    return res.status(200).json({ topics: formattedTopics });
  } catch (error) {
    return res.status(500).json({
      message: "Error occured while fetching topics for admin dashboard",
      error,
    });
  }
};

export const editTopicDetails = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { topicName, courseDescription, courseTitle } = req.body;
    const files = req.files;

    // Find topic
    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    // Get the course for exercise handling
    const course = await Course.findById(topic.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Update title and slug (retain topicId)
    if (topicName) {
      topic.title = topicName;
      topic.slug = generateSlug(topicName);
    }
    // Update course description if provided
    if (courseDescription) {
      course.description = courseDescription;
      await course.save();
    }
    if (courseTitle) {
      course.title = courseTitle;
      await course.save();
    }
    // Find the correct files in req.files array
    const notesFile = req.files.find((f) => f.fieldname === "file");
    const quizFile = req.files.find((f) => f.fieldname === "quizFile");
    const exerciseFile = req.files.find((f) => f.fieldname === "exerciseFile");

    // Update notes if file provided
    if (notesFile) {
      const notesContent = parseNotesMarkdown(notesFile.path, topic.title);
      await Notes.findByIdAndUpdate(topic.notesId, {
        parsedContent: notesContent.content,
      });
      fs.unlinkSync(notesFile.path);
    }

    // Update quiz if quizFile provided
    if (quizFile) {
      const quizData = await parseQuizMarkdownFile(quizFile.path, topicId);
      if (quizData && quizData.questions) {
        await Quiz.findByIdAndUpdate(topic.quizId, {
          questions: quizData.questions,
        });
      }
      fs.unlinkSync(quizFile.path);
    }

    // Exercise handling removed from editTopicDetails

    await topic.save();
    res.json({
      message: "Topic updated successfully",
      topic,
    });
  } catch (error) {
    console.error("Edit topic error:", error);
    res
      .status(500)
      .json({ message: "Error updating topic", error: error.message });
  }
};

// Edit all exercises for a course by editing an existing exercise file
export const editCourseExercises = async (req, res) => {
  const { courseId } = req.params;
  const exerciseFile = req.file;

  if (!exerciseFile) {
    return res
      .status(400)
      .json({ success: false, error: "No exercise file uploaded" });
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    if (fs.existsSync(exerciseFile.path)) fs.unlinkSync(exerciseFile.path);
    return res.status(400).json({ success: false, error: "Invalid courseId" });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    if (fs.existsSync(exerciseFile.path)) fs.unlinkSync(exerciseFile.path);
    return res.status(404).json({ success: false, error: "Course not found" });
  }

  try {
    // Parse the uploaded file
    const parseResult = await parseExerciseMarkdownFile(
      exerciseFile.path,
      courseId
    );

    if (!parseResult.success) {
      fs.unlinkSync(exerciseFile.path);
      return res.status(400).json({ success: false, error: parseResult.error });
    }

    const newExercises = parseResult.exercises;
    if (!Array.isArray(newExercises) || newExercises.length === 0) {
      fs.unlinkSync(exerciseFile.path);
      return res
        .status(400)
        .json({ success: false, error: "No valid exercises found in file" });
    }

    // Get existing exercises for this course
    const existingExercises = await Exercise.find({ courseId }).sort({
      createdAt: 1,
    });

    const exerciseIds = [];

    // Update existing exercises in the order they appear in the markdown file
    for (let i = 0; i < newExercises.length; i++) {
      if (i < existingExercises.length) {
        // Update existing exercise while preserving its ID
        await Exercise.findByIdAndUpdate(
          existingExercises[i]._id,
          newExercises[i]
        );
        exerciseIds.push(existingExercises[i]._id);
      } else {
        // Create new exercise if we have more exercises than before
        const created = await Exercise.create(newExercises[i]);
        exerciseIds.push(created._id);
      }
    }

    // Delete extra exercises if new file has fewer
    if (existingExercises.length > newExercises.length) {
      const excess = existingExercises.slice(newExercises.length);
      await Exercise.deleteMany({ _id: { $in: excess.map((e) => e._id) } });
    }

    // Update course.exerciseIds with the new order
    await Course.findByIdAndUpdate(courseId, { exerciseIds });

    fs.unlinkSync(exerciseFile.path);

    return res.json({
      success: true,
      message: "Exercises updated",
      count: exerciseIds.length,
      exerciseIds: exerciseIds,
    });
  } catch (error) {
    if (exerciseFile && fs.existsSync(exerciseFile.path))
      fs.unlinkSync(exerciseFile.path);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminMetrics = async (req, res) => {
  try {
    // stats for the users
    const totalUsers = await User.countDocuments();
    const clubMembers = await User.countDocuments({ isClub: true });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      updatedAt: { $gte: sevenDaysAgo },
    });

    // course count
    const totalCourses = await Course.countDocuments();

    // project count
    const majorProjects = await MajorProject.countDocuments();
    const midProjects = await MidProject.countDocuments();
    const miniProjects = await MiniProject.countDocuments();

    const totalProjects = majorProjects + midProjects + miniProjects;

    res.status(200).json({
      totalUsers,
      clubMembers,
      activeUsers,
      totalCourses,
      totalProjects,
    });
  } catch (err) {
    console.error("Admin Metrics Error:", err);
    res.status(500).json({ error: "Failed to fetch admin metrics" });
  }
};
