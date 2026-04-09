import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Dashboard/Sidebar';
import LoadingScreen from '../../components/Loader/Loader3D';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { FiChevronRight, FiClock, FiStar, FiTrendingUp, FiTarget } from 'react-icons/fi';

export default function Dashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    user,
    isLoading,
    error,
    xp,
    recentExercises,
    progress: contextProgress,
    isReady
  } = useUser();
  
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  const progress = useMemo(() => {
    if (!contextProgress) return { xp: 0, completed: 0, total: 0 };
    return {
      xp: Math.max(0, xp || 0),
      completed: contextProgress.completedExercises || 0,
      total: contextProgress.totalExercises || 0,
    };
  }, [contextProgress, xp]);

  // --- Mock Data for UI (Replace with your API data) ---
  const stats = [
    { title: "Total XP", value: progress.xp.toLocaleString(), subtitle: "Global Rank: #402" },
    { title: "Current Streak", value: "12", subtitle: "Days in a row " },
    { title: "Problems Solved", value: progress.completed.toString(), subtitle: `Out of ${progress.total || 150} available` },
    { title: "Course Progress", value: "68%", subtitle: "Data Structures Track" }
  ];

  const dailyChallenge = {
    title: "Reverse Nodes in k-Group",
    difficulty: "Hard",
    topic: "Linked Lists",
    xpReward: 250,
    timeEstimate: "45 mins"
  };

  const leaderboardMock = [
    { rank: 1, name: "Alex Chen", score: "14,250", isUser: false },
    { rank: 2, name: "Sarah Jenkins", score: "13,900", isUser: false },
    { rank: 3, name: "Michael Ross", score: "13,120", isUser: false },
    { rank: 4, name: user?.firstName || "You", score: progress.xp.toLocaleString(), isUser: true },
    { rank: 5, name: "David Kim", score: "11,800", isUser: false },
  ];

  if (isLoading || !isReady) {
    return <LoadingScreen showMessage={true} fullScreen={true} size={40} duration={800} />;
  }

  if (error && !error.includes('authentication')) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="text-center p-8 bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl">
          <div className="text-xl text-red-500 mb-4">{error}</div>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#3C83F6] text-white rounded-lg hover:bg-blue-600 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const userName = user?.firstName ? user.firstName : 'Student';
  return (
    <>
      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
        {/* Unified Background matches Admin */}
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
            isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 transition-all duration-700 ease-in-out z-10 
            ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
          pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Header Section with Profile & Theme Toggle */}
            <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white">
                  Welcome back, {userName}.
                </h1>
                <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2">
                  Student Overview
                </p>
              </div>

            </header>

            {/* KPIs Grid (Stats & Streak) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-black/60 transition-colors rounded-xl">
                  <span className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">
                    {stat.title}
                  </span>
                  <div className="mt-4 mb-1 flex items-end gap-2">
                    <span className="text-3xl font-normal tracking-tighter text-[#3C83F6] dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-[10px] text-black/40 dark:text-white/40">
                    {stat.subtitle}
                  </span>
                </div>
              ))}
            </div>

            {/* Middle Section: Daily Challenge & Mini Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Daily Challenge Highlight (Spans 2 columns) */}
              <div className="lg:col-span-2 relative bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px] overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                  <FiStar className="w-64 h-64" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 shrink-0">
                      Daily Challenge
                    </span>
                    <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/5"></div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5 rounded-sm">
                        {dailyChallenge.difficulty}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-[#3C83F6]/20 text-[#3C83F6] dark:text-blue-400 bg-[#3C83F6]/5 rounded-sm">
                        {dailyChallenge.topic}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-medium text-black dark:text-white mb-2">
                      {dailyChallenge.title}
                    </h2>
                    
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                        <FiStar className="text-amber-500" />
                        <span>+{dailyChallenge.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                        <FiClock className="text-[#3C83F6] dark:text-white" />
                        <span>~{dailyChallenge.timeEstimate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button 
                      onClick={() => navigate('/track-templates')}
                      className="bg-[#3C83F6] hover:bg-blue-600 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      Start Challenge <FiChevronRight />
                    </button>
                    <span className="text-xs text-black/40 dark:text-white/40">Resets in 14h 22m</span>
                  </div>
                </div>
              </div>

              {/* Leaderboard Snippet */}
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
                    Leaderboard
                  </h3>
                  <button onClick={() => navigate('/leaderboard')} className="text-[10px] font-medium text-[#3C83F6] dark:text-blue-400 hover:underline">
                    View Full
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col justify-between gap-2">
                  {leaderboardMock.map((student) => (
                    <div
                      key={student.rank}
                      className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-lg transition-colors ${
                        student.isUser ? 'bg-[#3C83F6]/10 dark:bg-white/10 border border-[#3C83F6]/20 dark:border-white/20' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-5 text-sm font-medium text-right shrink-0 ${
                        student.rank === 1 ? 'text-amber-500' : student.rank === 2 ? 'text-slate-400' : student.rank === 3 ? 'text-amber-700' : 'text-black/30 dark:text-white/30'
                      }`}>
                        #{student.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${student.isUser ? 'text-[#3C83F6] dark:text-white' : 'text-black dark:text-white'}`}>
                          {student.name}
                        </h4>
                      </div>
                      <div className="text-xs font-semibold text-black/70 dark:text-white/70 shrink-0">
                        {student.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Recent Exercises */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
                  Recent Activity & Exercises
                </h3>
                <button onClick={() => navigate('/learn/exercises')} className="text-[10px] font-medium text-[#3C83F6] dark:text-blue-400 hover:underline">
                  View All History
                </button>
              </div>

              {(!recentExercises || recentExercises.length === 0) ? (
                 <div className="py-12 flex flex-col items-center justify-center border border-black/5 dark:border-white/5 rounded-lg border-dashed">
                    <p className="text-xs tracking-widest uppercase text-black/30 dark:text-white/30">
                      No recent activity recorded
                    </p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentExercises.slice(0, 3).map((exercise, i) => (
                    <div 
                      key={i} 
                      className="p-5 border border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 transition-colors rounded-xl cursor-pointer group flex flex-col justify-between min-h-[140px]"
                      onClick={() => navigate(`/learn/exercises/${exercise.courseId}/${exercise.id}`)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40">
                            {exercise.courseTitle || 'Course'}
                          </span>
                          <span className="text-[10px] uppercase font-medium text-[#3C83F6] dark:text-white">
                            +{exercise.xp || 0} XP
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-black dark:text-white group-hover:text-[#3C83F6] transition-colors line-clamp-2">
                          {exercise.title || 'Untitled Exercise'}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-4 border-t border-black/5 dark:border-white/5 pt-3">
                        <span className="text-[10px] text-black/50 dark:text-white/50 flex items-center gap-1">
                          <FiTrendingUp /> Completed
                        </span>
                        <FiChevronRight className="text-black/30 dark:text-white/30 group-hover:text-[#3C83F6] dark:group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}