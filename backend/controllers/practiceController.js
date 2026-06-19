import Question from "../models/Questions.js";
import PracticeSubmission from "../models/PracticeSubmission.js";
import mongoose from "mongoose";
import { normalizeCategoryType } from "../utils/questionBank.js";

const TRACKS = ["DSA", "Core CS", "SQL", "Aptitude", "Company Based"];

const normalizeSqlQuery = (query) => {
  if (!query) return "";
  
  // Remove single-line comments starting with --
  let cleaned = query.replace(/--.*$/gm, "");
  
  // Remove multi-line comments /* ... */
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  
  // Convert to lowercase
  cleaned = cleaned.toLowerCase();
  
  // Replace multiple whitespace characters (spaces, tabs, newlines) with a single space
  cleaned = cleaned.replace(/\s+/g, " ");
  
  // Trim spaces and semicolons
  cleaned = cleaned.trim().replace(/^;+|;+$/g, "").trim();
  
  return cleaned;
};

const isSqlEmpty = (query) => {
  return normalizeSqlQuery(query).length === 0;
};

const isCodeEmpty = (code, language) => {
  if (!code) return true;
  let cleaned = code;
  const lang = String(language || "").toLowerCase();
  if (lang === "python" || lang === "python3") {
    cleaned = cleaned.replace(/#.*$/gm, "");
    cleaned = cleaned.replace(/"""[\s\S]*?"""/g, "");
    cleaned = cleaned.replace(/'''[\s\S]*?'''/g, "");
  } else {
    cleaned = cleaned.replace(/\/\/.*$/gm, "");
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  }
  return cleaned.trim().length === 0;
};


const normalizePracticeTrack = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("dsa") || normalized.includes("data structures")) return "DSA";
  if (normalized.includes("core") || normalized.includes("cs")) return "Core CS";
  if (normalized.includes("sql") || normalized.includes("database")) return "SQL";
  if (normalized.includes("aptitude")) return "Aptitude";
  if (normalized.includes("company")) return "Company Based";
  return "";
};

const toDayKey = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const calculateStreak = (submissions) => {
  const days = [...new Set(submissions.map((entry) => toDayKey(entry.submittedAt)).filter(Boolean))].sort().reverse();
  if (!days.length) return { currentStreak: 0, lastActivityDate: null };

  let cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const todayKey = cursor.toISOString().slice(0, 10);

  const yesterday = new Date(cursor);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (days[0] !== todayKey && days[0] !== yesterdayKey) {
    return { currentStreak: 0, lastActivityDate: days[0] };
  }

  let streak = 0;
  const daySet = new Set(days);
  if (days[0] === yesterdayKey) cursor = yesterday;

  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return { currentStreak: streak, lastActivityDate: days[0] };
};

const formatQuestion = (question) => {
  const category = question.categoryId && typeof question.categoryId === "object" ? question.categoryId : null;
  const categoryType = normalizeCategoryType(question.categoryType || category?.categoryType);
  if (categoryType && categoryType !== "Coding") return null;

  const content = question.content || {};
  const track = normalizePracticeTrack(category?.title || question.categoryTitle || question.trackType);
  if (!track) return null;

  return {
    id: String(question._id),
    title: question.title,
    subtitle: question.tags?.[0] || category?.title || question.categoryTitle || question.trackType || track,
    difficulty: question.difficulty || "Easy",
    topic: track,
    categoryType: categoryType || "Coding",
    description: question.description || "",
    inputFormat: question.inputFormat || "",
    outputFormat: question.outputFormat || "",
    visibleTestCases: content.visibleTestCases?.length ? content.visibleTestCases : question.visibleTestCases || [],
    hiddenTestCases: content.hiddenTestCases?.length ? content.hiddenTestCases : question.hiddenTestCases || [],
    editorial: question.editorial || content.solutionNotes || "",
    solutionCode: question.solutionCode || "",
  };
};

export const listPracticeQuestions = async (req, res) => {
  try {
    const requestedTrack = normalizePracticeTrack(req.query.track);
    const query = {
      status: "Active",
      isActive: { $ne: false },
      $or: [{ categoryType: "Coding" }, { categoryType: { $exists: false } }, { categoryType: null }],
    };

    const questions = await Question.find(query)
      .populate("categoryId", "title slug categoryType")
      .sort({ createdAt: -1 })
      .lean();
    const data = questions
      .map(formatQuestion)
      .filter(Boolean)
      .filter((question) => !requestedTrack || question.topic === requestedTrack);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listPracticeQuestions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch practice questions." });
  }
};

export const recordPracticeSubmission = async (req, res) => {
  try {
    const track = normalizePracticeTrack(req.body.track);
    const questionIdRaw = String(req.body.questionId || "").trim();

    if (!questionIdRaw) {
      return res.status(400).json({ success: false, message: "questionId is required." });
    }

    if (!TRACKS.includes(track)) {
      return res.status(400).json({ success: false, message: "track must be one of DSA, Core CS, SQL, Aptitude, or Company Based." });
    }

    let canonicalQuestion = null;
    if (mongoose.Types.ObjectId.isValid(questionIdRaw)) {
      canonicalQuestion = await Question.findById(questionIdRaw).lean();
    }

    const selectedAnswer = String(req.body.selectedAnswer || "").trim().toUpperCase();
    const normalizedCategoryType = normalizeCategoryType(canonicalQuestion?.categoryType || req.body.categoryType);
    const isMcqSubmission = normalizedCategoryType === "MCQ" && ["A", "B", "C", "D"].includes(selectedAnswer);

    let isCorrect = Boolean(req.body.isCorrect);

    if (track === "SQL") {
      const code = req.body.code;
      if (!code || isSqlEmpty(code)) {
        return res.status(400).json({ success: false, message: "Query cannot be empty." });
      }

      if (canonicalQuestion) {
        let referenceSolution = canonicalQuestion.solutionCode || "";
        if (!referenceSolution && canonicalQuestion.content?.referenceSolution?.javascript?.code) {
          referenceSolution = canonicalQuestion.content.referenceSolution.javascript.code;
        }

        // Hardcoded fallbacks for seeded questions
        const idStr = String(canonicalQuestion._id);
        if (!referenceSolution && idStr === "6a205308e9ad6aec12fc1872") {
          referenceSolution = "SELECT name FROM employees WHERE salary > 100000;";
        }
        if (!referenceSolution && idStr === "6a205308e9ad6aec12fc1873") {
          referenceSolution = "SELECT email FROM users GROUP BY email HAVING COUNT(email) > 1;";
        }
        if (!referenceSolution && canonicalQuestion.content?.starterCode?.javascript?.code) {
          referenceSolution = canonicalQuestion.content.starterCode.javascript.code;
        }

        const normalizedUser = normalizeSqlQuery(code);
        const normalizedRef = normalizeSqlQuery(referenceSolution);
        
        isCorrect = (normalizedUser === normalizedRef);
      } else {
        isCorrect = true;
      }
    } else if (track === "DSA") {
      const code = req.body.code;
      const language = req.body.language;

      if (!code || isCodeEmpty(code, language)) {
        return res.status(400).json({ success: false, message: "Code cannot be empty." });
      }

      if (canonicalQuestion) {
        const visibleTestCases = canonicalQuestion.visibleTestCases || canonicalQuestion.content?.visibleTestCases || [];
        const hiddenTestCases = canonicalQuestion.hiddenTestCases || canonicalQuestion.content?.hiddenTestCases || [];
        const allTestCases = [...visibleTestCases, ...hiddenTestCases];

        // Filter out completely empty placeholder test cases
        const validTestCases = allTestCases.filter(tc => tc.input?.trim() || tc.output?.trim());

        if (validTestCases.length > 0) {
          const { testCodeWithJudge0, LANGUAGE_IDS } = await import("../utils/judgeUtil.js");
          const langId = LANGUAGE_IDS[String(language || "").toLowerCase()] || 71; // Default to Python

          let allPassed = true;
          for (const tc of validTestCases) {
            const judgeRes = await testCodeWithJudge0(code, langId, tc.input, tc.output);
            if (!judgeRes.passed) {
              allPassed = false;
              break;
            }
          }
          isCorrect = allPassed;
        } else {
          isCorrect = true;
        }
      } else {
        isCorrect = true;
      }
    }

    const score = Number.isFinite(Number(req.body.score)) ? Number(req.body.score) : (isCorrect ? 1 : 0);
    const accuracy = Number.isFinite(Number(req.body.accuracy)) ? Number(req.body.accuracy) : (isCorrect ? 100 : 0);

    const submission = await PracticeSubmission.create({
      userId: req.user._id,
      questionId: questionIdRaw,
      questionBankId: canonicalQuestion?._id || null,
      categoryId: canonicalQuestion?.categoryId || null,
      categoryType: normalizedCategoryType || null,
      track,
      source: req.body.source || "practice",
      selectedAnswer: isMcqSubmission ? selectedAnswer : "",
      isCorrect,
      score,
      accuracy,
      submittedAt: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
    });

    // Intercept for Daily Task tracking
    try {
      const email = req.user.email.toLowerCase().trim();
      const student = await mongoose.model("Student").findOne({ email });
      if (student && student.batchId) {
        const batch = await mongoose.model("Batch").findById(student.batchId);
        if (batch && batch.assignedDailyTaskTrack) {
          const trackTemplate = await mongoose.model("TrackTemplate").findById(batch.assignedDailyTaskTrack);
          if (trackTemplate) {
            const getISTDateParts = (date) => {
              const d = new Date(date);
              const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
              return {
                year: istDate.getUTCFullYear(),
                month: istDate.getUTCMonth(),
                date: istDate.getUTCDate(),
              };
            };
            const combineDateAndTime = (date, timeString = "00:00") => {
              const { year, month, date: day } = getISTDateParts(date);
              const [hours, minutes] = String(timeString || "00:00")
                .split(":")
                .map((val) => Number(val || 0));
              const utcTime = Date.UTC(year, month, day, hours, minutes, 0, 0);
              return new Date(utcTime - 5.5 * 60 * 60 * 1000);
            };
            const releaseStart = combineDateAndTime(trackTemplate.startDate || batch.startDate, batch.releaseTime || "00:00");
            const dayNumber = Math.floor((new Date().getTime() - releaseStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
            
            let attempt = await mongoose.model("DailyTaskAttempt").findOne({
              userId: req.user._id,
              batchId: batch._id,
              trackId: trackTemplate._id,
              dayNumber,
            });
            
            if (attempt) {
              const taskIndex = attempt.tasksProgress.findIndex(
                (t) => String(t.questionId) === String(questionIdRaw)
              );
              
              const finalize = Boolean(req.body.finalize);
              if (taskIndex !== -1 && !attempt.isFullyCompleted) {
                const task = attempt.tasksProgress[taskIndex];
                
                if (!finalize) {
                  if (task.taskType === "Coding" || task.taskType === "SQL") {
                    task.code = req.body.code || "";
                    task.language = req.body.language || "";
                    task.isCorrect = isCorrect;
                    task.accuracy = accuracy;
                    task.attempted = true;
                    task.status = "In Progress";
                    await attempt.save();
                  } else {
                    // MCQ, Aptitude, Core CS
                    if (!task.attempted) {
                      task.status = "Completed";
                      task.selectedOption = selectedAnswer || "";
                      task.isCorrect = isCorrect;
                      task.attempted = true;
                      task.completedAt = new Date();
                      await attempt.save();
                    }
                  }
                } else {
                  // When final Finish is clicked (finalize: true)
                  // First ensure the current (final) task is marked as completed if it wasn't already
                  if (task.taskType === "Coding" || task.taskType === "SQL") {
                    task.code = req.body.code || "";
                    task.language = req.body.language || "";
                    task.isCorrect = isCorrect;
                    task.accuracy = accuracy;
                    task.attempted = true;
                    task.status = "Completed";
                    task.completedAt = new Date();
                  } else {
                    if (!task.attempted) {
                      task.status = "Completed";
                      task.selectedOption = selectedAnswer || "";
                      task.isCorrect = isCorrect;
                      task.attempted = true;
                      task.completedAt = new Date();
                    }
                  }
                  
                  const isSameTrack = (taskType) => {
                    if (track === "DSA") return taskType === "Coding" || taskType === "Debugging";
                    if (track === "SQL") return taskType === "SQL";
                    if (track === "Aptitude") return taskType === "Aptitude";
                    if (track === "Core CS") return taskType === "MCQ" || taskType === "Core CS";
                    return false;
                  };

                  // Check if there are any tasks with status "Not Started" BEFORE we finalize this track
                  const skippedAny = attempt.tasksProgress.some((t) => t.status === "Not Started");

                  // Also mark any other unattempted tasks in this track as attempted (but incorrect) to prevent cheats
                  // And finalize any "In Progress" tasks in this track
                  attempt.tasksProgress.forEach((t) => {
                    if (isSameTrack(t.taskType)) {
                      if (!t.attempted) {
                        t.status = "Completed";
                        t.attempted = true;
                        t.isCorrect = false;
                        t.completedAt = new Date();
                      } else if (t.status === "In Progress") {
                        t.status = "Completed";
                        t.completedAt = t.completedAt || new Date();
                      }
                    }
                  });

                  // Check if the entire day's tasks are now completed
                  const allCompleted = attempt.tasksProgress.every((t) => t.status === "Completed");
                  if (allCompleted) {
                    attempt.isFullyCompleted = true;
                  }
                  
                  await attempt.save();
                  
                  // Award XP only for correct tasks in this track
                  const { calculateTaskXP, TASK_XP } = await import("../services/xpService.js");
                  let totalXpAdded = 0;
                  
                  attempt.tasksProgress.forEach((t) => {
                    if (isSameTrack(t.taskType)) {
                      let xpEarned = calculateTaskXP({ taskType: t.taskType, hintsUsed: t.hintsUsed });
                      if (t.taskType === "Coding" || t.taskType === "SQL") {
                        const acc = typeof t.accuracy === "number" ? t.accuracy : (t.isCorrect ? 100 : 0);
                        const fraction = Math.max(0, Math.min(100, acc)) / 100;
                        totalXpAdded += Math.round(xpEarned * fraction);
                      } else {
                        if (t.isCorrect === true) {
                          totalXpAdded += xpEarned;
                        }
                      }
                    }
                  });
                  
                  // Add bonuses only if all tasks are completed
                  if (allCompleted) {
                    totalXpAdded += TASK_XP.ALL_COMPLETED_BONUS;
                    if (!skippedAny) {
                      totalXpAdded += TASK_XP.NO_SKIP_BONUS;
                    }
                  }
                  
                  if (totalXpAdded > 0) {
                    let progress = await mongoose.model("UserProgress").findOne({ userId: req.user._id });
                    if (!progress) {
                      progress = new (mongoose.model("UserProgress"))({
                        userId: req.user._id,
                        courseXP: new Map(),
                        exerciseXP: new Map(),
                        completedExercises: [],
                      });
                    }
                    
                    const courseIdKey = String(trackTemplate._id);
                    const currentXP = progress.exerciseXP.get(courseIdKey) || 0;
                    progress.exerciseXP.set(courseIdKey, currentXP + totalXpAdded);
                    await progress.save();
                  }
                }
              }
            }
          }
        }
      }
    } catch (dtError) {
      console.error("Daily task automatic submission completion failed:", dtError);
    }

    return res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error("recordPracticeSubmission error:", error);
    return res.status(500).json({ success: false, message: "Failed to record practice submission." });
  }
};

export const getPracticeStats = async (req, res) => {
  try {
    const [questions, submissions] = await Promise.all([
      Question.find({
        status: "Active",
        isActive: { $ne: false },
        $or: [{ categoryType: "Coding" }, { categoryType: { $exists: false } }, { categoryType: null }],
      })
        .select("trackType categoryTitle categoryType categoryId")
        .populate("categoryId", "title slug categoryType")
        .lean(),
      PracticeSubmission.find({ userId: req.user._id }).sort({ submittedAt: -1 }).lean(),
    ]);

    const stats = Object.fromEntries(
      TRACKS.map((track) => [
        track,
        {
          track,
          total: 0,
          attempted: 0,
          correct: 0,
          accuracy: 0,
          streak: 0,
        },
      ])
    );

    for (const question of questions) {
      const track = normalizePracticeTrack(question.categoryId?.title || question.categoryTitle || question.trackType);
      if (stats[track]) stats[track].total += 1;
    }

    const attemptedByTrack = Object.fromEntries(TRACKS.map((track) => [track, new Set()]));
    const correctByTrack = Object.fromEntries(TRACKS.map((track) => [track, new Set()]));

    for (const submission of submissions) {
      if (!stats[submission.track]) continue;
      attemptedByTrack[submission.track].add(submission.questionId);
      if (submission.isCorrect) correctByTrack[submission.track].add(submission.questionId);
    }

    for (const track of TRACKS) {
      stats[track].attempted = attemptedByTrack[track].size;
      stats[track].correct = correctByTrack[track].size;
      stats[track].accuracy =
        stats[track].attempted > 0
          ? Number(((stats[track].correct / stats[track].attempted) * 100).toFixed(1))
          : 0;

      const trackSubmissions = submissions.filter((s) => s.track === track);
      const trackStreak = calculateStreak(trackSubmissions);
      stats[track].streak = trackStreak.currentStreak;
    }

    const streak = calculateStreak(submissions);

    return res.status(200).json({
      success: true,
      data: {
        streak: streak.currentStreak,
        lastActivityDate: streak.lastActivityDate,
        tracks: TRACKS.map((track) => stats[track]),
      },
    });
  } catch (error) {
    console.error("getPracticeStats error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch practice stats." });
  }
};
