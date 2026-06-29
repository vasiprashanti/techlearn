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
import { getStudentActiveProject, toggleStudentProjectTask } from '../../api/project';
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
  <img src={pixelStarImg} alt="Star XP" className="w-9 h-9 object-contain select-none" style={{ imageRendering: 'pixelated' }} />
);

const PixelQuestion = () => (
  <img src={pixelQuestionImg} alt="Solved" className="w-9 h-9 object-contain select-none" style={{ imageRendering: 'pixelated' }} />
);

const PixelFlame = () => (
  <img src={pixelFlameImg} alt="Streak" className="w-9 h-9 object-contain select-none" style={{ imageRendering: 'pixelated' }} />
);

const PixelArrow = () => (
  <img src={pixelArrowImg} alt="Arrow" className="w-9 h-9 object-contain select-none" style={{ imageRendering: 'pixelated' }} />
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
  const [dailyTasks, setDailyTasks] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [isFullyCompleted, setIsFullyCompleted] = useState(false);
  const [taskProgress, setTaskProgress] = useState(0);
  
  // Student project states
  const [hasActiveProject, setHasActiveProject] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [advancementModal, setAdvancementModal] = useState({ isOpen: false, completedDay: 1, nextDay: 2 });
  
  // Optimistic UI updates states
  const [pendingToggles, setPendingToggles] = useState(new Set());
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const loadProjectData = async () => {
    try {
      const res = await getStudentActiveProject();
      if (res && res.success && res.dashboardMode === "project" && res.hasActiveProject) {
        setHasActiveProject(true);
        setProjectData(res);
      } else {
        setHasActiveProject(false);
        setProjectData(null);
      }
    } catch (error) {
      console.error("Failed to load project data:", error);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleProjectTaskToggle = async (taskId) => {
    if (pendingToggles.has(taskId)) return;

    const task = projectData?.todayTasks?.find((t) => t.id === taskId);
    if (!task) return;

    // Capture previous state for rollback
    const previousProjectData = { ...projectData };
    const previousStreak = streak;

    // Invert the task completion state optimistically
    const nextCompletedState = !task.completed;

    const updatedTasks = projectData.todayTasks.map((t) =>
      t.id === taskId ? { ...t, completed: nextCompletedState } : t
    );

    const newCompletedToday = nextCompletedState
      ? projectData.projectCompletedToday + 1
      : Math.max(0, projectData.projectCompletedToday - 1);

    const newProgressPercent = projectData.projectTotalToday > 0
      ? Math.round((newCompletedToday / projectData.projectTotalToday) * 100)
      : 0;

    const newXpEarned = nextCompletedState
      ? projectData.projectXpEarned + (task.xp || 0)
      : Math.max(0, projectData.projectXpEarned - (task.xp || 0));

    // Optimistically update projectData
    setProjectData((prev) => ({
      ...prev,
      todayTasks: updatedTasks,
      projectCompletedToday: newCompletedToday,
      projectDayProgress: newProgressPercent,
      projectXpEarned: newXpEarned,
    }));

    // Optimistically update streak if this completes the last task of the day
    const isDayFullyCompletedBefore = projectData.projectCompletedToday === projectData.projectTotalToday;
    const isDayFullyCompletedAfter = newCompletedToday === projectData.projectTotalToday;
    if (!isDayFullyCompletedBefore && isDayFullyCompletedAfter) {
      setStreak((prev) => prev + 1);
    } else if (isDayFullyCompletedBefore && !isDayFullyCompletedAfter) {
      setStreak((prev) => Math.max(0, prev - 1));
    }

    // Set pending state
    setPendingToggles((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    try {
      const currentDayBefore = projectData?.assignment?.current_day || 1;
      const res = await toggleStudentProjectTask(taskId);
      if (res && res.success) {
        if (res.dayAdvanced) {
          setAdvancementModal({ isOpen: true, completedDay: currentDayBefore, nextDay: res.currentDay });
        }
        await loadProjectData();
      } else {
        throw new Error(res?.message || "Failed to update task.");
      }
    } catch (err) {
      console.error("Failed to toggle project task:", err);
      // Rollback to previous state on error
      setProjectData(previousProjectData);
      setStreak(previousStreak);
      setToast({
        show: true,
        message: err.message || "Could not save progress. Please check your connection.",
        type: "error",
      });
    } finally {
      // Clear pending state
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const loadTodayTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/daily-task/today`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload?.success && payload?.data) {
          const list = (payload.data.tasks || []).map((t) => ({
            id: t.questionId,
            text: t.title,
            type: t.taskType,
            completed: t.status === "Completed",
          }));
          setDailyTasks(list);
          setIsFullyCompleted(payload.data.isFullyCompleted);
          setTaskProgress(payload.data.progressPercent);

          if (payload.data.isFullyCompleted && payload.data.dayNumber) {
            const seenKey = `daily-task-completed-seen-day-${payload.data.dayNumber}`;
            const alreadySeen = localStorage.getItem(seenKey);
            if (!alreadySeen) {
              setAdvancementModal({
                isOpen: true,
                completedDay: payload.data.dayNumber,
                nextDay: payload.data.dayNumber + 1,
                isDailyTaskMode: true
              });
              localStorage.setItem(seenKey, "true");
            }
          }
        }
      }
      setTasksLoaded(true);
    } catch (error) {
      console.error("Failed to load daily tasks:", error);
      setTasksLoaded(true);
    }
  };

  useEffect(() => {
    const storedProgram = (() => {
      try {
        return JSON.parse(localStorage.getItem("userData") || "{}").programSelection;
      } catch {
        return "";
      }
    })();

    if (storedProgram !== "Full Stack Project Program") {
      loadTodayTasks();
    } else {
      setTasksLoaded(true);
    }
    loadProjectData();
  }, []);

  // Group the daily tasks for the checklist display
  const groupedTasks = useMemo(() => {
    const groups = {};
    dailyTasks.forEach((task, index) => {
      let categoryGroup = task.type;
      if (task.type === "Coding" || task.type === "Debugging") categoryGroup = "Coding";
      else if (task.type === "MCQ" || task.type === "Core CS") categoryGroup = "MCQ";
      else if (task.type === "SQL") categoryGroup = "SQL";
      else if (task.type === "Aptitude") categoryGroup = "Aptitude";

      if (!groups[categoryGroup]) {
        groups[categoryGroup] = {
          type: categoryGroup,
          text: categoryGroup === "MCQ" ? "Technical MCQ" : `${categoryGroup} Task`,
          questions: [],
          firstIndex: index,
        };
      }
      groups[categoryGroup].questions.push(task);
    });

    return Object.values(groups)
      .sort((a, b) => a.firstIndex - b.firstIndex)
      .map((group) => {
        const completedCount = group.questions.filter((q) => q.completed).length;
        const totalCount = group.questions.length;
        return {
          type: group.type,
          text: group.text,
          completed: totalCount > 0 && completedCount === totalCount,
          questions: group.questions,
        };
      });
  }, [dailyTasks]);

  const customTaskProgress = useMemo(() => {
    if (groupedTasks.length === 0) return 0;
    const weightPerGroup = 100 / groupedTasks.length;
    let totalProgress = 0;
    groupedTasks.forEach((group) => {
      const totalQ = group.questions.length;
      if (totalQ > 0) {
        const completedQ = group.questions.filter((q) => q.completed).length;
        totalProgress += (completedQ / totalQ) * weightPerGroup;
      }
    });
    return Math.round(totalProgress);
  }, [groupedTasks]);

  const handleGroupClick = (group) => {
    if (isFullyCompleted) {
      setToast({
        show: true,
        message: "You have already completed today's daily tasks. Access is locked.",
        type: "info",
      });
      return;
    }

    const nextUncompleted = group.questions.find((q) => !q.completed) || group.questions[0];
    if (!nextUncompleted) return;

    if (group.type === "Coding") {
      navigate(`/dashboard/practice/dsa/${nextUncompleted.id}?mode=daily`);
    } else if (group.type === "SQL") {
      navigate(`/dashboard/practice/sql/${nextUncompleted.id}?mode=daily`);
    } else if (group.type === "Aptitude") {
      navigate(`/dashboard/practice/aptitude/${nextUncompleted.id}?mode=daily`);
    } else {
      navigate(`/dashboard/practice/core-cs/${nextUncompleted.id}?mode=daily`);
    }
  };


  const completedTasks = dailyTasks.filter(t => t.completed).length;
  const totalTasks = dailyTasks.length;

  const [streak, setStreak] = useState(0);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState(null);

  const handleAvatarSelect = async (avatarUrl) => {
    setIsSelectingAvatar(false);
    try {
      const storedUser = JSON.parse(localStorage.getItem("userData"));
      if (!storedUser || !storedUser.id) return;

      const token = localStorage.getItem("token");
      const userId = storedUser.id;
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/users/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ photoUrl: avatarUrl }),
        }
      );

      if (!res.ok) throw new Error("Failed to update avatar");

      await res.json();

      // Update localStorage with new photoUrl and avatar
      const updatedUser = { ...storedUser, photoUrl: avatarUrl, avatar: avatarUrl };
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
  let rawPhotoUrl = displayUser?.photoUrl || "/profile_avatars/nobackgroundavatar1.png";
  if (rawPhotoUrl && !rawPhotoUrl.includes('/profile_avatars/')) {
    rawPhotoUrl = "/profile_avatars/nobackgroundavatar1.png";
  }
  // Dynamically rewrite to the backgroundless version if user has an old avatar set
  if (rawPhotoUrl && rawPhotoUrl.includes('/profile_avatars/') && !rawPhotoUrl.includes('nobackground')) {
    rawPhotoUrl = rawPhotoUrl.replace('/avatar', '/nobackgroundavatar');
  }
  const photoUrl = rawPhotoUrl;
  const collegeName = displayUser?.collegeName || "TechLearn Student";

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const projectStats = hasActiveProject && projectData ? [
    { title: 'Project XP', value: projectData.projectXpEarned.toLocaleString(), icon: <PixelStar /> },
    { title: 'Tasks Done', value: `${projectData.projectCompletedTotal}/${projectData.totalProjectTasks}`, icon: <PixelQuestion /> },
    { title: 'Project Progress', value: `${projectData.projectOverallProgress}%`, icon: <PixelArrow /> },
    { title: 'Streak', value: streak.toString(), icon: <PixelFlame /> },
  ] : null;

  const retroStats = hasActiveProject && projectData ? projectStats : [
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
            .font-press-start { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.4; }
            .font-pixel-header { font-family: "Press Start 2P", "Courier New", monospace; line-height: 1.6; }
            .pixel-icon { filter: drop-shadow(3px 3px 0px rgba(0,0,0,0.4)); image-rendering: pixelated; }
          `,
        }}
      />

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-300 ${
            isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          className={`flex flex-1 flex-col items-center transition-all duration-300 ease-in-out z-10 lg:ml-[90px] pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="w-full max-w-[1400px] space-y-8">


            <div className="flex flex-col lg:grid lg:grid-cols-8 gap-8 items-stretch w-full">
              
              {/* Daily Challenge Card / Project Hero - Spans 5/8 width on lg */}
              <div className="w-full lg:col-span-5 order-1 lg:order-none flex flex-col">
                {hasActiveProject && projectData ? (
                  <div className="rounded-xl flex flex-col justify-between relative overflow-hidden p-4 sm:p-5 md:p-6 min-h-[220px] lg:h-[250px] shadow-lg border border-[#15366f]/45 group w-full">
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
                    <div className="z-10 flex flex-wrap items-center justify-between gap-2 w-full shrink-0 sm:flex-nowrap">
                      <h1 className="font-pixel-header text-[9px] sm:text-[10.5px] md:text-[11.5px] tracking-wider text-white drop-shadow-md leading-tight text-left">
                        {projectData.project.title}
                      </h1>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-press-start text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-bold text-white bg-black/55 backdrop-blur-md px-2 py-1 border border-white/10 rounded-md flex items-center justify-center gap-1 shadow-sm">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap leading-none">{todayFormatted.toUpperCase()} IST</span>
                        </span>
                        <span className="font-press-start text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-bold text-white bg-black/55 backdrop-blur-md px-2 py-1 border border-white/10 rounded-md shadow-sm flex items-center justify-center whitespace-nowrap leading-none">
                          <span>{projectData.project.daysRemaining} DAYS LEFT</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="z-10 flex flex-1 flex-col justify-end text-left w-full mt-4 sm:mt-5 text-white">
                      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={pixelStarImg}
                            alt="XP"
                            className="w-7 h-7 object-contain select-none"
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <span className="font-pixel-header text-[8px] sm:text-[9px] text-[#8fd9ff] drop-shadow-md">
                            {projectData.projectXpEarned} XP
                          </span>
                        </div>

                        <div className="flex w-full flex-col justify-end gap-2 sm:w-auto sm:flex-row">
                          <button
                            onClick={() => navigate('/dashboard/project-overview')}
                            className="bg-white text-[#0a1128] hover:bg-slate-100 active:bg-slate-200 px-4 py-2 rounded-md font-press-start text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5 shadow-md"
                          >
                            View Project <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => navigate('/dashboard/project/day-notes')}
                            className="bg-white text-[#0a1128] hover:bg-slate-100 active:bg-slate-200 px-4 py-2 rounded-md font-press-start text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 transform hover:-translate-y-0.5 shadow-md"
                          >
                            Start Lesson <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl flex flex-col justify-between relative overflow-hidden p-4 sm:p-5 md:p-6 min-h-[220px] lg:h-[250px] shadow-lg border border-[#15366f]/45 group w-full">
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
                      <h1 className="font-pixel-header text-[9px] sm:text-[10.5px] md:text-[11.5px] tracking-wider text-white drop-shadow-md leading-tight whitespace-nowrap">
                        Daily Challenge
                      </h1>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-press-start text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-bold text-white bg-black/55 backdrop-blur-md px-2 py-1 border border-white/10 rounded-md flex items-center justify-center gap-1 shadow-sm">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap leading-none">{todayFormatted.toUpperCase()} IST</span>
                        </span>
                        <span className="font-press-start text-[9px] sm:text-[10px] tracking-[0.12em] uppercase font-bold text-white bg-black/55 backdrop-blur-md px-2 py-1 border border-white/10 rounded-md shadow-sm flex items-center justify-center whitespace-nowrap leading-none">
                          <span>Resets in 14h 22m</span>
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
                          {/* Button at bottom right with slightly more rounded edges (rounded-md) */}
                          <div className="flex w-full justify-end pt-1">
                            <button
                              onClick={() => {
                                if (activeChallenge?.linkId) {
                                  navigate(`/daily-challenge/${activeChallenge.linkId}`);
                                }
                              }}
                              className="bg-white text-[#0a1128] hover:bg-slate-100 active:bg-slate-200 px-4 py-2 rounded-md font-press-start text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5 shadow-md"
                            >
                              Go to Daily challenge <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Overview Card - Spans 3/8 width on lg - Redesigned into two halves */}
              <div className="w-full lg:col-span-3 order-3 lg:order-none border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-4 md:p-5 rounded-xl flex flex-col h-full min-h-[220px] lg:h-[250px] justify-between relative">
                
                {/* Top Half Section: Avatar on left, Headings on right - Centered layout - pushed down with pt-4 */}
                <div className="flex items-center justify-center gap-4 shrink-0 w-full px-1.5 pt-4 pb-1">
                  {/* Left Column: Avatar + Edit Link - Expanded Size */}
                  <div className="flex flex-col items-center justify-end shrink-0 relative w-20 h-16">
                    <img
                      src={photoUrl}
                      alt="Avatar"
                      className="w-20 h-20 object-contain select-none absolute bottom-2"
                    />
                    <button
                      onClick={() => {
                        setPendingAvatar(photoUrl);
                        setIsSelectingAvatar(true);
                      }}
                      className="font-press-start text-[8px] sm:text-[9.5px] text-[#00113b] dark:text-[#8fd9ff] hover:underline leading-none transition-colors z-10"
                    >
                      EDIT
                    </button>
                  </div>

                  {/* Right Column: Name & College */}
                  <div className="text-left flex-1 min-w-0 -mt-6">
                    <h2 className="font-pixel-header text-xs sm:text-sm md:text-base text-[#00113b] dark:text-[#8fd9ff] uppercase tracking-wide leading-tight truncate">
                      {userDisplayName}
                    </h2>
                    <p className="font-press-start text-xs sm:text-sm text-[#00113b]/70 dark:text-[#81bde6] mt-1 font-medium leading-tight truncate">
                      {collegeName}
                    </p>
                  </div>
                </div>

                {/* Bottom Half Section: 2x2 Stats Grid (Icon left, Text right) - Shipped flush left - pushed down with mt-2 */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-1 px-1 py-0.5 mt-2 flex-1 items-center w-full justify-items-start pl-4 sm:pl-6">
                  {retroStats.map((stat) => (
                    <div key={stat.title} className="flex items-center gap-2">
                      <div className="shrink-0">{stat.icon}</div>
                      <div className="flex flex-col text-left">
                        <span className="font-pixel-header text-[10px] sm:text-xs text-[#00113b] dark:text-white leading-tight">{stat.value}</span>
                        <span className="font-press-start text-[10px] sm:text-xs text-[#00113b]/70 dark:text-[#81bde6] mt-0.5 whitespace-nowrap font-medium leading-tight">{stat.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard Card - Spans 3/8 width on lg - aligned flush left matching header */}
              <div className="w-full lg:col-span-3 order-4 lg:order-none border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-5 md:p-6 rounded-xl flex flex-col h-full min-h-[220px] lg:h-[250px] justify-between">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h3 className="font-pixel-header text-[9.5px] md:text-[11.5px] tracking-wider text-black/70 dark:text-[#8fd9ff]">LEADERBOARD</h3>
                  <button onClick={() => navigate('/leaderboard')} className="font-press-start text-[10px] sm:text-xs text-[#3C83F6] dark:text-blue-400 hover:underline">
                    VIEW FULL
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-around gap-1 py-1">
                  {leaderboardLoading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={`leaderboard-loading-${index}`}
                          className="flex items-center gap-2 py-1 px-1 rounded-sm"
                        >
                          <PlaceholderBar className="h-2 w-6" />
                          <PlaceholderBar className="h-2.5 flex-1 rounded-md" />
                          <PlaceholderBar className="h-2 w-10" />
                        </div>
                      ))
                    : featuredLeaderboard.map((student) => (
                        <div
                          key={student.userId}
                          className={`flex items-center gap-2 py-1 px-1.5 rounded-sm transition-colors ${
                            student.isUser ? 'bg-[#3C83F6]/10 dark:bg-white/10 border border-[#3C83F6]/20 dark:border-white/20' : 'hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div
                            className={`w-6 font-pixel-header text-[10px] sm:text-xs text-left shrink-0 leading-tight ${
                              student.rank === 1 ? 'text-amber-500 font-medium' : student.rank === 2 ? 'text-slate-400 font-medium' : student.rank === 3 ? 'text-amber-700 font-medium' : 'text-[#00113b]/70 dark:text-[#81bde6] font-medium'
                            }`}
                          >
                            #{student.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-pixel-header text-[10px] sm:text-xs truncate ml-1 leading-tight ${student.isUser ? 'text-[#3C83F6] dark:text-white font-medium' : 'text-[#00113b] dark:text-white font-normal'}`}>
                              {student.name}
                            </div>
                          </div>
                          <div className="font-pixel-header text-[10px] sm:text-xs text-[#8A2BE2] dark:text-[#E0B0FF] shrink-0 leading-tight font-normal">
                            {student.totalXp.toLocaleString()}
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Daily Tasks Card / Project Tasks - Spans 5/8 width on lg */}
              <div className="w-full lg:col-span-5 order-2 lg:order-none border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-5 md:p-6 rounded-xl flex flex-col justify-between min-h-[220px] lg:h-[250px]">
                {projectLoading || !tasksLoaded ? (
                  <>
                    {/* Header loading */}
                    <div className="flex items-center justify-between shrink-0 mb-2">
                      <PlaceholderBar className="h-4 w-32 rounded-md" />
                      <PlaceholderBar className="h-4 w-12 rounded-md" />
                    </div>
                    {/* Task list loading */}
                    <div className="flex-1 flex flex-col gap-2 justify-start mt-2 mb-1.5">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={`task-loading-${index}`} className="flex items-center justify-between w-full py-2 px-3 rounded-sm border border-slate-400/30 dark:border-[#15366f]/45 bg-black/5 dark:bg-white/5 animate-pulse">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <PlaceholderBar className="w-3.5 h-3.5 rounded-sm" />
                            <PlaceholderBar className="h-3 w-3/4 rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar loading */}
                    <div className="mt-1 shrink-0 w-full">
                      <div className="flex justify-between items-center mb-1">
                        <PlaceholderBar className="h-2.5 w-16 rounded-md" />
                        <PlaceholderBar className="h-2.5 w-10 rounded-md" />
                      </div>
                      <PlaceholderBar className="h-2 w-full rounded-full" />
                    </div>
                  </>
                ) : hasActiveProject && projectData ? (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between shrink-0 mb-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-pixel-header text-[9.5px] md:text-[11.5px] tracking-wider text-black/70 dark:text-[#8fd9ff]">
                          TODAY'S TASKS (DAY {projectData.assignment.current_day})
                        </h3>
                      </div>
                      <span className="font-pixel-header text-[10px] sm:text-xs text-[#3C83F6] dark:text-[#8fd9ff] leading-tight font-normal">
                        {projectData.projectCompletedToday}/{projectData.projectTotalToday}
                      </span>
                    </div>

                    {/* Task List */}
                    <div className="flex-1 flex flex-col gap-1.5 justify-start mt-2 mb-0.5">
                      {projectData.todayTasks && projectData.todayTasks.length > 0 ? (
                        projectData.todayTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => handleProjectTaskToggle(task.id)}
                            className="flex items-center justify-between w-full text-left py-2 px-3 rounded-sm border border-slate-400/60 dark:border-slate-600/60 bg-transparent hover:border-[#3C83F6] hover:shadow-[0_0_8px_rgba(60,131,246,0.3)] transition-all duration-300 cursor-pointer transform active:scale-[0.99] group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div
                                className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                                  task.completed
                                    ? 'bg-[#3C83F6] border-[#3C83F6] text-white shadow-[0_0_6px_#3C83F6]'
                                    : 'border-slate-400 dark:border-slate-600 bg-transparent group-hover:border-[#3C83F6]'
                                }`}
                              >
                                {task.completed && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`font-press-start text-[10px] sm:text-xs font-normal truncate transition-all duration-300 leading-tight ${
                                task.completed
                                  ? 'line-through text-[#00113b]/30 dark:text-white/30'
                                  : 'text-[#00113b] dark:text-white'
                              }`}>
                                {task.title}
                              </span>
                            </div>
                            <span className="rounded-md border border-[#3C83F6]/20 bg-white/30 px-2 py-0.5 font-pixel-header text-[8px] leading-none text-[#3C83F6] dark:border-[#8fd9ff]/20 dark:bg-white/5 dark:text-[#8fd9ff]">
                              +{task.xp} XP
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3">
                          <p className="font-press-start text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                            No tasks configured for today.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-1 shrink-0 w-full text-left">
                      <div className="flex justify-between items-center font-press-start mb-0.5">
                        <span className="text-[10px] sm:text-xs font-medium text-[#00113b]/70 dark:text-[#81bde6] leading-tight">PROGRESS</span>
                        <span className="font-pixel-header text-[10px] sm:text-xs font-medium text-[#00113b]/70 dark:text-[#81bde6] leading-tight">
                          {projectData.projectDayProgress}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full border border-black/5 bg-black/15 shadow-inner dark:border-white/5 dark:bg-black/40">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#3C83F6] shadow-[0_0_8px_#3C83F6] transition-all duration-500"
                          style={{ width: `${projectData.projectDayProgress}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between shrink-0 mb-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-pixel-header text-[9.5px] md:text-[11.5px] tracking-wider text-black/70 dark:text-[#8fd9ff]">DAILY TASKS</h3>
                      </div>
                      <span className="font-pixel-header text-[10px] sm:text-xs text-[#3C83F6] dark:text-[#8fd9ff] leading-tight font-normal">
                        {groupedTasks.filter((g) => g.completed).length}/{groupedTasks.length}
                      </span>
                    </div>

                     {/* Task List - Staged background elements added back */}
                    <div className="flex-1 flex flex-col gap-1.5 justify-start mt-2 mb-0.5">
                      {groupedTasks.length > 0 ? (
                        groupedTasks.map(group => (
                          <div
                            key={group.type}
                            onClick={() => handleGroupClick(group)}
                            className="flex items-center justify-between w-full text-left py-2 px-3 rounded-sm border border-slate-400/60 dark:border-slate-600/60 bg-transparent hover:border-[#3C83F6] hover:shadow-[0_0_8px_rgba(60,131,246,0.3)] transition-all duration-300 cursor-pointer transform active:scale-[0.99] group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Beautiful custom pixel checkbox - Slightly rounded edges */}
                              <div
                                className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                                  group.completed
                                    ? 'bg-[#3C83F6] border-[#3C83F6] text-white shadow-[0_0_6px_#3C83F6]'
                                    : 'border-slate-400 dark:border-slate-600 bg-transparent group-hover:border-[#3C83F6]'
                                }`}
                              >
                                {group.completed && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {/* Task text */}
                              <span className={`font-press-start text-[10px] sm:text-xs font-normal truncate transition-all duration-300 leading-tight ${
                                group.completed
                                  ? 'line-through text-[#00113b]/30 dark:text-white/30'
                                  : 'text-[#00113b] dark:text-white'
                              }`}>
                                {group.text}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-3">
                          <svg className="w-8 h-8 text-slate-400/80 dark:text-slate-500 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="font-press-start text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                            No tasks assigned for today.
                          </p>
                          <p className="font-press-start text-[8px] text-slate-400/60 dark:text-slate-500 mt-1">
                            You're all caught up!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Premium Retro Neon Progress Bar */}
                    <div className="mt-1 shrink-0 w-full">
                      <div className="flex justify-between items-center font-press-start mb-0.5">
                        <span className="text-[10px] sm:text-xs font-medium text-[#00113b]/70 dark:text-[#81bde6] leading-tight">PROGRESS</span>
                        <span className="font-pixel-header text-[10px] sm:text-xs font-bold text-[#3C83F6] dark:text-[#8fd9ff] leading-tight">
                          {groupedTasks.length > 0 ? `${customTaskProgress}%` : "No tasks"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/10 dark:bg-black/50 rounded-full overflow-hidden border border-black/5 dark:border-white/10 shadow-inner">
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out bg-[#3C83F6] shadow-[0_0_6px_#3C83F6]"
                          style={{ width: `${groupedTasks.length > 0 ? customTaskProgress : 0}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Section: Recent Activity & Exercises - Spans all columns */}
              <div className="w-full lg:col-span-8 order-5 lg:order-none border border-black/5 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-4 md:p-5 rounded-xl flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-pixel-header text-[9.5px] md:text-[11.5px] tracking-wider text-black/70 dark:text-[#8fd9ff]">Recent Activity & Exercises</h3>
                  <button onClick={() => navigate('/learn/exercises')} className="font-press-start text-[10px] sm:text-xs text-[#3C83F6] dark:text-blue-400 hover:underline">
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
                            <span className="font-press-start text-[10px] uppercase tracking-widest text-black/40 dark:text-[#7fb8e2]">
                              {exercise.courseTitle || 'Course'}
                            </span>
                            <span className="font-pixel-header text-[10px] uppercase font-medium text-[#3C83F6] dark:text-[#8fd9ff]">
                              +{exercise.xp || 0} XP
                            </span>
                          </div>
                          <h4 className="font-press-start text-xs sm:text-sm text-black dark:text-white group-hover:text-[#3C83F6] dark:group-hover:text-[#96ddff] transition-colors line-clamp-2 leading-relaxed">
                            {exercise.title || 'Untitled Exercise'}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mt-3 border-t border-black/5 dark:border-white/5 pt-2">
                          <span className="font-press-start text-[10px] text-black/50 dark:text-white/50 flex items-center gap-1">
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
                const avatarUrl = `/profile_avatars/nobackgroundavatar${i + 1}.png`;
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

      {/* Day Advancement Modal */}
      {advancementModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-sans">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0a1128] border-2 border-[#3C83F6]/50 rounded-2xl p-6 md:p-8 shadow-2xl text-center border-b-8">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#3C83F6] text-white p-3 rounded-full border-4 border-white dark:border-[#0a1128] shadow-lg">
              <img
                src={pixelStarImg}
                alt="Level Up"
                className="w-10 h-10 object-contain pixel-icon"
              />
            </div>
            
            <div className="mt-6 space-y-4">
              <h3 className="font-pixel-header text-[10px] tracking-wider text-[#3C83F6] dark:text-[#8fd9ff] uppercase">
                DAY COMPLETE!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Awesome effort! You have successfully completed all your {advancementModal.isDailyTaskMode ? "Daily Tasks" : "tasks"} for <span className="font-semibold text-slate-800 dark:text-white font-sans">Day {advancementModal.completedDay}</span>{advancementModal.isDailyTaskMode ? "." : " of the project."}
              </p>
              
              <div className="bg-[#3C83F6]/10 dark:bg-white/5 py-4 px-6 rounded-xl border border-[#3C83F6]/20 dark:border-white/10 flex items-center justify-center gap-3">
                <div className="text-right">
                  <span className="block text-[8px] font-press-start uppercase text-slate-400 dark:text-slate-500">PREVIOUS</span>
                  <span className="font-pixel-header text-[9px] text-slate-500 dark:text-slate-400">DAY {advancementModal.completedDay}</span>
                </div>
                <div className="font-bold text-slate-400">→</div>
                <div className="text-left">
                  <span className="block text-[8px] font-press-start uppercase text-[#3C83F6] dark:text-[#8fd9ff]">{advancementModal.isDailyTaskMode ? "NEXT DAY" : "UNLOCKED"}</span>
                  <span className="font-pixel-header text-[9px] text-[#3C83F6] dark:text-white">DAY {advancementModal.nextDay}</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 italic font-sans">
                {advancementModal.isDailyTaskMode ? "Come back tomorrow for your next daily tasks and keep your streak alive!" : "New lesson notes and tasks have been unlocked for you."}
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  const isDaily = advancementModal.isDailyTaskMode;
                  setAdvancementModal({ isOpen: false, completedDay: 1, nextDay: 2 });
                  if (!isDaily) {
                    navigate(`/dashboard/project/day-notes?day=${advancementModal.nextDay}`);
                  }
                }}
                className="px-6 py-2.5 bg-[#3C83F6] text-white hover:bg-blue-600 font-press-start text-[9px] rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {advancementModal.isDailyTaskMode ? "AWESOME" : `UNLEASH DAY ${advancementModal.nextDay}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optimistic Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 transform transition-all duration-300 ease-out translate-y-0 opacity-100">
          <div className="flex items-center gap-3 bg-red-600 text-white font-press-start text-[10px] sm:text-xs py-3 px-5 rounded-lg shadow-lg border border-red-500 max-w-sm">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{toast.message}</span>
            <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-auto hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
