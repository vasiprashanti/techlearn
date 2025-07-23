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

  useEffect(() => {
    const handleXPUpdate = () => {
      fetchXP();
    };

    window.addEventListener('xpUpdated', handleXPUpdate);
    return () => window.removeEventListener('xpUpdated', handleXPUpdate);
  }, [isAuthenticated]);

  const displayPoints = points !== 0 ? points : xpData.points;
  const displayLoading = loading || xpData.loading;
  const displayError = error || xpData.error;

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 p-6 flex flex-col items-center justify-start space-y-4 rounded-xl h-full text-light-text dark:text-dark-text shadow-md">
      <h3 className="text-lg font-semibold font-poppins text-gray-600 dark:text-gray-400 hover-gradient-text">
        XP Points
      </h3>

      {displayLoading ? (
        <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent animate-pulse">
          ...
        </div>
      ) : displayError ? (
        <div className="text-4xl font-bold text-red-500">Error</div>
      ) : (
        <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
          {displayPoints.toLocaleString()}
        </div>
      )}

      <p className="text-sm text-light-text/70 dark:text-dark-text/70">
        {displayError ? 'Failed to load points' : 'Points collected'}
      </p>
    </div>
  );
};

export default XPDisplay;