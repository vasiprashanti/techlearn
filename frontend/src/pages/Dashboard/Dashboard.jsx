import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import { adminStats } from '../../data/adminDashboardMock';
import { FiSearch } from 'react-icons/fi';


const searchRoutes = [
  { id: "dashboard", title: "Dashboard", category: "Overview" },
  { id: "analytics", title: "Analytics", category: "Overview" },
  { id: "system-health", title: "System Health", category: "Overview" },
  { id: "colleges", title: "Colleges", category: "Organization" },
  { id: "batches", title: "Batches", category: "Organization" },
  { id: "students", title: "Students", category: "Organization" },
  { id: "question-bank", title: "Question Bank", category: "Learning" },
  { id: "track-templates", title: "Track Templates", category: "Learning" },
  { id: "resources", title: "Resources", category: "Learning" },
  { id: "certificates", title: "Certificates", category: "Learning" },
  { id: "submission-monitor", title: "Submission Monitor", category: "Operations" },
  { id: "notifications", title: "Notifications", category: "Operations" },
  { id: "audit-logs", title: "Audit Logs", category: "Operations" },
  { id: "reports", title: "Reports", category: "Operations" }
];


const Dashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);


  const isDarkMode = theme === 'dark';


  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery("");
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


  return (
    <>
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
                    <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}


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
            pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">


            <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
              <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">Overview</h1>


              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group"
                >
                  <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors" />
                  <span className="text-sm text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">Search...</span>
                  <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
                    <span>⌘</span><span>K</span>
                  </div>
                </button>


                <button
                  onClick={toggleTheme}
                  className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
                >
                  {isDarkMode ? 'Light' : 'Dark'}
                </button>


                <div className="w-9 h-9 rounded-full bg-[#3C83F6] dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-sm cursor-pointer hover:scale-105 transition-transform">
                  A
                </div>
              </div>
            </header>


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {adminStats.kpis.map((kpi, i) => (
                <div key={i} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-5 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-black/60 transition-colors rounded-xl">
                  <span className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">{kpi.title}</span>
                  <div className="mt-6 mb-1">
                    <span className="text-3xl font-light tracking-tighter text-[#3C83F6] dark:text-white">{kpi.value}</span>
                  </div>
                  <span className="text-[10px] text-black/40 dark:text-white/40">{kpi.subtitle}</span>
                </div>
              ))}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px]">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-8 shrink-0">College Performance Ranking</h3>
                <div className="flex-1 flex flex-col justify-between gap-6 relative">
                  <div className="absolute top-0 bottom-0 left-[120px] right-0 flex justify-between px-2 text-[10px] text-black/20 dark:text-white/20 pointer-events-none -z-10 items-end pb-[-20px]">
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                  </div>


                  {adminStats.collegeRanking.map((college, i) => (
                    <div key={i} className="flex items-center w-full z-10">
                      <div className="w-[120px] text-xs font-medium text-black/70 dark:text-white/70 truncate pr-4">
                        {college.name}
                      </div>
                      <div className="flex-1 h-8 bg-black/5 dark:bg-white/5 relative group cursor-crosshair rounded-r-md overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-[#3C83F6] dark:bg-white transition-all duration-1000 ease-out flex items-center justify-end pr-3 rounded-r-md"
                          style={{ width: `${college.score}%` }}
                        >
                          <span className="text-[10px] font-bold text-white dark:text-black opacity-0 group-hover:opacity-100 transition-opacity">
                            {college.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}


                  <div className="flex pl-[120px] justify-between text-[10px] font-medium text-black/40 dark:text-white/40 mt-2">
                    <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                  </div>
                </div>
              </div>


              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px]">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-6 shrink-0">Top Performing Students</h3>
                <div className="flex-1 flex flex-col justify-between">
                  {adminStats.topStudents.map((student) => (
                    <div key={student.rank} className="flex items-center gap-4 group py-1">
                      <div className="w-4 text-sm font-medium text-black/30 dark:text-white/30 text-right shrink-0">{student.rank}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer truncate">{student.name}</h4>
                        <p className="text-[10px] text-black/50 dark:text-white/50 truncate">{student.college} · {student.track}</p>
                      </div>
                      <div className="text-sm font-light text-[#3C83F6] dark:text-white shrink-0 pl-2">{student.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">


              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col h-full min-h-[380px]">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-6 shrink-0">Recent Student Activity</h3>
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  {adminStats.recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/50 flex items-center justify-center text-[10px] font-medium text-[#3C83F6] dark:text-white border border-black/10 dark:border-white/10 shrink-0 shadow-sm group-hover:bg-[#3C83F6] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                          {activity.name.charAt(0)}
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white truncate">{activity.name}</h4>
                          <p className="text-[10px] text-black/50 dark:text-white/50 truncate">{activity.batch} · Streak: {activity.streak} days</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-black/30 dark:text-white/30 shrink-0">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>


              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col h-full min-h-[380px]">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-6 shrink-0">Most Solved Questions</h3>
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  {adminStats.mostSolved.map((question, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="min-w-0 pr-4">
                        <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{question.title}</h4>
                        <div className="flex items-center gap-2 mt-1 truncate">
                          <p className="text-[10px] text-black/50 dark:text-white/50 truncate">{question.track}</p>
                          <span className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm shrink-0
                            ${question.difficulty === 'Easy' ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' :
                              question.difficulty === 'Medium' ? 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5' :
                              'border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5'}
                          `}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-light text-black/70 dark:text-white/70 whitespace-nowrap shrink-0">{question.count}</span>
                    </div>
                  ))}
                </div>
              </div>


              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col h-full min-h-[380px]">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-6 shrink-0">Upcoming & Active Batches</h3>
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  {adminStats.batches.map((batch, i) => (
                    <div key={i} className="p-4 border border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 transition-colors rounded-lg cursor-pointer group shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{batch.id}</h4>
                          <span className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm
                            ${batch.status === 'Active' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'}
                          `}>
                            {batch.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-black/60 dark:text-white/60 mb-2 font-medium truncate">{batch.college} · <span className="font-light">{batch.track}</span></p>
                      <div className="flex items-center gap-1 text-[9px] text-black/40 dark:text-white/40 uppercase tracking-widest">
                        <span>{batch.start}</span>
                        <span className="mx-1">→</span>
                        <span>{batch.end}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


            </div>


          </div>
        </main>
      </div>
    </>
  );
};


export default Dashboard;
