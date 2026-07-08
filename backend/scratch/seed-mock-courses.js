import { connectDB } from "../config/db.js";
import Batch from "../models/Batch.js";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import mongoose from "mongoose";

// Simple Schema for College to lookup
const CollegeSchema = new mongoose.Schema({ name: String });
const College = mongoose.models.College || mongoose.model("College", CollegeSchema);

const createTopicsForCourse = async (courseId, prefix) => {
  const topicIds = [];
  for (let day = 1; day <= 10; day++) {
    const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const topic = new Topic({
      title: `${prefix} Notes - Day ${day}`,
      notes: `Detailed notes content for ${prefix} Day ${day}. This is for testing the day-wise dynamic notes mapping.`,
      index: day,
      courseId: courseId,
      slug: `${cleanPrefix}-day-${day}`,
      hasNotes: true
    });
    const saved = await topic.save();
    topicIds.push(saved._id);
  }
  return topicIds;
};

const run = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully.");

    // Find a college
    let college = await College.findOne();
    if (!college) {
      college = new College({ name: "Test College" });
      await college.save();
      console.log("Created Test College");
    }

    // Find or create July Placement Batch
    let batch = await Batch.findOne({ name: "July Placement Batch" });
    if (!batch) {
      batch = new Batch({
        name: "July Placement Batch",
        status: "Active",
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year later
        collegeId: college._id,
        releaseTime: "00:00"
      });
      await batch.save();
      console.log("Created July Placement Batch");
    } else {
      batch.status = "Active";
      await batch.save();
      console.log("Found July Placement Batch");
    }

    // 1. Create Placement Sprint Course
    let primaryCourse = await Course.findOne({ title: "Placement Sprint" });
    if (primaryCourse) {
      await Course.deleteOne({ _id: primaryCourse._id });
      await Topic.deleteMany({ courseId: primaryCourse._id });
    }
    primaryCourse = new Course({
      title: "Placement Sprint",
      description: "Master placement preparation and core Java fundamentals.",
      level: "Intermediate",
      numTopics: 10,
      assignedBatchIds: [batch._id]
    });
    await primaryCourse.save();
    const primaryTopics = await createTopicsForCourse(primaryCourse._id, "Placement Sprint");
    primaryCourse.topicIds = primaryTopics;
    await primaryCourse.save();
    console.log("Created Placement Sprint Course");

    // 2. Create Mock Aptitude Course
    let aptitudeCourse = await Course.findOne({ title: "Mock Aptitude Course" });
    if (aptitudeCourse) {
      await Course.deleteOne({ _id: aptitudeCourse._id });
      await Topic.deleteMany({ courseId: aptitudeCourse._id });
    }
    aptitudeCourse = new Course({
      title: "Mock Aptitude Course",
      description: "Daily quantitative aptitude and logical reasoning notes.",
      level: "Beginner",
      numTopics: 10,
      assignedBatchIds: [batch._id]
    });
    await aptitudeCourse.save();
    const aptitudeTopics = await createTopicsForCourse(aptitudeCourse._id, "Mock Aptitude");
    aptitudeCourse.topicIds = aptitudeTopics;
    await aptitudeCourse.save();
    console.log("Created Mock Aptitude Course");

    // 3. Create Mock Technical Course
    let technicalCourse = await Course.findOne({ title: "Mock Technical Course" });
    if (technicalCourse) {
      await Course.deleteOne({ _id: technicalCourse._id });
      await Topic.deleteMany({ courseId: technicalCourse._id });
    }
    technicalCourse = new Course({
      title: "Mock Technical Course",
      description: "Daily core CS concepts, programming language fundamentals, and notes.",
      level: "Intermediate",
      numTopics: 10,
      assignedBatchIds: [batch._id]
    });
    await technicalCourse.save();
    const technicalTopics = await createTopicsForCourse(technicalCourse._id, "Mock Technical");
    technicalCourse.topicIds = technicalTopics;
    await technicalCourse.save();
    console.log("Created Mock Technical Course");

    // Assign courses to the batch
    batch.attachedCourse = primaryCourse._id;
    batch.supportingCourses = [aptitudeCourse._id, technicalCourse._id];
    await batch.save();
    console.log("Assigned Primary & Supporting courses to batch successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

run();
