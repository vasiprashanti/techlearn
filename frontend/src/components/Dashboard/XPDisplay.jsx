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
      const courseXP = data.courseXP ? Object.values(data.courseXP).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0) : 0;
      const exerciseXP = data.exerciseXP ? Object.values(data.exerciseXP).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0) : 0;
      const totalXP = courseXP + exerciseXP;
      setXpData({
        points: totalXP,
        loading: false,
        error: null
      });
    } catch (err) {
      setXpData({
        points: 0,
        loading: false,
        error: 'Failed to sync'
      });
    }
  };

  useEffect(() => {
    fetchXP();
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleXPUpdate = () => fetchXP();
    window.addEventListener('xpUpdated', handleXPUpdate);
    return () => window.removeEventListener('xpUpdated', handleXPUpdate);
  }, [isAuthenticated]);

  const displayPoints = points !== 0 ? points : xpData.points;
  const displayLoading = loading || xpData.loading;
  const displayError = error || xpData.error;

  return (
    <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 flex flex-col justify-between h-full min-h-[240px]">
      <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
        Total Experience
      </h3>

      <div className="mt-8 mb-4">
        {displayLoading ? (
          <div className="text-6xl font-light tracking-tighter text-black/20 dark:text-white/20 animate-pulse">000</div>
        ) : displayError ? (
          <div className="text-sm tracking-widest text-red-500 uppercase">Error</div>
        ) : (
          <div className="text-7xl font-light tracking-tighter text-black dark:text-white">
            {displayPoints.toLocaleString()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-black/10 dark:bg-white/10"></div>
        <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
          Points
        </p>
      </div>
    </div>
  );
};

export default XPDisplay;