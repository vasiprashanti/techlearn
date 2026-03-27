import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Context & Data
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { adminStats } from "../../data/adminDashboardMock";

// Components
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin// <-- FIXED: Now using the exact Dashboard Sidebar
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from "../../components/Loader/Loader3D"; 

// Icons
import { FiSearch, FiBell, FiClock, FiTrendingUp, FiAward } from "react-icons/fi";

// --- Dashboard Logic (Search Routes) ---
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
  { id: "reports", title: "Reports", category: "Operations" },
  { id: "settings", title: "Settings", category: "Configuration" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // --- AdminDashboard States ---
  const [loading] = useState(false);

  // --- Dashboard States ---
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const isDarkMode = theme === "dark";

  // --- Dashboard Effects ---
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  // --- Helpers ---
  const filteredRoutes = searchRoutes.filter(
    (route) =>
      route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRouteSelect = (id) => {
    setIsSearchOpen(false);
    navigate(`/${id}`);
  };

  // --- Loading Return from AdminDashboard ---
  if (loading) {
    return (
      <LoadingScreen
        showMessage={false}
        fullScreen={true}
        size={40}
        duration={800}
      />
    );
  }

  // --- 1:1 Visual Return from Dashboard ---
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
                      <p className="admin-micro-label text-black/40 dark:text-white/40 mt-1">
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

      {/* Main Layout */}
      <div
        className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${
          isDarkMode ? "dark" : "light"
        }`}
      >
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
            isDarkMode
              ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
              : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"
          }`}
        />

        <Sidebar
          onToggle={setSidebarCollapsed}
          isCollapsed={sidebarCollapsed}
        />

        <main
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 
            ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
            pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <h1 className="admin-page-title">
                Dashboard
              </h1>

              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {adminStats.kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-5 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-black/60 transition-colors rounded-xl"
                >
                  <span className="admin-micro-label text-black/50 dark:text-white/50">
                    {kpi.title}
                  </span>
                  <div className="mt-6 mb-1">
                    <span className="text-3xl font-light tracking-tighter text-[#3C83F6] dark:text-white">
                      {kpi.value}
                    </span>
                  </div>
                  <span className="text-[10px] text-black/40 dark:text-white/40">
                    {kpi.subtitle}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px]">
                <h3 className="admin-section-heading mb-8 shrink-0">
                  College Performance Ranking
                </h3>
                <div className="flex-1 flex flex-col justify-between gap-6 relative">
                  <div className="absolute top-0 bottom-0 left-[180px] right-0 flex justify-between px-2 text-[10px] text-black/20 dark:text-white/20 pointer-events-none -z-10 items-end pb-[-20px]">
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                    <div className="h-full w-[1px] bg-black/5 dark:bg-white/5"></div>
                  </div>

                  {adminStats.collegeRanking.map((college, i) => (
                    <div key={i} className="flex items-center w-full z-10">
                      <div className="w-[180px] text-xs font-medium text-black/70 dark:text-white/70 pr-4 leading-tight whitespace-normal break-words">
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

                  <div className="flex pl-[180px] justify-between text-[10px] font-medium text-black/40 dark:text-white/40 mt-2">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px]">
                <h3 className="admin-section-heading mb-6 shrink-0">
                  Top Performing Students
                </h3>
                <div className="flex-1 flex flex-col justify-between">
                  {adminStats.topStudents.map((student) => (
                    <div
                      key={student.rank}
                      className="flex items-center gap-4 group py-1"
                    >
                      <div className="w-4 text-sm font-medium text-black/30 dark:text-white/30 text-right shrink-0">
                        {student.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer truncate">
                          {student.name}
                        </h4>
                        <p className="text-[10px] text-black/50 dark:text-white/50 truncate">
                          {student.college} · {student.track}
                        </p>
                      </div>
                      <div className="text-sm font-light text-[#3C83F6] dark:text-white shrink-0 pl-2">
                        {student.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 rounded-xl flex flex-col h-[360px]">
                  <h3 className="admin-section-heading flex items-center gap-2 mb-3 shrink-0">
                    <FiClock className="w-4 h-4 text-[#3C83F6] dark:text-white/80" />
                    Recent Student Activity
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-1">
                    {adminStats.recentActivity.map((activity, i) => (
                      <div
                        key={i}
                        className={`py-3 ${i !== adminStats.recentActivity.length - 1 ? "border-b border-black/10 dark:border-white/10" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white truncate">
                              {activity.name}
                            </h4>
                            <p className="text-xs text-black/55 dark:text-white/55 truncate">
                              {activity.batch} · Streak: {activity.streak} days
                            </p>
                          </div>
                          <span className="text-xs text-black/45 dark:text-white/45 shrink-0">
                            {activity.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 rounded-xl flex flex-col h-[360px]">
                  <h3 className="admin-section-heading flex items-center gap-2 mb-3 shrink-0">
                    <FiTrendingUp className="w-4 h-4 text-[#3C83F6] dark:text-white/80" />
                    Most Solved Questions
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-1">
                    {adminStats.mostSolved.map((question, i) => (
                      <div
                        key={i}
                        className={`py-3 ${i !== adminStats.mostSolved.length - 1 ? "border-b border-black/10 dark:border-white/10" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white truncate">
                              {question.title}
                            </h4>
                            <p className="text-xs text-black/55 dark:text-white/55 truncate">
                              {question.track}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 pl-2">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium
                              ${
                                question.difficulty === "Easy"
                                  ? "border-emerald-500/20 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5"
                                  : question.difficulty === "Medium"
                                  ? "border-amber-500/20 text-amber-700 dark:text-amber-400 bg-amber-500/5"
                                  : "border-rose-500/20 text-rose-700 dark:text-rose-400 bg-rose-500/5"
                              }`}
                            >
                              {question.difficulty}
                            </span>
                            <span className="text-xs text-black/55 dark:text-white/55 whitespace-nowrap">
                              {question.count} solved
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 rounded-xl flex flex-col h-[280px]">
                <h3 className="admin-section-heading flex items-center gap-2 mb-4 shrink-0">
                  <FiAward className="w-4 h-4 text-[#3C83F6] dark:text-white/80" />
                  Upcoming & Active Batches
                </h3>
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {adminStats.batches.map((batch, i) => (
                      <div
                        key={i}
                        className="p-4 border border-black/8 dark:border-white/10 bg-white/25 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/35 transition-colors rounded-lg cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <h4 className="text-lg font-medium text-[#2563eb] dark:text-white truncate">
                            {batch.id}
                          </h4>
                          <span
                              className={`text-[10px] px-2.5 py-1 rounded-lg border uppercase tracking-wide font-semibold shrink-0
                            ${
                              batch.status === "Active"
                                ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                                : "border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {batch.status}
                          </span>
                        </div>
                        <p className="text-sm text-black/75 dark:text-white/75 font-medium truncate">
                          {batch.college}
                        </p>
                        <p className="text-sm text-black/60 dark:text-white/60 truncate mt-0.5">
                          {batch.track}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-black/45 dark:text-white/45 mt-2">
                          <span>{batch.start}</span>
                          <span>→</span>
                          <span>{batch.end}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}