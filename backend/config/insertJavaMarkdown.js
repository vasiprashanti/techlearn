import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import process from "process";

import Notes from "../models/Notes.js";
import Quiz from "../models/Quiz.js";
import Course from "../models/Course.js";
import Exercise from "../models/Exercise.js";

const __dirname = process.cwd();

// Base paths
const coreJavaDir = path.join(__dirname, "markdown-content", "CoreJava");
const notesDir = path.join(coreJavaDir, "CoreJava_Notes");
const quizzesDir = path.join(coreJavaDir, "CoreJava_Quiz");
const exercisesDir = path.join(coreJavaDir, "CoreJava_Exercises");

// Notes
export const predefinedNotes = [
  { file: "CoreJava_BasicsAndDataTypes_Notes01.md", title: "Basics and Data Types" },
  { file: "CoreJava_ScannerInputAndKeywords_Notes02.md", title: "Scanner Input and Keywords" },
  { file: "CoreJava_ControlStatements_Notes0304.md", title: "Control Statements" },
  { file: "CoreJava_Arrays_Notes05.md", title: "Arrays" },
  { file: "CoreJava_StorageTypes_Notes06.md", title: "Storage Types" },
  { file: "CoreJava_Constructors_Notes07.md", title: "Constructors" },
  { file: "CoreJava_Inheritance_Notes08.md", title: "Inheritance" },
  { file: "CoreJava_AbstractClassAndInterface_Notes09.md", title: "Abstract Class and Interface" },
  { file: "CoreJava_ExceptionHandling_Notes10.md", title: "Exception Handling" },
  { file: "CoreJava_Multithreading_Notes11.md", title: "Multithreading" },
  { file: "CoreJava_CollectionFramework_Notes12.md", title: "Collection Framework" },
  { file: "CoreJava_MysqlDb_Notes1314.md", title: "MySQL Database" },
];

// Quizzes
export const predefinedQuizzes = [
  { file: "CoreJava_BasicsAndDataTypes_Quiz01.md", title: "Basics and Data Types" },
  { file: "CoreJava_ScannerInputAndKeywords_Quiz02.md", title: "Scanner Input and Keywords" },
  { file: "CoreJava_ControlStatements_Quiz0304.md", title: "Control Statements" },
  { file: "CoreJava_Arrays_Quiz05.md", title: "Arrays" },
  { file: "CoreJava_StorageTypes_Quiz06.md", title: "Storage Types" },
  { file: "CoreJava_Constructors_Quiz07.md", title: "Constructors" },
  { file: "CoreJava_Inheritance_Quiz08.md", title: "Inheritance" },
  { file: "CoreJava_AbstractClassAndInterface_Quiz09.md", title: "Abstract Class and Interface" },
  { file: "CoreJava_ExceptionHandling_Quiz10.md", title: "Exception Handling" },
  { file: "CoreJava_Multithreading_Quiz11.md", title: "Multithreading" },
  { file: "CoreJava_CollectionFramework_Quiz12.md", title: "Collection Framework" },
  { file: "CoreJava_MysqlDb_Quiz1314.md", title: "MySQL Database" },
];

// Exercises
export const predefinedExercises = [
  { file: "CoreJava_BasicsAndDataTypes_Exercise01.md", title: "Basics and Data Types" },
  { file: "CoreJava_ScannerAndInput_Exercise02.md", title: "Scanner and Input" },
  { file: "CoreJava_ControlStatements_Exercise03.md", title: "Control Statements" },
  { file: "CoreJava_Arrays_Exercise04.md", title: "Arrays" },
  { file: "CoreJava_ControlFlowAndLoops_Exercise05.md", title: "Control Flow and Loops" },
  { file: "CoreJava_Inheritance_Exercise06.md", title: "Inheritance" },
  { file: "CoreJava_ConstructorAndThisKeyword_Exercise07.md", title: "Constructor and this Keyword" },      
  { file: "CoreJava_MethodOverridingAndPolymorphism_Exercise08.md", title: "Method Overriding and Polymorphism" },
  { file: "CoreJava_ObjectMemoryAndJVMStorage_Exercise09.md", title: "Object Memory and JVM Storage" },
  { file: "CoreJava_SpecialConstructsAndRealApps_Exercise10.md", title: "Special Constructs and Real Apps" },
  { file: "CoreJava_ExpertMixedJavaQuestions_Exercise11.md", title: "Expert Mixed Java Questions" },
];

// Quiz Markdown Parser
const parseQuizMarkdown = (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const questions = [];

  const questionRegex = /### Question:?([\s\S]*?)(?=### Question:?|$)/g;
  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    const block = match[0];
    const questionLine = block.match(/### Question:?\s*([\s\S]*?)(?:\n|$)/);
    const question = questionLine ? questionLine[1].trim() : null;

    const options = [];
    const optionRegex = /^-\s*([A-D])\)\s*(.*)$/gm;
    let optMatch;
    while ((optMatch = optionRegex.exec(block)) !== null) {
      options.push(optMatch[2].trim());
    }

    const answerMatch = block.match(/\*\*Answer:\*\*\s*([A-D])/);
    if (!question || options.length < 2 || !answerMatch) {
      console.warn(`Skipped invalid question block in ${filePath}:\n${block}\n`);
      continue;
    }

    const correctLetter = answerMatch[1].toUpperCase();
    const correctAnswer = correctLetter.charCodeAt(0) - 65;
    if (correctAnswer >= 0 && correctAnswer < options.length) {
      questions.push({ question, options, correctAnswer });
    } else {
      console.warn(`Answer index out of range in ${filePath}:\n${block}\n`);
    }
  }

  return questions;
};

// Exercise Markdown Parser
const parseIndividualExercises = (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");

  const blocks = content.split(/^### Q:/m).slice(1); // each exercise block
  const exercises = [];

  // Get topic name from top-level ## heading
  const topicMatch = content.match(/^##\s+\d+\.\s+(.*)/m);
  const topic = topicMatch ? topicMatch[1].trim() : "Unknown Topic";

  for (const block of blocks) {
    const lines = block.trim().split("\n");

    const question = lines[0].trim();

    const realLifeLine = lines.find((line) =>
      line.startsWith("**Real-life:**")
    );
    const realLife = realLifeLine
      ? realLifeLine.replace("**Real-life:**", "").trim()
      : "";

    const codeMatch = block.match(/```java([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : null;

    if (question && code) {
      exercises.push({
        topic,
        question,
        realLifeApplication: realLife,
        exerciseAnswers: code,
      });
    } else {
      console.warn(`Skipped malformed block in ${filePath}`);
    }
  }

  return exercises;
};

// 🌱 Main Markdown Seeder
export const insertJavaMarkdownContent = async () => {
  try {
    let coreJavaCourse = await Course.findOne({ title: "Core Java" });

    if (!coreJavaCourse) {
      const coreJavaTopics = predefinedNotes.map((note) => ({
        title: note.title,
        notesId: null,
        quizId: null,
        exerciseId: null,
      }));

      coreJavaCourse = new Course({
        title: "Core Java",
        description: "Learn the fundamentals of Java programming.",
        level: "Beginner",
        topics: coreJavaTopics,
      });

      await coreJavaCourse.save();
      console.log("Core Java course seeded");
    } else {
      console.log("Core Java course already exists");
    }

    // Notes
    let courseModified = false;
    for (const note of predefinedNotes) {
      const filePath = path.join(notesDir, note.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Note file not found: ${filePath}`);
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      let existingNote = await Notes.findOne({ content });

      if (!existingNote) {
        existingNote = await Notes.create({ content });
      }

      const topic = coreJavaCourse.topics.find((t) => t.title === note.title);
      if (topic && (!topic.notesId || topic.notesId.toString() !== existingNote._id.toString())) {
        topic.notesId = existingNote._id;
        courseModified = true;
      }
    }

    // Quizzes
    let quizModified = false;
    for (const quiz of predefinedQuizzes) {
      const filePath = path.join(quizzesDir, quiz.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Quiz file not found: ${filePath}`);
        continue;
      }

      const questions = parseQuizMarkdown(filePath);
      if (questions.length === 0) {
        console.warn(`No valid questions in quiz: ${filePath}`);
        continue;
      }

      const topic = coreJavaCourse.topics.find((t) => t.title === quiz.title);
      if (!topic) continue;

      let existingQuiz = await Quiz.findOne({ topicTitle: quiz.title });
      if (!existingQuiz) {
        existingQuiz = await Quiz.create({
          courseId: coreJavaCourse._id,
          topicId: topic._id,
          topicTitle: quiz.title,
          questions,
        });
      }

      if (!topic.quizId || topic.quizId.toString() !== existingQuiz._id.toString()) {
        topic.quizId = existingQuiz._id;
        quizModified = true;
      }
    }

    // Exercises
    for (const exercise of predefinedExercises) {
      const filePath = path.join(exercisesDir, exercise.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Exercise file not found: ${filePath}`);
        continue;
      }

      const parsedExercises = parseIndividualExercises(filePath);
      if (parsedExercises.length === 0) {
        console.warn(`No valid exercises in: ${exercise.file}`);
        continue;
      }

      const topic = coreJavaCourse.topics.find((t) => t.title === exercise.title);
      if (!topic) continue;

      for (const ex of parsedExercises) {
        const exists = await Exercise.findOne({
          courseId: coreJavaCourse._id,
          topicTitle: exercise.title,
          question: ex.question,
        });

        if (!exists) {
          await Exercise.create({
            courseId: coreJavaCourse._id,
            topicTitle: exercise.title,
            question: ex.question,
            realLifeApplication: ex.realLifeApplication,
            exerciseAnswers: ex.exerciseAnswers,
          });
          // console.log(`Inserted exercise: ${ex.question}`);
        } else {
          // console.log(`Exercise already exists: ${ex.question}`);
        }
      }
    }

    if (courseModified || quizModified) {
      await coreJavaCourse.save();
      console.log("Core Java topics updated with notes and quizzes");
    } else {
      console.log("No updates needed for Core Java topics");
    }
  } catch (error) {
    console.error("Error inserting markdown content:", error);
  }
};
