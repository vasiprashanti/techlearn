import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
dotenv.config();
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {});
    console.log(`MongoDB Connected Successfully`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Seed only courses if database is empty
export const seedCourses = async () => {
  try {
    // Check if courses already exist
    const existingCourses = await Course.countDocuments();
    if (existingCourses > 0) {
      console.log("Courses already exist, skipping seeding");
      return;
    }

    // await Course.insertMany(sampleCourses);
    console.log("Sample courses seeded");
  } catch (error) {
    console.error("Error seeding courses:", error.message);
  }
};

// Seed quizzes and link to topics by topicId (only if none exist)
export const seedQuizzes = async () => {
  try {
    // Check if quizzes already exist
    const existingQuizzes = await Quiz.countDocuments();
    if (existingQuizzes > 0) {
      console.log("Quizzes already exist, skipping seeding");
      return;
    }

    const courses = await Course.find();

    for (const course of courses) {
      let updated = false;
      for (const topic of course.topics) {
        // Use unique questions for each topic - skip if not found instead of throwing
        let questions = quizQuestions[topic.title];
        if (!questions) {
          console.warn(
            `Warning: No quiz questions found for topic: ${topic.title}. Skipping...`
          );
          continue;
        }

        try {
          const quiz = await Quiz.create({
            courseId: course._id,
            topicId: topic._id,
            topicTitle: topic.title,
            questions,
          });
          topic.quizId = quiz._id; // Link quiz to topic
          updated = true;
        } catch (quizError) {
          console.error(
            `Error creating quiz for topic ${topic.title}:`,
            quizError.message
          );
        }
      }
      if (updated) {
        try {
          await course.save();
        } catch (saveError) {
          console.error(
            `Error saving course ${course.title}:`,
            saveError.message
          );
        }
      }
    }
    console.log("Sample quizzes seeded and linked to topics");
  } catch (error) {
    console.log("Error seeding quizzes:", error.message);
  }
};
export default connectDB;
