import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronRight,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiTarget,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import Sidebar from '../../components/Dashboard/Sidebar';
import LoadingScreen from '../../components/Loader/Loader3D';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import leaderboardApi from '../../services/leaderboardApi';
import { dailyChallengeAPI } from '../../services/dailyChallengeApi';
import heroBg from '../../assets/hero-bg.jpg';

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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);

  const {
    user,
    isLoading,
    error,
    xp,
    recentExercises,
    progress: contextProgress,
    isReady,
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

  useEffect(() => {
    let cancelled = false;

    const loadDashboardHighlights = async () => {
      try {
        const [leaderboardResponse, challengeResponse] = await Promise.all([
          leaderboardApi.getLeaderboard(5),
          dailyChallengeAPI.getActive(),
        ]);

        if (cancelled) return;

        setLeaderboardEntries(leaderboardResponse?.entries || []);
        setActiveChallenge(challengeResponse?.data || null);
      } catch (loadError) {
        if (!cancelled) {
          setLeaderboardEntries([]);
          setActiveChallenge(null);
        }
      }
    };

    loadDashboardHighlights();

    return () => {
      cancelled = true;
    };
  }, []);

  const userName = user?.firstName ? user.firstName : 'Student';
  const userInitial = userName.charAt(0).toUpperCase();
  const userDisplayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || 'Student';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const retroStats = [
    { title: 'Total XP', value: progress.xp.toLocaleString(), icon: <PixelStar /> },
    { title: 'Total Solved', value: progress.completed.toString(), icon: <PixelQuestion /> },
    {
      title: 'Completion',
      value: `${progress.total ? Math.round((progress.completed / progress.total) * 100) : 0}%`,
      icon: <PixelDiamond />,
    },
    { title: 'Day Streak', value: activeChallenge ? 'Live' : '12', icon: <PixelFlame /> },
  ];

  const dailyChallenge = {
    title: activeChallenge?.questionTitle || activeChallenge?.title || 'No active challenge yet',
    difficulty: activeChallenge?.difficulty || 'Daily',
    topic: activeChallenge?.trackType || 'Challenge',
    xpReward: activeChallenge?.xpReward || activeChallenge?.points || 0,
    timeEstimate: activeChallenge?.durationMinutes ? `${activeChallenge.durationMinutes} mins` : '--',
    prompt:
      activeChallenge?.description ||
      activeChallenge?.summary ||
      "Gear up for today's algorithmic puzzle. Submit your solution within the time limit to earn bonus XP and maintain your streak.",
  };

  const featuredLeaderboard = leaderboardEntries.length
    ? leaderboardEntries.slice(0, 5).map((entry) => ({
        rank: entry.rank,
        name: entry.name,
        totalXp: Number(entry.totalXp || 0),
        isUser: entry.name === userDisplayName,
        userId: entry.userId || `${entry.rank}-${entry.name}`,
      }))
    : [
        {
          rank: '--',
          name: 'Leaderboard will update once learners earn XP',
          totalXp: 0,
          isUser: false,
          userId: 'empty',
        },
      ];

  if (isLoading || !isReady) {
    return <LoadingScreen showMessage={true} fullScreen={true} size={40} duration={800} />;
  }

  if (error && !error.includes('authentication')) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="text-center p-8 bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl">
          <div className="text-xl text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#3C83F6] text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            .font-press-start { font-family: 'Press Start 2P', cursive; line-height: 1.5; }
            .pixel-icon { filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.4)); image-rendering: pixelated; }
          `,
        }}
      />

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-300 ${
            isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          className={`flex-1 transition-all duration-300 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="flex items-center justify-between pb-6 gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white truncate">
                  Welcome back, {userName}.
                </h1>
                <p className="text-[10px] tracking-[0.25em] uppercase text-black/40 dark:text-white/40 mt-2">
                  Student Overview
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-shrink-0">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen((open) => !open)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                  >
                    {userInitial}
                  </button>

                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">
                              {userInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-black dark:text-white truncate">{userDisplayName}</h3>
                              <p className="text-xs text-black/60 dark:text-white/60 truncate">{user?.email || 'student@techlearn.com'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              navigate('/dashboard/profile');
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors">
                              <FiTarget className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium">My Profile</div>
                              <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                            </div>
                          </button>
                          <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10" />
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              logout();
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                              <FiChevronRight className="w-4 h-4" />
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-2 rounded-2xl flex flex-col justify-end relative overflow-hidden p-6 sm:p-8 md:p-10 min-h-[45vh] md:min-h-[350px] shadow-sm">
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url(${heroBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: '65% center',
                  }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

                <div className="z-10 flex flex-col items-start text-left w-full mt-auto space-y-2.5 md:space-y-4">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1 md:mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-white/95 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-1.5 border border-white/30 rounded-full flex items-center gap-1.5 sm:gap-2">
                      <FiClock className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{todayFormatted}</span>
                      <span className="opacity-70 text-[9px] sm:text-[10px] tracking-widest uppercase font-bold shrink-0">IST</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-bold text-white bg-rose-500/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                      Resets in 14h 22m
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-white/25 text-white bg-white/10 rounded-sm">
                      {dailyChallenge.difficulty}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-sky-300/40 text-sky-100 bg-sky-400/15 rounded-sm">
                      {dailyChallenge.topic}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-md leading-tight">
                    {dailyChallenge.title}
                  </h1>

                  <p className="text-xs sm:text-sm md:text-base text-white/80 max-w-xl line-clamp-3 pb-1 md:pb-2 drop-shadow-sm">
                    {dailyChallenge.prompt}
                  </p>

                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <FiStar className="text-amber-400" />
                      <span>+{dailyChallenge.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <FiClock className="text-sky-300" />
                      <span>~{dailyChallenge.timeEstimate}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/dashboard/daily-challenge')}
                    className="mt-3 bg-white text-[#0a1128] px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 flex items-center gap-2"
                  >
                    Start Challenge <FiChevronRight />
                  </button>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 md:p-6 rounded-xl flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                  <h3 className="font-press-start text-[10px] tracking-widest text-black/60 dark:text-white/70">LEADERBOARD</h3>
                  <button onClick={() => navigate('/leaderboard')} className="text-[10px] font-medium text-[#3C83F6] dark:text-blue-400 hover:underline">
                    View Full
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                  {featuredLeaderboard.map((student) => (
                    <div
                      key={student.userId}
                      className={`flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg transition-colors ${
                        student.isUser ? 'bg-[#3C83F6]/10 dark:bg-white/10 border border-[#3C83F6]/20 dark:border-white/20' : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`w-6 font-press-start text-[10px] text-right shrink-0 ${
                          student.rank === 1 ? 'text-amber-500' : student.rank === 2 ? 'text-slate-400' : student.rank === 3 ? 'text-amber-700' : 'text-black/40 dark:text-white/40'
                        }`}
                      >
                        #{student.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-press-start text-[8px] md:text-[10px] truncate ml-2 leading-loose ${student.isUser ? 'text-[#3C83F6] dark:text-white' : 'text-black dark:text-white'}`}>
                          {student.name}
                        </h4>
                      </div>
                      <div className="font-press-start text-[8px] md:text-[10px] text-[#8A2BE2] dark:text-[#E0B0FF] shrink-0">
                        {student.totalXp.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-y-4 md:gap-y-6 gap-x-2 mt-6">
                  {retroStats.map((stat) => (
                    <div key={stat.title} className="flex flex-col items-center text-center gap-1.5 md:gap-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="shrink-0 scale-[0.70] origin-center">{stat.icon}</div>
                        <span className="font-press-start text-xs md:text-sm text-black dark:text-white truncate">{stat.value}</span>
                      </div>
                      <span className="text-[10px] text-black/60 dark:text-white/60 font-medium tracking-wide uppercase">{stat.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 md:p-8 rounded-xl flex flex-col">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">Recent Activity & Exercises</h3>
                <button onClick={() => navigate('/learn/exercises')} className="text-[10px] font-medium text-[#3C83F6] dark:text-blue-400 hover:underline">
                  View All History
                </button>
              </div>

              {!recentExercises || recentExercises.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center border border-black/5 dark:border-white/5 rounded-lg border-dashed">
                  <p className="text-xs tracking-widest uppercase text-black/30 dark:text-white/30">No recent activity recorded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentExercises.slice(0, 3).map((exercise, index) => (
                    <div
                      key={`${exercise.id || exercise.title}-${index}`}
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
