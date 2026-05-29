import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Clock,
  Star,
  TrendingUp,
} from 'lucide-react';
import Sidebar from '../../components/Dashboard/Sidebar';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import leaderboardApi from '../../services/leaderboardApi';
import { dailyChallengeAPI } from '../../services/dailyChallengeApi';
import heroBg from '../../assets/hero-bg-dashboard.webp';

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

  const {
    user,
    isLoading,
    error,
    xp,
    recentExercises,
    progress: contextProgress,
    isReady,
    latestDailyChallenge,
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

      loadLeaderboard();
      loadChallenge();
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
    {
      title: 'Last Accuracy',
      value: latestDailyChallenge ? `${latestDailyChallenge.accuracy || 0}%` : '--',
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
            .font-press-start { font-family: "Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.5; font-weight: 700; }
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
          className={`flex flex-1 flex-col items-center transition-all duration-300 ease-in-out z-10 lg:ml-[90px] pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-full max-w-[640px] space-y-6">
            {error && !error.includes('authentication') ? (
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                Some dashboard details are still syncing. You can keep using the page while we retry in the background.
              </div>
            ) : null}

            {/* Daily Challenge Card at the Top (Full Width) */}
            <div className="rounded-2xl flex flex-col justify-end relative overflow-hidden p-6 sm:p-8 md:p-10 min-h-[320px] shadow-lg mt-4 border border-white/10 group">
              <div
                className="absolute inset-0 z-0 scale-102 group-hover:scale-100 transition-transform duration-500 ease-out"
                style={{
                  backgroundImage: `url(${heroBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

              <div className="z-10 flex flex-col items-start text-left w-full mt-auto space-y-4 text-white">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[9px] sm:text-[10px] font-semibold text-white bg-white/16 backdrop-blur-md px-3 py-1 border border-white/20 rounded-full flex items-center gap-1.5 sm:gap-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{todayFormatted}</span>
                    <span className="opacity-65 text-[8px] sm:text-[9px] tracking-[0.22em] uppercase font-bold shrink-0">IST</span>
                  </span>
                  <span className="text-[8px] sm:text-[9px] tracking-[0.24em] uppercase font-bold text-white bg-rose-500/72 backdrop-blur-md px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    Resets in 14h 22m
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight drop-shadow-md leading-tight">
                  {dailyChallenge.title}
                </h1>

                {challengeLoading ? (
                  <div className="w-full max-w-xl space-y-3 pt-1">
                    <PlaceholderBar className="h-4 w-full" />
                    <PlaceholderBar className="h-4 w-5/6" />
                    <div className="flex items-center gap-5 pt-2">
                      <PlaceholderBar className="h-4 w-24" />
                      <PlaceholderBar className="h-4 w-20" />
                    </div>
                    <PlaceholderBar className="mt-4 h-11 w-40 rounded-lg bg-white/25 dark:bg-white/15" />
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] sm:text-sm text-white/90 max-w-xl leading-relaxed font-light drop-shadow-sm">
                      {dailyChallenge.prompt}
                    </p>

                    <div className="flex flex-wrap items-center gap-5 pt-2 w-full">
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <Star className="text-amber-400 w-4 h-4" />
                        <span>+{dailyChallenge.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <Clock className="text-sky-300 w-4 h-4" />
                        <span>~{dailyChallenge.timeEstimate}</span>
                      </div>
                      {latestDailyChallenge ? (
                        <div className="flex items-center gap-2 text-sm text-white font-medium">
                          <TrendingUp className="text-emerald-300 w-4 h-4" />
                          <span>Last accuracy: {latestDailyChallenge.accuracy || 0}%</span>
                        </div>
                      ) : null}
                    </div>

                    <button
                      onClick={() => navigate('/dashboard/daily-challenge')}
                      className="mt-2 bg-white text-[#0a1128] hover:bg-slate-100 active:bg-slate-200 px-6 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 transform hover:-translate-y-0.5 shadow-md"
                    >
                      Go To Challenge <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats and Leaderboard side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 md:p-6 rounded-xl flex flex-col h-full min-h-[240px] justify-between">
                <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                  <h3 className="font-press-start text-[10px] tracking-widest text-black/60 dark:text-white/70">LEADERBOARD</h3>
                  <button onClick={() => navigate('/leaderboard')} className="text-[10px] font-medium text-[#3C83F6] dark:text-blue-400 hover:underline">
                    View Full
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-around gap-2">
                  {leaderboardLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={`leaderboard-loading-${index}`}
                          className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-lg"
                        >
                          <PlaceholderBar className="h-3 w-7" />
                          <PlaceholderBar className="h-4 flex-1 rounded-md" />
                          <PlaceholderBar className="h-3 w-16" />
                        </div>
                      ))
                    : featuredLeaderboard.map((student) => (
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
              </div>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 md:p-6 rounded-xl flex flex-col h-full min-h-[240px] justify-between">
                <div className="flex items-center justify-between mb-4 md:mb-5 shrink-0">
                  <h3 className="font-press-start text-[10px] tracking-widest text-black/60 dark:text-white/70">STATS</h3>
                  <span className="font-press-start text-[10px] tracking-widest text-black/60 dark:text-white/70">OVERVIEW</span>
                </div>

                <div className="grid grid-cols-2 gap-y-6 md:gap-y-8 gap-x-4 my-auto px-2 md:px-6">
                  {retroStats.map((stat) => (
                    <div key={stat.title} className="flex flex-col items-start text-left gap-2">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 scale-90 md:scale-100 origin-left">{stat.icon}</div>
                        <span className="font-press-start text-sm md:text-base text-black dark:text-white truncate">{stat.value}</span>
                      </div>
                      <span className="text-[9px] md:text-[10px] text-black/40 dark:text-white/40 font-semibold tracking-widest uppercase mt-0.5">{stat.title}</span>
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

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`exercise-loading-${index}`}
                      className="p-5 border border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20 rounded-xl min-h-[140px] animate-pulse"
                    >
                      <PlaceholderBar className="h-3 w-20" />
                      <PlaceholderBar className="mt-4 h-4 w-full rounded-md" />
                      <PlaceholderBar className="mt-2 h-4 w-4/5 rounded-md" />
                      <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-3">
                        <PlaceholderBar className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !recentExercises || recentExercises.length === 0 ? (
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
                          <TrendingUp className="w-3 h-3" /> Completed
                        </span>
                        <ChevronRight className="text-black/30 dark:text-white/30 group-hover:text-[#3C83F6] dark:group-hover:text-white transition-colors" />
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
