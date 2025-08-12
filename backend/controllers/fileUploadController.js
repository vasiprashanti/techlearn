// controllers/fileUploadController.js
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import { parseExerciseMarkdownFile } from "../config/unifiedMarkdownParser.js";

export const uploadFiles = async (req, res) => {
  let uploadedFiles = [];

  try {
    uploadedFiles = req.files;

    // Convert object to array if needed
    if (!Array.isArray(uploadedFiles)) {
      uploadedFiles = Object.values(req.files).flat();
    }

    // Parse titles from string to array
    let titles;
    try {
      titles =
        typeof req.body.titles === "string"
          ? JSON.parse(req.body.titles)
          : req.body.titles;
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid titles format" });
    }

    let quizFilesInfo;
    try {
      quizFilesInfo =
        typeof req.body.quizFilesInfo === "string"
          ? JSON.parse(req.body.quizFilesInfo)
          : req.body.quizFilesInfo;
    } catch (parseError) {
      quizFilesInfo = [];
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    if (!titles || titles.length === 0) {
      return res.status(400).json({ message: "No topic titles provided" });
    }

    const topics = titles.map((title, index) => {
      const notesFile = uploadedFiles.find(
        (file) => file.fieldname === `notesFile${index}`
      );
      const quizFile = uploadedFiles.find(
        (file) => file.fieldname === `quizFile${index}`
      );
      return {
        title,
        index: index + 1,
        notesFilePath: notesFile ? notesFile.path : null,
        quizFilePath: quizFile ? quizFile.path : null,
      };
    });

    res.status(200).json({
      message: "Files uploaded successfully",
      topics,
      fileCount: uploadedFiles.length,
    });
  } catch (err) {
    // Only clean up files if there's an error
    if (uploadedFiles && uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cleanupError) {
          console.warn(
            `Could not cleanup file ${file.path}:`,
            cleanupError.message
          );
        }
      });
    }

    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

export const uploadExerciseFile = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No exercise file uploaded" });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if course already has exercises
    if (course.exerciseIds && course.exerciseIds.length > 0) {
      return res.status(400).json({
        message:
          "Course already has exercises. Delete existing exercises first or use edit function.",
      });
    }

    // Parse exercise markdown file using the existing parser
    const result = await parseExerciseMarkdownFile(req.file.path, courseId);

    if (!result.success) {
      return res.status(400).json({
        message: "Failed to parse exercise file",
        error: result.error,
      });
    }

    // Ensure at least one exercise was found in the file
    if (result.exercises.length === 0) {
      return res.status(400).json({ message: "No exercises found in file" });
    }

    // Update course with all exercise references
    const exerciseIds = result.exercises.map((ex) => ex._id);
    course.exerciseIds = exerciseIds;
    await course.save();

    res.status(201).json({
      success: true,
      message: "Exercises uploaded and linked to course successfully",
      exerciseCount: result.exercises.length,
      exercises: result.exercises.map((ex) => ({
        id: ex._id,
        title: ex.title,
        question: ex.question,
        courseId: ex.courseId,
      })),
      course: {
        id: course._id,
        title: course.title,
        exerciseIds: course.exerciseIds,
      },
    });
  } catch (error) {
    console.error("Upload exercise error:", error);

    res.status(500).json({
      message: "Exercise upload failed",
      error: error.message,
    });
  }
};

//  Clean up ALL files in uploads/temp
export const cleanupTempFiles = async (req, res) => {
  try {
    const uploadsDir = process.env.VERCEL ? "/tmp" : "uploads/temp";

    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).json({
        message: "No temp directory found",
        filesDeleted: 0,
        totalFiles: 0,
      });
    }

    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    const deletedFiles = [];
    const errors = [];

    if (files.length === 0) {
      return res.status(200).json({
        message: "No files to clean up",
        filesDeleted: 0,
        totalFiles: 0,
      });
    }

    // Delete ALL files
    files.forEach((filename) => {
      try {
        const filePath = path.join(uploadsDir, filename);

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          fs.unlinkSync(filePath);
          deletedCount++;
          deletedFiles.push({
            filename,
            size: stats.size,
            lastModified: stats.mtime,
          });
        }
      } catch (error) {
        console.warn(`Could not process file ${filename}:`, error.message);
        errors.push({
          filename,
          error: error.message,
        });
      }
    });

    res.status(200).json({
      message: `deleted all files`,
      summary: {
        successful: deletedCount,
        failed: errors.length,
        totalProcessed: files.length,
      },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({
      message: "Cleanup failed",
      error: error.message,
    });
  }
};
