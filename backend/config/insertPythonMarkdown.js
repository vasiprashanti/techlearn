import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Notes from "../models/Notes.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";

// Always resolve from backend root
import process from "process";
const __dirname = process.cwd();

// Python directories
const pythonDir = path.join(__dirname, "markdown-content", "Python");
const pythonNotesDir = path.join(pythonDir, "Python_Notes");

// Predefined Python notes
export const predefinedPythonNotes = [
  { file: "Python_Introduction_Notes01.md", title: "Introduction" },
  { file: "Python_InbuiltFunctions_Notes02.md", title: "Inbuilt Functions" },
  { file: "Python_Operators_Notes03.md", title: "Operators" },
  { file: "Python_ControlStatements_Notes04.md", title: "Control Statements" },
  {
    file: "Python_DatatypesAndMethods_Notes05.md",
    title: "Data Types and Methods",
  },
  { file: "Python_Looping_Notes06.md", title: "Looping" },
  { file: "Python_Functions_Notes07.md", title: "Functions" },
  {
    file: "Python_ConstructorAndDestructor_Notes08.md",
    title: "Constructor and Destructor",
  },
  { file: "Python_OOPS_Notes09.md", title: "OOPS" },
  { file: "Python_Inheritance_Notes10.md", title: "Inheritance" },
  { file: "Python_Multithreading_Notes11.md", title: "Multithreading" },
];

// Predefined Python quizzes
export const predefinedPythonQuizzes = [
  { file: "Python_Introduction_Quiz01.md", title: "Introduction" },
  { file: "Python_InbuiltFunctions_Quiz02.md", title: "Inbuilt Functions" },
  { file: "Python_Operators_Quiz03.md", title: "Operators" },
  { file: "Python_ControlStatements_Quiz04.md", title: "Control Statements" },
  {
    file: "Python_DatatypesAndMethods_Quiz05.md",
    title: "Data Types and Methods",
  },
  { file: "Python_Looping_Quiz06.md", title: "Looping" },
  { file: "Python_Functions_Quiz07.md", title: "Functions" },
  {
    file: "Python_ConstructorAndDestructor_Quiz08.md",
    title: "Constructor and Destructor",
  },
  { file: "Python_Inheritance_Quiz10.md", title: "Inheritance" },
  { file: "Python_Multithreading_Quiz11.md", title: "Multithreading" },
];
const parseQuizMarkdown = (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
  const questions = [];
  const questionRegex = /### Question[\s\S]*?(?=### Question|$)/g;
  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    const block = match[0];
    const lines = block.split("\n").map((l) => l.trim());
    let question = "";
    const options = [];
    let correctLetter = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("### Question")) continue;
      if (
        !question &&
        line &&
        !line.startsWith("- ") &&
        !line.startsWith("**Answer:")
      ) {
        question = line;
      }
      const optMatch = line.match(/^\-\s*([A-D])\)\s*(.*)$/);
      if (optMatch) {
        options.push({ letter: optMatch[1], text: optMatch[2] });
      }
      const ansMatch = line.match(/\*?\*?Answer:?\*?\*?\s*:?\s*([A-D])/i);
      if (ansMatch) {
        correctLetter = ansMatch[1].toUpperCase();
      }
    }
    const nonEmptyOptions = options.filter((opt) => opt.text);
    if (!question || nonEmptyOptions.length < 2 || !correctLetter) {
      continue;
    }
    questions.push({
      question: question.trim(),
      options: options.map((opt) => opt.text),
      correctAnswer: options.findIndex((opt) => opt.letter === correctLetter),
    });
  }
  return questions;
};

export const insertPythonMarkdownContent = async () => {
  try {
    // Only insert if Python course does not exist
    let pythonCourse = await Course.findOne({ title: "Python" });
    if (!pythonCourse) {
      // Create course and topics
      const pythonTopics = predefinedPythonNotes.map((note) => ({
        title: note.title,
        notesId: null,
        quizId: null,
        exerciseId: null,
      }));
      pythonCourse = new Course({
        title: "Python",
        description: "Learn the fundamentals of Python programming.",
        level: "Beginner",
        topics: pythonTopics,
      });
      await pythonCourse.save();
      console.log("Python course seeded successfully");
    } else {
      console.log("Python course already exists, skipping course creation");
    }

    // Insert or update notes and always ensure correct linking
    let courseModified = false;
    for (const note of predefinedPythonNotes) {
      const filePath = path.join(pythonNotesDir, note.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        let existingNote = await Notes.findOne({ content });
        if (!existingNote) {
          existingNote = await Notes.create({ content });
        }
        const topic = pythonCourse.topics.find((t) => t.title === note.title);
        if (
          topic &&
          (!topic.notesId ||
            topic.notesId.toString() !== existingNote._id.toString())
        ) {
          topic.notesId = existingNote._id;
          courseModified = true;
        }
      } else {
        console.warn(`Note file not found: ${filePath}`);
      }
    }

    // Insert or update quizzes and always ensure correct linking
    let quizModified = false;
    for (const quiz of predefinedPythonQuizzes) {
      const filePath = path.join(pythonDir, "Python_Quiz", quiz.file);
      if (fs.existsSync(filePath)) {
        const questions = parseQuizMarkdown(filePath);
        if (questions.length > 0) {
          const topic = pythonCourse.topics.find((t) => t.title === quiz.title);
          if (!topic) continue;
          let existingQuiz = await Quiz.findOne({ topicTitle: quiz.title });
          if (!existingQuiz) {
            existingQuiz = await Quiz.create({
              courseId: pythonCourse._id,
              topicId: topic._id,
              topicTitle: quiz.title,
              questions,
            });
          }
          if (
            !topic.quizId ||
            topic.quizId.toString() !== existingQuiz._id.toString()
          ) {
            topic.quizId = existingQuiz._id;
            quizModified = true;
          }
        } else {
          console.warn(`No valid questions found in quiz: ${filePath}`);
        }
      } else {
        console.warn(`Quiz file not found: ${filePath}`);
      }
    }

    if (courseModified) {
      await pythonCourse.save();
      console.log("Notes linked to Python course successfully");
    } else {
      console.log("Python notes already linked, skipping update");
    }

    if (quizModified) {
      await pythonCourse.save();
      console.log("Quizzes linked to Python course successfully");
    } else {
      console.log("Python quizzes already linked, skipping update");
    }
  } catch (error) {
    console.error("Error inserting Python markdown content:", error);
  }
};
