// Extended XP System Rules Engine

export const CHALLENGE_XP = {
  Easy: 25,
  Medium: 50,
  Hard: 90,
  NO_HINTS_BONUS: 5,
  WINDOW_BONUS: 5,
  FIRST_ATTEMPT_BONUS: 10,
};

export const TASK_XP = {
  Coding: 40,
  SQL: 25,
  MCQ: 10,
  Aptitude: 15,
  "Core CS": 20,
  Debugging: 25,
  ALL_COMPLETED_BONUS: 25,
  NO_SKIP_BONUS: 10,
};

export const HINT_DEDUCTION = -2.5;

/**
 * Calculates XP for a Daily Challenge.
 * @param {Object} params
 * @param {string} params.difficulty - 'Easy', 'Medium', 'Hard'
 * @param {boolean} params.hintsUsed - Number of hints used
 * @param {boolean} params.withinWindow - Whether submitted inside the active window (e.g. 7:00PM - 8:30PM)
 * @param {boolean} params.firstAttempt - Whether this was the first attempt
 * @returns {number} calculated XP points
 */
export const calculateChallengeXP = ({ difficulty, hintsUsed = 0, withinWindow = false, firstAttempt = false }) => {
  let xp = CHALLENGE_XP[difficulty] || CHALLENGE_XP.Easy;

  // Deduct hints
  xp += hintsUsed * HINT_DEDUCTION;

  // No Hints Bonus
  if (hintsUsed === 0) {
    xp += CHALLENGE_XP.NO_HINTS_BONUS;
  }

  // Active Window Bonus
  if (withinWindow) {
    xp += CHALLENGE_XP.WINDOW_BONUS;
  }

  // First Attempt Bonus
  if (firstAttempt) {
    xp += CHALLENGE_XP.FIRST_ATTEMPT_BONUS;
  }

  return Math.max(0, xp);
};

/**
 * Calculates XP for a specific Daily Task.
 * @param {Object} params
 * @param {string} params.taskType - 'Coding', 'SQL', 'MCQ', etc.
 * @param {number} params.hintsUsed - Number of hints used
 * @returns {number} calculated XP points
 */
export const calculateTaskXP = ({ taskType, hintsUsed = 0 }) => {
  let xp = TASK_XP[taskType] || 0;

  // Deduct hints
  xp += hintsUsed * HINT_DEDUCTION;

  return Math.max(0, xp);
};
