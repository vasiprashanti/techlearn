import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Notes from "../models/Notes.js";
import Exercise from "../models/Exercise.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import {
  parseNotesMarkdownFile,
  parseMcqMarkdownFile,
} from "../config/unifiedMarkdownParser.js";

// admin specific functions
export const createCourseShell = async (req, res) => {
  try {
    const { title, description, level, numTopics, assignedBatchIds } = req.body;

    // Validate required fields
    if (!title || !numTopics) {
      return res.status(400).json({
        message: "Title and number of topics are required",
      });
    }

    if (title.trim().length < 1) {
      return res.status(400).json({
        message: "Course title must be at least 1 character long",
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
      assignedBatchIds: Array.isArray(assignedBatchIds) ? assignedBatchIds.filter(Boolean) : [],
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
    const notesIds = topics.map((topic) => topic.notesId).filter(Boolean);

    const deletedExercises = await Exercise.deleteMany({ courseId });
    const deletedNotes = await Notes.deleteMany({ _id: { $in: notesIds } });
    const deletedTopics = await Topic.deleteMany({ courseId });

    await Course.findByIdAndDelete(courseId);

    // Cascade: clean up any Batch references to this course
    await Batch.updateMany(
      { attachedCourse: courseId },
      { $set: { attachedCourse: null } }
    );
    await Batch.updateMany(
      { supportingCourses: courseId },
      { $pull: { supportingCourses: courseId } }
    );

    res.status(200).json({
      success: true,
      message: "Course and all related data deleted successfully",
      deletedCounts: {
        course: 1,
        topics: deletedTopics.deletedCount,
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

export const updateCourseShell = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, level, numTopics, assignedBatchIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    if (title !== undefined && String(title).trim().length < 1) {
      return res.status(400).json({ message: "Course title must be at least 1 character long" });
    }

    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (level !== undefined) update.level = level;
    if (numTopics !== undefined) update.numTopics = Number(numTopics);
    if (assignedBatchIds !== undefined) {
      update.assignedBatchIds = Array.isArray(assignedBatchIds) ? assignedBatchIds.filter(Boolean) : [];
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update course",
      error: error.message,
    });
  }
};

//create multiple topics while also inserting the notes for them
export const addMultipleTopics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { topics } = req.body; // Array of {title, index, notesFilePath}

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

        // Create topic first (without notesId)
        const topic = new Topic({
          courseId,
          title: notesResult.data.title,
          notesId: null, // Will be updated later
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
        let mcqId = null;
        if (mcqFilePath) {
          const mcqResult = await parseMcqMarkdownFile(
            mcqFilePath,
            savedTopic._id
          );
          if (mcqResult.success) {
            mcqId = mcqResult.mcqId;
            // Update topic with mcqId
            await Topic.findByIdAndUpdate(savedTopic._id, { mcqId });
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
          mcqId,
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
    let filter = {};
    let isAdmin = false;

    if (req.user) {
      if (req.user.role === "admin") {
        isAdmin = true;
      } else {
        // Look up the student's batch
        const email = String(req.user.email || "").trim().toLowerCase();
        const student = await Student.findOne({
          $or: [
            { userId: req.user._id },
            ...(email ? [{ email }] : []),
          ],
        }).lean();

        if (student?.batchId) {
          // Fetch the batch to get primary + supporting course IDs
          const batch = await Batch.findById(student.batchId)
            .select("attachedCourse supportingCourses status")
            .lean();

          if (batch && batch.status === "Active") {
            const primaryCourseId = batch.attachedCourse;
            const supportingCourseIds = (batch.supportingCourses || []).map(id => id.toString());

            // Build filter:
            // Show: courses with no batch assignment (public) OR the primary course
            // Hide: supporting courses (even though they're assigned to this batch)
            const conditions = [
              { assignedBatchIds: { $size: 0 } },
              { assignedBatchIds: { $exists: false } },
            ];

            // Include primary course if it exists
            if (primaryCourseId) {
              conditions.push({ _id: primaryCourseId });
            }

            filter = {
              $and: [
                { $or: conditions },
                // Explicitly exclude all supporting courses
                ...(supportingCourseIds.length > 0
                  ? [{ _id: { $nin: supportingCourseIds } }]
                  : []),
              ],
            };
          } else {
            // Batch inactive or not found — show only public courses
            filter = {
              $or: [
                { assignedBatchIds: { $size: 0 } },
                { assignedBatchIds: { $exists: false } },
              ],
            };
          }
        } else {
          // Student has no batch — show only public courses
          filter = {
            $or: [
              { assignedBatchIds: { $size: 0 } },
              { assignedBatchIds: { $exists: false } },
            ],
          };
        }
      }
    } else {
      // Unauthenticated — show only public courses
      filter = {
        $or: [
          { assignedBatchIds: { $size: 0 } },
          { assignedBatchIds: { $exists: false } },
        ],
      };
    }

    const courses = await Course.find(filter);
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

    let studentBatchId = null;
    if (req.user) {
      if (req.user.role !== "admin") {
        const email = String(req.user.email || "").trim().toLowerCase();
        const student = await Student.findOne({
          $or: [
            { userId: req.user._id },
            ...(email ? [{ email }] : []),
          ],
        }).lean();
        if (student?.batchId) {
          studentBatchId = student.batchId;
        }
      }
    }

    let currentDay = null;
    let isBatchActive = false;
    let isPlacementPrimary = false;

    if (studentBatchId) {
      const batch = await Batch.findById(studentBatchId).lean();
      if (batch) {
        const courseIdStr = String(courseId);
        const primaryId = batch.attachedCourse ? String(batch.attachedCourse) : null;
        const supportingIds = (batch.supportingCourses || []).map(String);
        const assignedIds = (course.assignedBatchIds || []).map(String);

        const isAttached =
          primaryId === courseIdStr ||
          supportingIds.includes(courseIdStr) ||
          assignedIds.includes(String(batch._id));

        if (batch.status === "Active" && isAttached) {
          const assignmentDate = batch.startDate || new Date();
          const releaseTime = batch.releaseTime || "00:00";
          const [hours = "0", minutes = "0"] = releaseTime.split(":");
          const releaseStart = new Date(assignmentDate);
          releaseStart.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
          const elapsedDays = Math.floor((Date.now() - releaseStart.getTime()) / (24 * 60 * 60 * 1000));
          currentDay = Math.max(1, elapsedDays + 1);
          isBatchActive = true;
        }

        // This course is the primary placement course if it's the batch's attachedCourse
        isPlacementPrimary = primaryId === courseIdStr;
      }
    }

    // Fetch topics using topicIds array and populate notesId
    const topics = await Topic.find({ _id: { $in: course.topicIds } })
      .populate("notesId")
      .sort({ index: 1, createdAt: 1 });

    const formattedTopics = topics.map((topic, idx) => {
      const day = idx + 1;
      const isLocked = isBatchActive && day > currentDay;
      return {
        topicId: topic._id,
        title: topic.title,
        notesId: topic.notesId ? topic.notesId._id : null,
        notes:
          topic.notesId && topic.notesId.parsedContent
            ? topic.notesId.parsedContent
            : null,
        slug: topic.slug,
        index: topic.index,
        isLocked,
      };
    });

    res.status(200).json({
      _id: course._id,
      title: course.title,
      description: course.description,
      level: course.level,
      isPlacementPrimary,          // ← true only when this is the batch's primary course
      exerciseIds: course.exerciseIds || [],
      topics: formattedTopics,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching course details",
      error: error.message,
    });
  }
};

// delete topic and clean up associated notes & course topic references
export const deleteTopic = async (req, res) => {
  try {
    const { topicId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "Invalid topic ID" });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // Delete associated notes
    if (topic.notesId) {
      await Notes.findByIdAndDelete(topic.notesId);
    } else {
      await Notes.deleteMany({ topicId });
    }

    // Pull from Course
    await Course.updateOne(
      { _id: topic.courseId },
      { $pull: { topicIds: topic._id } }
    );

    // Delete Topic
    await Topic.findByIdAndDelete(topicId);

    res.status(200).json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Delete topic error:", error);
    res.status(500).json({
      message: "Failed to delete topic",
      error: error.message,
    });
  }
};
