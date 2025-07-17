import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { progressAPI } from '../../services/api';

const XPDisplay = ({ points = 0, loading = false, error = null }) => {
  const { user, isAuthenticated } = useAuth();
  const [xpData, setXpData] = useState({
    points: 0,
    loading: true,
    error: null
  });

  const fetchXP = async () => {
    if (!isAuthenticated) {
      setXpData({ points: 0, loading: false, error: null });
      return;
    }

    try {
      const data = await progressAPI.getUserProgress();
      const totalXP = (data.totalCourseXP || 0) + (data.totalExerciseXP || 0);
      setXpData({
        points: totalXP,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching XP:', err);
      setXpData({
        points: 0,
        loading: false,
        error: 'Failed to load points'
      });
    }
  };

  useEffect(() => {
    fetchXP();
  }, [isAuthenticated, user]);

  // Listen for XP updates from quiz completions
  useEffect(() => {
    const handleXPUpdate = () => {
      fetchXP();
    };

    window.addEventListener('xpUpdated', handleXPUpdate);
    return () => window.removeEventListener('xpUpdated', handleXPUpdate);
  }, [isAuthenticated]);

  // Use props if they're provided (for controlled usage), otherwise use internal state
  const displayPoints = points !== 0 ? points : xpData.points;
  const displayLoading = loading || xpData.loading;
  const displayError = error || xpData.error;

  return (
    <div className="glass-panel p-6 flex flex-col items-center justify-center rounded-xl h-full text-light-text dark:text-dark-text">
      <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
        XP Points
      </h3>
      
      {displayLoading ? (
        <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent mt-2 animate-pulse">
          ...
        </div>
      ) : displayError ? (
        <div className="text-4xl font-bold text-red-500 mt-2">Error</div>
      ) : (
        <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent mt-2">
          {displayPoints.toLocaleString()} {/* Formats number with commas */}
        </div>
      )}
      
      <p className="text-sm text-light-text/70 dark:text-dark-text/70 mt-1">
        {displayError ? 'Failed to load points' : 'Points collected'}
      </p>
    </div>
  );
};

export default XPDisplay;