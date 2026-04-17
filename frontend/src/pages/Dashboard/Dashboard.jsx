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
        <div className="text-center p-8 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 dark:from-[#052152]/75 dark:to-[#072b63]/70 backdrop-blur-xl border border-[#86c4ff]/40 dark:border-[#6fbfff]/30 rounded-2xl shadow-[0_12px_34px_rgba(60,131,246,0.12)]">
          <div className="text-xl text-red-500 mb-4">{error}</div>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] text-[#082a5d] rounded-lg hover:brightness-105 transition-colors">
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
            <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#8ec8ff]/30 dark:border-[#6fbfff]/25 gap-4">
              <div>
                <h1 className="brand-heading-primary font-poppins text-3xl md:text-4xl font-normal tracking-tight leading-none">
                  Welcome back, {userName}.
                </h1>
                <p className="text-xs tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] mt-2">
                  Student Overview
                </p>
              </div>

            </header>

            {/* KPIs Grid (Stats & Streak) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 dark:from-[#052152]/75 dark:to-[#072b63]/70 backdrop-blur-xl border border-[#86c4ff]/40 dark:border-[#6fbfff]/30 p-6 flex flex-col justify-between hover:from-[#ecf8ff] hover:to-[#deefff] dark:hover:from-[#0a2f6f]/85 dark:hover:to-[#0b3677]/80 transition-colors rounded-xl shadow-[0_12px_34px_rgba(60,131,246,0.12)]">
                  <span className="text-[10px] uppercase tracking-widest text-[#4d6f9c] dark:text-[#7fb9e6]">
                    {stat.title}
                  </span>
                  <div className="mt-4 mb-1 flex items-end gap-2">
                    <span className="text-3xl font-normal tracking-tighter text-[#2d7fe8] dark:text-[#8fd9ff]">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5f82ac] dark:text-[#81bde6]">
                    {stat.subtitle}
                  </span>
                </div>
              ))}
            </div>

            {/* Middle Section: Daily Challenge & Mini Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Daily Challenge Highlight (Spans 2 columns) */}
              <div className="lg:col-span-2 relative bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 dark:from-[#052152]/75 dark:to-[#072b63]/70 backdrop-blur-xl border border-[#86c4ff]/40 dark:border-[#6fbfff]/30 p-8 rounded-xl flex flex-col min-h-[300px] overflow-hidden group shadow-[0_12px_34px_rgba(60,131,246,0.12)]">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                  <FiStar className="w-64 h-64" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-xs tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] shrink-0">
                      Daily Challenge
                    </span>
                    <div className="h-[1px] flex-1 bg-[#86c4ff]/35 dark:bg-[#66b6ec]/35"></div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5 rounded-sm">
                        {dailyChallenge.difficulty}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-[#86c4ff]/45 text-[#2d7fe8] dark:text-[#8fd9ff] bg-[#dbf1ff] dark:bg-[#0d366f] rounded-sm">
                        {dailyChallenge.topic}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-medium text-[#0d2a57] dark:text-[#8fd9ff] mb-2">
                      {dailyChallenge.title}
                    </h2>
                    
                    <div className="flex items-center gap-6 mt-6">
                      <div className="flex items-center gap-2 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                        <FiStar className="text-amber-500" />
                        <span>+{dailyChallenge.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                        <FiClock className="text-[#4f7fb7] dark:text-[#7cc3ee]" />
                        <span>~{dailyChallenge.timeEstimate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <button 
                      onClick={() => navigate('/track-templates')}
                      className="bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] text-[#082a5d] px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:brightness-105 flex items-center gap-2"
                    >
                      Start Challenge <FiChevronRight />
                    </button>
                    <span className="text-xs text-[#5f82ac] dark:text-[#81bde6]">Resets in 14h 22m</span>
                  </div>
                </div>
              </div>

              {/* Leaderboard Snippet */}
              <div className="bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 dark:from-[#052152]/75 dark:to-[#072b63]/70 backdrop-blur-xl border border-[#86c4ff]/40 dark:border-[#6fbfff]/30 p-8 rounded-xl flex flex-col min-h-[300px] shadow-[0_12px_34px_rgba(60,131,246,0.12)]">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="text-xs tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6]">
                    Leaderboard
                  </h3>
                  <button onClick={() => navigate('/leaderboard')} className="text-[10px] font-medium text-[#2d7fe8] dark:text-[#8fd9ff] hover:underline">
                    View Full
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col justify-between gap-2">
                  {leaderboardMock.map((student) => (
                    <div
                      key={student.rank}
                      className={`flex items-center gap-4 py-2 px-3 -mx-3 rounded-lg transition-colors ${
                        student.isUser ? 'bg-[#dbf1ff] dark:bg-[#0d366f] border border-[#86c4ff]/40 dark:border-[#6fbfff]/30' : 'hover:bg-[#edf7ff]/75 dark:hover:bg-[#0a2f6f]/55'
                      }`}
                    >
                      <div className={`w-5 text-sm font-medium text-right shrink-0 ${
                        student.rank === 1 ? 'text-amber-500' : student.rank === 2 ? 'text-slate-400' : student.rank === 3 ? 'text-amber-700' : 'text-black/30 dark:text-white/30'
                      }`}>
                        #{student.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${student.isUser ? 'text-[#2d7fe8] dark:text-[#8fd9ff]' : 'text-[#0d2a57] dark:text-[#8fd9ff]'}`}>
                          {student.name}
                        </h4>
                      </div>
                      <div className="text-xs font-semibold text-[#4c6f9a] dark:text-[#7fb8e2] shrink-0">
                        {student.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Recent Exercises */}
            <div className="bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 dark:from-[#052152]/75 dark:to-[#072b63]/70 backdrop-blur-xl border border-[#86c4ff]/40 dark:border-[#6fbfff]/30 p-8 rounded-xl flex flex-col shadow-[0_12px_34px_rgba(60,131,246,0.12)]">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xs tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6]">
                  Recent Activity & Exercises
                </h3>
                <button onClick={() => navigate('/learn/exercises')} className="text-[10px] font-medium text-[#2d7fe8] dark:text-[#8fd9ff] hover:underline">
                  View All History
                </button>
              </div>

              {(!recentExercises || recentExercises.length === 0) ? (
                 <div className="py-12 flex flex-col items-center justify-center border border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 rounded-lg border-dashed bg-[#edf7ff]/60 dark:bg-[#0a2f6f]/35">
                    <p className="text-xs tracking-widest uppercase text-[#5f82ac] dark:text-[#81bde6]">
                      No recent activity recorded
                    </p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentExercises.slice(0, 3).map((exercise, i) => (
                    <div 
                      key={i} 
                      className="p-5 border border-[#86c4ff]/40 dark:border-[#6fbfff]/30 bg-[#edf7ff]/75 dark:bg-[#0a2f6f]/45 hover:bg-[#f4fbff] dark:hover:bg-[#0b3677]/55 transition-colors rounded-xl cursor-pointer group flex flex-col justify-between min-h-[140px]"
                      onClick={() => navigate(`/learn/exercises/${exercise.courseId}/${exercise.id}`)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] uppercase tracking-widest text-[#4d6f9c] dark:text-[#7fb9e6]">
                            {exercise.courseTitle || 'Course'}
                          </span>
                          <span className="text-[10px] uppercase font-medium text-[#2d7fe8] dark:text-[#8fd9ff]">
                            +{exercise.xp || 0} XP
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-[#0d2a57] dark:text-[#8fd9ff] group-hover:text-[#2d7fe8] dark:group-hover:text-[#96ddff] transition-colors line-clamp-2">
                          {exercise.title || 'Untitled Exercise'}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-4 border-t border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 pt-3">
                        <span className="text-[10px] text-[#5f82ac] dark:text-[#81bde6] flex items-center gap-1">
                          <FiTrendingUp /> Completed
                        </span>
                        <FiChevronRight className="text-[#6f8fb8] dark:text-[#7fb9e6] group-hover:text-[#2d7fe8] dark:group-hover:text-[#96ddff] transition-colors" />
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