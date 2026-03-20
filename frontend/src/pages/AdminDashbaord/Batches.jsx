import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import {  FiSearch, FiPlus , FiBell } from 'react-icons/fi';

const searchRoutes = [
  { id: "dashboard",          title: "Dashboard",          category: "Overview"     },
  { id: "analytics",          title: "Analytics",          category: "Overview"     },
  { id: "system-health",      title: "System Health",      category: "Overview"     },
  { id: "colleges",           title: "Colleges",           category: "Organization" },
  { id: "batches",            title: "Batches",            category: "Organization" },
  { id: "students",           title: "Students",           category: "Organization" },
  { id: "question-bank",      title: "Question Bank",      category: "Learning"     },
  { id: "track-templates",    title: "Track Templates",    category: "Learning"     },
  { id: "resources",          title: "Resources",          category: "Learning"     },
  { id: "certificates",       title: "Certificates",       category: "Learning"     },
  { id: "submission-monitor", title: "Submission Monitor", category: "Operations"   },
  { id: "notifications",      title: "Notifications",      category: "Operations"   },
  { id: "audit-logs",         title: "Audit Logs",         category: "Operations"   },
  { id: "reports",            title: "Reports",            category: "Operations"   },
];

const batchesData = [
  { id: "CS-2024A",  college: "MIT",                 track: "Data Structures & Algorithms", status: "Active",    start: "Jun 1, 2024",  end: "Dec 1, 2024",  students: 2 },
  { id: "CS-2024B",  college: "MIT",                 track: "Web Development",              status: "Active",    start: "Jul 15, 2024", end: "Jan 15, 2025", students: 2 },
  { id: "DS-2024A",  college: "Stanford University", track: "Python Programming",           status: "Active",    start: "Jun 15, 2024", end: "Dec 15, 2024", students: 3 },
  { id: "WD-2024A",  college: "IIT Delhi",           track: "Web Development",              status: "Active",    start: "Aug 1, 2024",  end: "Feb 1, 2025",  students: 1 },
  { id: "WD-2024B",  college: "IIT Delhi",           track: "Database Management",          status: "Upcoming",  start: "Sep 1, 2024",  end: "Mar 1, 2025",  students: 1 },
  { id: "ML-2024A",  college: "Harvard University",  track: "Machine Learning",             status: "Completed", start: "Jun 1, 2024",  end: "Nov 30, 2024", students: 2 },
  { id: "DSA-2024C", college: "IIT Delhi",           track: "Data Structures & Algorithms", status: "Active",    start: "Oct 1, 2024",  end: "Apr 1, 2025",  students: 1 },
];

const colleges = ["All Colleges", "MIT", "Stanford University", "IIT Delhi", "Harvard University", "IIT Bombay"];

// Upcoming → indigo instead of amber
const statusBadge = (status) => {
  if (status === 'Active')    return 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5';
  if (status === 'Upcoming')  return 'border-indigo-400/20 text-indigo-500 dark:text-indigo-400 bg-indigo-400/5';
  return 'border-black/10 dark:border-white/10 text-black/35 dark:text-white/30 bg-black/3';
};

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, searchInputRef, filteredRoutes, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
          <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
          <input
            ref={searchInputRef} type="text"
            placeholder="Search pages, tracks, or settings..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
          />
          <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={onClose}>
            <span>ESC</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredRoutes.length === 0
            ? <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results found for "{searchQuery}"</div>
            : filteredRoutes.map(route => (
              <button key={route.id} onClick={() => { onClose(); navigate(`/${route.id}`); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                <div>
                  <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>

                </div>
                <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
};

const Batches = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [statusFilter, setStatusFilter]   = useState('All');
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(p => !p); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    else setSearchQuery('');
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBatches = batchesData.filter(b => {
    const matchCollege = collegeFilter === 'All Colleges' || b.college === collegeFilter;
    const matchStatus  = statusFilter  === 'All'          || b.status  === statusFilter;
    return matchCollege && matchStatus;
  });

  const counts = {
    Active:    batchesData.filter(b => b.status === 'Active').length,
    Upcoming:  batchesData.filter(b => b.status === 'Upcoming').length,
    Completed: batchesData.filter(b => b.status === 'Completed').length,
  };

  return (
    <>
      <SearchModal
        isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef} filteredRoutes={filteredRoutes} navigate={navigate}
      />

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* Header */}
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Batches</h1>

              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => setIsSearchOpen(true)} className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group">
                  <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40" />
                  <span className="text-sm text-black/40 dark:text-white/40">Search...</span>
                  <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded"><span>⌘</span><span>K</span></div>
                </button>
                <button className='relative text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors'><FiBell className='w-5 h-5' /><span className='absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500' /></button>
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                  >
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </button>

                  {/* Luxury Profile Dropdown */}
                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Profile Header */}
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

                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              // Navigate to profile settings if needed
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">Profile Settings</div>
                              <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                            </div>
                          </button>

                          <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10"></div>

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              logout();
                            }}
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

                        {/* Footer */}
                        <div className="px-4 py-2 bg-black/2.5 dark:bg-white/2.5 border-t border-black/5 dark:border-white/5">
                          <p className="text-[9px] text-black/40 dark:text-white/40 text-center">
                            TechLearn Admin Panel v2.0
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active',    count: counts.Active,    color: 'text-emerald-500'                          },
                { label: 'Upcoming',  count: counts.Upcoming,  color: 'text-indigo-500 dark:text-indigo-400'      },
                { label: 'Completed', count: counts.Completed, color: 'text-black/35 dark:text-white/40'          },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl px-6 py-5">
                  <p className="admin-micro-label text-black/40 dark:text-white/40">{label}</p>
                  <p className={`text-3xl font-light tracking-tight mt-2 ${color}`}>{count}</p>
                </div>
              ))}
            </div>

            {/* Filters row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* College dropdown */}
                <div className="relative">
                  <select
                    value={collegeFilter}
                    onChange={e => setCollegeFilter(e.target.value)}
                    className="appearance-none text-[11px] tracking-wide pl-4 pr-8 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/40 text-black/60 dark:text-white/60 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors cursor-pointer"
                  >
                    {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[10px]">▾</span>
                </div>

                {/* Status pill tabs */}
                <div className="flex items-center bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-1">
                  {['All', 'Active', 'Upcoming', 'Completed'].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`admin-micro-label px-3 py-1.5 rounded-lg transition-all duration-200
                        ${statusFilter === s
                          ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm font-semibold'
                          : 'text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Batch — blue accent */}
              <button className="flex items-center gap-2 admin-micro-label px-4 py-2.5 rounded-xl bg-[#3C83F6]/10 dark:bg-white/5 border border-[#3C83F6]/20 dark:border-white/10 text-[#3C83F6] dark:text-white/60 hover:bg-[#3C83F6]/15 dark:hover:bg-white/10 transition-colors font-medium shrink-0">
                <FiPlus className="w-3.5 h-3.5" />Create Batch
              </button>
            </div>

            {/* Batch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredBatches.map((batch) => (
                <div key={batch.id} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-5 rounded-2xl flex flex-col gap-4 hover:bg-white/60 dark:hover:bg-black/60 transition-colors group">

                  {/* College badge + Status */}
                  <div className="flex items-start justify-between">
                    <span className="admin-micro-label text-black/45 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/5">
                      {batch.college}
                    </span>
                    <span className={`admin-micro-label px-2.5 py-1 rounded-lg border ${statusBadge(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>

                  {/* Batch ID in blue + track neutral */}
                  <div className="space-y-0.5">
                    <h3 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white leading-none">{batch.id}</h3>
                    <p className="text-sm text-black/45 dark:text-white/40 font-light leading-snug">{batch.track}</p>
                  </div>

                  {/* Date + students info */}
                  <div className="grid grid-cols-[1.45fr_0.9fr] gap-2.5">
                    <div className="bg-white/55 dark:bg-white/5 rounded-xl px-3 py-2.5 border border-black/5 dark:border-white/5 flex items-center justify-between gap-2 min-h-[48px]">
                      <p className="admin-micro-label font-semibold text-black/30 dark:text-white/30">Start</p>
                      <p className="text-[11px] font-semibold text-black/70 dark:text-white/75 leading-none whitespace-nowrap">{batch.start}</p>
                    </div>

                    <div className="row-span-2 bg-white/55 dark:bg-white/5 rounded-xl px-3 py-2.5 border border-black/5 dark:border-white/5 flex flex-col min-h-[104px]">
                      <p className="admin-micro-label font-semibold text-black/30 dark:text-white/30 text-center">Students</p>
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-2xl font-semibold text-[#3C83F6] dark:text-blue-400 leading-none">{batch.students}</p>
                      </div>
                    </div>

                    <div className="bg-white/55 dark:bg-white/5 rounded-xl px-3 py-2.5 border border-black/5 dark:border-white/5 flex items-center justify-between gap-2 min-h-[48px]">
                      <p className="admin-micro-label font-semibold text-black/30 dark:text-white/30">End</p>
                      <p className="text-[11px] font-semibold text-black/70 dark:text-white/75 leading-none whitespace-nowrap">{batch.end}</p>
                    </div>
                  </div>

                  {/* View button */}
                  <button className="w-full py-2.5 admin-micro-label text-black/35 dark:text-white/40 border border-black/5 dark:border-white/10 rounded-xl hover:border-black/15 dark:hover:border-white/20 hover:text-black/60 dark:hover:text-white/60 transition-all duration-200">
                    View Batch →
                  </button>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default Batches;
