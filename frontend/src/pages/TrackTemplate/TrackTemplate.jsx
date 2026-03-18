import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import LoadingScreen from '../../components/Loader/Loader3D';
import ActiveTrack from '../../components/Dashboard/ActiveTrack';
import ThemeToggle from '../../components/Dashboard/ThemeToggle';
import { getInitialTrackState } from '../../data/mockTracks';
import { FiSearch } from 'react-icons/fi';

const searchRoutes = [
  { id: 'dashboard',          title: 'Dashboard',          category: 'Overview'     },
  { id: 'analytics',          title: 'Analytics',          category: 'Overview'     },
  { id: 'system-health',      title: 'System Health',      category: 'Overview'     },
  { id: 'colleges',           title: 'Colleges',           category: 'Organization' },
  { id: 'batches',            title: 'Batches',            category: 'Organization' },
  { id: 'students',           title: 'Students',           category: 'Organization' },
  { id: 'question-bank',      title: 'Question Bank',      category: 'Learning'     },
  { id: 'track-templates',    title: 'Track Templates',    category: 'Learning'     },
  { id: 'resources',          title: 'Resources',          category: 'Learning'     },
  { id: 'certificates',       title: 'Certificates',       category: 'Learning'     },
  { id: 'submission-monitor', title: 'Submission Monitor', category: 'Operations'   },
  { id: 'notifications',      title: 'Notifications',      category: 'Operations'   },
  { id: 'audit-logs',         title: 'Audit Logs',         category: 'Operations'   },
  { id: 'reports',            title: 'Reports',            category: 'Operations'   },
];

const TrackTemplate = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trackData, setTrackData] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

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

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(p => !p); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    else setSearchQuery('');
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRouteSelect = (id) => { setIsSearchOpen(false); navigate('/' + id); };

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
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages, tracks, or settings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
              />
              <div
                className="text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setIsSearchOpen(false)}
              >ESC</div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0
                ? <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results for &ldquo;{searchQuery}&rdquo;</div>
                : filteredRoutes.map(r => (
                  <button key={r.id} onClick={() => handleRouteSelect(r.id)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                    <div>
                      <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{r.title}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">{r.category}</p>
                    </div>
                    <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">›</span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased ${isDarkMode ? 'dark' : ''}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 z-10 transition-all duration-700 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-8 pb-16 px-6 md:px-12 lg:px-16 overflow-auto ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="max-w-[1400px] mx-auto space-y-8">

            {/* Header — matches all other admin pages exactly */}
            <header className="flex items-center justify-between pb-6 border-b border-black/[0.06] dark:border-white/5">
              <div>
                <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">Track Templates</h1>
                <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">
                  {user?.firstName ? `${user.firstName}'s active learning track` : 'Your active learning track'}
                </p>
              </div>

              <div className="flex items-center gap-5">
                {/* Reset progress — subtle, tucked before search */}
                <button
                  onClick={() => { localStorage.removeItem('trace_active_track'); window.location.reload(); }}
                  className="hidden md:block text-[10px] tracking-widest uppercase text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors border border-black/[0.07] dark:border-white/10 px-3 py-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/5"
                >
                  Reset Progress
                </button>

                {/* Search */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="relative hidden md:flex items-center w-60 bg-white/30 dark:bg-black/20 border border-black/[0.06] dark:border-white/5 py-2 pl-10 pr-12 rounded-xl backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/30 transition-colors text-left"
                >
                  <FiSearch className="absolute left-3.5 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                  <span className="text-sm text-black/35 dark:text-white/35">Search...</span>
                  <div className="absolute right-3 text-[9px] font-medium text-black/30 dark:text-white/30 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">⌘K</div>
                </button>

                <ThemeToggle />

                {/* Avatar */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </button>

                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-base font-semibold">
                              {user?.firstName?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-black dark:text-white truncate">{user?.firstName || 'Admin User'}</h3>
                              <p className="text-xs text-black/50 dark:text-white/50 truncate">{user?.email || 'admin@techlearn.com'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-1.5">
                          <button
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full px-4 py-2.5 text-left text-sm text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                            Profile Settings
                          </button>
                          <div className="mx-4 my-1 h-px bg-black/[0.08] dark:bg-white/[0.08]" />
                          <button
                            onClick={() => { setProfileDropdownOpen(false); logout(); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          >
                            Log Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* KPI Cards — matches SubmissionMonitor/AuditLogs pattern exactly */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Experience', value: `${totalXP} XP`   },
                { label: 'Track Progress',   value: `${progressPercent}%` },
                { label: 'Avg Accuracy',     value: `${avgAccuracy}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/5 rounded-2xl px-6 py-5">
                  <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-black/35 dark:text-white/40">{label}</p>
                  <p className="text-3xl font-light tracking-tight text-[#3C83F6] dark:text-white mt-3">{value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar — subtle section under KPIs */}
            <div className="bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/5 rounded-2xl px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] uppercase tracking-[0.12em] font-semibold text-black/35 dark:text-white/40">Days Completed</p>
                <p className="text-[11px] font-mono text-black/40 dark:text-white/40">{completedDays} / {trackData.questions.length}</p>
              </div>
              <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3C83F6] dark:bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Active Track component */}
            <ActiveTrack track={trackData} />

          </div>
        </main>
      </div>
    </>
  );
};

export default TrackTemplate;
