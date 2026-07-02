// Extended XP System Rules Engine

export const CHALLENGE_XP = {
  Easy: 25,
  Medium: 50,
  Hard: 90,
  NO_HINTS_BONUS: 0,
  WINDOW_BONUS: 0,
  FIRST_ATTEMPT_BONUS: 0,
};

export const TASK_XP = {
  Coding: { Easy: 20, Medium: 40, Hard: 60 },
  SQL: { Easy: 15, Medium: 30, Hard: 45 },
  MCQ: { Easy: 10, Medium: 20, Hard: 30 },
  Aptitude: { Easy: 10, Medium: 20, Hard: 30 },
  "Core CS": { Easy: 10, Medium: 20, Hard: 30 },
  Debugging: { Easy: 20, Medium: 40, Hard: 60 },
  ALL_COMPLETED_BONUS: 0,
  NO_SKIP_BONUS: 0,
};

export const HINT_DEDUCTION = 0; // No penalties

/**
 * Calculates XP for a Daily Challenge.
 * @param {Object} params
 * @param {string} params.difficulty - 'Easy', 'Medium', 'Hard'
 * @param {number} params.accuracy - accuracy percentage (0-100)
 * @returns {number} calculated XP points
 */
export const calculateChallengeXP = ({ difficulty, accuracy = 100 }) => {
  const base = CHALLENGE_XP[difficulty] || CHALLENGE_XP.Easy;
  const xp = base * (accuracy / 100);
  return Math.max(0, Math.round(xp));
};

/**
 * Calculates XP for a specific Daily Task.
 * @param {Object} params
 * @param {string} params.taskType - 'Coding', 'SQL', 'MCQ', etc.
 * @param {string} params.difficulty - 'Easy', 'Medium', 'Hard'
 * @param {number} params.accuracy - accuracy percentage (0-100)
 * @returns {number} calculated XP points
 */
export const calculateTaskXP = ({ taskType, difficulty = "Easy", accuracy = 100 }) => {
  const normalizedType = String(taskType || "").toLowerCase().trim();
  let base = 10; // Default fallback base XP

  if (normalizedType === "coding" || normalizedType === "dsa coding" || normalizedType === "coding (dsa)") {
    base = TASK_XP.Coding[difficulty] || TASK_XP.Coding.Easy;
  } else if (normalizedType === "sql") {
    base = TASK_XP.SQL[difficulty] || TASK_XP.SQL.Easy;
  } else if (normalizedType === "mcq" || normalizedType === "technical mcq") {
    base = TASK_XP.MCQ[difficulty] || TASK_XP.MCQ.Easy;
  } else if (normalizedType === "aptitude" || normalizedType === "aptitude mcq") {
    base = TASK_XP.Aptitude[difficulty] || TASK_XP.Aptitude.Easy;
  } else if (normalizedType === "core cs") {
    base = TASK_XP["Core CS"][difficulty] || TASK_XP["Core CS"].Easy;
  } else if (normalizedType === "debugging") {
    base = TASK_XP.Debugging[difficulty] || TASK_XP.Debugging.Easy;
  } else {
    // Fallback standard mappings
    const standardMap = {
      coding: TASK_XP.Coding,
      sql: TASK_XP.SQL,
      mcq: TASK_XP.MCQ,
      aptitude: TASK_XP.Aptitude,
      debugging: TASK_XP.Debugging
    };
    const category = standardMap[normalizedType] || TASK_XP.MCQ;
    base = category[difficulty] || category.Easy;
  }

  // Coding/SQL are proportional to test cases passed, MCQ is correct only (100% accuracy)
  const isCodingOrSql = normalizedType.includes("coding") || normalizedType.includes("sql") || normalizedType.includes("dsa") || normalizedType.includes("debugging");
  let xp = base;
  if (isCodingOrSql) {
    xp = base * (accuracy / 100);
  } else {
    xp = accuracy >= 100 ? base : 0;
  }

  return Math.max(0, Math.round(xp));
};
