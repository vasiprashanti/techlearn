import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import LoadingScreen from '../../components/Loader/Loader3D';
import { FiSearch, FiEye, FiEdit2, FiTrash2, FiPlus, FiCode, FiDatabase, FiCpu, FiBell } from 'react-icons/fi';

// --- Mock Data ---
const mockTracks = [
  {
    id: 'trk_dsa_01',
    name: 'DSA Track',
    description: '30-day Data Structures & Algorithms curriculum',
    totalDays: 30,
    questionsAssigned: 4,
    status: 'Active',
    icon: FiCode,
    category: 'Algorithms',
  },
  {
    id: 'trk_core_01',
    name: 'Core Track',
    description: '20-day Core CS fundamentals',
    totalDays: 20,
    questionsAssigned: 1,
    status: 'Active',
    icon: FiCpu,
    category: 'Fundamentals',
  },
  {
    id: 'trk_sql_01',
    name: 'SQL Track',
    description: '15-day SQL mastery',
    totalDays: 15,
    questionsAssigned: 1,
    status: 'Active',
    icon: FiDatabase,
    category: 'Database',
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
  { id: 'settings', title: 'Settings', category: 'Configuration' },
];

export default function TrackTemplate() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const searchInputRef = useRef(null);

  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

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

  const handleRouteSelect = (id) => {
    setIsSearchOpen(false);
    navigate(`/${id}`);
  };

  const filteredTracks = mockTracks.filter((track) => {
    const query = templateSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      track.name.toLowerCase().includes(query) ||
      track.description.toLowerCase().includes(query) ||
      track.category.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages, tracks, or settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
              />
              <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0">
                <span>ESC</span>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                filteredRoutes.map((route) => (
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
                    <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
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
            pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-auto
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* Header — same as AdminDashboard */}
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 py-3 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">
                Track Templates
              </h1>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group"
                >
                  <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors" />
                  <span className="text-sm text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">
                    Search...
                  </span>
                  <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
                    <span>⌘</span>
                    <span>K</span>
                  </div>
                </button>

                <button className="relative text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <FiBell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                  >
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </button>

                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">
                              {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-black dark:text-white truncate">
                                {user?.firstName || user?.email || 'Admin User'}
                              </h3>
                              <p className="text-xs text-black/60 dark:text-white/60 truncate">
                                {user?.email || 'admin@techlearn.com'}
                              </p>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-white/10 dark:text-white border border-[#3C83F6]/20 dark:border-white/20">
                                  Administrator
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => setProfileDropdownOpen(false)}
                            className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Profile Settings</div>
                              <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                            </div>
                          </button>
                          <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10" />
                          <button
                            onClick={() => { setProfileDropdownOpen(false); logout(); }}
                            className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Log Out</div>
                              <div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out of your account</div>
                            </div>
                          </button>
                        </div>
                        <div className="px-4 py-2 bg-black/2.5 dark:bg-white/2.5 border-t border-black/5 dark:border-white/5">
                          <p className="text-[9px] text-black/40 dark:text-white/40 text-center">TechLearn Admin Panel v2.0</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Search + Create Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/40 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl backdrop-blur-md text-sm text-black/70 dark:text-white/70 placeholder:text-black/30 dark:placeholder:text-white/30 outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
                />
              </div>

              <button className="w-full md:w-auto md:ml-auto flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest rounded-xl bg-[#3C83F6]/10 dark:bg-white/5 border border-[#3C83F6]/20 dark:border-white/10 text-[#3C83F6] dark:text-white/60 hover:bg-[#3C83F6]/15 dark:hover:bg-white/10 transition-colors font-medium">
                <FiPlus className="w-3.5 h-3.5" />
                Create Template
              </button>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30 -mt-2">
              {filteredTracks.length} of {mockTracks.length} templates
            </p>

            {/* 3-Column Card Grid */}
            {filteredTracks.length === 0 ? (
              <div className="py-20 text-center text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30">
                No templates match your search
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTracks.map((track) => {
                  const Icon = track.icon;
                  return (
                    <div
                      key={track.id}
                      className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-7 flex flex-col gap-5 hover:bg-white/60 dark:hover:bg-black/60 transition-colors group"
                    >
                      {/* Top row: icon + status badge */}
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-[#3C83F6]/10 dark:bg-white/10 border border-[#3C83F6]/10 dark:border-white/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-[#3C83F6] dark:text-white" />
                        </div>
                        <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border
                          ${track.status === 'Active'
                            ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                            : 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                          }`}
                        >
                          {track.status}
                        </span>
                      </div>

                      {/* Track name + description */}
                      <div className="min-h-[4.5rem]">
                        <h3 className="text-xl font-light tracking-tight text-[#3C83F6] dark:text-white">
                          {track.name}
                        </h3>
                        <p className="text-sm text-black/45 dark:text-white/45 mt-1 font-light leading-relaxed line-clamp-2">
                          {track.description}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5">
                          <p className="text-[8px] uppercase tracking-widest text-black/30 dark:text-white/30">Total Days</p>
                          <p className="text-xl font-light text-black/75 dark:text-white/80 mt-1 leading-none">{track.totalDays}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5">
                          <p className="text-[8px] uppercase tracking-widest text-black/30 dark:text-white/30">Questions Assigned</p>
                          <p className="text-xl font-light text-black/75 dark:text-white/80 mt-1 leading-none">
                            {track.questionsAssigned} / {track.totalDays}
                          </p>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center gap-3 mt-auto">
                        <button
                          onClick={() => navigate(`/track/${track.id}/day/1`)}
                          className="flex-1 h-10 flex items-center justify-center gap-2 px-4 text-[10px] uppercase tracking-widest rounded-xl bg-[#3C83F6]/10 dark:bg-white/5 border border-[#3C83F6]/20 dark:border-white/10 text-[#3C83F6] dark:text-white/60 hover:bg-[#3C83F6]/15 dark:hover:bg-white/10 transition-colors font-medium"
                        >
                          <FiEye className="w-4 h-4" />
                          View Template
                        </button>
                        <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-black/40 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
}

