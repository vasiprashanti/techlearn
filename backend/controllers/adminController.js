import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Notes from "../models/Notes.js";
import Quiz from "../models/Quiz.js";
import {
  generateSlug,
  parseNotesMarkdown,
  parseQuizMarkdownFile,
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
  const { topicId } = req.params;
  const { topicName } = req.body;
  const files = req.files;

  try {
    // Find topic
    const topic = await Topic.findById(topicId);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    // Update title and slug (retain topicId)
    if (topicName) {
      topic.title = topicName;
      topic.slug = generateSlug(topicName);
    }

    // Find the correct file in req.files array
    const notesFile = req.files.find((f) => f.fieldname === "file");
    const quizFile = req.files.find((f) => f.fieldname === "quizFile");

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

    await topic.save();
    res.json({ message: "Topic updated successfully", topic });
  } catch (error) {
    res.status(500).json({ message: "Error updating topic", error });
  }
};
