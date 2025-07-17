import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import Notes from "../models/Notes.js";

dotenv.config();

const clearCourses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("MongoDB Connected Successfully");

    // Get count before clearing
    const courseCount = await Course.countDocuments();
    const quizCount = await Quiz.countDocuments();
    const notesCount = await Notes.countDocuments();

    console.log(
      `Found ${courseCount} courses, ${quizCount} quizzes, and ${notesCount} notes`
    );

    if (courseCount === 0 && quizCount === 0 && notesCount === 0) {
      console.log("No data to clear");
      process.exit(0);
    }

    // Clear existing courses, quizzes, and notes
    console.log("Clearing existing courses, quizzes, and notes...");
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    await Notes.deleteMany({});

    console.log("All courses, quizzes, and notes cleared successfully!");
    console.log("Restart the server to seed new courses automatically");

    process.exit(0);
  } catch (error) {
    console.error("Error clearing courses:", error.message);
    process.exit(1);
  }
};

clearCourses();
