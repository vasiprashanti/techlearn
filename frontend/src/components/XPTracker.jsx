import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { progressAPI } from '../services/api';

const XPTracker = ({ className = '', showDetailed = true }) => {
  const { user, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState({
    totalCourseXP: 0,
    totalExerciseXP: 0,
    courseXP: {},
    exerciseXP: {}
  });
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      console.log('XPTracker: Fetching progress using progressAPI...');
      const data = await progressAPI.getUserProgress();
      console.log('XPTracker: Received data:', data);
      setProgress(data);
    } catch (error) {
      console.error('XPTracker: Error fetching user progress:', error);
      // Default values on error
      setProgress({
        totalCourseXP: 0,
        totalExerciseXP: 0,
        courseXP: {},
        exerciseXP: {}
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [isAuthenticated, user]);

  // Listen for XP updates from quiz completions
  useEffect(() => {
    const handleXPUpdate = () => {
      console.log('XP updated, refreshing tracker...');
      fetchProgress();
    };

    window.addEventListener('xpUpdated', handleXPUpdate);
    return () => window.removeEventListener('xpUpdated', handleXPUpdate);
  }, [isAuthenticated]);

  const totalXP = (progress.totalCourseXP || 0) + (progress.totalExerciseXP || 0);
  const level = Math.floor(totalXP / 100) + 1;
  const xpToNextLevel = (level * 100) - totalXP;
  const levelProgress = ((totalXP % 100) / 100) * 100;

  const getXPBadgeColor = (xp) => {
    if (xp >= 500) return 'from-purple-500 to-pink-500';
    if (xp >= 300) return 'from-blue-500 to-cyan-500';
    if (xp >= 100) return 'from-green-500 to-emerald-500';
    return 'from-gray-500 to-gray-600';
  };

  if (!isAuthenticated) {
    return null; // Don't show anything when not logged in
  }

  if (loading) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/20 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/20 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${getXPBadgeColor(totalXP)} text-white`}>
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Level {level}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {xpToNextLevel} XP to next level
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {totalXP}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total XP</div>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Level {level}</span>
          <span>Level {level + 1}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full bg-gradient-to-r ${getXPBadgeColor(totalXP)}`}
          />
        </div>
      </div>

      {/* XP Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {/* Course XP */}
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Courses</span>
          </div>
          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {progress.totalCourseXP}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">XP</div>
        </div>

        {/* Exercise XP */}
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Exercises</span>
          </div>
          <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
            {progress.totalExerciseXP}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">XP</div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-2">
          {totalXP >= 100 && (
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
          )}
          {totalXP >= 300 && (
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white" />
            </div>
          )}
          {totalXP >= 500 && (
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Trophy className="w-3 h-3 text-white" />
            </div>
          )}
          {totalXP < 100 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Earn 100 XP to unlock achievements
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default XPTracker;
