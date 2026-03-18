import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import {  FiSearch, FiPlus, FiUpload , FiBell } from 'react-icons/fi';

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

const studentsData = [
  { name: "Alex Johnson",   email: "alex@mit.edu",        college: "MIT",                 batch: "CS-2024A",  track: "Data Structures & Algorithms", score: 92, streak: 15, status: "Active"   },
  { name: "Sarah Williams", email: "sarah@stanford.edu",  college: "Stanford University", batch: "DS-2024A",  track: "Python Programming",           score: 88, streak: 12, status: "Active"   },
  { name: "Mike Chen",      email: "mike@mit.edu",        college: "MIT",                 batch: "CS-2024B",  track: "Web Development",              score: 95, streak: 22, status: "Active"   },
  { name: "Emily Davis",    email: "emily@iitd.ac.in",    college: "IIT Delhi",           batch: "WD-2024A",  track: "Web Development",              score: 79, streak: 8,  status: "Active"   },
  { name: "James Wilson",   email: "james@stanford.edu",  college: "Stanford University", batch: "DS-2024A",  track: "Python Programming",           score: 67, streak: 3,  status: "Inactive" },
  { name: "Lisa Anderson",  email: "lisa@mit.edu",        college: "MIT",                 batch: "CS-2024A",  track: "Data Structures & Algorithms", score: 85, streak: 10, status: "Active"   },
  { name: "David Kim",      email: "david@iitd.ac.in",    college: "IIT Delhi",           batch: "WD-2024B",  track: "Database Management",          score: 91, streak: 18, status: "Active"   },
  { name: "Rachel Green",   email: "rachel@stanford.edu", college: "Stanford University", batch: "DS-2024A",  track: "Python Programming",           score: 94, streak: 20, status: "Active"   },
  { name: "Tom Brown",      email: "tom@mit.edu",         college: "MIT",                 batch: "CS-2024B",  track: "Web Development",              score: 72, streak: 5,  status: "Inactive" },
  { name: "Priya Patel",    email: "priya@iitd.ac.in",    college: "IIT Delhi",           batch: "DSA-2024C", track: "Data Structures & Algorithms", score: 89, streak: 14, status: "Active"   },
  { name: "Kevin Zhang",    email: "kevin@harvard.edu",   college: "Harvard University",  batch: "ML-2024A",  track: "Machine Learning",             score: 96, streak: 25, status: "Active"   },
  { name: "Anna Martinez",  email: "anna@harvard.edu",    college: "Harvard University",  batch: "ML-2024A",  track: "Machine Learning",             score: 82, streak: 9,  status: "Active"   },
];

const uniqueColleges = ["All Colleges", ...new Set(studentsData.map(s => s.college))];
const uniqueTracks   = ["All Tracks",   ...new Set(studentsData.map(s => s.track))];

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

const Students = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [tableSearch, setTableSearch]   = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [trackFilter, setTrackFilter]     = useState('All Tracks');
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
  const filteredStudents = studentsData.filter(s => {
    const matchCollege = collegeFilter === 'All Colleges' || s.college === collegeFilter;
    const matchTrack   = trackFilter   === 'All Tracks'   || s.track   === trackFilter;
    const matchStatus  = statusFilter  === 'All'          || s.status  === statusFilter;
    const matchSearch  = !tableSearch  ||
      s.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
      s.batch.toLowerCase().includes(tableSearch.toLowerCase());
    return matchCollege && matchTrack && matchStatus && matchSearch;
  });

  const scoreColor = (s) => s >= 90 ? 'text-emerald-500' : s >= 75 ? 'text-[#3C83F6] dark:text-blue-400' : 'text-amber-500';
  const scoreBg    = (s) => s >= 90 ? 'bg-emerald-500'   : s >= 75 ? 'bg-[#3C83F6]'                        : 'bg-amber-500';

  const dropdownClass = `
    appearance-none text-[11px] tracking-wide pl-4 pr-8 py-2.5 rounded-xl
    border border-black/10 dark:border-white/10
    bg-white/60 dark:bg-black/40
    text-black/60 dark:text-white/60
    focus:outline-none focus:border-black/20 dark:focus:border-white/20
    transition-colors cursor-pointer
  `;

  return (
    <>
      <SearchModal
        isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef} filteredRoutes={filteredRoutes} navigate={navigate}
      />

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-10 lg:px-14 overflow-auto ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* Header */}
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 py-3 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">Students</h1>
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

            {/* Filter Panel */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl p-5 flex flex-col gap-4">

              {/* Row 1 — search + dropdowns */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                  <input
                    type="text"
                    placeholder="Search name, email or batch..."
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-colors w-60"
                  />
                </div>
                <div className="relative">
                  <select value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)} className={dropdownClass}>
                    {uniqueColleges.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[10px]">▾</span>
                </div>
                <div className="relative">
                  <select value={trackFilter} onChange={e => setTrackFilter(e.target.value)} className={dropdownClass}>
                    {uniqueTracks.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[10px]">▾</span>
                </div>
              </div>

              {/* Row 2 — status tabs + actions */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-1">
                  {['All', 'Active', 'Inactive'].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-lg transition-all duration-200
                        ${statusFilter === s
                          ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm font-semibold'
                          : 'text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60'
                        }`}
                    >
                      {s}
                      <span className="ml-1.5 opacity-50 text-[9px]">
                        {s === 'All' ? studentsData.length : studentsData.filter(st => st.status === s).length}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Bulk Import — subtle */}
                  <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl border border-[#3C83F6]/20 text-[#3C83F6] dark:border-white/10 dark:text-white/50 hover:bg-[#3C83F6]/5 dark:hover:bg-white/5 transition-colors">
                    <FiUpload className="w-3.5 h-3.5" />Bulk Import
                  </button>
                  {/* Add Student — slightly more prominent */}
                  <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl bg-[#3C83F6]/10 dark:bg-white/5 border border-[#3C83F6]/20 dark:border-white/10 text-[#3C83F6] dark:text-white/60 hover:bg-[#3C83F6]/15 dark:hover:bg-white/10 transition-colors font-medium">
                    <FiPlus className="w-3.5 h-3.5" />Add Student
                  </button>
                </div>
              </div>
            </div>

            {/* Result count */}
            <p className="text-[10px] uppercase tracking-widest text-black/30 dark:text-white/30 -mt-2">
              {filteredStudents.length} of {studentsData.length} students
            </p>

            {/* Table — fixed layout */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[7%]"  />
                  <col className="w-[8%]"  />
                  <col className="w-[8%]"  />
                </colgroup>
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/5">
                    {['Name', 'College', 'Batch', 'Track', 'Score', 'Streak', 'Status', ''].map((col, i) => (
                      <th key={i} className="px-5 py-4 text-left text-[9px] uppercase tracking-widest font-medium text-black/30 dark:text-white/30">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, i) => (
                    <tr key={i} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-white/30 dark:hover:bg-white/[0.03] transition-colors group">

                      {/* Name + email — name in blue */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-white flex items-center justify-center text-[11px] font-medium shrink-0 border border-[#3C83F6]/15 dark:border-white/10">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#3C83F6] dark:text-white truncate">{student.name}</p>
                            <p className="text-[10px] text-black/35 dark:text-white/30 mt-0.5 truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* College — neutral */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-black/55 dark:text-white/50 truncate block">{student.college}</span>
                      </td>

                      {/* Batch — neutral */}
                      <td className="px-5 py-4">
                        <span className="text-[10px] uppercase tracking-widest text-black/55 dark:text-white/50 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg border border-black/5 dark:border-white/5 whitespace-nowrap">
                          {student.batch}
                        </span>
                      </td>

                      {/* Track — neutral */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-black/45 dark:text-white/40 truncate block">{student.track}</span>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium tabular-nums shrink-0 ${scoreColor(student.score)}`}>{student.score}%</span>
                          <div className="flex-1 h-px bg-black/8 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreBg(student.score)}`} style={{ width: `${student.score}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Streak */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-black/45 dark:text-white/50">{student.streak}d</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border whitespace-nowrap
                          ${student.status === 'Active'
                            ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                            : 'border-rose-400/20 text-rose-500 dark:text-rose-400 bg-rose-400/5'
                          }`}>
                          {student.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        <button className="text-[10px] uppercase tracking-widest text-black/25 dark:text-white/30 group-hover:text-[#3C83F6] dark:group-hover:text-white/60 transition-colors whitespace-nowrap">
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default Students;
