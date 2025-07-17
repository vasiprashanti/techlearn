import { useState, useMemo } from 'react';
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
          total: 0
        },
        xp: 0,
        calendar: {},
        recentExercises: []
      };
    }

    const totalExercises = contextProgress.totalExercises || 0;
    const completedExercises = contextProgress.completedExercises || 0;
    
    const validRecentExercises = Array.isArray(recentExercises) ? recentExercises : [];
    
    const exerciseCompleted = completedExercises || 
      validRecentExercises.filter(ex => ex && ex.completed === true).length;
    
    const exerciseTotal = totalExercises || validRecentExercises.length || 1;

    return {
      course: {
        title: 'Current Course',
        progressPercent: Math.max(0, Math.min(100, contextProgress.courseProgress || 0))
      },
      exercise: {
        completed: exerciseCompleted,
        total: exerciseTotal
      },
      xp: Math.max(0, xp || 0),
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
    <div className={`flex min-h-screen w-full ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className={`fixed inset-0 -z-10 ${theme === 'dark' ? 
        'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 
        'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`}
      />
      
      <Sidebar onToggle={handleSidebarToggle} />
      
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-[10px]' : 'ml-[10px]'
      } p-6 overflow-auto`}>
        <div className="max-w-[1800px] mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <UserGreeting name={userName} />
          
            <button
              onClick={toggleTheme}
              className={`text-[15px] transition-colors duration-300 p-1.5 ${
                isDarkMode
                  ? 'text-[#e0e6f5] hover:text-white'
                  : 'text-[#00184f]'
              }`}
              aria-label="Toggle dark mode"
            >
              <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ProgressDonut 
                title="Course Progress" 
                progress={progress.course.progressPercent}
                subtitle={progress.course.title}
              />
            </div>
            
            <div className="lg:col-span-1 flex flex-col gap-6">
              <XPDisplay points={progress.xp} />
              <ProgressBar 
                title="Exercise Progress" 
                progress={Math.round((progress.exercise.completed / Math.max(progress.exercise.total, 1)) * 100)}
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
  );
};

export default Dashboard;