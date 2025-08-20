import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Notes from "../models/Notes.js";
import Quiz from "../models/Quiz.js";
import Exercise from "../models/Exercise.js";
import {
  generateSlug,
  parseNotesMarkdown,
  parseMcqMarkdownFile,
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
    const { topicName, courseTitle } = req.body;
    const files = req.files || [];

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
    if (courseTitle) {
      course.title = courseTitle;
      await course.save();
    }

    // If no files provided and only updating course/topic title, return success
    if ((!files || files.length === 0) && (courseTitle || topicName)) {
      await topic.save();
      return res.json({
        message: "Title updated successfully",
        topic: topic,
        course: { title: course.title },
      });
    }

    // Find the correct files in req.files array (only if files exist)
    const notesFile = files.find(
      (f) => f.fieldname === "file" || f.fieldname === "notesFile"
    );
    const mcqFile = files.find(
      (f) => f.fieldname === "quizFile" || f.fieldname === "mcqFile"
    );

    // Parse notes and MCQs if files provided
    let notesContent = null;
    let checkpointMcqs = null;
    if (notesFile) {
      notesContent = parseNotesMarkdown(notesFile.path, topic.title);
      fs.unlinkSync(notesFile.path);
    }
    if (mcqFile) {
      checkpointMcqs = await parseMcqMarkdownFile(mcqFile.path, topicId);
      fs.unlinkSync(mcqFile.path);
    }

    // Merge and save Notes(Both mcqs and notes)
    let notes = await Notes.findOne({ topicId });

    // If files are provided but no notes exist, create new notes
    if (!notes && (notesFile || mcqFile)) {
      notes = new Notes({
        parsedContent: notesContent ? notesContent.content : "",
        topicId: topicId,
        checkpointMcqs: [],
      });
    }

    // If no notes exist and no files provided, only allow title updates (already handled above)
    if (!notes && !notesFile && !mcqFile) {
      return res.status(400).json({
        message:
          "Cannot edit: No existing notes found for this topic. Please create notes first using the initial upload process.",
        error: "NOTES_NOT_FOUND",
      });
    }
    // If checkpointMcqs is result object, extract array
    const mcqArray =
      checkpointMcqs && checkpointMcqs.checkpointMcqs
        ? checkpointMcqs.checkpointMcqs
        : checkpointMcqs || [];

    // Only update parsedContent if a new notes file is uploaded
    if (notesContent) {
      notes.parsedContent = notesContent.content;
    }
    // Always update checkpointMcqs if a new MCQ file is uploaded
    if (checkpointMcqs) {
      notes.checkpointMcqs = mcqArray;
    }

    await notes.save();

    // 🔧 VALIDATION: Ensure Topic points to the correct Notes (should already be correct)
    if (!topic.notesId || topic.notesId.toString() !== notes._id.toString()) {
      topic.notesId = notes._id;
    }

    await topic.save();

    const savedTopic = await Topic.findById(topicId);
    const savedNotes = await Notes.findById(savedTopic.notesId);

    if (!savedNotes) {
      console.error("[ERROR] Topic-Notes relationship broken after save!");
      throw new Error("Failed to maintain Topic-Notes relationship");
    }

    // Use the verified notes data for the response summary
    res.json({
      message: "Topic updated successfully",
      topic: savedTopic,
      notesSummary: savedNotes
        ? {
            notesId: savedNotes._id,
            parsedContentPreview: savedNotes.parsedContent
              ? savedNotes.parsedContent.slice(0, 200)
              : "",
            checkpointMcqsCount: Array.isArray(savedNotes.checkpointMcqs)
              ? savedNotes.checkpointMcqs.length
              : 0,
          }
        : null,
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
