import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import LoadingScreen from '../../components/Loader/Loader3D';
import ThemeToggle from '../../components/Dashboard/ThemeToggle';
import { FiSearch, FiEye, FiEdit2, FiTrash2, FiPlus, FiCode, FiDatabase, FiCpu } from 'react-icons/fi';

const mockTracks = [
  {
    id: 'trk_dsa_01',
    name: 'DSA Track',
    description: '30-day Data Structures & Algorithms curriculum',
    totalDays: 30,
    questionsAssigned: 4,
    status: 'Active',
    icon: FiCode,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'trk_core_01',
    name: 'Core Track',
    description: '20-day Core CS fundamentals',
    totalDays: 20,
    questionsAssigned: 1,
    status: 'Active',
    icon: FiCpu,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-500 dark:text-orange-400',
  },
  {
    id: 'trk_sql_01',
    name: 'SQL Track',
    description: '15-day SQL mastery',
    totalDays: 15,
    questionsAssigned: 1,
    status: 'Active',
    icon: FiDatabase,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
];

const searchRoutes = [
  { id: 'dashboard', title: 'Dashboard', category: 'Overview' },
  { id: 'analytics', title: 'Analytics', category: 'Overview' },
  { id: 'system-health', title: 'System Health', category: 'Overview' },
  { id: 'colleges', title: 'Colleges', category: 'Organization' },
  { id: 'batches', title: 'Batches', category: 'Organization' },
  { id: 'students', title: 'Students', category: 'Organization' },
  { id: 'question-bank', title: 'Question Bank', category: 'Learning' },
  { id: 'track-templates', title: 'Track Templates', category: 'Learning' },
  { id: 'resources', title: 'Resources', category: 'Learning' },
  { id: 'certificates', title: 'Certificates', category: 'Learning' },
  { id: 'submission-monitor', title: 'Submission Monitor', category: 'Operations' },
];

const TrackTemplate = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const searchInputRef = useRef(null);

  const { user, isLoading, isReady } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter(route =>
    route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTracks = mockTracks.filter(track =>
    track.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    track.description.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const handleRouteSelect = (id) => {
    setIsSearchOpen(false);
    navigate('/' + id);
  };

  const isDarkMode = theme === 'dark';

  if (isLoading || !isReady) {
    return <LoadingScreen showMessage={true} fullScreen={true} size={40} duration={800} />;
  }

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
                className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setIsSearchOpen(false)}
              >
                <span>ESC</span>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                filteredRoutes.map(route => (
                  <button
                    key={route.id}
                    onClick={() => handleRouteSelect(route.id)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {route.title}
                      </h4>
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">
                        {route.category}
                      </p>
                    </div>
                    <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">›</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        {/* Background */}
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
            pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1400px] mx-auto space-y-8">

            {/* Header */}
            <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
              <div>
                <h1 className="text-2xl font-semibold text-black dark:text-white tracking-tight">Track Templates</h1>
              </div>

              <div className="flex items-center gap-4">
                {/* Search Button */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="relative hidden md:flex items-center w-56 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group"
                >
                  <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40" />
                  <span className="text-sm text-black/40 dark:text-white/40">Search...</span>
                  <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
                    <span>⌘</span><span>K</span>
                  </div>
                </button>

                <ThemeToggle />

                {/* Profile Avatar */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] text-white flex items-center justify-center text-sm font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    {user?.firstName?.charAt(0)?.toUpperCase() || 'A'}
                  </button>

                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] text-white flex items-center justify-center text-sm font-medium">
                              {user?.firstName?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-black dark:text-white">{user?.firstName || 'Admin User'}</h3>
                              <p className="text-xs text-black/60 dark:text-white/60">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => { setProfileDropdownOpen(false); logout(); }}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

            {/* Search & Create Row */}
            <div className="flex items-center gap-4">
              {/* Template Search */}
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/40 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl backdrop-blur-md text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 transition-all"
                />
              </div>

              {/* Create Template Button */}
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#3C83F6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 whitespace-nowrap">
                <FiPlus className="w-4 h-4" />
                Create Template
              </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">How Track Templates work</h3>
              <p className="text-xs text-blue-700/80 dark:text-blue-300/70 leading-relaxed">
                Track Templates are reusable day-wise curricula built from the Question Bank. When you create a Batch, all active templates are automatically attached as copies — so editing a template later won't affect existing batches.
              </p>
            </div>

            {/* Track Cards Grid */}
            {filteredTracks.length === 0 ? (
              <div className="text-center py-20 text-black/40 dark:text-white/40 text-sm">
                No templates found matching &ldquo;{templateSearch}&rdquo;
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTracks.map(track => {
                  const IconComponent = track.icon;
                  return (
                    <div
                      key={track.id}
                      className="bg-white/60 dark:bg-black/30 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-300 group"
                    >
                      {/* Card Top Row */}
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl ${track.iconBg} flex items-center justify-center`}>
                          <IconComponent className={`w-6 h-6 ${track.iconColor}`} />
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-700/30 px-3 py-1 rounded-full">
                          {track.status}
                        </span>
                      </div>

                      {/* Track Name & Description */}
                      <div>
                        <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{track.name}</h3>
                        <p className="text-sm text-black/50 dark:text-white/50 leading-snug">{track.description}</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-black/5 dark:border-white/5">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">Total Days</p>
                          <p className="text-xl font-semibold text-black dark:text-white">{track.totalDays}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">Questions Assigned</p>
                          <p className="text-xl font-semibold text-black dark:text-white">
                            {track.questionsAssigned} / {track.totalDays}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => navigate(`/track/${track.id}/day/1`)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3C83F6] hover:bg-[#2563eb] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm shadow-blue-500/20"
                        >
                          <FiEye className="w-4 h-4" />
                          View Template
                        </button>
                        <button className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-all duration-200">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 text-black/50 dark:text-white/50 hover:text-red-500 dark:hover:text-red-400 transition-all duration-200">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
};

export default TrackTemplate;
