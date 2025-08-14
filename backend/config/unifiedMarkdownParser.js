import fs from "fs";

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
export const parseMcqMarkdownFile = async (filePath, topicId) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Split by MCQ blocks (support both ### Question and :::checkpointMcq)
    const mcqBlocks = content.split(/###\s*Question|:::checkpointMcq/).slice(1);
    const checkpointMcqs = mcqBlocks.map((block, idx) => {
      // Extract question text (first line)
      const questionMatch = block.match(/Question:\s*(.*?)(?:\n- )/s);
      const question = questionMatch ? questionMatch[1].trim() : "";

      // Extract options
      const optionMatches = [...block.matchAll(/\n-\s(.*)/g)];
      const options = optionMatches.map((m) => m[1].trim());

      // Extract correct answer index (1-based)
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
        checkpointMcqId: `${topicId}-mcq${idx + 1}`,
      };
    });

    // Save MCQs to Notes.checkpointMcqs
    const Notes = (await import("../models/Notes.js")).default;
    const notes = await Notes.findOne({ topicId });
    if (!notes) {
      // If notes do not exist, create a new Notes document
      const newNotes = new Notes({
        topicId,
        parsedContent: content,
        checkpointMcqs,
      });
      await newNotes.save();
      return { success: true, notesId: newNotes._id, checkpointMcqs };
    } else {
      // If notes exist, update checkpointMcqs
      notes.checkpointMcqs = checkpointMcqs;
      await notes.save();
      return { success: true, notesId: notes._id, checkpointMcqs };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// exercises are being extracted one after the other
export const parseExerciseMarkdownFile = async (filePath, courseId) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const exerciseBlocks = content.split(/## Question/).slice(1);
    const exercises = [];

    for (const block of exerciseBlocks) {
      // Extract title
      const titleMatch = block.match(/Title:\s*(.*)/);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Extract question
      const questionMatch = block.match(/Question:\s*(.*)/);
      const question = questionMatch ? questionMatch[1].trim() : "";

      // Extract the code block as expected output
      let expectedOutput = "";
      const codeBlockMatch = block.match(/```[\w]*[\r\n]+([\s\S]*?)```/);
      if (codeBlockMatch) {
        expectedOutput = codeBlockMatch[1].trim();
      }

      exercises.push({
        title,
        question,
        expectedOutput,
        input: "", // Always empty since no input is needed
        courseId,
      });
    }

    return { success: true, exercises };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
export default {
  generateSlug,
  parseNotesMarkdown,
  parseNotesMarkdownFile,
  parseMcqMarkdownFile,
  parseExerciseMarkdownFile,
};
