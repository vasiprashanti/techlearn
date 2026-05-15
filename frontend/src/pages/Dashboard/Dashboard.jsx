import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronRight,
  FiClock,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';
import Sidebar from '../../components/Dashboard/Sidebar';
import AvatarPickerModal from '../../components/Dashboard/AvatarPickerModal';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import leaderboardApi from '../../services/leaderboardApi';
import { dailyChallengeAPI } from '../../services/dailyChallengeApi';
import heroBg from '../../assets/hero-bg.jpg';

const ICON_XP = '/dashboard_svgs/Xp%20star.png';
const ICON_SOLVED = '/dashboard_svgs/solved-question.png';
const ICON_PROGRESS = '/dashboard_svgs/progress-arrow%20(1).png';
const ICON_STREAK = '/dashboard_svgs/streak%20flame.png';

const PlaceholderBar = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-full bg-white/20 dark:bg-white/10 ${className}`}
    aria-hidden="true"
  />
);

export default function Dashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [challengeLoading, setChallengeLoading] = useState(true);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState(() => [
    { label: "Finish today's Daily Challenge", done: false },
    { label: 'Solve 2 practice exercises', done: false },
    { label: 'Review notes for 15 minutes', done: false },
    { label: 'Update your profile details', done: false },
    { label: 'Check leaderboard rank', done: false },
  ]);

  const {
    user,
    isLoading,
    error,
    xp,
    recentExercises,
    progress: contextProgress,
    isReady,
    latestDailyChallenge,
    updateUser,
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
            setLeaderboardEntries(leaderboardResponse?.entries || []);
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
            setActiveChallenge(challengeResponse?.data || null);
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

  const completionPercent = progress.total
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const dayStreak = Number.isFinite(Number(user?.streak)) ? Number(user?.streak) : 0;
  const instituteName =
    user?.collegeName ||
    user?.college ||
    user?.university ||
    user?.institute ||
    '';
  const avatarUrl = user?.avatar || user?.photoUrl || user?.avatarUrl || '';
  const resolvedAvatarUrl = avatarUrl || '/profile_avatars/avatar1.png';

  const handleSaveAvatar = async (nextAvatarUrl) => {
    if (!nextAvatarUrl || isSavingAvatar) return;

    setIsSavingAvatar(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      if (token) {
        const response = await fetch(`${apiBase}/auth/avatar`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar: nextAvatarUrl }),
        });

        if (!response.ok) {
          throw new Error('Failed to update avatar');
        }

        await response.json().catch(() => null);
      }

      // Keep backward compatibility with any UI still reading photoUrl
      updateUser({ avatar: nextAvatarUrl, photoUrl: nextAvatarUrl });
      setIsSelectingAvatar(false);
    } catch (saveError) {
      console.error(saveError);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const toggleTodayTask = (taskLabel) => {
    setTodaysTasks((tasks) =>
      tasks.map((task) =>
        task.label === taskLabel ? { ...task, done: !task.done } : task
      )
    );
  };

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
            .font-press-start { font-family: 'Press Start 2P', cursive; line-height: 1.5; }
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
          className={`flex-1 transition-all duration-300 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[20rem]'} pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
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

                <div className="z-10 flex flex-col items-start text-left w-full mt-auto space-y-2.5 md:space-y-4 text-white">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white bg-white/16 backdrop-blur-md px-3 py-1 border border-white/20 rounded-full flex items-center gap-1.5 sm:gap-2">
                      <FiClock className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{todayFormatted}</span>
                      <span className="opacity-65 text-[8px] sm:text-[9px] tracking-[0.22em] uppercase font-bold shrink-0">IST</span>
                    </span>
                    <span className="text-[8px] sm:text-[9px] tracking-[0.24em] uppercase font-bold text-white bg-rose-500/72 backdrop-blur-md px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      Resets in 14h 22m
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-md leading-tight">
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
                      <p className="text-[13px] sm:text-sm text-white max-w-xl line-clamp-3 pb-1 drop-shadow-sm">
                        {dailyChallenge.prompt}
                      </p>

                      <div className="flex items-center gap-5 mt-1.5">
                        <div className="flex items-center gap-2 text-sm text-white">
                          <FiStar className="text-amber-400" />
                          <span>+{dailyChallenge.xpReward} XP</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white">
                          <FiClock className="text-sky-300" />
                          <span>~{dailyChallenge.timeEstimate}</span>
                        </div>
                        {latestDailyChallenge ? (
                          <div className="flex items-center gap-2 text-sm text-white">
                            <FiTrendingUp className="text-emerald-300" />
                            <span>Last accuracy: {latestDailyChallenge.accuracy || 0}%</span>
                          </div>
                        ) : null}
                      </div>

                      <button
                        onClick={() => navigate('/dashboard/daily-challenge')}
                        className="mt-3 bg-white text-[#0a1128] px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 flex items-center gap-2"
                      >
                        Start Challenge <FiChevronRight />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 h-full">
                <div
                  className={`p-5 md:p-6 rounded-xl flex flex-col ${
                    isDarkMode
                      ? 'bg-[#020b23]/90 dark:bg-black/40 backdrop-blur-xl border border-white/10 dark:border-white/5 text-white'
                      : 'bg-white/40 backdrop-blur-xl border border-black/5 text-slate-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative w-12 h-12 shrink-0">
                        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                          <img
                            src={resolvedAvatarUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-press-start text-[14px] md:text-[16px] uppercase tracking-wider truncate">
                          {userDisplayName}
                        </p>
                        {instituteName ? (
                          <p className={`text-xs truncate mt-1 ${isDarkMode ? 'text-white/70' : 'text-black/60'}`}>
                            {instituteName}
                          </p>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard/profile/edit')}
                          className="mt-2 text-xs font-medium text-[#3C83F6] dark:text-blue-400 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-6">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 scale-[0.75] origin-left">
                        <img src={ICON_XP} alt="XP" className="w-9 h-9 object-contain [image-rendering:pixelated]" draggable={false} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-press-start text-sm md:text-base leading-none">
                          {progress.xp.toLocaleString()}
                        </p>
                        <p className="text-[10px] tracking-[0.22em] uppercase text-black/50 dark:text-white/70 mt-1">
                          Total XP
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0 scale-[0.75] origin-left">
                        <img src={ICON_SOLVED} alt="Solved" className="w-9 h-9 object-contain [image-rendering:pixelated]" draggable={false} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-press-start text-sm md:text-base leading-none">
                          {progress.completed.toLocaleString()}
                        </p>
                        <p className="text-[10px] tracking-[0.22em] uppercase text-black/50 dark:text-white/70 mt-1">
                          Total Solved
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0 scale-[0.75] origin-left">
                        <img src={ICON_PROGRESS} alt="Progress" className="w-9 h-9 object-contain [image-rendering:pixelated]" draggable={false} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-press-start text-sm md:text-base leading-none">
                          {completionPercent}%
                        </p>
                        <p className="text-[10px] tracking-[0.22em] uppercase text-black/50 dark:text-white/70 mt-1">
                          Progress
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="shrink-0 scale-[0.75] origin-left">
                        <img src={ICON_STREAK} alt="Streak" className="w-9 h-9 object-contain [image-rendering:pixelated]" draggable={false} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-press-start text-sm md:text-base leading-none">
                          {dayStreak}
                        </p>
                        <p className="text-[10px] tracking-[0.22em] uppercase text-black/50 dark:text-white/70 mt-1">
                          Day streak
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/profile')}
                    className={`mt-6 self-center w-auto px-6 font-press-start text-[10px] tracking-[0.22em] uppercase py-3 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-dark-bg-mid hover:bg-dark-bg-end border border-white/15'
                        : 'bg-secondary-blue text-white hover:bg-secondary-blue/90 shadow-sm'
                    }`}
                  >
                    View Profile
                  </button>
                </div>

                <AvatarPickerModal
                  isOpen={isSelectingAvatar}
                  currentAvatar={resolvedAvatarUrl}
                  onClose={() => (isSavingAvatar ? null : setIsSelectingAvatar(false))}
                  onSave={handleSaveAvatar}
                />

                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 md:p-6 rounded-xl flex flex-col flex-1">
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
              </div>
            </div>

            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-4 md:p-8 rounded-xl flex flex-col">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">Today's Tasks</h3>
              </div>

              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <label
                    key={task.label}
                    className="flex items-center gap-3 p-3 rounded-lg border border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTodayTask(task.label)}
                      className="h-4 w-4 accent-[#3C83F6]"
                    />
                    <span className="text-sm text-black/80 dark:text-white/80">{task.label}</span>
                  </label>
                ))}
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
