import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Notes from "../models/Notes.js";
import Exercise from "../models/Exercise.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import Payment from "../models/Payment.js";
import {
  calculateProgramDayNumber,
  isCompletedProgramSchedule,
  isProgramResourceLocked,
  resolveProgramSchedule,
} from "../utils/programSchedule.js";
import { getTopicDayNumber } from "../utils/courseTopicSchedule.js";
import { expireBatchIfNeeded } from "../utils/batchLifecycle.js";
import {
  buildPublicCourseConditions,
  buildPublicFreeProgramQuery,
  hasPublicFreeProgramLink,
  isUserVisibleCourse,
} from "../utils/courseVisibility.js";
import { isProgramAccessibleToLearner } from "../utils/programVisibility.js";
import { buildCapturedCoursePurchaseQuery } from "../utils/coursePurchase.js";
import { resolveProgramPrimaryCourseId } from "../utils/programPrimaryCourse.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  parseNotesMarkdownFile,
  parseMcqMarkdownFile,
} from "../config/unifiedMarkdownParser.js";

const detectBannerMimeType = (buffer) => {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
};

const uploadCourseBanner = async (file) => {
  let fileBuffer = file?.buffer;
  if (!fileBuffer && file?.path) {
    try {
      fileBuffer = await fs.promises.readFile(file.path);
    } catch (err) {
      console.error("Failed to read course banner temp file:", err);
    }
  }

  if (!fileBuffer) return null;

  const detectedMimeType = detectBannerMimeType(fileBuffer);
  if (!detectedMimeType) {
    const error = new Error("Banner must be a valid PNG, JPEG, WebP, or GIF image.");
    error.statusCode = 400;
    throw error;
  }

  const hasCloudinaryCredentials = Boolean(
    process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );

  const databaseFallback = () => ({
    secure_url: `data:${detectedMimeType};base64,${fileBuffer.toString("base64")}`,
  });

  if (!hasCloudinaryCredentials) return databaseFallback();

  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  try {
    return await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "techlearn/courses",
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(fileBuffer);
    });
  } catch (error) {
    console.warn("Course banner Cloudinary upload failed; using database fallback:", error.message);
    return databaseFallback();
  }
};

const getActiveProgramLinksForCourses = async (courseIds) => {
  const ids = (courseIds || []).filter(Boolean);
  if (!ids.length) return [];
  return Program.find({ courseIds: { $in: ids }, status: "Active" })
    .select("_id courseIds status pricingType visibility +accessTier")
    .lean();
};

const groupProgramLinksByCourse = (programs) => {
  const links = new Map();
  for (const program of programs || []) {
    for (const courseId of program.courseIds || []) {
      const key = String(courseId);
      const current = links.get(key) || [];
      current.push(program);
      links.set(key, current);
    }
  }
  return links;
};

const courseRequiresEnrollment = (linkedPrograms = []) => {
  const hasPublicFreeProgram = hasPublicFreeProgramLink(linkedPrograms);
  const hasRestrictedProgram = linkedPrograms.some(
    (program) => program.visibility !== "Public" || program.pricingType === "Paid"
  );
  return !hasPublicFreeProgram && hasRestrictedProgram;
};

// admin specific functions
export const createCourseShell = async (req, res) => {
  try {
    const {
      title,
      description,
      level,
      numTopics,
      assignedBatchIds,
      programIds,
      skills,
      deliveryType,
      courseType,
      accessType,
      price,
      status,
      bannerImage,
      instructor,
      instructorBio,
      learningOutcomes,
      duration,
      schedule,
      startDate,
    } = req.body;

    // Validate required fields
    if (!title || String(title).trim().length < 1) {
      return res.status(400).json({
        message: "Course title is required",
      });
    }

    if (String(title).trim().length > 120) {
      return res.status(400).json({
        message: "Course title must be at most 120 characters",
      });
    }

    const parsedNumTopics = parseInt(numTopics) || 0;
    if (parsedNumTopics < 0) {
      return res.status(400).json({
        message: "Topics count cannot be negative",
      });
    }

    // Skills parsing
    let parsedSkills = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills;
    } else if (typeof skills === "string") {
      try {
        parsedSkills = JSON.parse(skills);
      } catch (e) {
        parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    // Deduplicate skills case-insensitively
    const seenSkills = new Set();
    const cleanSkills = [];
    for (const skill of parsedSkills) {
      const trimmed = String(skill || "").trim();
      const lower = trimmed.toLowerCase();
      if (trimmed && !seenSkills.has(lower)) {
        seenSkills.add(lower);
        cleanSkills.push(trimmed);
      }
    }

    // Program IDs parsing
    let parsedProgramIds = [];
    if (Array.isArray(programIds)) {
      parsedProgramIds = programIds;
    } else if (typeof programIds === "string") {
      try {
        parsedProgramIds = JSON.parse(programIds);
      } catch (e) {
        parsedProgramIds = programIds.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }

    let parsedBatchIds = assignedBatchIds || [];
    if (typeof assignedBatchIds === "string") {
      try {
        parsedBatchIds = JSON.parse(assignedBatchIds);
      } catch (e) {
        parsedBatchIds = assignedBatchIds.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }

    const resolvedAccessType = accessType === "Paid" ? "Paid" : "Free";
    const resolvedPrice = resolvedAccessType === "Paid" ? Number(price) || 0 : 0;
    if (resolvedAccessType === "Paid" && resolvedPrice <= 0) {
      return res.status(400).json({
        message: "Paid courses require a price greater than 0",
      });
    }

    const resolvedStatus = ["Draft", "Published", "Archived"].includes(status) ? status : "Draft";
    // Publishing gate: cannot publish a course shell that has 0 actual topics
    if (resolvedStatus === "Published") {
      return res.status(400).json({
        message: "A course cannot be published with zero actual topics. Please save as Draft and add topic content first.",
      });
    }

    const normalizedDeliveryType = deliveryType || (courseType === "Trainer-led" ? "Trainer-Led" : "Self-Paced");

    let resolvedBannerImage = bannerImage || "";
    if (req.file) {
      const uploadRes = await uploadCourseBanner(req.file);
      if (uploadRes?.secure_url) {
        resolvedBannerImage = uploadRes.secure_url;
      }
    }

    // Create course shell with empty topicIds and exerciseIds arrays
    const courseData = {
      title: title.trim(),
      description: description?.trim() || "No description provided",
      level: level || "Beginner",
      skills: cleanSkills,
      numTopics: parsedNumTopics,
      topicIds: [], // Empty initially
      exerciseIds: [], // Empty initially
      programIds: parsedProgramIds,
      assignedBatchIds: parsedBatchIds,
      deliveryType: normalizedDeliveryType,
      courseType: normalizedDeliveryType === "Trainer-Led" ? "Trainer-led" : "Self-paced",
      accessType: resolvedAccessType,
      price: resolvedPrice,
      status: resolvedStatus,
      bannerImage: resolvedBannerImage,
      instructor: instructor || "",
      instructorBio: instructorBio || "",
      learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
      duration: duration || "",
      schedule: schedule || "",
      startDate: startDate || "",
    };

    const newCourse = new Course(courseData);
    const savedCourse = await newCourse.save();

    // Link course to programs if specified
    if (parsedProgramIds.length > 0) {
      await Program.updateMany(
        { _id: { $in: parsedProgramIds } },
        { $addToSet: { courseIds: savedCourse._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Course shell created successfully",
      courseId: savedCourse._id,
      course: savedCourse,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
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
    const {
      title,
      description,
      level,
      numTopics,
      assignedBatchIds,
      programIds,
      skills,
      deliveryType,
      courseType,
      accessType,
      price,
      status,
      bannerImage,
      instructor,
      instructorBio,
      learningOutcomes,
      duration,
      schedule,
      startDate,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    if (title !== undefined && String(title).trim().length < 1) {
      return res.status(400).json({ message: "Course title must be at least 1 character long" });
    }

    if (title !== undefined && String(title).trim().length > 120) {
      return res.status(400).json({ message: "Course title must be at most 120 characters" });
    }

    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (level !== undefined) update.level = level;
    if (numTopics !== undefined) {
      const n = Number(numTopics);
      if (n < 0) {
        return res.status(400).json({ message: "Topics count cannot be negative" });
      }
      update.numTopics = n;
    }

    if (deliveryType !== undefined) {
      update.deliveryType = deliveryType;
      update.courseType = deliveryType === "Trainer-Led" ? "Trainer-led" : "Self-paced";
    } else if (courseType !== undefined) {
      update.courseType = courseType;
      update.deliveryType = courseType === "Trainer-led" ? "Trainer-Led" : "Self-Paced";
    }

    if (instructor !== undefined) update.instructor = instructor;
    if (instructorBio !== undefined) update.instructorBio = instructorBio;
    if (learningOutcomes !== undefined) {
      let parsedOutcomes = learningOutcomes;
      if (typeof learningOutcomes === "string") {
        try { parsedOutcomes = JSON.parse(learningOutcomes); } catch { parsedOutcomes = learningOutcomes.split("\n"); }
      }
      update.learningOutcomes = Array.isArray(parsedOutcomes)
        ? parsedOutcomes.map((outcome) => String(outcome).trim()).filter(Boolean)
        : [];
    }
    if (duration !== undefined) update.duration = duration;
    if (schedule !== undefined) update.schedule = schedule;
    if (startDate !== undefined) update.startDate = startDate;

    // Skills
    if (skills !== undefined) {
      let parsedSkills = [];
      if (Array.isArray(skills)) {
        parsedSkills = skills;
      } else if (typeof skills === "string") {
        try {
          parsedSkills = JSON.parse(skills);
        } catch (e) {
          parsedSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      const seenSkills = new Set();
      const cleanSkills = [];
      for (const skill of parsedSkills) {
        const trimmed = String(skill || "").trim();
        const lower = trimmed.toLowerCase();
        if (trimmed && !seenSkills.has(lower)) {
          seenSkills.add(lower);
          cleanSkills.push(trimmed);
        }
      }
      update.skills = cleanSkills;
    }

    // Access Type & Price
    const resolvedAccessType = accessType !== undefined ? accessType : existingCourse.accessType;
    if (accessType !== undefined) update.accessType = accessType;

    if (resolvedAccessType === "Free") {
      update.price = 0;
    } else if (price !== undefined) {
      const p = Number(price);
      if (resolvedAccessType === "Paid" && p <= 0) {
        return res.status(400).json({ message: "Paid courses require a price greater than 0" });
      }
      update.price = p;
    }

    // Status & Publishing Validation
    if (status !== undefined) {
      if (!["Draft", "Published", "Archived"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      if (status === "Published") {
        const actualTopicsCount = await Topic.countDocuments({ courseId });
        if (actualTopicsCount === 0) {
          return res.status(400).json({
            message: "Cannot publish course: course has 0 actual topics. Add topic content before publishing.",
          });
        }

        const effectivePrice = update.price !== undefined ? update.price : existingCourse.price;
        if (resolvedAccessType === "Paid" && (!effectivePrice || effectivePrice <= 0)) {
          return res.status(400).json({
            message: "Cannot publish course: Paid course must have a valid price greater than zero.",
          });
        }
      }
      update.status = status;
    }

    // Program Assignment
    if (programIds !== undefined) {
      let parsedProgramIds = [];
      if (Array.isArray(programIds)) {
        parsedProgramIds = programIds;
      } else if (typeof programIds === "string") {
        try {
          parsedProgramIds = JSON.parse(programIds);
        } catch (e) {
          parsedProgramIds = programIds.split(",").map((id) => id.trim()).filter(Boolean);
        }
      }
      const newProgIds = parsedProgramIds.map(String);
      const oldProgIds = (existingCourse.programIds || []).map(String);

      const addedProgIds = newProgIds.filter((id) => !oldProgIds.includes(id));
      const removedProgIds = oldProgIds.filter((id) => !newProgIds.includes(id));

      if (addedProgIds.length > 0) {
        await Program.updateMany(
          { _id: { $in: addedProgIds } },
          { $addToSet: { courseIds: courseId } }
        );
      }
      if (removedProgIds.length > 0) {
        await Program.updateMany(
          { _id: { $in: removedProgIds } },
          { $pull: { courseIds: courseId } }
        );
      }
      update.programIds = newProgIds;
    }

    // Batch Assignment
    let parsedBatchIds = assignedBatchIds;
    if (typeof assignedBatchIds === "string") {
      try {
        parsedBatchIds = JSON.parse(assignedBatchIds);
      } catch (e) {
        parsedBatchIds = assignedBatchIds.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }

    if (parsedBatchIds !== undefined) {
      const newBatchIds = (Array.isArray(parsedBatchIds) ? parsedBatchIds.filter(Boolean) : []).map(String);
      const oldBatchIds = (existingCourse.assignedBatchIds || []).map(String);

      const addedBatchIds = newBatchIds.filter((id) => !oldBatchIds.includes(id));
      const removedBatchIds = oldBatchIds.filter((id) => !newBatchIds.includes(id));

      for (const batchId of addedBatchIds) {
        const batch = await Batch.findById(batchId);
        if (batch) {
          const isAssigned = String(batch.attachedCourse) === String(courseId) ||
            (batch.supportingCourses || []).map(String).includes(String(courseId));
          if (!isAssigned) {
            if (!batch.attachedCourse) {
              batch.attachedCourse = courseId;
            } else {
              batch.supportingCourses = batch.supportingCourses || [];
              if (!batch.supportingCourses.map(String).includes(String(courseId))) {
                batch.supportingCourses.push(courseId);
              }
            }
            await batch.save();
          }
        }
      }

      for (const batchId of removedBatchIds) {
        const batch = await Batch.findById(batchId);
        if (batch) {
          if (String(batch.attachedCourse) === String(courseId)) {
            batch.attachedCourse = null;
          }
          batch.supportingCourses = (batch.supportingCourses || []).filter((id) => String(id) !== String(courseId));
          await batch.save();
        }
      }

      update.assignedBatchIds = newBatchIds;
    }

    if (req.file) {
      const uploadRes = await uploadCourseBanner(req.file);
      if (uploadRes?.secure_url) {
        update.bannerImage = uploadRes.secure_url;
      }
    } else if (bannerImage !== undefined) {
      update.bannerImage = bannerImage;
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
    return res.status(error.statusCode || 500).json({
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
    const allowedProgramCourseIds = new Set();
    const allowedBatchIds = new Set();

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

        const schedule = await resolveProgramSchedule({ user: req.user, student });
        if (schedule.batchExpired && !isCompletedProgramSchedule(schedule)) {
          return res.status(403).json({ success: false, message: "This batch has ended and program access has been revoked." });
        }
        const batch = schedule.batchId
          ? await Batch.findById(schedule.batchId).select("attachedCourse supportingCourses status").lean()
          : null;
        const program = schedule.programId
          ? await Program.findById(schedule.programId).select("courseIds status pricingType visibility").lean()
          : null;
        const publicFreeProgramCourseIds = await Program.distinct(
          "courseIds",
          buildPublicFreeProgramQuery()
        );
        const publicConditions = buildPublicCourseConditions(publicFreeProgramCourseIds);
        const programCourseIds = (program?.courseIds || []).map(String);
        const hasVerifiedProgramAccess = Boolean(
          program &&
          isProgramAccessibleToLearner({
            program,
            enrollment: schedule.enrollment,
          }) &&
          schedule.enrollment &&
          (program.pricingType !== "Paid" || schedule.enrollment.accessTier === "Member")
        );
        if (hasVerifiedProgramAccess) {
          programCourseIds.forEach((courseId) => allowedProgramCourseIds.add(courseId));
        }

        if (schedule.programId) {
          // A concrete Program is the only content source for this learner.
          // Do not surface a legacy/manual batch course that is not mapped to
          // the selected Program.
          filter = {
            $or: [
              ...publicConditions,
              ...(programCourseIds.length ? [{ _id: { $in: programCourseIds } }] : []),
            ],
          };
        } else if (batch && (
          batch.status === "Active"
          || isCompletedProgramSchedule(schedule)
        )) {
          allowedBatchIds.add(String(batch._id));
          const primaryCourseId = batch.attachedCourse;
          if (primaryCourseId) allowedProgramCourseIds.add(String(primaryCourseId));
          const supportingCourseIds = (batch.supportingCourses || []).map(String);
          const conditions = [
            ...publicConditions,
            { assignedBatchIds: batch._id },
            ...(primaryCourseId ? [{ _id: primaryCourseId }] : []),
            ...(programCourseIds.length ? [{ _id: { $in: programCourseIds } }] : []),
          ];

          filter = {
            $and: [
              { $or: conditions },
              ...(supportingCourseIds.length > 0
                ? [{ _id: { $nin: supportingCourseIds } }]
                : []),
            ],
          };
        } else if (programCourseIds.length > 0) {
          filter = { $or: [...publicConditions, { _id: { $in: programCourseIds } }] };
        } else {
          filter = { $or: publicConditions };
        }
      }
    } else {
      // Unauthenticated — show only public courses
      const publicFreeProgramCourseIds = await Program.distinct(
        "courseIds",
        buildPublicFreeProgramQuery()
      );
      filter = { $or: buildPublicCourseConditions(publicFreeProgramCourseIds) };
    }

    if (!isAdmin) {
      filter = {
        $and: [
          filter,
          { status: "Published" },
          { topicIds: { $exists: true, $ne: [] } },
        ],
      };
    }

    const courses = await Course.find(filter);
    const topicCourseIds = isAdmin || courses.length === 0
      ? new Set()
      : new Set((await Topic.distinct("courseId", { courseId: { $in: courses.map((course) => course._id) } })).map(String));
    const linkedPrograms = await getActiveProgramLinksForCourses(courses.map((course) => course._id));
    const linksByCourse = groupProgramLinksByCourse(linkedPrograms);
    const visibleCourses = courses.filter((course) => {
      // Admin course management must include Draft and Archived records.
      // Learner visibility is enforced below for non-admin users only.
      if (isAdmin) return true;
      if (!topicCourseIds.has(String(course._id))) return false;
      if (!isUserVisibleCourse(course)) return false;

      const courseId = String(course._id);
      const assignedBatchIds = Array.isArray(course.assignedBatchIds)
        ? course.assignedBatchIds.map(String)
        : [];
      const linkedCoursePrograms = linksByCourse.get(courseId) || [];
      const isBatchScoped = assignedBatchIds.length > 0;
      const requiresEnrollment = !hasPublicFreeProgramLink(linkedCoursePrograms)
        && (isBatchScoped || courseRequiresEnrollment(linkedCoursePrograms));

      if (!requiresEnrollment || isAdmin) return true;
      if (!req.user) return false;

      // The initial query already limits authenticated learners to their
      // active program/batch context. Keep a second explicit check here so a
      // paid course linked to an unassigned program cannot leak into a public
      // catalog response.
      return allowedProgramCourseIds.has(courseId)
        || assignedBatchIds.some((batchId) => allowedBatchIds.has(batchId));
    });
    res.status(200).json({ count: visibleCourses.length, courses: visibleCourses });
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
    const actualTopicCount = req.user?.role === "admin"
      ? null
      : await Topic.countDocuments({ courseId: course._id });
    if (req.user?.role !== "admin" && (!actualTopicCount || !isUserVisibleCourse(course))) {
      return res.status(404).json({ message: "Course not found" });
    }

    let schedule = null;
    let batch = null;
    let program = null;
    let student = null;

    const assignedBatchIds = (course.assignedBatchIds || []).map(String);
    const linkedPrograms = req.user?.role === "admin"
      ? []
      : await getActiveProgramLinksForCourses([course._id]);
    const linkedProgramIds = linkedPrograms.map((linkedProgram) => String(linkedProgram._id));
    const isPaidCourse = course.accessType === "Paid";
    const hasRestrictedProgramLink = linkedPrograms.some(
      (linkedProgram) => linkedProgram.visibility !== "Public" || linkedProgram.pricingType === "Paid"
    );
    let purchaseAvailable = isPaidCourse
      && assignedBatchIds.length === 0
      && !hasRestrictedProgramLink
      && Number.isFinite(Number(course.price))
      && Number(course.price) > 0;
    const requiresEnrollment = isPaidCourse || (
      !hasPublicFreeProgramLink(linkedPrograms)
      && (assignedBatchIds.length > 0 || courseRequiresEnrollment(linkedPrograms))
    );
    let courseProgramId = null;
    let hasCourseAccess = !requiresEnrollment || req.user?.role === "admin";

    // Optional authentication keeps the catalog public, but it must not make
    // batch-scoped or paid-program content public by direct URL.
    if (requiresEnrollment && req.user?.role !== "admin") {
      if (!req.user) {
        if (!purchaseAvailable) {
          return res.status(403).json({ success: false, message: "This course is available to enrolled learners only." });
        }
      } else {
        const hasCapturedPurchase = isPaidCourse && await Payment.exists(
          buildCapturedCoursePurchaseQuery({ userId: req.user._id, courseId: course._id })
        );

        const email = String(req.user.email || "").trim().toLowerCase();
        student = await Student.findOne({
          $or: [
            { userId: req.user._id },
            ...(email ? [{ email }] : []),
          ],
        }).lean();

        const identifiers = [
          req.user._id ? { userId: req.user._id } : null,
          student?._id ? { studentId: student._id } : null,
        ].filter(Boolean);
        const newestActiveEnrollment = identifiers.length
          ? await ProgramEnrollment.findOne({ status: "Active", $or: identifiers })
            .sort({ assignedAt: -1, createdAt: -1 })
            .select("_id")
            .lean()
          : null;

        const enrollmentAccessConditions = [];
        if (linkedProgramIds.length > 0) {
          enrollmentAccessConditions.push({ programId: { $in: linkedProgramIds } });
        }
        if (assignedBatchIds.length > 0) {
          enrollmentAccessConditions.push({ batchId: { $in: assignedBatchIds } });
        }

        const matchedEnrollments = identifiers.length && enrollmentAccessConditions.length
          ? await ProgramEnrollment.find({
              status: { $in: ["Active", "Completed"] },
              $or: identifiers,
              $and: [{ $or: enrollmentAccessConditions }],
          }).select("programId batchId accessTier status accessExpiresAt").lean()
          : [];
        const enrollments = matchedEnrollments.filter((enrollment) =>
          (!enrollment.accessExpiresAt || new Date(enrollment.accessExpiresAt) > new Date())
          && (enrollment.status === "Completed" || String(enrollment._id) === String(newestActiveEnrollment?._id || ""))
        );

        const batchResults = await Promise.all(
          assignedBatchIds.map((id) => Batch.findById(id).lean().then((assignedBatch) => (
            assignedBatch ? expireBatchIfNeeded(assignedBatch) : { expired: false, batch: null }
          )))
        );
        const activeBatchIds = new Set(
          batchResults
            .map((result) => result.batch)
            .filter((assignedBatch) => assignedBatch?.status === "Active")
            .map((assignedBatch) => String(assignedBatch._id))
        );
        const completedEnrollmentBatchIds = new Set(
          enrollments
            .filter((enrollment) => enrollment.status === "Completed" && enrollment.batchId)
            .map((enrollment) => String(enrollment.batchId))
        );
        const accessibleBatchById = new Map(
          batchResults
            .map((result) => result.batch)
            .filter((assignedBatch) => assignedBatch && (
              assignedBatch.status === "Active"
              || completedEnrollmentBatchIds.has(String(assignedBatch._id))
            ))
            .map((assignedBatch) => [String(assignedBatch._id), assignedBatch])
        );
        const hasBatchAccess = enrollments.some((enrollment) => {
          if (!enrollment.batchId) return false;
          const assignedBatch = accessibleBatchById.get(String(enrollment.batchId));
          if (!assignedBatch) return false;
          // A concrete batch Program must match the learner's exact Program;
          // legacy batches without programId retain their old batch access.
          return !assignedBatch.programId
            || String(assignedBatch.programId) === String(enrollment.programId);
        }) || Boolean(
          student?.batchId
          && activeBatchIds.has(String(student.batchId))
          && !accessibleBatchById.get(String(student.batchId))?.programId
        );
        const hasProgramAccess = enrollments.some((enrollment) => {
          const linkedProgram = linkedPrograms.find((candidate) => String(candidate._id) === String(enrollment.programId));
          return linkedProgram &&
            isProgramAccessibleToLearner({ program: linkedProgram, enrollment }) &&
            (linkedProgram.pricingType !== "Paid" || enrollment.accessTier === "Member");
        });

        hasCourseAccess = Boolean(hasBatchAccess || hasProgramAccess || hasCapturedPurchase);
        if (!hasCourseAccess && !purchaseAvailable) {
          return res.status(403).json({ success: false, message: "You do not have access to this course." });
        }
      }
    }

    if (req.user) {
      if (req.user.role !== "admin") {
        if (!student) {
          const email = String(req.user.email || "").trim().toLowerCase();
          student = await Student.findOne({
            $or: [
              { userId: req.user._id },
              ...(email ? [{ email }] : []),
            ],
          }).lean();
        }
        if (linkedProgramIds.length > 0) {
          const identifiers = [
            req.user._id ? { userId: req.user._id } : null,
            student?._id ? { studentId: student._id } : null,
          ].filter(Boolean);
          const courseEnrollments = identifiers.length
            ? await ProgramEnrollment.find({
                status: { $in: ["Active", "Completed"] },
                programId: { $in: linkedProgramIds },
                $or: identifiers,
              }).sort({ assignedAt: -1, createdAt: -1 }).select("programId status assignedAt createdAt accessExpiresAt").lean()
            : [];
          const newestActiveEnrollment = identifiers.length
            ? await ProgramEnrollment.findOne({ status: "Active", $or: identifiers })
              .sort({ assignedAt: -1, createdAt: -1 })
              .select("_id")
              .lean()
            : null;
          const courseEnrollment = courseEnrollments.find((enrollment) =>
            (!enrollment.accessExpiresAt || new Date(enrollment.accessExpiresAt) > new Date())
            && (enrollment.status === "Completed" || String(enrollment._id) === String(newestActiveEnrollment?._id || ""))
          ) || null;
          courseProgramId = courseEnrollment?.programId || null;
        }

        // ProgramEnrollment is the source of truth, so a valid user-only
        // enrollment must receive the same schedule as a legacy Student row.
        schedule = await resolveProgramSchedule({ user: req.user, student, programId: courseProgramId });
        batch = schedule.batchId ? await Batch.findById(schedule.batchId).lean() : null;
        program = schedule.programId ? await Program.findById(schedule.programId).lean() : null;
        const courseIdString = String(course._id);
        const scheduleOwnsCourse = schedule.programId
          ? (program?.courseIds || []).some((id) => String(id) === courseIdString)
          : Boolean(batch && (
              String(batch.attachedCourse || "") === courseIdString
              || (batch.supportingCourses || []).some((id) => String(id) === courseIdString)
              || assignedBatchIds.includes(String(batch._id))
            ));
        if (schedule.batchExpired && !isCompletedProgramSchedule(schedule)) {
          if (scheduleOwnsCourse) {
            return res.status(403).json({ success: false, message: "This batch has ended and program access has been revoked." });
          }
          // An unrelated expired batch must not revoke a separately purchased
          // Course. Its old schedule should not lock this Course's topics.
          schedule = null;
          batch = null;
          program = null;
        }
      }
    }

    let currentDay = null;
    let isScheduleActive = false;
    let isPlacementPrimary = false;

    if (schedule) {
      const courseIdStr = String(courseId);
      const primaryId = batch?.attachedCourse ? String(batch.attachedCourse) : null;
      const supportingIds = (batch?.supportingCourses || []).map(String);
      const assignedIds = (course.assignedBatchIds || []).map(String);
      const programCourseIds = (program?.courseIds || []).map(String);
      const isAttached = schedule.programId
        ? programCourseIds.includes(courseIdStr)
        : primaryId === courseIdStr
          || supportingIds.includes(courseIdStr)
          || (batch && assignedIds.includes(String(batch._id)))
          || programCourseIds.includes(courseIdStr);

      const isProgramCompleted = isCompletedProgramSchedule(schedule);
      const scheduleOwnerIsActive = batch ? batch.status === "Active" : program?.status === "Active";
      if (isAttached && (isProgramCompleted || scheduleOwnerIsActive)) {
        currentDay = calculateProgramDayNumber({
          batch,
          individualStartDate: schedule.individualStartDate,
        });
        isScheduleActive = true;
      }

      // The first Program course is the learner's primary course. A
      // batch-level primary course is retained only for legacy batches that
      // have no concrete Program assignment.
      isPlacementPrimary = schedule.programId
        ? String(resolveProgramPrimaryCourseId(program) || "") === courseIdStr
        : primaryId === courseIdStr || (!primaryId && String(resolveProgramPrimaryCourseId(program) || "") === courseIdStr);
    }

    // Fetch topics using topicIds array and populate notesId
    const topics = await Topic.find({ _id: { $in: course.topicIds } })
      .populate("notesId")
      .sort({ index: 1, createdAt: 1 });
    if (isPaidCourse && topics.length === 0) purchaseAvailable = false;

    const formattedTopics = topics.map((topic, idx) => {
      const day = getTopicDayNumber(topic, idx);
      const isLocked = isScheduleActive && isProgramResourceLocked({
        resourceDay: day,
        currentDay,
        schedule,
      });
      const canReadTopic = hasCourseAccess && !isLocked;
      return {
        topicId: topic._id,
        title: topic.title,
        day,
        week: Math.ceil(day / 7),
        notesId: canReadTopic && topic.notesId ? topic.notesId._id : null,
        notes: canReadTopic &&
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
      skills: course.skills || [],
      deliveryType: course.deliveryType || (course.courseType === "Trainer-led" ? "Trainer-Led" : "Self-Paced"),
      courseType: course.courseType,
      accessType: course.accessType || "Free",
      price: course.price || 0,
      hasAccess: hasCourseAccess,
      purchaseAvailable,
      status: course.status || "Draft",
      programIds: course.programIds || [],
      duration: course.duration,
      instructor: course.instructor,
      instructorBio: course.instructorBio || "",
      learningOutcomes: course.learningOutcomes || [],
      schedule: course.schedule,
      startDate: course.startDate,
      numTopics: course.numTopics,
      bannerImage: course.bannerImage,
      isPlacementPrimary,          // ← true only when this is the batch's primary course
      programId: schedule?.programId || null,
      scheduleType: schedule?.scheduleType || null,
      exerciseIds: hasCourseAccess ? (course.exerciseIds || []) : [],
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

    // Pull from Course. A published course must not remain published after
    // its last actual curriculum topic is removed.
    const courseUpdate = {
      $pull: { topicIds: topic._id },
    };
    const courseBeforeDelete = await Course.findById(topic.courseId).select("status topicIds");
    const isLastTopic = courseBeforeDelete && (courseBeforeDelete.topicIds || []).length <= 1;
    if (isLastTopic && courseBeforeDelete.status === "Published") {
      courseUpdate.$set = { status: "Draft" };
    }
    await Course.updateOne(
      { _id: topic.courseId },
      courseUpdate
    );

    // Delete Topic
    await Topic.findByIdAndDelete(topicId);

    res.status(200).json({
      success: true,
      message: isLastTopic && courseBeforeDelete.status === "Published"
        ? "Topic deleted successfully. The course was moved to Draft because it has no curriculum topics."
        : "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Delete topic error:", error);
    res.status(500).json({
      message: "Failed to delete topic",
      error: error.message,
    });
  }
};
