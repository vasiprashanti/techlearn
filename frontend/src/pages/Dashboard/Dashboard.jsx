import { useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import UserGreeting from '../../components/Dashboard/UserGreeting';
import ProgressDonut from '../../components/Dashboard/ProgressDonut';
import Calendar from '../../components/Dashboard/Calendar';
import XPDisplay from '../../components/Dashboard/XPDisplay';
import RecentExercises from '../../components/Dashboard/RecentExercises';
import ThemeToggle from '../../components/Dashboard/ThemeToggle';
import ProgressBar from '../../components/Dashboard/ProgressBar';
import LoadingScreen from '../../components/Loader/Loader3D';

const Dashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    user,
    isLoading,
    error,
    xp,
    recentExercises,
    progress: contextProgress,
    activities,
    isReady
  } = useUser();

  const progress = useMemo(() => {
    if (!contextProgress) {
      return {
        course: {
          title: 'Current Course',
          progressPercent: 0
        },
        exercise: {
          completed: 0,
          total: 0,
          progressPercent: 0
        },
        xp: 0,
        calendar: {},
        recentExercises: []
      };
    }

    const totalExercises = contextProgress.totalExercises || 0;
    const completedExercises = contextProgress.completedExercises || 0;

    const validRecentExercises = Array.isArray(recentExercises) ? recentExercises : [];

    // Use the exerciseProgressPercent from the API if available
    const exerciseProgressPercent = contextProgress.exerciseProgressPercent !== undefined 
      ? contextProgress.exerciseProgressPercent 
      : totalExercises > 0 
        ? Math.round((completedExercises / totalExercises) * 100)
        : 0;

    return {
      course: {
        title: 'Current Course',
        // Use courseProgress from API response (totalCourseProgress.progressPercent)
        progressPercent: Math.max(0, Math.min(100, contextProgress.courseProgress || 0))
      },
      exercise: {
        completed: completedExercises,
        total: totalExercises,
        // Use exerciseProgress.progressPercent from API response
        progressPercent: Math.max(0, Math.min(100, exerciseProgressPercent))
      },
      xp: Math.max(0, xp || 0), // XP is now calculated from courseXP in UserContext
      calendar: activities && typeof activities === 'object' ? activities : {},
      recentExercises: validRecentExercises
    };
  }, [contextProgress, recentExercises, activities, xp]);

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const isDarkMode = theme === 'dark';

  // Loading state - show for minimum time to prevent flashing
  if (isLoading || !isReady) {
    return (
      <LoadingScreen
        showMessage={true}
        fullScreen={true}
        size={40}
        duration={800}
      />
    );
  }

  // Error state - only show if it's not an auth error (those auto-retry)
  if (error && !error.includes('authentication') && !error.includes('token')) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="text-xl text-red-500 dark:text-red-400 mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ensure user exists before rendering
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">
          No user data available
        </div>
      </div>
    );
  }

  const userName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.name || 'User';

  return (
    <>
      <Navbar />

      <div className={`flex min-h-screen w-full ${theme === 'dark' ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
              : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'
          }`}
        />

        <Sidebar />

        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-[10px]' : 'ml-[10px]'
          } pt-16 p-6 overflow-auto`}
          >
          <div className="max-w-[1800px] mx-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
              <UserGreeting name={userName} />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-1">
                <ProgressDonut
                  title="Course Progress"
                  progress={progress.course.progressPercent}
                  subtitle={progress.course.title}
                />
              </div>

              <div className="lg:col-span-1 flex flex-col gap-7 items-stretch">
                <XPDisplay points={progress.xp} />
                <ProgressBar
                  title="Exercise Progress"
                  progress={progress.exercise.progressPercent}
                  subtitle={`${progress.exercise.completed}/${progress.exercise.total}`}
                />
              </div>

              <div className="lg:col-span-1">
                <Calendar activities={progress.calendar} />
              </div>

              <div className="col-span-full mt-6">
                <RecentExercises exercises={progress.recentExercises} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
