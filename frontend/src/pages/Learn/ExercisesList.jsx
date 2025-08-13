import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Code, Trophy, Clock, ArrowLeft, Star, Play } from 'lucide-react';
import { courseAPI, exerciseAPI, progressAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModalContext } from '../../context/AuthModalContext';
import LoadingScreen from '../../components/LoadingScreen';
import XPTracker from '../../components/XPTracker';
import useInViewport from '../../hooks/useInViewport';
import AccessPopup from '../../utils/accessPopup';

const ExercisesList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { openLogin } = useAuthModalContext();
  const [titleRef, isTitleInViewport] = useInViewport();
  
  const [course, setCourse] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});
  const [showAccessPopup, setShowAccessPopup] = useState(false);

  // Helper function to transform backend exercise data to frontend format
  const transformExerciseData = (backendExercises, completedExerciseIds = []) => {
    return backendExercises.map((exercise, index) => {
      const id = exercise._id || exercise.exerciseId;
      return {
        id,
        exerciseId: exercise.exerciseId,
        title: exercise.title || exercise.question || '',
        question: exercise.question || '',
        expectedOutput: exercise.expectedOutput,
        input: exercise.input,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        // Remove realLifeApplication, use only backend fields
        exerciseAnswers: exercise.exerciseAnswers,
        difficulty: 'Easy', // Default or backend if available
        estimatedTime: '15 min', // Default or backend if available
        xp: 10, // Default or backend if available
        completed: completedExerciseIds.includes(id),
        locked: index >= 4,
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course details
        const courseResponse = await courseAPI.getCourse(courseId);
        setCourse(courseResponse);

        // Fetch exercises from backend
        const exerciseResponse = await exerciseAPI.getExercises(courseId);
        // Handle both array and object response
        let backendExercises = exerciseResponse;
        if (exerciseResponse && Array.isArray(exerciseResponse.exercises)) {
          backendExercises = exerciseResponse.exercises;
        }

        // Fetch user progress if authenticated
        let completedExerciseIds = [];
        if (isAuthenticated) {
          try {
            const progressResponse = await progressAPI.getUserProgress();
            setUserProgress(progressResponse);
            completedExerciseIds = progressResponse.completedExercises || [];
          } catch (progressError) {
            console.error('Error fetching user progress:', progressError);
          }
        }

  // Log the raw exercises data received from backend
  console.log('[ExercisesList] Received exercises:', backendExercises);
  // Transform exercise data with completed status
  const transformedExercises = transformExerciseData(backendExercises, completedExerciseIds);
  setExercises(transformedExercises);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback data
        setCourse({
          title: 'Course Exercises',
          level: 'Beginner',
          description: 'Practice your coding skills with these exercises'
        });
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, isAuthenticated]);

  // Listen for exercise completion events to refresh the list
  useEffect(() => {
    const handleExerciseCompleted = () => {
      console.log('Exercise completed, refreshing exercise list...');
      // Refetch data to update completion status
      if (isAuthenticated) {
        const refreshData = async () => {
          try {
            const progressResponse = await progressAPI.getUserProgress();
            setUserProgress(progressResponse);
            const completedExerciseIds = progressResponse.completedExercises || [];

            // Update exercises with new completion status
            setExercises(prevExercises =>
              prevExercises.map(exercise => ({
                ...exercise,
                completed: completedExerciseIds.includes(exercise.id)
              }))
            );
          } catch (error) {
            console.error('Error refreshing exercise progress:', error);
          }
        };
        refreshData();
      }
    };

    window.addEventListener('exerciseCompleted', handleExerciseCompleted);
    return () => window.removeEventListener('exerciseCompleted', handleExerciseCompleted);
  }, [isAuthenticated]);

  const handleExerciseClick = (exercise) => {
    if (exercise.locked && (!isAuthenticated || !user?.isClubMember)) {
      // Show membership required modal or redirect
      if (!isAuthenticated) {
        openLogin(); // Open login modal instead of navigating
      } else {
        // Show club membership required popup
        setShowAccessPopup(true);
      }
      return;
    }

    navigate(`/learn/exercises/${courseId}/${exercise.id}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'Hard': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };



  if (loading) {
    return (
      <LoadingScreen
        showMessage={false}
        size={48}
        duration={800}
      />
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Breadcrumbs */}
        <motion.nav
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-6 text-sm text-gray-600 dark:text-gray-400"
        >
          <button
            onClick={() => navigate('/learn')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
          >
            Learn
          </button>
          <span>/</span>
          <button
            onClick={() => navigate('/learn/exercises')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
          >
            Exercises
          </button>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {course?.title || 'Course'}
          </span>
        </motion.nav>

        {/* Course Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/20 dark:border-gray-700/20 mb-6 sm:mb-8"
        >

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">
                <span
                  ref={titleRef}
                  className={`brand-heading-primary hover-gradient-text ${isTitleInViewport ? 'in-viewport' : ''}`}
                  style={{ display: 'inline-block' }}
                >
                  {course?.title || 'Course Exercises'}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                Master Java basics with beginner-friendly exercises and earn XP for every question you solve right
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Beginner Friendly
                </span>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Code className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="text-xs sm:text-sm">{exercises.length} Exercises</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Trophy className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="text-xs sm:text-sm">{exercises.reduce((sum, ex) => sum + ex.xp, 0)} Total XP</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>



        {/* Exercises List */}
        <div className="space-y-4">
          {exercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => handleExerciseClick(exercise)}
              className="group cursor-pointer"
            >
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 sm:p-6 shadow-lg border border-white/20 dark:border-gray-700/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] min-h-[100px] relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 h-full">
                  {/* Exercise Info */}
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-medium text-[#1e3a8a] dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-relaxed">
                        {exercise.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{exercise.estimatedTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          <span>{exercise.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Play Button positioned at top right - Toggle between versions */}
                  {/* VERSION 1: With play button - Uncomment below */}
                  

                  {/* VERSION 2: Without play button - Comment out the above block and this will be the clean version */}

                  {/* Status & Action */}
                  <div className="flex items-start justify-end gap-2 sm:gap-4 flex-shrink-0 mt-1">
                    {exercise.completed && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Upgrade to Club Button - Centered */}
        {(!isAuthenticated || !user?.isClubMember) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={() => navigate('/membership')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              Upgrade to Club
            </button>
          </motion.div>
        )}

        {/* Access Popup */}
        <AccessPopup
          open={showAccessPopup}
          onClose={() => setShowAccessPopup(false)}
        />
      </div>
    </div>
  );
};

export default ExercisesList;
