import fs from "fs";
import path from "path";
import Quiz from "../models/Quiz.js";
import Exercise from "../models/Exercise.js";

// Generate URL-friendly slug from title
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Parse markdown content with admin-provided title
export const parseNotesMarkdown = (filePath, title) => {
  const content = fs.readFileSync(filePath, "utf-8");
  if (!title) {
    throw new Error("Title is required for notes creation");
  }

  const cleanTitle = title.trim();
  const slug = generateSlug(cleanTitle);

  return {
    title: cleanTitle,
    slug,
    content: content,
    filePath,
  };
};

// Parse single markdown file and return structured data
export const parseNotesMarkdownFile = (filePath, title) => {
  try {
    const notesData = parseNotesMarkdown(filePath, title);

    return {
      success: true,
      type: "notes",
      filePath,
      data: notesData,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return {
      success: false,
      error: error.message,
      filePath,
    };
  }
};

// each quiz file is being parser
export const parseQuizMarkdownFile = async (filePath, topicId) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Split by question blocks
    const questionBlocks = content.split(/###\s*Question/).slice(1);

    const questions = questionBlocks.map((block) => {
      // Extract question text (first line)
      const questionMatch = block.match(/^(.*?)(?:\n- )/s);
      const question = questionMatch ? questionMatch[1].trim() : "";

      // Extract options
      const optionMatches = [...block.matchAll(/\n-\s(.*)/g)];
      const options = optionMatches.map((m) => m[1].trim());

      // Extract correct answer index (0-based)
      const answerMatch = block.match(/Answer:\s*(\d+)/);
      const correctAnswer = answerMatch ? parseInt(answerMatch[1], 10) : null;

      // Extract explanation
      const explanationMatch = block.match(/Explanation:\s*(.*)/);
      const explanation = explanationMatch ? explanationMatch[1].trim() : "";

      return {
        question,
        options,
        correctAnswer,
        explanation,
      };
    });

    // Insert quiz into DB
    const quiz = new Quiz({
      topicId,
      questions,
    });
    await quiz.save();

    return { success: true, quizId: quiz._id, questions };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// exercises are being extarcted one after the other
export const parseExerciseMarkdownFile = async (filePath, courseId) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const exerciseBlocks = content.split(/## Question/).slice(1);

    const exercises = [];

    for (const block of exerciseBlocks) {
      // Extract title
      const titleMatch = block.match(/Title:\s*(.*)/);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Extract question (everything after "Question:")
      const questionMatch = block.match(/Question:\s*([\s\S]*)/);
      const question = questionMatch ? questionMatch[1].trim() : block.trim();

      // Create exercise document
      const exercise = new Exercise({
        question: question || title,
        courseId, // Link to course
        realLifeApplication: "",
        exerciseAnswers: "",
        expectedOutput: "",
        input: "",
      });

      await exercise.save();
      exercises.push(exercise);
    }

    return { success: true, exercises, count: exercises.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  generateSlug,
  parseNotesMarkdown,
  parseNotesMarkdownFile,
  parseQuizMarkdownFile,
  parseExerciseMarkdownFile,
};
