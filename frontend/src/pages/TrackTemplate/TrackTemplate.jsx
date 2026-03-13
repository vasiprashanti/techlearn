import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import UserGreeting from '../../components/Dashboard/UserGreeting';
import LoadingScreen from '../../components/Loader/Loader3D';
import ActiveTrack from '../../components/Dashboard/ActiveTrack';
import { getInitialTrackState } from '../../data/mockTracks';

const TrackTemplate = () => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trackData, setTrackData] = useState(null);

  const { user, isLoading, isReady } = useUser();

  useEffect(() => {
    setMounted(true);
    const savedTrack = localStorage.getItem('trace_active_track');
    if (savedTrack) {
      setTrackData(JSON.parse(savedTrack));
    } else {
      const initial = getInitialTrackState();
      setTrackData(initial);
      localStorage.setItem('trace_active_track', JSON.stringify(initial));
    }
  }, []);

  const isDarkMode = theme === 'dark';

  if (isLoading || !isReady || !trackData) {
    return <LoadingScreen showMessage={true} fullScreen={true} size={40} duration={800} />;
  }

  const completedDays = trackData.questions.filter(q => q.status === 'completed').length;
  const progressPercent = Math.round((completedDays / trackData.questions.length) * 100);
  const totalXP = completedDays * 100;
  
  const completedWithScores = trackData.questions.filter(q => q.status === 'completed' && q.score);
  const avgAccuracy = completedWithScores.length > 0 
    ? Math.round(completedWithScores.reduce((acc, q) => acc + q.score, 0) / completedWithScores.length)
    : 0;

  return (
    <>
      <Navbar />

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
            isDarkMode
              ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
              : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          className={`flex-1 transition-all duration-700 ease-in-out z-10 
            ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} 
            pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-auto
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1400px] mx-auto space-y-10">
            
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-8 border-b border-black/5 dark:border-white/5">
              <UserGreeting name={user?.firstName || 'Student'} />
              <button 
                onClick={() => { localStorage.removeItem('trace_active_track'); window.location.reload(); }}
                className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors mt-4 sm:mt-0"
              >
                Reset Progress
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/5 p-8 flex flex-col justify-between">
                <span className="text-[10px] tracking-widest uppercase text-black/50 dark:text-white/50">Total Experience</span>
                <div className="mt-8">
                  <span className="text-6xl font-light tracking-tighter text-black dark:text-white">{totalXP}</span>
                  <span className="text-sm tracking-widest uppercase text-black/40 dark:text-white/40 ml-2">XP</span>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/5 p-8 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-widest uppercase text-black/50 dark:text-white/50">Track Progress</span>
                  <span className="text-sm tracking-tighter text-black dark:text-white">{progressPercent}%</span>
                </div>
                <div className="mt-10">
                  <div className="w-full h-[2px] bg-black/10 dark:bg-white/10 relative">
                    <div className="absolute top-0 left-0 h-full bg-black dark:bg-white transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <p className="text-[10px] tracking-widest uppercase text-black/40 dark:text-white/40 mt-4">
                    {completedDays} / {trackData.questions.length} Days Completed
                  </p>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/5 p-8 flex flex-col justify-between">
                <span className="text-[10px] tracking-widest uppercase text-black/50 dark:text-white/50">Accuracy</span>
                <div className="mt-8 flex items-baseline gap-2">
                  <span className="text-6xl font-light tracking-tighter text-emerald-600 dark:text-emerald-400">{avgAccuracy}%</span>
                </div>
              </div>
            </div>

            <ActiveTrack track={trackData} />

          </div>
        </main>
      </div>
    </>
  );
};

export default TrackTemplate;