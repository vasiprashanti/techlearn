import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Clock,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import Sidebar from '../../components/Dashboard/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import leaderboardApi from '../../services/leaderboardApi';
import { dailyChallengeAPI } from '../../services/dailyChallengeApi';
import { practiceAPI } from '../../services/practiceApi';
import heroBg from '../../assets/hero-bg-dashboard.webp';
import pixelArrowImg from '../../assets/pixel-arrow.png';
import pixelFlameImg from '../../assets/pixel-flame.png';
import pixelQuestionImg from '../../assets/pixel-question.png';
import pixelStarImg from '../../assets/pixel-star.png';

const DASHBOARD_HIGHLIGHTS_CACHE_KEY = 'techlearn-dashboard-highlights-cache-v1';
const DASHBOARD_HIGHLIGHTS_CACHE_TTL_MS = 5 * 60 * 1000;

const readDashboardHighlightsCache = () => {
  try {
    const raw = localStorage.getItem(DASHBOARD_HIGHLIGHTS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !parsed?.data) return null;
    if (Date.now() - parsed.timestamp > DASHBOARD_HIGHLIGHTS_CACHE_TTL_MS) return null;

    return parsed.data;
  } catch {
    return null;
  }
};

const writeDashboardHighlightsCache = (partialData) => {
  try {
    const current = readDashboardHighlightsCache() || {};
    localStorage.setItem(
      DASHBOARD_HIGHLIGHTS_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: {
          ...current,
          ...partialData,
        },
      })
    );
  } catch {
    // Cache is only used to improve perceived load time.
  }
};

const PixelStar = () => (
  <img src={pixelStarImg} alt="Star XP" className="w-[50px] h-[50px] object-contain select-none" style={{ imageRendering: 'pixelated' }} />
);

const PixelQuestion = () => (
  <img src={pixelQuestionImg} alt="Solved" className="w-[50px] h-[50px] object-contain select-none" style={{ imageRendering: 'pixelated' }} />
);

const PixelFlame = () => (
  <img src={pixelFlameImg} alt="Streak" className="w-[50px] h-[50px] object-contain select-none" style={{ imageRendering: 'pixelated' }} />
);

const PixelArrow = () => (
  <img src={pixelArrowImg} alt="Arrow" className="w-[60px] h-[60px] object-contain select-none" style={{ imageRendering: 'pixelated' }} />
);

const PlaceholderBar = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-full bg-white/20 dark:bg-white/10 ${className}`}
    aria-hidden="true"
  />
);

export default function Dashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [cachedHighlights] = useState(() => readDashboardHighlightsCache());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState(cachedHighlights?.leaderboardEntries || []);
  const [activeChallenge, setActiveChallenge] = useState(cachedHighlights?.activeChallenge || null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(!cachedHighlights?.leaderboardEntries);
  const [challengeLoading, setChallengeLoading] = useState(!cachedHighlights?.activeChallenge);
  const [dailyTasks, setDailyTasks] = useState([
    { id: 1, text: "Solve today's Daily Challenge", completed: false },
    { id: 2, text: "Complete at least 1 DSA problem", completed: false },
    { id: 3, text: "Review SQL or Core CS concepts", completed: false },
    { id: 4, text: "Check your place on the Leaderboard", completed: false }
  ]);

  const toggleTask = (id) => {
    setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedTasks = dailyTasks.filter(t => t.completed).length;
  const totalTasks = dailyTasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const [streak, setStreak] = useState(0);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState(null);

  const handleAvatarSelect = async (avatarUrl) => {
    setIsSelectingAvatar(false);
    try {
      const storedUser = JSON.parse(localStorage.getItem("userData"));
      if (!storedUser || !storedUser.id) return;

      const userId = storedUser.id;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/users/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ photoUrl: avatarUrl }),
        }
      );

      if (!res.ok) throw new Error("Failed to update avatar");

      await res.json();

      // Update localStorage with new photoUrl
      const updatedUser = { ...storedUser, photoUrl: avatarUrl };
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      
      // Refresh UserContext state
      if (refetchUserData) {
        await refetchUserData();
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  const {
    user,
    isLoading,
    error,
    xp,
    recentExercises,
    progress: contextProgress,
    isReady,
    latestDailyChallenge,
    refetchUserData,
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
      const loadLeaderboard = async () => {
        try {
          const leaderboardResponse = await leaderboardApi.getLeaderboard(5);
          if (!cancelled) {
            const entries = leaderboardResponse?.entries || [];
            setLeaderboardEntries(entries);
            writeDashboardHighlightsCache({ leaderboardEntries: entries });
          }
        } catch {
          if (!cancelled) {
            setLeaderboardEntries([]);
          }
        } finally {
          if (!cancelled) {
            setLeaderboardLoading(false);
          }
        }
      };

      const loadChallenge = async () => {
        try {
          const challengeResponse = await dailyChallengeAPI.getActive();
          if (!cancelled) {
            const challenge = challengeResponse?.data || null;
            setActiveChallenge(challenge);
            writeDashboardHighlightsCache({ activeChallenge: challenge });
          }
        } catch {
          if (!cancelled) {
            setActiveChallenge(null);
          }
        } finally {
          if (!cancelled) {
            setChallengeLoading(false);
          }
        }
      };
      const loadStats = async () => {
        try {
          const stats = await practiceAPI.getStats();
          if (!cancelled && stats?.streak !== undefined) {
            setStreak(stats.streak);
          }
        } catch {}
      };

      loadLeaderboard();
      loadChallenge();
      loadStats();
    };

    loadDashboardHighlights();

    return () => {
      cancelled = true;
    };
  }, []);

  const userDisplayName =
    user?.name?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email?.split('@')[0] ||
    'Student';

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('userData')) || {};
    } catch {
      return {};
    }
  }, []);
  const displayUser = user || storedUser;
  const photoUrl = displayUser?.photoUrl || "/profile_avatars/avatar1.png";
  const collegeName = displayUser?.collegeName || "TechLearn Student";

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const retroStats = [
    { title: 'Total XP', value: progress.xp.toLocaleString(), icon: <PixelStar /> },
    { title: 'Total Solved', value: progress.completed.toString(), icon: <PixelQuestion /> },
    {
      title: 'Progress',
      value: `${progress.total ? Math.round((progress.completed / progress.total) * 100) : 0}%`,
      icon: <PixelArrow />,
    },
    {
      title: 'Day streak',
      value: streak.toString(),
      icon: <PixelFlame />,
    },
  ];

  const dailyChallenge = {
    title: 'Daily Challenge',
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

  if (!isReady) {
    return null;
  }

  const showBlockingError = error && !error.includes('authentication') && !user;

  if (showBlockingError) {
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
            .font-press-start { font-family: "Press Start 2P", "Courier New", monospace; line-height: 1.6; }
            .pixel-icon { filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.4)); image-rendering: pixelated; }
          `,
        }}
      />

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-300 ${
            isDarkMode ? 'bg-[#020816]' : 'bg-gradient-to-br from-[#bceaff] via-[#9adfff] to-[#bceaff]'
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          className={`flex flex-1 flex-col items-center transition-all duration-300 ease-in-out z-10 lg:ml-[90px] pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-full max-w-[1400px] space-y-8">
            {error && !error.includes('authentication') ? (
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                Some dashboard details are still syncing. You can keep using the page while we retry in the background.
              </div>
            ) : null}

            {/* Row 1 Grid: Daily Challenge (left) and Daily Tasks (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Daily Challenge Card - Spans 7 columns for wider visual width */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="rounded-xl flex flex-col justify-between relative overflow-hidden p-5 sm:p-6 md:p-8 min-h-[220px] lg:h-[240px] shadow-lg border border-[#15366f]/45 group">
                  <div
                    className="absolute inset-0 z-0 scale-102 group-hover:scale-100 transition-transform duration-500 ease-out"
                    style={{
                      backgroundImage: `url(${heroBg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

                  {/* Top Header Row */}
                  <div className="z-10 flex items-center justify-between gap-2 w-full shrink-0">
                    <h1 className="font-press-start text-[9px] sm:text-[11px] md:text-[13px] tracking-wider text-white drop-shadow-md leading-tight whitespace-nowrap">
                      Daily Challenge
                    </h1>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-press-start text-[4.5px] sm:text-[5px] md:text-[6px] text-white bg-white/16 backdrop-blur-md px-1.5 py-0.5 border border-white/20 rounded-full flex items-center gap-0.5">
                        <Clock className="w-2 h-2 shrink-0" />
                        <span className="whitespace-nowrap relative top-[0.7px]">{todayFormatted}</span>
                      </span>
                      <span className="font-press-start text-[4.5px] sm:text-[5px] md:text-[6px] tracking-[0.24em] uppercase font-bold text-white bg-rose-500/72 backdrop-blur-md px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                        Resets in 14h 22m
                      </span>
                    </div>
                  </div>

                  {/* Middle / Bottom Content */}
                  <div className="z-10 flex flex-col items-start text-left w-full mt-4 sm:mt-5 space-y-3 text-white">
                    {challengeLoading ? (
                      <div className="w-full max-w-xl space-y-2.5 pt-1">
                        <PlaceholderBar className="mt-3 h-10 w-36 rounded-lg bg-white/25 dark:bg-white/15" />
                      </div>
                    ) : (
                      <>
                        {/* Button at bottom right */}
                        <div className="flex w-full justify-end pt-1">
                          <button
                            onClick={() => navigate('/dashboard/daily-challenge')}
                            className="bg-white text-[#0a1128] hover:bg-slate-100 active:bg-slate-200 px-4 py-2.5 rounded-xl font-press-start text-[8px] md:text-[9px] font-bold transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5 shadow-md"
                          >
                            Go to Daily challenge <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-3.5 sm:p-4 rounded-xl flex flex-col justify-between min-h-[220px] lg:h-[240px]">
                {/* Header */}
                <div className="flex items-center justify-between shrink-0 mb-1">
                  <div className="flex items-center gap-1.5">
                    {/* Pixel checklist icon indicator */}
                    <span className={`w-1.5 h-1.5 rounded-sm inline-block animate-pulse shadow-md transition-colors duration-300 ${
                      taskProgress === 100 ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-[#3C83F6] dark:bg-[#8fd9ff] shadow-[0_0_8px_#3C83F6]'
                    }`} />
                    <h3 className="font-press-start text-[11px] md:text-[13px] tracking-wider text-black/70 dark:text-[#8fd9ff]">DAILY TASKS</h3>
                  </div>
                  <span className="font-press-start text-[9px] md:text-[10px] text-[#3C83F6] dark:text-[#E0B0FF] bg-[#3C83F6]/10 dark:bg-white/10 px-1.5 py-0.5 rounded shadow-sm">
                    {completedTasks}/{totalTasks}
                  </span>
                </div>

                {/* Task List */}
                <div className="flex-1 flex flex-col gap-0.5 justify-center my-0.5">
                  {dailyTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center justify-between w-full text-left py-1.5 px-2 rounded-xl transition-all duration-300 transform active:scale-98 group hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Beautiful custom pixel checkbox - Rounded-none to make it a square */}
                        <div className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 transition-all duration-300 ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_6px_#10B981]'
                            : 'border-black/20 dark:border-white/20 bg-white/40 dark:bg-black/40 group-hover:border-[#3C83F6] shadow-inner'
                        }`}>
                          {task.completed && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        {/* Task text */}
                        <span className={`font-press-start text-[8px] md:text-[9.5px] truncate transition-all duration-300 ${
                          task.completed
                            ? 'line-through text-black/30 dark:text-white/30'
                            : 'text-black/80 dark:text-white/95'
                        }`}>
                          {task.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Premium Retro Neon Progress Bar */}
                <div className="mt-1 shrink-0 pt-1 border-t border-black/5 dark:border-white/5 w-full">
                  <div className="flex justify-between items-center text-[7px] font-bold text-black/55 dark:text-white/55 font-press-start mb-0.5">
                    <span>PROGRESS</span>
                    <span className="text-[#3C83F6] dark:text-[#8fd9ff]">{taskProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/10 dark:bg-black/50 rounded-full overflow-hidden p-0.5 border border-black/5 dark:border-white/10 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        taskProgress === 100 
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_8px_#10B981]' 
                          : 'bg-gradient-to-r from-[#3C83F6] to-[#00d2ff] shadow-[0_0_6px_#3C83F6]'
                      }`}
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Row 2 Grid: Leaderboard and Stats Card (Reduced Height: lg:h-[310px] / min-h-[290px]) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              
              {/* Leaderboard Card */}
              <div className="border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-5 md:p-6 rounded-xl flex flex-col h-full min-h-[290px] lg:h-[310px] justify-between">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h3 className="font-press-start text-[11px] md:text-[13px] tracking-wider text-black/70 dark:text-[#8fd9ff]">LEADERBOARD</h3>
                  <button onClick={() => navigate('/leaderboard')} className="font-press-start text-[8px] md:text-[9.5px] text-[#3C83F6] dark:text-blue-400 hover:underline">
                    View Full
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-around gap-1 py-1">
                  {leaderboardLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={`leaderboard-loading-${index}`}
                          className="flex items-center gap-2.5 py-1 px-2 -mx-2 rounded-lg"
                        >
                          <PlaceholderBar className="h-2.5 w-6" />
                          <PlaceholderBar className="h-3 flex-1 rounded-md" />
                          <PlaceholderBar className="h-2.5 w-12" />
                        </div>
                      ))
                    : featuredLeaderboard.map((student) => (
                        <div
                          key={student.userId}
                          className={`flex items-center gap-2.5 py-1 px-2 -mx-2 rounded-xl transition-colors ${
                            student.isUser ? 'bg-[#3C83F6]/10 dark:bg-white/10 border border-[#3C83F6]/20 dark:border-white/20' : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div
                            className={`w-9 font-press-start text-[10px] md:text-xs text-right shrink-0 ${
                              student.rank === 1 ? 'text-amber-500' : student.rank === 2 ? 'text-slate-400' : student.rank === 3 ? 'text-amber-700' : 'text-black/40 dark:text-white/40'
                            }`}
                          >
                            #{student.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-press-start text-[10px] md:text-xs truncate ml-2 leading-relaxed ${student.isUser ? 'text-[#3C83F6] dark:text-white' : 'text-black dark:text-white'}`}>
                              {student.name}
                            </h4>
                          </div>
                          <div className="font-press-start text-[10px] md:text-xs text-[#8A2BE2] dark:text-[#E0B0FF] shrink-0">
                            {student.totalXp.toLocaleString()}
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Stats Overview Card - Reduced Height and Matched Fonts */}
              <div className="border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-5 md:p-6 rounded-xl flex flex-col h-full min-h-[290px] lg:h-[310px] justify-between relative">
                
                {/* Top Section: Avatar left, Name/College right - centered and shifted slightly left */}
                <div className="flex items-center justify-center gap-4 shrink-0 w-full pl-2 md:pl-4">
                  {/* Left Column: Avatar + Edit Link */}
                  <div className="flex flex-col items-center shrink-0">
                    <img
                      src={photoUrl}
                      alt="Avatar"
                      className="w-16 h-16 object-contain select-none"
                    />
                    <button
                      onClick={() => {
                        setPendingAvatar(photoUrl);
                        setIsSelectingAvatar(true);
                      }}
                      className="font-press-start text-[7px] md:text-[8px] text-[#00113b] dark:text-[#8fd9ff] hover:underline mt-1 leading-none transition-colors"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Right Column: Name & College */}
                  <div className="text-left pl-1">
                    <h2 className="font-press-start text-[10px] md:text-xs lg:text-sm text-[#00113b] dark:text-[#8fd9ff] uppercase tracking-wide">
                      {userDisplayName}
                    </h2>
                    <p className="font-press-start text-[8px] md:text-[9.5px] text-[#00113b]/70 dark:text-[#81bde6] mt-1 font-medium leading-relaxed">
                      {collegeName}
                    </p>
                  </div>
                </div>

                {/* Middle Section: 2x2 Stats Grid (Icon left, Text right) */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 px-2 py-2 flex-1 items-center w-full justify-items-start pl-6 md:pl-10">
                  {retroStats.map((stat) => (
                    <div key={stat.title} className="flex items-center gap-2.5">
                      <div className="shrink-0 scale-75 md:scale-90">{stat.icon}</div>
                      <div className="flex flex-col text-left">
                        <span className="font-press-start text-[10px] md:text-xs text-[#00113b] dark:text-white leading-tight">{stat.value}</span>
                        <span className="font-press-start text-[7.5px] md:text-[8.5px] text-[#00113b]/70 dark:text-[#81bde6] mt-0.5 whitespace-nowrap font-medium">{stat.title}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Section: capsule View Profile Button */}
                <div className="pt-1 shrink-0">
                  <button
                    onClick={() => navigate('/dashboard/profile')}
                    className="px-6 py-2 bg-[#00113b] dark:bg-[#00113b] text-white hover:brightness-110 active:scale-98 rounded-xl font-press-start text-[8px] font-bold tracking-wider transition-all shadow-md flex items-center justify-center mx-auto w-fit"
                  >
                    VIEW PROFILE
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Section: Recent Activity & Exercises */}
            <div className="border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-4 md:p-5 rounded-xl flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="font-press-start text-[11px] md:text-[13px] tracking-wider text-black/70 dark:text-[#8fd9ff]">Recent Activity & Exercises</h3>
                <button onClick={() => navigate('/learn/exercises')} className="font-press-start text-[8px] md:text-[9.5px] text-[#3C83F6] dark:text-blue-400 hover:underline">
                  View All History
                </button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`exercise-loading-${index}`}
                      className="p-4 border border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20 rounded-xl min-h-[110px] animate-pulse"
                    >
                      <PlaceholderBar className="h-3 w-20" />
                      <PlaceholderBar className="mt-3 h-3.5 w-full rounded-md" />
                      <PlaceholderBar className="mt-2 h-3.5 w-4/5 rounded-md" />
                      <div className="mt-6 border-t border-black/5 dark:border-white/5 pt-2">
                        <PlaceholderBar className="h-2.5 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !recentExercises || recentExercises.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center border border-black/5 dark:border-white/5 rounded-lg border-dashed">
                  <p className="font-press-start text-[8px] md:text-[9.5px] tracking-widest uppercase text-black/30 dark:text-white/30">No recent activity recorded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentExercises.slice(0, 3).map((exercise, index) => (
                    <div
                      key={`${exercise.id || exercise.title}-${index}`}
                      className="p-4 border border-black/5 dark:border-[#15366f]/40 bg-white/20 dark:bg-[#020b23]/30 hover:bg-white/40 dark:hover:bg-[#020b23]/60 transition-all duration-300 rounded-xl cursor-pointer group flex flex-col justify-between min-h-[110px] hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => navigate(`/learn/exercises/${exercise.courseId}/${exercise.id}`)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-press-start text-[7px] md:text-[8px] uppercase tracking-widest text-black/40 dark:text-[#7fb8e2]">
                            {exercise.courseTitle || 'Course'}
                          </span>
                          <span className="font-press-start text-[7px] md:text-[8px] uppercase font-medium text-[#3C83F6] dark:text-[#8fd9ff]">
                            +{exercise.xp || 0} XP
                          </span>
                        </div>
                        <h4 className="font-press-start text-[10px] md:text-xs text-black dark:text-white group-hover:text-[#3C83F6] dark:group-hover:text-[#96ddff] transition-colors line-clamp-2 leading-relaxed">
                          {exercise.title || 'Untitled Exercise'}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-3 border-t border-black/5 dark:border-white/5 pt-2">
                        <span className="font-press-start text-[7.5px] md:text-[8.5px] text-black/50 dark:text-white/50 flex items-center gap-1">
                          <TrendingUp className="w-2.5 h-2.5 text-emerald-500 shrink-0" /> Completed
                        </span>
                        <ChevronRight className="text-black/30 dark:text-white/30 group-hover:text-[#3C83F6] dark:group-hover:text-white transition-colors w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Avatar Picker Modal */}
      {isSelectingAvatar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="relative w-full max-w-md bg-white dark:bg-[#0a1128] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setIsSelectingAvatar(false)}
              className="absolute top-4 right-4 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-press-start text-[10px] tracking-wider text-[#0d2a57] dark:text-[#8fd9ff] mb-4 text-center">
              CHOOSE YOUR AVATAR
            </h3>

            <div className="grid grid-cols-4 gap-4 my-6">
              {Array.from({ length: 8 }, (_, i) => {
                const avatarUrl = `/profile_avatars/avatar${i + 1}.png`;
                const isSelected = avatarUrl === (pendingAvatar || photoUrl);
                return (
                  <button
                    key={i}
                    onClick={() => setPendingAvatar(avatarUrl)}
                    className={`relative aspect-square rounded-xl overflow-hidden p-1 transition-all ${
                      isSelected 
                        ? "bg-gradient-to-br from-[#3C83F6] to-[#2563eb] scale-105 shadow-md border border-[#3C83F6]" 
                        : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    <img 
                      src={avatarUrl} 
                      alt={`Avatar ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg bg-white dark:bg-[#020b23]"
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setIsSelectingAvatar(false)}
                className="px-4 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAvatarSelect(pendingAvatar || photoUrl)}
                className="px-4 py-2 bg-[#3C83F6] text-white rounded-xl text-xs font-semibold hover:bg-blue-600 transition-all disabled:opacity-50"
                disabled={!pendingAvatar || pendingAvatar === photoUrl}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
