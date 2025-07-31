// Helper function to calculate total possible XP
export const calculateTotalPossibleXP = async () => {
  // Calculate total exercises * 10 (10 XP per exercise)
  const totalExercises = await Exercise.countDocuments();
  const totalExerciseXP = totalExercises * 10;

  // Calculate total quiz questions * 10 (10 XP per question)
  const allQuizzes = await Quiz.find();
  let totalQuizQuestions = 0;
  for (const quiz of allQuizzes) {
    totalQuizQuestions += quiz.questions.length;
  }
  const totalCourseXP = totalQuizQuestions * 10;

  return { totalCourseXP, totalExerciseXP };
};
