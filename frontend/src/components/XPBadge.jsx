import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Star, Target, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { progressAPI } from '../services/api';

const XPBadge = () => {
  const { user, isAuthenticated } = useAuth();
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [progress, setProgress] = useState({
    totalCourseXP: 0,
    totalExerciseXP: 0,
    courseXP: {},
    exerciseXP: {}
  });
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const fetchXP = async () => {
    if (!isAuthenticated) {
      console.log('XPBadge: User not authenticated, skipping XP fetch');
      setLoading(false);
      return;
    }

    console.log('XPBadge: Fetching XP data using progressAPI...');
    try {
      const data = await progressAPI.getUserProgress();
      console.log('XPBadge: Received data:', data);
      const total = (data.totalCourseXP || 0) + (data.totalExerciseXP || 0);
      console.log('XPBadge: Calculated total XP:', total);
      setTotalXP(total);
      setProgress(data);
    } catch (error) {
      console.error('XPBadge: Error fetching XP:', error);
      setTotalXP(0);
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
    fetchXP();
  }, [isAuthenticated, user]);

  // Listen for XP updates from quiz completions
  useEffect(() => {
    const handleXPUpdate = () => {
      console.log('XP updated, refreshing badge...');
      fetchXP();
    };

    window.addEventListener('xpUpdated', handleXPUpdate);
    return () => window.removeEventListener('xpUpdated', handleXPUpdate);
  }, [isAuthenticated]);

  const getXPLevel = () => {
    if (totalXP >= 1000) return {
      level: 'Expert',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50/80 dark:bg-purple-900/20',
      borderColor: 'border-purple-200/50 dark:border-purple-700/30',
      gradientColor: 'from-purple-500 to-pink-500',
      icon: Trophy
    };
    if (totalXP >= 500) return {
      level: 'Advanced',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50/80 dark:bg-blue-900/20',
      borderColor: 'border-blue-200/50 dark:border-blue-700/30',
      gradientColor: 'from-blue-500 to-cyan-500',
      icon: Star
    };
    if (totalXP >= 200) return {
      level: 'Intermediate',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50/80 dark:bg-green-900/20',
      borderColor: 'border-green-200/50 dark:border-green-700/30',
      gradientColor: 'from-green-500 to-emerald-500',
      icon: Star
    };
    return {
      level: 'Beginner',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50/80 dark:bg-amber-900/20',
      borderColor: 'border-amber-200/50 dark:border-amber-700/30',
      gradientColor: 'from-amber-500 to-orange-500',
      icon: Trophy
    };
  };

  const level = Math.floor(totalXP / 100) + 1;
  const xpToNextLevel = (level * 100) - totalXP;
  const levelProgress = ((totalXP % 100) / 100) * 100;

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse">
        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  const levelInfo = getXPLevel();
  const Icon = levelInfo.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 ${levelInfo.bgColor} backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-105 cursor-pointer border ${levelInfo.borderColor} opacity-70 hover:opacity-90`}
        title="Click to view XP breakdown"
      >
        <Icon className={`w-4 h-4 ${levelInfo.color}`} />
        <span className={`text-sm font-medium ${levelInfo.color}`}>
          {totalXP} XP
        </span>
        <span className={`text-xs ${levelInfo.color} opacity-75`}>
          {levelInfo.level}
        </span>
        <ChevronDown className={`w-3 h-3 ${levelInfo.color} transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/30 z-50 overflow-hidden"
          >
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${levelInfo.gradientColor} text-white mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Level {level}</h3>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {totalXP} <span className="text-sm font-medium text-gray-600 dark:text-gray-400">XP</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {xpToNextLevel} XP to next level
                  </p>
                </div>

                {/* Level Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span>Level {level}</span>
                    <span>Level {level + 1}</span>
                  </div>
                  <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-2 rounded-full bg-gradient-to-r ${levelInfo.gradientColor}`}
                    />
                  </div>
                </div>

                {/* XP Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Course XP */}
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl border border-white/20 dark:border-gray-700/20">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Courses</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {progress.totalCourseXP}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">XP</div>
                  </div>

                  {/* Exercise XP */}
                  <div className="text-center p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-xl border border-white/20 dark:border-gray-700/20">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Exercises</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {progress.totalExerciseXP}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">XP</div>
                  </div>
                </div>

                {/* Achievement Badges */}
                <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                    Achievements
                  </h4>
                  <div className="flex items-center justify-center gap-3">
                    {totalXP >= 100 && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">First 100</span>
                      </div>
                    )}
                    {totalXP >= 300 && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Rising Star</span>
                      </div>
                    )}
                    {totalXP >= 500 && (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Champion</span>
                      </div>
                    )}
                    {totalXP < 100 && (
                      <div className="text-center py-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Earn 100 XP to unlock your first achievement!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default XPBadge;
