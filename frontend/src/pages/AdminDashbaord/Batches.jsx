import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import ThemeToggle from '../../components/Dashboard/ThemeToggle';
import { FiSearch, FiPlus } from 'react-icons/fi';

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
                  <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">{route.category}</p>
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
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* Header */}
            <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
              <div>
                <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">Batches</h1>
                <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">All active, upcoming, and completed cohorts</p>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => setIsSearchOpen(true)} className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group">
                  <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40" />
                  <span className="text-sm text-black/40 dark:text-white/40">Search...</span>
                  <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded"><span>⌘</span><span>K</span></div>
                </button>
                <ThemeToggle />
                <div className="w-9 h-9 rounded-full bg-[#3C83F6] dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-sm cursor-pointer hover:scale-105 transition-transform">A</div>
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
                  <p className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40">{label}</p>
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
                      className={`text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all duration-200
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
              <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl bg-[#3C83F6]/10 dark:bg-white/5 border border-[#3C83F6]/20 dark:border-white/10 text-[#3C83F6] dark:text-white/60 hover:bg-[#3C83F6]/15 dark:hover:bg-white/10 transition-colors font-medium shrink-0">
                <FiPlus className="w-3.5 h-3.5" />Create Batch
              </button>
            </div>

            {/* Batch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredBatches.map((batch) => (
                <div key={batch.id} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-7 rounded-2xl flex flex-col gap-5 hover:bg-white/60 dark:hover:bg-black/60 transition-colors group">

                  {/* College badge + Status */}
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-black/45 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/5">
                      {batch.college}
                    </span>
                    <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border ${statusBadge(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>

                  {/* Batch ID in blue + track neutral */}
                  <div>
                    <h3 className="text-xl font-light tracking-tight text-[#3C83F6] dark:text-white">{batch.id}</h3>
                    <p className="text-sm text-black/45 dark:text-white/40 mt-1 font-light">{batch.track}</p>
                  </div>

                  {/* Date + students info */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Start',    value: batch.start    },
                      { label: 'End',      value: batch.end      },
                      { label: 'Students', value: batch.students },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-black/30 dark:text-white/30">{label}</p>
                        <p className="text-xs font-medium text-black/65 dark:text-white/70 mt-1.5 leading-tight">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* View button */}
                  <button className="w-full py-2.5 text-[10px] uppercase tracking-widest text-black/35 dark:text-white/40 border border-black/5 dark:border-white/10 rounded-xl hover:border-black/15 dark:hover:border-white/20 hover:text-black/60 dark:hover:text-white/60 transition-all duration-200">
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
