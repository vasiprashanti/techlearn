import Student from "../models/Student.js";
import StudentProject from "../models/StudentProject.js";
import Project from "../models/Project.js";
import ProjectDay from "../models/ProjectDay.js";
import ProjectTask from "../models/ProjectTask.js";
import StudentTaskProgress from "../models/StudentTaskProgress.js";
import UserProgress from "../models/UserProgress.js";
import User from "../models/User.js";

// Helper to get active project for current student
const getStudentActiveAssignment = async (userId) => {
  let student = await Student.findOne({ userId });

  if (!student) {
    // Fallback: lookup user's email and lazy-link student profile if unlinked
    const user = await User.findById(userId).select("email").lean();
    if (user && user.email) {
      student = await Student.findOne({ email: user.email.toLowerCase() });
      if (student) {
        student.userId = userId;
        await student.save();
        console.log(`Lazy-linked student profile ${student._id} to userId ${userId}`);
      }
    }
  }

  if (!student) return null;

  const assignment = await StudentProject.findOne({
    student_id: student._id,
    status: "Active"
  }).populate("project_id");

  return { student, assignment };
};

// ==========================================
// STUDENT PROJECTS CONTROLLERS
// ==========================================

export const getActiveProject = async (req, res) => {
  try {
    const result = await getStudentActiveAssignment(req.user._id);
    if (!result || !result.assignment) {
      return res.status(200).json({ success: true, hasActiveProject: false });
    }

    const { assignment } = result;
    const project = assignment.project_id;

    // Fetch all days of this project
    const days = await ProjectDay.find({ project_id: project._id }).sort({ day_number: 1 }).lean();
    const dayIds = days.map(d => d._id);

    // Fetch all tasks for this project
    const allTasks = await ProjectTask.find({ project_day_id: { $in: dayIds } }).lean();
    const totalProjectTasks = allTasks.length;

    // Fetch progress records
    const progressRecords = await StudentTaskProgress.find({
      student_project_id: assignment._id,
      completed: true
    }).lean();
    const completedTaskIds = new Set(progressRecords.map(p => p.project_task_id.toString()));
    const projectCompletedTotal = completedTaskIds.size;

    // Compute overall progress
    const projectOverallProgress = totalProjectTasks > 0
      ? Math.round((projectCompletedTotal / totalProjectTasks) * 100)
      : 0;

    // Update progress percentage in db if out of sync
    if (assignment.progress_percentage !== projectOverallProgress) {
      assignment.progress_percentage = projectOverallProgress;
      await assignment.save();
    }

    // Get current day's tasks
    const currentDayDoc = days.find(d => d.day_number === assignment.current_day);
    let todayTasks = [];
    if (currentDayDoc) {
      const currentTasks = allTasks.filter(t => t.project_day_id.toString() === currentDayDoc._id.toString());
      todayTasks = currentTasks.map(t => ({
        id: t._id,
        title: t.task_description,
        xp: t.xp_value,
        completed: completedTaskIds.has(t._id.toString())
      }));
    }

    // Calculate total project XP earned
    const taskXpMap = new Map(allTasks.map(t => [t._id.toString(), t.xp_value]));
    let projectXpEarned = 0;
    progressRecords.forEach(p => {
      const xpVal = taskXpMap.get(p.project_task_id.toString()) || 0;
      projectXpEarned += xpVal;
    });

    const projectCompletedToday = todayTasks.filter(t => t.completed).length;
    const projectTotalToday = todayTasks.length;
    const projectDayProgress = projectTotalToday > 0
      ? Math.round((projectCompletedToday / projectTotalToday) * 100)
      : 0;
    const projectDayComplete = projectTotalToday > 0 && projectCompletedToday === projectTotalToday;

    return res.status(200).json({
      success: true,
      hasActiveProject: true,
      assignment: {
        _id: assignment._id,
        current_day: assignment.current_day,
        progress_percentage: projectOverallProgress,
        status: assignment.status
      },
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        category: project.category,
        duration_days: project.duration_days,
        xp_requirement: project.xp_requirement,
        daysRemaining: Math.max(project.duration_days - assignment.current_day, 0)
      },
      projectXpEarned,
      projectCompletedTotal,
      totalProjectTasks,
      projectOverallProgress,
      projectDayProgress,
      projectCompletedToday,
      projectTotalToday,
      projectDayComplete,
      todayTasks,
      dayNotes: days.map(d => ({
        day: d.day_number,
        title: d.topic_title,
        isLocked: d.day_number > assignment.current_day
      }))
    });
  } catch (err) {
    console.error("Get Student Active Project Error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching project" });
  }
};

export const getProjectOverview = async (req, res) => {
  try {
    const result = await getStudentActiveAssignment(req.user._id);
    if (!result || !result.assignment) {
      return res.status(404).json({ success: false, message: "No active project assignment found" });
    }

    const project = result.assignment.project_id;
    return res.status(200).json({
      success: true,
      title: project.title,
      description: project.description,
      category: project.category,
      duration_days: project.duration_days,
      xp_requirement: project.xp_requirement,
      overview_markdown_content: project.overview_markdown_content
    });
  } catch (err) {
    console.error("Get Student Project Overview Error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching overview" });
  }
};

export const getDayNotes = async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const dayNum = Number(dayNumber);

    if (isNaN(dayNum) || dayNum <= 0) {
      return res.status(400).json({ success: false, message: "Invalid day number" });
    }

    const result = await getStudentActiveAssignment(req.user._id);
    if (!result || !result.assignment) {
      return res.status(404).json({ success: false, message: "No active project assignment found" });
    }

    const { assignment } = result;

    // Enforce future day lock
    if (dayNum > assignment.current_day) {
      return res.status(403).json({ success: false, message: "This day is locked." });
    }

    const dayDoc = await ProjectDay.findOne({
      project_id: assignment.project_id._id,
      day_number: dayNum
    });

    if (!dayDoc) {
      return res.status(404).json({ success: false, message: "Day notes not found" });
    }

    // Fetch tasks for this day
    const dayTasks = await ProjectTask.find({ project_day_id: dayDoc._id }).lean();
    const progressRecords = await StudentTaskProgress.find({
      student_project_id: assignment._id,
      project_task_id: { $in: dayTasks.map(t => t._id) }
    }).lean();
    const progressMap = new Map(progressRecords.map(p => [p.project_task_id.toString(), p]));

    const tasks = dayTasks.map(t => {
      const prog = progressMap.get(t._id.toString());
      return {
        id: t._id,
        title: t.task_description,
        xp: t.xp_value,
        completed: prog ? prog.completed : false
      };
    });

    return res.status(200).json({
      success: true,
      day: dayNum,
      title: dayDoc.topic_title,
      notes_markdown: dayDoc.notes_markdown,
      tasks
    });
  } catch (err) {
    console.error("Get Student Day Notes Error:", err);
    return res.status(500).json({ success: false, message: "Server error fetching day notes" });
  }
};

export const toggleTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const result = await getStudentActiveAssignment(req.user._id);
    if (!result || !result.assignment) {
      return res.status(404).json({ success: false, message: "No active project assignment found" });
    }

    const { assignment } = result;
    const project = assignment.project_id;

    // Find the task
    const task = await ProjectTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Find the day this task belongs to
    const dayDoc = await ProjectDay.findById(task.project_day_id);
    if (!dayDoc || dayDoc.project_id.toString() !== project._id.toString()) {
      return res.status(400).json({ success: false, message: "Task does not belong to your project" });
    }

    // Block completion of future day tasks
    if (dayDoc.day_number > assignment.current_day) {
      return res.status(403).json({ success: false, message: "Cannot complete tasks for future days" });
    }

    // Toggle completion status
    let progress = await StudentTaskProgress.findOne({
      student_project_id: assignment._id,
      project_task_id: taskId
    });

    let xpAwardedThisTime = 0;

    if (!progress) {
      // First-time completion: award XP
      progress = new StudentTaskProgress({
        student_project_id: assignment._id,
        project_task_id: taskId,
        completed: true,
        xp_awarded: true,
        completed_at: Date.now()
      });
      xpAwardedThisTime = task.xp_value;
    } else {
      // Toggle
      progress.completed = !progress.completed;
      progress.completed_at = progress.completed ? Date.now() : null;

      // If marked complete again and XP was never awarded, award it
      if (progress.completed && !progress.xp_awarded) {
        progress.xp_awarded = true;
        xpAwardedThisTime = task.xp_value;
      }
    }

    await progress.save();

    // Award XP in UserProgress if needed
    if (xpAwardedThisTime > 0) {
      let userProgress = await UserProgress.findOne({ userId: req.user._id });
      if (!userProgress) {
        userProgress = new UserProgress({ userId: req.user._id });
      }

      if (!userProgress.projectXP) {
        userProgress.projectXP = new Map();
      }

      const pIdStr = project._id.toString();
      const currentXp = userProgress.projectXP.get(pIdStr) || 0;
      userProgress.projectXP.set(pIdStr, currentXp + xpAwardedThisTime);
      await userProgress.save();
    }

    // Check if the current day has been fully completed
    const currentDayDoc = await ProjectDay.findOne({
      project_id: project._id,
      day_number: assignment.current_day
    });

    let dayAdvanced = false;
    let nextDayNumber = assignment.current_day;

    if (currentDayDoc) {
      const currentDayTasks = await ProjectTask.find({ project_day_id: currentDayDoc._id });
      const currentDayTaskIds = currentDayTasks.map(t => t._id);

      const completedCount = await StudentTaskProgress.countDocuments({
        student_project_id: assignment._id,
        project_task_id: { $in: currentDayTaskIds },
        completed: true
      });

      if (currentDayTasks.length > 0 && completedCount === currentDayTasks.length) {
        // Current day is complete. Advance.
        if (assignment.current_day < project.duration_days) {
          assignment.current_day += 1;
          dayAdvanced = true;
          nextDayNumber = assignment.current_day;
        } else if (assignment.current_day === project.duration_days) {
          assignment.status = "Completed";
          assignment.completed_at = Date.now();
        }
      }
    }

    // Recalculate overall progress
    const daysList = await ProjectDay.find({ project_id: project._id }).select("_id");
    const dayIdsList = daysList.map(d => d._id);
    const totalProjectTasks = await ProjectTask.countDocuments({ project_day_id: { $in: dayIdsList } });
    const projectCompletedTotal = await StudentTaskProgress.countDocuments({
      student_project_id: assignment._id,
      completed: true
    });

    const projectOverallProgress = totalProjectTasks > 0
      ? Math.round((projectCompletedTotal / totalProjectTasks) * 100)
      : 0;

    assignment.progress_percentage = projectOverallProgress;
    await assignment.save();

    return res.status(200).json({
      success: true,
      completed: progress.completed,
      xpAwardedThisTime,
      dayAdvanced,
      currentDay: assignment.current_day,
      progressPercentage: projectOverallProgress,
      status: assignment.status
    });
  } catch (err) {
    console.error("Toggle Task Error:", err);
    return res.status(500).json({ success: false, message: "Server error toggling task" });
  }
};
