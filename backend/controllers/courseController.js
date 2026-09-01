import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Notes from "../models/Notes.js";
import Exercise from "../models/Exercise.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import { calculateProgramDayNumber, resolveProgramSchedule } from "../utils/programSchedule.js";
import { expireBatchIfNeeded } from "../utils/batchLifecycle.js";
import { isUserVisibleCourse } from "../utils/courseVisibility.js";
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
    .select("_id courseIds pricingType visibility")
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
  const hasPublicFreeProgram = linkedPrograms.some(
    (program) => program.visibility === "Public" && program.pricingType === "Free"
  );
  const hasRestrictedProgram = linkedPrograms.some(
    (program) => program.visibility !== "Public" || program.pricingType === "Paid"
  );
  return !hasPublicFreeProgram && hasRestrictedProgram;
};

// admin specific functions
export const createCourseShell = async (req, res) => {
  try {
    const { title, description, level, numTopics, assignedBatchIds, courseType, bannerImage, instructor, duration, schedule, startDate } = req.body;

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

    let parsedBatchIds = assignedBatchIds || [];
    if (typeof assignedBatchIds === "string") {
      try {
        parsedBatchIds = JSON.parse(assignedBatchIds);
      } catch (e) {
        parsedBatchIds = assignedBatchIds.split(",").map(id => id.trim()).filter(Boolean);
      }
    }

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
      level: level,
      numTopics: parseInt(numTopics),
      topicIds: [], // Empty initially
      exerciseIds: [], // Empty initially
      assignedBatchIds: parsedBatchIds,
      courseType: courseType || "Self-paced",
      bannerImage: resolvedBannerImage,
      instructor: instructor || "",
      duration: duration || "",
      schedule: schedule || "",
      startDate: startDate || "",
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
    const { title, description, level, numTopics, assignedBatchIds, courseType, bannerImage, instructor, duration, schedule, startDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    if (title !== undefined && String(title).trim().length < 1) {
      return res.status(400).json({ message: "Course title must be at least 1 character long" });
    }

    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    let parsedBatchIds = assignedBatchIds;
    if (typeof assignedBatchIds === "string") {
      try {
        parsedBatchIds = JSON.parse(assignedBatchIds);
      } catch (e) {
        parsedBatchIds = assignedBatchIds.split(",").map(id => id.trim()).filter(Boolean);
      }
    }

    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (description !== undefined) update.description = String(description).trim();
    if (level !== undefined) update.level = level;
    if (numTopics !== undefined) update.numTopics = Number(numTopics);
    if (courseType !== undefined) update.courseType = courseType;
    if (instructor !== undefined) update.instructor = instructor;
    if (duration !== undefined) update.duration = duration;
    if (schedule !== undefined) update.schedule = schedule;
    if (startDate !== undefined) update.startDate = startDate;

    if (parsedBatchIds !== undefined) {
      const newBatchIds = (Array.isArray(parsedBatchIds) ? parsedBatchIds.filter(Boolean) : []).map(String);
      const oldBatchIds = (existingCourse.assignedBatchIds || []).map(String);

      const addedBatchIds = newBatchIds.filter(id => !oldBatchIds.includes(id));
      const removedBatchIds = oldBatchIds.filter(id => !newBatchIds.includes(id));

      // Handle added batches: assign course
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

      // Handle removed batches: unassign course
      for (const batchId of removedBatchIds) {
        const batch = await Batch.findById(batchId);
        if (batch) {
          if (String(batch.attachedCourse) === String(courseId)) {
            batch.attachedCourse = null;
          }
          batch.supportingCourses = (batch.supportingCourses || []).filter(id => String(id) !== String(courseId));
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
        if (schedule.batchExpired) {
          return res.status(403).json({ success: false, message: "This batch has ended and program access has been revoked." });
        }
        const batch = schedule.batchId
          ? await Batch.findById(schedule.batchId).select("attachedCourse supportingCourses status").lean()
          : null;
        const program = schedule.programId
          ? await Program.findById(schedule.programId).select("courseIds status pricingType visibility").lean()
          : null;
        const publicConditions = [
          { assignedBatchIds: { $size: 0 } },
          { assignedBatchIds: { $exists: false } },
        ];
        const programCourseIds = (program?.courseIds || []).map(String);
        const hasVerifiedProgramAccess = Boolean(
          program &&
          program.status === "Active" &&
          program.visibility === "Public" &&
          schedule.enrollment &&
          (program.pricingType !== "Paid" || schedule.enrollment.accessTier === "Member")
        );
        if (hasVerifiedProgramAccess) {
          programCourseIds.forEach((courseId) => allowedProgramCourseIds.add(courseId));
        }

        if (batch && batch.status === "Active") {
          allowedBatchIds.add(String(batch._id));
          const primaryCourseId = batch.attachedCourse;
          if (primaryCourseId) allowedProgramCourseIds.add(String(primaryCourseId));
          programCourseIds.forEach((courseId) => allowedProgramCourseIds.add(courseId));
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
      filter = {
        $or: [
          { assignedBatchIds: { $size: 0 } },
          { assignedBatchIds: { $exists: false } },
        ],
      };
    }

    const courses = await Course.find(filter);
    const linkedPrograms = await getActiveProgramLinksForCourses(courses.map((course) => course._id));
    const linksByCourse = groupProgramLinksByCourse(linkedPrograms);
    const visibleCourses = courses.filter((course) => {
      if (!isUserVisibleCourse(course)) return false;

      const courseId = String(course._id);
      const assignedBatchIds = Array.isArray(course.assignedBatchIds)
        ? course.assignedBatchIds.map(String)
        : [];
      const linkedCoursePrograms = linksByCourse.get(courseId) || [];
      const isBatchScoped = assignedBatchIds.length > 0;
      const requiresEnrollment = isBatchScoped || courseRequiresEnrollment(linkedCoursePrograms);

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
    if (req.user?.role !== "admin" && !isUserVisibleCourse(course)) {
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
    const requiresEnrollment = assignedBatchIds.length > 0 || courseRequiresEnrollment(linkedPrograms);
    let courseProgramId = null;

    // Optional authentication keeps the catalog public, but it must not make
    // batch-scoped or paid-program content public by direct URL.
    if (requiresEnrollment && req.user?.role !== "admin") {
      if (!req.user) {
        return res.status(403).json({ success: false, message: "This course is available to enrolled learners only." });
      }

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

      const enrollmentAccessConditions = [];
      if (linkedProgramIds.length > 0) {
        enrollmentAccessConditions.push({ programId: { $in: linkedProgramIds } });
      }
      if (assignedBatchIds.length > 0) {
        enrollmentAccessConditions.push({ batchId: { $in: assignedBatchIds } });
      }

      const enrollments = identifiers.length && enrollmentAccessConditions.length
        ? await ProgramEnrollment.find({
            status: "Active",
            $or: identifiers,
            $and: [{ $or: enrollmentAccessConditions }],
          }).select("programId batchId accessTier").lean()
        : [];

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
      const hasBatchAccess = Boolean(student?.batchId && activeBatchIds.has(String(student.batchId)))
        || enrollments.some((enrollment) => enrollment.batchId && activeBatchIds.has(String(enrollment.batchId)));
      const hasProgramAccess = enrollments.some((enrollment) => {
        const linkedProgram = linkedPrograms.find((candidate) => String(candidate._id) === String(enrollment.programId));
        return linkedProgram &&
          (linkedProgram.pricingType !== "Paid" || enrollment.accessTier === "Member");
      });

      if (!hasBatchAccess && !hasProgramAccess) {
        return res.status(403).json({ success: false, message: "You do not have access to this course." });
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
          const courseEnrollment = identifiers.length
            ? await ProgramEnrollment.findOne({
                status: { $in: ["Active", "Completed"] },
                programId: { $in: linkedProgramIds },
                $or: identifiers,
              }).sort({ assignedAt: -1, createdAt: -1 }).select("programId").lean()
            : null;
          courseProgramId = courseEnrollment?.programId || null;
        }
        if (!courseProgramId && student?.programId && linkedProgramIds.includes(String(student.programId))) {
          courseProgramId = student.programId;
        }

        // ProgramEnrollment is the source of truth, so a valid user-only
        // enrollment must receive the same schedule as a legacy Student row.
        schedule = await resolveProgramSchedule({ user: req.user, student, programId: courseProgramId });
        if (schedule.batchExpired) {
          return res.status(403).json({ success: false, message: "This batch has ended and program access has been revoked." });
        }
        batch = schedule.batchId ? await Batch.findById(schedule.batchId).lean() : null;
        program = schedule.programId ? await Program.findById(schedule.programId).lean() : null;
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
      const isAttached =
        primaryId === courseIdStr ||
        supportingIds.includes(courseIdStr) ||
        (batch && assignedIds.includes(String(batch._id))) ||
        programCourseIds.includes(courseIdStr);

      const scheduleOwnerIsActive = batch ? batch.status === "Active" : program?.status === "Active";
      if (scheduleOwnerIsActive && isAttached) {
        currentDay = calculateProgramDayNumber({
          batch,
          individualStartDate: schedule.individualStartDate,
        });
        isScheduleActive = true;
      }

      // The first program course is the individual learner's primary course;
      // a batch attachedCourse remains authoritative for cohort learners.
      isPlacementPrimary = primaryId === courseIdStr || (!primaryId && String(programCourseIds[0] || "") === courseIdStr);
    }

    // Fetch topics using topicIds array and populate notesId
    const topics = await Topic.find({ _id: { $in: course.topicIds } })
      .populate("notesId")
      .sort({ index: 1, createdAt: 1 });

    const formattedTopics = topics.map((topic, idx) => {
      const day = idx + 1;
      const isLocked = isScheduleActive && day > currentDay;
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
      courseType: course.courseType,
      duration: course.duration,
      instructor: course.instructor,
      schedule: course.schedule,
      startDate: course.startDate,
      numTopics: course.numTopics,
      bannerImage: course.bannerImage,
      isPlacementPrimary,          // ← true only when this is the batch's primary course
      programId: schedule?.programId || null,
      scheduleType: schedule?.scheduleType || null,
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
