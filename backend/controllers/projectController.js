import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import ProjectDay from "../models/ProjectDay.js";
import ProjectTask from "../models/ProjectTask.js";
import StudentProject from "../models/StudentProject.js";
import StudentTaskProgress from "../models/StudentTaskProgress.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";

// Safe directory creation fallback for serverless environments (like Vercel)
const projectsUploadDir = "uploads/projects";
try {
  if (!fs.existsSync(projectsUploadDir)) {
    fs.mkdirSync(projectsUploadDir, { recursive: true });
  }
} catch (err) {
  console.warn("Unable to create uploads directory (likely running on read-only serverless disk):", err.message);
}

// ==========================================
// PROJECTS CONTROLLERS
// ==========================================

export const createProject = async (req, res) => {
  try {
    const { title, description, category, duration_days, xp_requirement } = req.body;
    const durationDaysNum = Number(duration_days);

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Project Title is required." });
    }
    if (!description?.trim()) {
      return res.status(400).json({ success: false, message: "Project Description is required." });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: "Project Category is required." });
    }
    if (!Number.isFinite(durationDaysNum) || durationDaysNum <= 0) {
      return res.status(400).json({ success: false, message: "Duration must be a positive number." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "An Overview Markdown file is required." });
    }

    let overview_markdown_content = req.body.overview_markdown_content || "";
    let overview_markdown_file_url = "";
    let overview_markdown_original_name = "";

    // Handle uploaded file
    if (req.file) {
      overview_markdown_content = fs.readFileSync(req.file.path, "utf-8");
      overview_markdown_original_name = req.file.originalname;
      
      // Copy to permanent folder (wrapped to prevent crash on read-only environments)
      try {
        const destPath = path.join(projectsUploadDir, Date.now() + "-" + req.file.originalname);
        fs.copyFileSync(req.file.path, destPath);
        overview_markdown_file_url = destPath.replace(/\\/g, "/"); // Normalize windows slashes
      } catch (copyErr) {
        console.warn("Could not copy overview file to permanent uploads folder:", copyErr.message);
      }
      
      // Clean up temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn("Could not unlink temp file", err);
      }
    }

    // Create the project
    const project = await Project.create({
      title,
      description,
      category,
      duration_days: durationDaysNum,
      xp_requirement: Number(xp_requirement || 0),
      overview_markdown_content,
      overview_markdown_file_url,
      overview_markdown_original_name,
      status: "Draft",
    });

    // Auto-generate ProjectDays Day 1 -> Day N
    const daysToCreate = [];
    for (let day = 1; day <= durationDaysNum; day++) {
      daysToCreate.push({
        project_id: project._id,
        day_number: day,
        topic_title: `Day ${day} Topic`,
        notes_markdown: "",
      });
    }

    if (daysToCreate.length > 0) {
      await ProjectDay.insertMany(daysToCreate);
    }

    return res.status(201).json({
      success: true,
      message: `Project created and ${durationDaysNum} days auto-generated.`,
      project,
    });
  } catch (err) {
    console.error("Create Project Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let filter = {};

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    // Use aggregation to count assigned students dynamically
    const projects = await Project.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "studentprojects",
          localField: "_id",
          foreignField: "project_id",
          as: "assignments",
        },
      },
      {
        $addFields: {
          assignedStudentsCount: {
            $size: {
              $filter: {
                input: "$assignments",
                as: "a",
                cond: { $eq: ["$$a.status", "Active"] },
              },
            },
          },
        },
      },
      {
        $project: {
          assignments: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json(projects);
  } catch (err) {
    console.error("Get Projects Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Fetch active assignments count
    const assignedStudentsCount = await StudentProject.countDocuments({
      project_id: project._id,
      status: "Active",
    });

    const projectObj = project.toObject();
    projectObj.assignedStudentsCount = assignedStudentsCount;

    return res.status(200).json(projectObj);
  } catch (err) {
    console.error("Get Single Project Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { title, description, category, duration_days, xp_requirement, status } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (category) project.category = category;
    if (xp_requirement !== undefined) project.xp_requirement = Number(xp_requirement);
    if (status === "Published") {
      const days = await ProjectDay.find({ project_id: project._id }).select("_id notes_markdown").lean();
      const dayIds = days.map((day) => day._id);
      const taskCounts = await ProjectTask.aggregate([
        { $match: { project_day_id: { $in: dayIds } } },
        { $group: { _id: "$project_day_id", count: { $sum: 1 } } },
      ]);
      const taskCountByDay = new Map(taskCounts.map((entry) => [entry._id.toString(), entry.count]));
      const emptyDays = days.length !== project.duration_days;
      const missingNotes = days.some((day) => !day.notes_markdown?.trim());
      const missingTasks = days.some((day) => !taskCountByDay.get(day._id.toString()));

      if (emptyDays || missingNotes || missingTasks) {
        const errors = [];
        if (emptyDays) errors.push("all project days must be present");
        if (missingNotes) errors.push("each day needs markdown notes");
        if (missingTasks) errors.push("each day needs at least one task");
        return res.status(400).json({
          success: false,
          message: `Project cannot be published: ${errors.join(", ")}.`,
          validation: { emptyDays, missingNotes, missingTasks },
        });
      }
    }

    if (status) project.status = status;

    if (req.body.overview_markdown_content !== undefined) {
      project.overview_markdown_content = req.body.overview_markdown_content;
    }

    // Handle markdown file replace
    if (req.file) {
      project.overview_markdown_content = fs.readFileSync(req.file.path, "utf-8");
      project.overview_markdown_original_name = req.file.originalname;
      
      try {
        const destPath = path.join(projectsUploadDir, Date.now() + "-" + req.file.originalname);
        fs.copyFileSync(req.file.path, destPath);
        project.overview_markdown_file_url = destPath.replace(/\\/g, "/");
      } catch (copyErr) {
        console.warn("Could not copy updated overview file to permanent uploads folder:", copyErr.message);
      }
      
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn("Could not unlink temp file", err);
      }
    }

    // If duration changed, handle adjustment of days
    if (duration_days && Number(duration_days) !== project.duration_days) {
      const newDuration = Number(duration_days);
      const oldDuration = project.duration_days;
      project.duration_days = newDuration;

      if (newDuration > oldDuration) {
        // Create days from oldDuration + 1 to newDuration
        const daysToCreate = [];
        for (let day = oldDuration + 1; day <= newDuration; day++) {
          daysToCreate.push({
            project_id: project._id,
            day_number: day,
            topic_title: `Day ${day} Topic`,
            notes_markdown: "",
          });
        }
        await ProjectDay.insertMany(daysToCreate);
      } else if (newDuration < oldDuration) {
        // Delete project days and their associated tasks beyond the new duration
        const daysToDelete = await ProjectDay.find({
          project_id: project._id,
          day_number: { $gt: newDuration }
        }).select("_id");
        const dayIds = daysToDelete.map((d) => d._id);

        await ProjectTask.deleteMany({ project_day_id: { $in: dayIds } });
        await ProjectDay.deleteMany({
          project_id: project._id,
          day_number: { $gt: newDuration },
        });
      }
    }

    await project.save();
    return res.status(200).json({ success: true, message: "Project updated successfully.", project });
  } catch (err) {
    console.error("Update Project Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const archiveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.status === "Archived") {
      project.status = "Draft";
      await project.save();
      return res.status(200).json({ success: true, message: "Project unarchived successfully.", project });
    } else {
      project.status = "Archived";
      await project.save();
      return res.status(200).json({ success: true, message: "Project archived successfully.", project });
    }
  } catch (err) {
    console.error("Archive Project Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Clean up days and tasks associated with the project
    const days = await ProjectDay.find({ project_id: req.params.id });
    const dayIds = days.map((d) => d._id);

    await ProjectTask.deleteMany({ project_day_id: { $in: dayIds } });
    await ProjectDay.deleteMany({ project_id: req.params.id });

    // Clean up student projects and their task progress
    const studentProjects = await StudentProject.find({ project_id: req.params.id });
    const spIds = studentProjects.map((sp) => sp._id);
    await StudentTaskProgress.deleteMany({ student_project_id: { $in: spIds } });
    await StudentProject.deleteMany({ project_id: req.params.id });

    return res.status(200).json({ success: true, message: "Project and associated items deleted successfully." });
  } catch (err) {
    console.error("Delete Project Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjectsSummary = async (req, res) => {
  try {
    const [
      totalProjects,
      activeProjects,
      archivedProjects,
      studentAssignmentStats,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: "Published" }),
      Project.countDocuments({ status: "Archived" }),
      StudentProject.aggregate([
        {
          $group: {
            _id: null,
            studentsAssigned: { $sum: 1 },
            studentsActive: {
              $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
            },
            studentsCompleted: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            averageProgress: { $avg: "$progress_percentage" },
          },
        },
      ]),
    ]);

    const assignmentStats = studentAssignmentStats[0] || {};
    const studentsAssigned = assignmentStats.studentsAssigned || 0;
    const studentsActive = assignmentStats.studentsActive || 0;
    const averageProgress = Math.round(assignmentStats.averageProgress || 0);
    const completionRate = studentsAssigned > 0
      ? Math.round(((assignmentStats.studentsCompleted || 0) / studentsAssigned) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      totalProjects,
      activeProjects,
      archivedProjects,
      studentsAssigned,
      studentsActive,
      averageProgress,
      completionRate,
    });
  } catch (err) {
    console.error("Get Projects Summary Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const assignments = await StudentProject.find({
      project_id: projectId,
      status: { $ne: "Archived" },
    }).select("_id status progress_percentage").lean();
    const assignmentIds = assignments.map((assignment) => assignment._id);
    const projectDays = await ProjectDay.find({ project_id: projectId }).select("_id").lean();
    const projectTasks = await ProjectTask.find({
      project_day_id: { $in: projectDays.map((day) => day._id) },
    }).select("_id xp_value").lean();
    const taskXpById = new Map(projectTasks.map((task) => [task._id.toString(), task.xp_value || 0]));
    const completedProgress = assignmentIds.length
      ? await StudentTaskProgress.find({
          student_project_id: { $in: assignmentIds },
          completed: true,
        }).select("student_project_id project_task_id").lean()
      : [];

    const xpByAssignment = new Map();
    completedProgress.forEach((progress) => {
      const assignmentId = progress.student_project_id.toString();
      const taskXp = taskXpById.get(progress.project_task_id.toString()) || 0;
      xpByAssignment.set(assignmentId, (xpByAssignment.get(assignmentId) || 0) + taskXp);
    });

    const totalStudents = assignments.length;
    const activeStudents = assignments.filter((assignment) => assignment.status === "Active").length;
    const completedStudents = assignments.filter((assignment) => assignment.status === "Completed").length;
    const averageProgress = totalStudents
      ? Math.round(assignments.reduce((sum, assignment) => sum + (assignment.progress_percentage || 0), 0) / totalStudents)
      : 0;
    const averageXp = totalStudents
      ? Math.round(Array.from(xpByAssignment.values()).reduce((sum, value) => sum + value, 0) / totalStudents)
      : 0;

    return res.status(200).json({
      success: true,
      totalStudents,
      activeStudents,
      averageProgress,
      averageXp,
      completionRate: totalStudents ? Math.round((completedStudents / totalStudents) * 100) : 0,
    });
  } catch (err) {
    console.error("Get Project Analytics Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// PROJECT DAYS CONTROLLERS
// ==========================================

export const createProjectDay = async (req, res) => {
  try {
    const { project_id, day_number, topic_title, notes_markdown } = req.body;

    const dayExists = await ProjectDay.findOne({ project_id, day_number });
    if (dayExists) {
      return res.status(400).json({ success: false, message: `Day ${day_number} already exists for this project.` });
    }

    const day = await ProjectDay.create({
      project_id,
      day_number,
      topic_title,
      notes_markdown: notes_markdown || "",
    });

    return res.status(201).json({ success: true, day });
  } catch (err) {
    console.error("Create Project Day Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjectDays = async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    const days = await ProjectDay.aggregate([
      { $match: { project_id: projectObjectId } },
      {
        $lookup: {
          from: "projecttasks",
          localField: "_id",
          foreignField: "project_day_id",
          as: "tasks"
        }
      },
      {
        $addFields: {
          taskCount: { $size: "$tasks" },
          totalXp: { $sum: "$tasks.xp_value" }
        }
      },
      {
        $project: {
          tasks: 0
        }
      },
      { $sort: { day_number: 1 } }
    ]);

    return res.status(200).json(days);
  } catch (err) {
    console.error("Get Project Days Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProjectDay = async (req, res) => {
  try {
    const { topic_title, notes_markdown, day_number } = req.body;
    const day = await ProjectDay.findById(req.params.id);
    if (!day) {
      return res.status(404).json({ success: false, message: "Day not found" });
    }

    if (day_number && day_number !== day.day_number) {
      // Check collision
      const collision = await ProjectDay.findOne({ project_id: day.project_id, day_number });
      if (collision) {
        return res.status(400).json({ success: false, message: `Day ${day_number} already exists.` });
      }
      day.day_number = day_number;
    }

    if (topic_title) day.topic_title = topic_title;
    if (notes_markdown !== undefined) day.notes_markdown = notes_markdown;

    await day.save();
    return res.status(200).json({ success: true, day });
  } catch (err) {
    console.error("Update Project Day Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProjectDay = async (req, res) => {
  try {
    const day = await ProjectDay.findByIdAndDelete(req.params.id);
    if (!day) {
      return res.status(404).json({ success: false, message: "Day not found" });
    }

    // Clean up tasks in this day
    await ProjectTask.deleteMany({ project_day_id: req.params.id });

    return res.status(200).json({ success: true, message: "Project day deleted successfully." });
  } catch (err) {
    console.error("Delete Project Day Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const duplicateProjectDay = async (req, res) => {
  try {
    const sourceDay = await ProjectDay.findById(req.params.id).lean();
    if (!sourceDay) {
      return res.status(404).json({ success: false, message: "Project day not found." });
    }

    const [project, lastDay, sourceTasks] = await Promise.all([
      Project.findById(sourceDay.project_id),
      ProjectDay.findOne({ project_id: sourceDay.project_id }).sort({ day_number: -1 }).lean(),
      ProjectTask.find({ project_day_id: sourceDay._id }).lean(),
    ]);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const newDayNumber = (lastDay?.day_number || 0) + 1;
    const duplicateDay = await ProjectDay.create({
      project_id: sourceDay.project_id,
      day_number: newDayNumber,
      topic_title: `${sourceDay.topic_title || `Day ${sourceDay.day_number} Topic`} (Copy)`,
      notes_markdown: sourceDay.notes_markdown || "",
    });

    if (sourceTasks.length) {
      await ProjectTask.insertMany(sourceTasks.map(({ task_description, xp_value }) => ({
        project_day_id: duplicateDay._id,
        task_description,
        xp_value,
      })));
    }

    project.duration_days = Math.max(project.duration_days, newDayNumber);
    await project.save();

    return res.status(201).json({ success: true, day: duplicateDay, message: "Day duplicated successfully." });
  } catch (err) {
    console.error("Duplicate Project Day Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// PROJECT TASKS CONTROLLERS
// ==========================================

export const createProjectTask = async (req, res) => {
  try {
    const { project_day_id, task_description, xp_value } = req.body;

    const task = await ProjectTask.create({
      project_day_id,
      task_description,
      xp_value: Number(xp_value || 0),
    });

    return res.status(201).json({ success: true, task });
  } catch (err) {
    console.error("Create Project Task Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjectTasksByDay = async (req, res) => {
  try {
    const { dayId } = req.params;
    const tasks = await ProjectTask.find({ project_day_id: dayId }).sort({ createdAt: 1 });
    return res.status(200).json(tasks);
  } catch (err) {
    console.error("Get Project Tasks Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProjectTask = async (req, res) => {
  try {
    const { task_description, xp_value } = req.body;
    const task = await ProjectTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task_description) task.task_description = task_description;
    if (xp_value !== undefined) task.xp_value = Number(xp_value);

    await task.save();
    return res.status(200).json({ success: true, task });
  } catch (err) {
    console.error("Update Project Task Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProjectTask = async (req, res) => {
  try {
    const task = await ProjectTask.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    return res.status(200).json({ success: true, message: "Task deleted successfully." });
  } catch (err) {
    console.error("Delete Project Task Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// STUDENT CONFIGURATION & ASSIGNMENT CONTROLLERS
// ==========================================

export const searchStudents = async (req, res) => {
  try {
    const { query, projectId } = req.query;
    if (!query) {
      return res.status(200).json([]);
    }

    // Exclude students who are already assigned (Active) to this specific project
    let excludedStudentIds = [];
    if (projectId) {
      const assigned = await StudentProject.find({
        project_id: projectId,
        status: "Active"
      }).select("student_id").lean();
      excludedStudentIds = assigned.map(a => a.student_id);
    }

    const searchRegex = new RegExp(query, "i");
    const searchFilter = {
      status: "Active",
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { rollNo: searchRegex }
      ]
    };

    if (excludedStudentIds.length > 0) {
      searchFilter._id = { $nin: excludedStudentIds };
    }

    const students = await Student.find(searchFilter)
      .populate("batchId", "name")
      .limit(30)
      .lean();

    return res.status(200).json(students);
  } catch (err) {
    console.error("Search Students Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const assignStudents = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "No students provided." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const assigned = [];
    const skipped = [];

    for (const studentId of studentIds) {
      const student = await Student.findById(studentId);
      if (!student) {
        skipped.push({ studentId, name: "Unknown", reason: "Student not found." });
        continue;
      }

      // Check if they already have an active project assignment
      const activeAssignment = await StudentProject.findOne({
        student_id: studentId,
        status: "Active"
      });

      if (activeAssignment) {
        const reason = activeAssignment.project_id.toString() === projectId
          ? "Already assigned to this project."
          : "Already has active project.";
        skipped.push({ studentId, name: student.name, reason });
        continue;
      }

      try {
        const newAssignment = await StudentProject.create({
          student_id: studentId,
          project_id: projectId,
          status: "Active",
          current_day: 1,
          progress_percentage: 0
        });

        assigned.push({ studentId, name: student.name });
      } catch (saveErr) {
        skipped.push({ studentId, name: student.name, reason: saveErr.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Assigned ${assigned.length} students, skipped ${skipped.length} students.`,
      assigned,
      skipped
    });
  } catch (err) {
    console.error("Assign Students Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const { projectId } = req.params;

    const assignments = await StudentProject.find({ project_id: projectId })
      .populate({
        path: "student_id",
        select: "name email rollNo batchId",
        populate: {
          path: "batchId",
          select: "name"
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    const result = assignments.map(a => ({
      _id: a._id,
      studentId: a.student_id?._id || null,
      name: a.student_id?.name || "Unknown",
      email: a.student_id?.email || "",
      rollNo: a.student_id?.rollNo || "",
      batch: a.student_id?.batchId?.name || "No Batch",
      current_day: a.current_day,
      progress_percentage: a.progress_percentage,
      status: a.status,
      assigned_at: a.assigned_at || a.createdAt
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error("Get Assigned Students Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const removeStudent = async (req, res) => {
  try {
    const { projectId, studentId } = req.params;

    // Find active assignment
    const assignment = await StudentProject.findOne({
      project_id: projectId,
      student_id: studentId,
      status: "Active"
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Active project assignment not found for this student." });
    }

    assignment.status = "Archived";
    await assignment.save();

    return res.status(200).json({ success: true, message: "Student removed from project. Assignment archived successfully." });
  } catch (err) {
    console.error("Remove Student Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjectDayDetails = async (req, res) => {
  try {
    const { dayId } = req.params;
    const day = await ProjectDay.findById(dayId).lean();
    if (!day) {
      return res.status(404).json({ success: false, message: "Project day not found." });
    }

    const [tasks, studentsHaveStarted] = await Promise.all([
      ProjectTask.find({ project_day_id: dayId }).sort({ createdAt: 1 }).lean(),
      StudentProject.exists({
        project_id: day.project_id,
        status: { $in: ["Active", "Completed"] },
        $or: [{ current_day: { $gt: 1 } }, { progress_percentage: { $gt: 0 } }],
      }),
    ]);

    return res.status(200).json({
      success: true,
      day,
      tasks,
      studentsHaveStarted: Boolean(studentsHaveStarted),
    });
  } catch (err) {
    console.error("Get Project Day Details Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProjectProgress = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    // 1. Fetch all student project assignments (excluding archived)
    const assignments = await StudentProject.find({
      project_id: projectId,
      status: { $ne: "Archived" }
    }).populate({
      path: "student_id",
      select: "name email rollNo batchId",
      populate: {
        path: "batchId",
        select: "name"
      }
    }).lean();

    // 2. Fetch project days and tasks to know task counts and XP mappings
    const projectDays = await ProjectDay.find({ project_id: projectId }).select("_id").lean();
    const projectDayIds = projectDays.map(d => d._id);
    const projectTasks = await ProjectTask.find({ project_day_id: { $in: projectDayIds } }).lean();
    const totalProjectTasks = projectTasks.length;

    const tasksMap = new Map(projectTasks.map(t => [t._id.toString(), t]));

    // 3. Fetch completed progress records in bulk for all student assignments
    const assignmentIds = assignments.map(a => a._id);
    const progressRecords = await StudentTaskProgress.find({
      student_project_id: { $in: assignmentIds },
      completed: true
    }).lean();

    // Group progress records by student_project_id
    const studentProgressMap = new Map();
    for (const record of progressRecords) {
      const spIdStr = record.student_project_id.toString();
      if (!studentProgressMap.has(spIdStr)) {
        studentProgressMap.set(spIdStr, []);
      }
      studentProgressMap.get(spIdStr).push(record);
    }

    // 4. Map students to details and dynamically generated day statuses
    const results = assignments.map(a => {
      const completedList = studentProgressMap.get(a._id.toString()) || [];
      const completedCount = completedList.length;

      // Calculate total XP earned from completed tasks
      const totalXp = completedList.reduce((sum, record) => {
        const task = tasksMap.get(record.project_task_id.toString());
        return sum + (task ? task.xp_value : 0);
      }, 0);

      // Compute progress percentage
      const progressPercentage = totalProjectTasks > 0 
        ? Math.round((completedCount / totalProjectTasks) * 100) 
        : 0;

      // Generate day statuses
      const dayStatuses = [];
      const isProjectCompleted = a.status === "Completed";

      for (let dayNum = 1; dayNum <= project.duration_days; dayNum++) {
        let status = "Locked";
        if (isProjectCompleted || dayNum < a.current_day) {
          status = "Completed";
        } else if (dayNum === a.current_day) {
          status = "Current";
        }
        dayStatuses.push({
          dayNumber: dayNum,
          status
        });
      }

      return {
        studentId: a.student_id?._id || null,
        name: a.student_id?.name || "Unknown",
        batch: a.student_id?.batchId?.name || "No Batch",
        currentDay: a.current_day,
        totalDays: project.duration_days,
        xp: totalXp,
        progressPercentage,
        assignmentStatus: a.status,
        dayStatuses
      };
    });

    return res.status(200).json(results);
  } catch (err) {
    console.error("Get Project Progress Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
