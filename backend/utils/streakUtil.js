import Student from "../models/Student.js";
import StudentMcqSubmission from "../models/StudentMcqSubmission.js";
import PracticeSubmission from "../models/PracticeSubmission.js";
import Submission from "../models/Submission.js";

const toDayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const updateStudentStreak = async (email) => {
  const studentEmail = String(email || "").trim().toLowerCase();
  if (!studentEmail) return;

  try {
    const student = await Student.findOne({ email: studentEmail });
    if (!student) return;

    const userId = student.userId;

    // Fetch all submission dates from all collections
    const [subs, mcqSubs, practiceSubs] = await Promise.all([
      Submission.find({ studentId: student._id }).select("submittedAt").lean(),
      StudentMcqSubmission.find({ studentEmail }).select("submittedAt").lean(),
      userId ? PracticeSubmission.find({ userId }).select("submittedAt").lean() : [],
    ]);

    const allDates = [
      ...subs.map((s) => s.submittedAt),
      ...mcqSubs.map((s) => s.submittedAt),
      ...practiceSubs.map((s) => s.submittedAt),
    ].filter(Boolean);

    const activityDays = new Set(
      allDates.map((date) => toDayKey(date)).filter(Boolean)
    );

    if (!activityDays.size) {
      student.streak = 0;
      await student.save();
      return;
    }

    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    const today = cursor.toISOString().slice(0, 10);
    const yesterday = new Date(cursor);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    if (!activityDays.has(today)) {
      if (!activityDays.has(yesterday.toISOString().slice(0, 10))) {
        student.streak = 0;
        await student.save();
        return;
      }
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    let streak = 0;
    while (activityDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    student.streak = streak;
    student.longestStreak = Math.max(student.longestStreak || 0, streak);
    student.lastActiveAt = allDates.reduce((latest, current) => {
      const currentDate = new Date(current);
      return !latest || currentDate > new Date(latest) ? current : latest;
    }, student.lastActiveAt || null);

    await student.save();
  } catch (error) {
    console.error("Error in updateStudentStreak:", error);
  }
};
