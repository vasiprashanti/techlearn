import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import ProjectDay from "../models/ProjectDay.js";
import ProjectTask from "../models/ProjectTask.js";
import StudentProject from "../models/StudentProject.js";
import StudentTaskProgress from "../models/StudentTaskProgress.js";

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
    let overview_markdown_content = req.body.overview_markdown_content || "";
    let overview_markdown_file_url = "";

    // Handle uploaded file
    if (req.file) {
      overview_markdown_content = fs.readFileSync(req.file.path, "utf-8");
      
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

    const durationDaysNum = Number(duration_days);

    // Create the project
    const project = await Project.create({
      title,
      description,
      category,
      duration_days: durationDaysNum,
      xp_requirement: Number(xp_requirement || 0),
      overview_markdown_content,
      overview_markdown_file_url,
      status: req.body.status || "Draft",
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
    if (status) project.status = status;

    if (req.body.overview_markdown_content !== undefined) {
      project.overview_markdown_content = req.body.overview_markdown_content;
    }

    // Handle markdown file replace
    if (req.file) {
      project.overview_markdown_content = fs.readFileSync(req.file.path, "utf-8");
      
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
        // Delete project days beyond the new duration
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
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: "Published" });
    const archivedProjects = await Project.countDocuments({ status: "Archived" });

    // Distinct assigned students across active StudentProjects
    const studentsAssignedResult = await StudentProject.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$student_id" } },
      { $count: "count" },
    ]);
    const studentsAssigned = studentsAssignedResult[0]?.count || 0;

    return res.status(200).json({
      success: true,
      totalProjects,
      activeProjects,
      archivedProjects,
      studentsAssigned,
    });
  } catch (err) {
    console.error("Get Projects Summary Error:", err);
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
    const days = await ProjectDay.find({ project_id: projectId }).sort({ day_number: 1 });
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
    const tasks = await ProjectTask.find({ project_day_id: dayId });
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
