import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Notes from "../models/Notes.js";
import Exercise from "../models/Exercise.js";
import {
  generateSlug,
  parseNotesMarkdown,
  parseMcqMarkdownFile,
  parseExerciseMarkdownFile,
} from "../config/unifiedMarkdownParser.js";
import fs from "fs";
import User from "../models/User.js";
import College from "../models/College.js";
import Student from "../models/Student.js";
import Submission from "../models/Submission.js";
import Batch from "../models/Batch.js";
import MajorProject from "../models/majorProject.js";
import MiniProject from "../models/miniProject.js";
import MidProject from "../models/MidProject.js";

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
      (f) => f.fieldname === "file" || f.fieldname === "notesFile",
    );
    const mcqFile = files.find((f) => f.fieldname === "mcqFile");

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
      courseId,
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
          newExercises[i],
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
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // -------------------------------------------------------------------------
    // BATCH 1: All independent counts + aggregations — single round-trip
    // -------------------------------------------------------------------------
    const [
      totalUsers,
      clubMembers,
      activeUsers,
      totalCourses,
      totalColleges,
      totalBatches,
      activeBatches,
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalSubmissions,
      todaySubmissions,
      avgScoreResult,
      avgStreakResult,
      majorProjects,
      miniProjects,
      midProjects,
      trackBreakdown,
      topBatchResult,
      studentsPerBatch,
      submissionsPerBatch,
      todayUniqueParticipantIds,
      recentSubmitterIds,
    ] = await Promise.all([
      // Platform users
      User.countDocuments(),
      User.countDocuments({ isClub: true }),
      User.countDocuments({ updatedAt: { $gte: sevenDaysAgo } }),
      Course.countDocuments(),

      // College & Batch
      College.countDocuments(),
      Batch.countDocuments(),
      Batch.countDocuments({ status: "Active" }),

      // Students
      Student.countDocuments(),
      Student.countDocuments({ status: "Active" }),
      Student.countDocuments({ status: "Inactive" }),

      // Submissions
      Submission.countDocuments(),
      Submission.countDocuments({ submittedAt: { $gte: todayStart } }),

      // Projects
      MajorProject.countDocuments(),
      MiniProject.countDocuments(),
      MidProject.countDocuments(),

      // Average score across all submissions
      Submission.aggregate([
        { $match: { totalScore: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$totalScore" } } },
      ]),

      // Average streak across all students
      Student.aggregate([
        { $group: { _id: null, avg: { $avg: "$streak" } } },
      ]),

      // Track-wise submission breakdown (Core / DSA / SQL)
      Submission.aggregate([
        { $group: { _id: "$trackId", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "tracks",
            localField: "_id",
            foreignField: "_id",
            as: "track",
          },
        },
        { $unwind: { path: "$track", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$track.trackType", "Unknown"] },
            count: { $sum: "$count" },
          },
        },
        { $project: { _id: 0, trackType: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),

      // Top performing batch by avg submission score
      Submission.aggregate([
        { $match: { totalScore: { $exists: true, $ne: null } } },
        { $group: { _id: "$batchId", avgScore: { $avg: "$totalScore" } } },
        { $sort: { avgScore: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "batches",
            localField: "_id",
            foreignField: "_id",
            as: "batch",
          },
        },
        { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            batchId: "$_id",
            batchName: { $ifNull: ["$batch.name", "Unknown"] },
            avgScore: { $round: ["$avgScore", 1] },
          },
        },
      ]),

      // Batch completion rate — students enrolled per batch
      Student.aggregate([
        { $group: { _id: "$batchId", total: { $sum: 1 } } },
      ]),

      // Batch completion rate — distinct submitting students per batch
      Submission.aggregate([
        { $group: { _id: { batchId: "$batchId", studentId: "$studentId" } } },
        { $group: { _id: "$_id.batchId", submittedStudents: { $sum: 1 } } },
      ]),

      // Today's unique participating student IDs
      Submission.distinct("studentId", { submittedAt: { $gte: todayStart } }),

      // At-risk: students who submitted in last 3 days (to find the inverse)
      Submission.distinct("studentId", { submittedAt: { $gte: threeDaysAgo } }),
    ]);

    // -------------------------------------------------------------------------
    // BATCH 2: Derived queries that depend on BATCH 1 results
    // -------------------------------------------------------------------------
    const [atRiskStudents, zeroStreakStudents] = await Promise.all([
      // Active students with NO submission in last 3 days
      Student.countDocuments({
        status: "Active",
        _id: { $nin: recentSubmitterIds },
      }),
      // Active students with streak = 0
      Student.countDocuments({ status: "Active", streak: 0 }),
    ]);

    // -------------------------------------------------------------------------
    // Derived computations (pure JS — no DB calls)
    // -------------------------------------------------------------------------

    // Batch completion rate: % of batches where >=60% students submitted at least once
    const studentEnrollmentMap = {};
    studentsPerBatch.forEach((b) => {
      if (b._id) studentEnrollmentMap[b._id.toString()] = b.total;
    });
    const submittedMap = {};
    submissionsPerBatch.forEach((b) => {
      if (b._id) submittedMap[b._id.toString()] = b.submittedStudents;
    });
    let completedBatchCount = 0;
    for (const [batchId, enrolled] of Object.entries(studentEnrollmentMap)) {
      const submitted = submittedMap[batchId] || 0;
      if (enrolled > 0 && submitted / enrolled >= 0.6) completedBatchCount++;
    }
    const batchCompletionRate =
      totalBatches > 0
        ? parseFloat(((completedBatchCount / totalBatches) * 100).toFixed(1))
        : 0;

    // Today's participation rate: unique submitters today / active students
    const todayParticipationRate =
      activeStudents > 0
        ? parseFloat(
            ((todayUniqueParticipantIds.length / activeStudents) * 100).toFixed(1)
          )
        : 0;

    const averageScore =
      avgScoreResult.length > 0
        ? parseFloat(avgScoreResult[0].avg.toFixed(1))
        : 0;

    const averageStreak =
      avgStreakResult.length > 0
        ? parseFloat(avgStreakResult[0].avg.toFixed(2))
        : 0;

    const topPerformingBatch = topBatchResult.length > 0 ? topBatchResult[0] : null;

    // -------------------------------------------------------------------------
    // Response
    // -------------------------------------------------------------------------
    return res.status(200).json({
      // Platform users (app learners)
      totalUsers,
      clubMembers,
      activeUsers,
      totalCourses,

      // College & Batch health
      totalColleges,
      totalBatches,
      activeBatches,

      // Projects
      majorProjects,
      miniProjects,
      midProjects,
      totalProjects: majorProjects + miniProjects + midProjects,

      // Student cohort
      totalStudents,
      activeStudents,
      inactiveStudents,
      activeVsInactiveRatio:
        inactiveStudents > 0
          ? parseFloat((activeStudents / inactiveStudents).toFixed(2))
          : null,

      // Submission volume
      totalSubmissions,
      todaySubmissions,
      todayUniqueParticipants: todayUniqueParticipantIds.length,

      // Score & streak quality
      averageScore,
      averageStreak,

      // Engagement health
      todayParticipationRate,  // % of active students who submitted today
      batchCompletionRate,     // % of batches with >=60% student participation

      // At-risk signals (feeds drop-off alerts)
      atRiskStudents,      // Active students with no submission in last 3 days
      zeroStreakStudents,  // Active students with streak = 0

      // Track breakdown
      trackBreakdown,  // [{ trackType: "Core", count: N }, ...]

      // Top performing batch
      topPerformingBatch,  // { batchName, avgScore } | null if no submissions yet
    });
  } catch (err) {
    console.error("Admin Metrics Error:", err);
    return res.status(500).json({ error: "Failed to fetch admin metrics" });
  }
};
