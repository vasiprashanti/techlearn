import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Dashboard/Sidebar';
import LoadingScreen from '../../components/Loader/Loader3D';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { FiChevronRight, FiClock, FiStar, FiTrendingUp, FiTarget } from 'react-icons/fi';

// --- CUSTOM RETRO PIXEL SVGs ---
const PixelStar = () => (
  <svg width="36" height="36" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixel-icon">
    <path d="M4 0h2v2H4V0zM2 2h2v2H2V2zM6 2h2v2H6V2zM0 4h10v2H0V4zM2 6h2v2H2V6zM6 6h2v2H6V6zM4 8h2v2H4V8z" fill="#FFD700" />
    <path d="M4 2h2v6H4V2zM2 4h6v2H2V4z" fill="#FFF2AC" />
  </svg>
);

const PixelQuestion = () => (
  <svg width="36" height="36" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixel-icon">
    <rect width="10" height="10" fill="#4FB7FF" />
    <path d="M2 2h6v2H8v2H7V5H5v2H4V5H2V2zm2 6h4v1H4V8z" fill="white" />
    <circle cx="5" cy="3" r="1" fill="white" />
    <rect x="1" y="1" width="8" height="8" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
  </svg>
);

const PixelDiamond = () => (
  <svg width="36" height="36" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixel-icon">
    <path d="M4 0h2v2h2v2h2v2H8v2H6v2H4V8H2V6H0V4h2V2h2V0z" fill="#00E5FF" />
    <path d="M4 2h2v2H4V2zm2 2h2v2H6V4z" fill="white" fillOpacity="0.5" />
  </svg>
);

const PixelFlame = () => (
  <svg width="36" height="36" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixel-icon">
    <path d="M3 0h4v1H7v1H6v1H5v1H4V3H3V0zm0 3h1v1H3V3zm4 0h1v1H7V3zm-3 2h1v1H4V5zm2 0h1v1H6V5zm-3 2h1v1H3V7zm4 0h1v1H7V7zm-2 2h2v1H5V9z" fill="#FF4D00" />
    <path d="M4 2h2v1H4V2zm1 3h1v3H5V5z" fill="#FFD700" />
    <path d="M4.5 1h1v2h-1V1z" fill="#FF8C00" />
  </svg>
);

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const {
    user,
    isLoading,
    error,
    xp,
    recentExercises,
    progress: contextProgress,
    isReady
  } = useUser();
  
  const { logout } = useAuth(); 

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

  // --- RETRO DATA CONFIG ---
  const retroStats = [
    { title: "Course Progress", value: "68%", icon: <PixelDiamond />, color: "#00E5FF" },
    { title: "Total Solved", value: progress.completed.toString(), icon: <PixelQuestion />, color: "#50E3C2" },
    { title: "Total XP", value: progress.xp.toLocaleString(), icon: <PixelStar />, color: "#FFD700" },
    { title: "Day Streak", value: "12", icon: <PixelFlame />, color: "#FF8C00" }
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
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Retro Styles Scoped to the Widget - Importing BOTH fonts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://cdn.jsdelivr.net/gh/neodbg/neodunggeunmo/build/webfont/neodunggeunmo.css');
        
        .font-press-start { font-family: 'Press Start 2P', cursive; line-height: 1.5; }
        .font-arcade { font-family: 'NeoDunggeunmo', monospace; line-height: 1.5; }
        
        .pixel-icon { filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.4)); image-rendering: pixelated; }
        .pixel-container.dark-mode {
          background: #050a18;
          border: 4px solid #1a2b6d;
          box-shadow: 8px 8px 0px rgba(0,0,0,0.5);
        }
        .pixel-container.light-mode {
          background: #ffffff;
          border: 4px solid #3C83F6;
          box-shadow: 8px 8px 0px rgba(60, 131, 246, 0.2);
        }
      `}} />

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
        {/* Unified Background */}
        <div className={`fixed inset-0 -z-10 transition-colors duration-300 ${
            isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"
          }`}
        />

        {/* SIDEBAR */}
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 transition-all duration-300 ease-in-out z-10 
            ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
            pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* HEADER */}
            <header className="flex items-center justify-between pb-6 gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                {/* Header now uses Press Start 2P - Adjusted text sizes to fit the wider font natively */}
               <h1 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white truncate">
  Welcome back, {userName}.
</h1>
              </div>

              {/* Right Side Header Controls */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-shrink-0">
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {isDarkMode ? "Light" : "Dark"}
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                  >
                    {userInitial}
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Profile Header */}
                        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">
                              {userInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-black dark:text-white truncate">
                                {userName}
                              </h3>
                              <p className="text-xs text-black/60 dark:text-white/60 truncate">
                                {user?.email || 'student@techlearn.com'}
                              </p>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-white/10 dark:text-white border border-[#3C83F6]/20 dark:border-white/20">
                                  Student
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              navigate('/profile');
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">My Profile</div>
                              <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                            </div>
                          </button>

                          <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10"></div>

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              logout();
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Log Out</div>
                              <div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out securely</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* --- REPLACED: NEW RETRO KPI GRID --- */}
            <div className={`pixel-container p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 rounded-xl transition-colors duration-300 ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
              {retroStats.map((stat, i) => (
                <div key={i} className="flex items-center gap-6 group hover:translate-x-1 transition-transform">
                  <div className="shrink-0">{stat.icon}</div>
                  <div className="flex flex-col mt-1">
                    {/* Numbers use Press Start 2P */}
                    <span 
                      className="font-press-start text-lg md:text-xl" 
                      style={{ color: isDarkMode ? stat.color : '#0f172a' }}
                    >
                      {stat.value}
                    </span>
                    {/* Labels use Arcade font */}
                    <span 
                      className="text-[12px] font-arcade mt-2 uppercase tracking-widest" 
                      style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                    >
                      {stat.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle Section: Daily Challenge & Mini Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Daily Challenge Highlight (Spans 2 columns) */}
              <div className="lg:col-span-2 relative bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px] overflow-hidden group">
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
                      onClick={() => {
                        const courseIds = [
                          '6890c2acbc09eb4b5c346b9b', // C Programming
                          '6890ec81950225df57310f52', // Python  
                          '6890f09830551d88a325f623'  // Core Java
                        ]; 
                        const randomCourseId = courseIds[Math.floor(Math.random() * courseIds.length)];
                        navigate(`/learn/exercises/${randomCourseId}`);
                      }}
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