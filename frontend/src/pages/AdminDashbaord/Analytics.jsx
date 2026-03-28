import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { FiSearch, FiBell, FiCode, FiGitBranch, FiFileText, FiBarChart2 } from 'react-icons/fi';

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

// --- MOCK DATA ---
const analyticsData = {
  platformOverview: [
    { label: "Total Colleges", value: "5" },
    { label: "Total Batches", value: "7" },
    { label: "Total Students", value: "12" },
    { label: "Active Students Today", value: "10" },
    { label: "Total Questions", value: "10" },
    { label: "Track Templates", value: "3" },
    { label: "Total Courses", value: "5" },
    { label: "Certificates Issued", value: "12" },
  ],
  studentEngagement: {
    dailyActive: 10,
    totalStudents: 12,
    weeklyActive: 10,
    inactive: 2,
    avgStreak: 13.4,
  },
  learningPerformance: {
    avgScore: 86,
    submissionSuccess: 64,
    avgSolveTime: 18,
  },
  batchPerformance: {
    active: 5,
    upcoming: 1,
    completed: 1,
    topBatches: [
      { rank: 1, id: "CS-2024A",  college: "MIT",                students: 2, avg: 89 },
      { rank: 2, id: "DSA-2024C", college: "IIT Delhi",          students: 1, avg: 89 },
      { rank: 3, id: "CS-2024B",  college: "MIT",                students: 2, avg: 84 },
      { rank: 4, id: "DS-2024A",  college: "Stanford University", students: 3, avg: 83 },
      { rank: 5, id: "WD-2024A",  college: "IIT Delhi",          students: 1, avg: 79 },
    ],
  },
  contentInsights: {
    totalQuestions: 10,
    usedInTracks: 6,
    unusedQuestions: 4,
    avgTrackLength: 22,
    difficulty: [
      { label: "Easy",   count: 3 },
      { label: "Medium", count: 4 },
      { label: "Hard",   count: 3 },
    ],
    trackTemplates: 3,
  },
  platformHealth: {
    engagementRate: 83,
    activeStudents: 10,
    totalStudents: 12,
    resourcesUploaded: 48,
    resourcesViewed: 312,
  },
};

const Analytics = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
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

  const contentInsights = analyticsData.contentInsights;
  const maxDifficultyCount = Math.max(...contentInsights.difficulty.map((item) => item.count), 1);

  return (
    <>
      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
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

                    </div>
                    <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
            isDarkMode
              ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
              : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 
            ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} 
            pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* Header */}
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Analytics</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* Platform Overview */}
            <section>
              <h2 className="admin-section-heading mb-4">Platform Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analyticsData.platformOverview.map((kpi, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-white backdrop-blur-xl border border-black/10 dark:border-black/20 p-5 flex flex-col justify-between hover:bg-white transition-colors rounded-xl"
                  >
                    <span className="admin-micro-label text-black/50 dark:text-white/50 leading-snug">{kpi.label}</span>
                    <span className="text-3xl font-light tracking-tighter text-[#3C83F6] dark:text-white mt-5">{kpi.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Student Engagement + Learning Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Student Engagement */}
              <div className="bg-white dark:bg-white backdrop-blur-xl border border-black/10 dark:border-black/20 p-8 rounded-xl flex flex-col">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="admin-section-heading">Student Engagement</h3>
                  <button
                    onClick={() => navigate('/students')}
                    className="admin-micro-label text-[#3C83F6] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                  >
                    View Details →
                  </button>
                </div>

                {/* Daily Active — hero stat */}
                <div className="mb-6 p-5 bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20">
                  <span className="admin-micro-label text-black/40 dark:text-white/40">Daily Active Students</span>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-light tracking-tighter text-[#3C83F6] dark:text-white">
                      {analyticsData.studentEngagement.dailyActive}
                    </span>
                    <span className="text-lg font-light text-black/30 dark:text-white/30 mb-1">
                      / {analyticsData.studentEngagement.totalStudents}
                    </span>
                  </div>
                  <div className="mt-3 w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3C83F6] dark:bg-white transition-all duration-1000 ease-out rounded-full"
                      style={{ width: `${(analyticsData.studentEngagement.dailyActive / analyticsData.studentEngagement.totalStudents) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="admin-micro-label text-black/40 dark:text-white/40">Weekly Active</span>
                    <span className="text-2xl font-light tracking-tighter text-[#3C83F6] dark:text-white mt-2">
                      {analyticsData.studentEngagement.weeklyActive}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="admin-micro-label text-black/40 dark:text-white/40">Inactive 3+ days</span>
                    <span className="text-2xl font-light tracking-tighter text-amber-500 mt-2">
                      {analyticsData.studentEngagement.inactive}
                    </span>
                    <span className="text-[9px] text-amber-500/70 mt-0.5">Needs attention</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="admin-micro-label text-black/40 dark:text-white/40">Avg Streak</span>
                    <span className="text-2xl font-light tracking-tighter text-[#3C83F6] dark:text-white mt-2">
                      {analyticsData.studentEngagement.avgStreak}
                    </span>
                    <span className="text-[9px] text-black/40 dark:text-white/40 mt-0.5">days</span>
                  </div>
                </div>
              </div>

              {/* Learning Performance */}
              <div className="bg-white dark:bg-white backdrop-blur-xl border border-black/10 dark:border-black/20 p-8 rounded-xl flex flex-col">
                <h3 className="admin-section-heading mb-6 shrink-0">Learning Performance</h3>
                <div className="flex-1 flex flex-col justify-between gap-6">

                  {/* Avg Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-black/70 dark:text-white/70">Average Score</span>
                      <span className="text-2xl font-light tracking-tighter text-[#3C83F6] dark:text-white">
                        {analyticsData.learningPerformance.avgScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3C83F6] dark:bg-white transition-all duration-1000 ease-out"
                        style={{ width: `${analyticsData.learningPerformance.avgScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Submission Success */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-black/70 dark:text-white/70">Submission Success Rate</span>
                      <span className="text-2xl font-light tracking-tighter text-[#3C83F6] dark:text-white">
                        {analyticsData.learningPerformance.submissionSuccess}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3C83F6] dark:bg-white transition-all duration-1000 ease-out"
                        style={{ width: `${analyticsData.learningPerformance.submissionSuccess}%` }}
                      />
                    </div>
                  </div>

                  {/* Avg Solve Time */}
                  <div className="p-5 bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20 flex items-center justify-between">
                    <span className="admin-micro-label text-black/40 dark:text-white/40">Average Solve Time</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-light tracking-tighter text-[#3C83F6] dark:text-white">
                        {analyticsData.learningPerformance.avgSolveTime}
                      </span>
                      <span className="text-sm font-light text-black/40 dark:text-white/40">min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Batch Performance */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white dark:bg-white backdrop-blur-xl border border-black/10 dark:border-black/20 p-8 rounded-xl flex flex-col">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="admin-section-heading">Batch Performance</h3>
                  <button
                    onClick={() => navigate('/batches')}
                    className="admin-micro-label text-[#3C83F6] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                  >
                    View Details →
                  </button>
                </div>

                {/* Status pills */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20">
                    <span className="text-3xl font-light tracking-tighter text-emerald-500">
                      {analyticsData.batchPerformance.active}
                    </span>
                    <p className="admin-micro-label text-black/40 dark:text-white/40 mt-1">Active</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20">
                    <span className="text-3xl font-light tracking-tighter text-amber-500">
                      {analyticsData.batchPerformance.upcoming}
                    </span>
                    <p className="admin-micro-label text-black/40 dark:text-white/40 mt-1">Upcoming</p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20">
                    <span className="text-3xl font-light tracking-tighter text-black/50 dark:text-white/50">
                      {analyticsData.batchPerformance.completed}
                    </span>
                    <p className="admin-micro-label text-black/40 dark:text-white/40 mt-1">Completed</p>
                  </div>
                </div>

                <h4 className="admin-section-heading mb-4 shrink-0">
                  Top Performing Batches
                </h4>
                <div className="flex-1 flex flex-col justify-between gap-3">
                  {analyticsData.batchPerformance.topBatches.map((batch) => (
                    <div key={batch.rank} className="flex items-center gap-4 group py-1">
                      <div className="w-5 text-sm font-medium text-black/30 dark:text-white/30 text-right shrink-0">
                        #{batch.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {batch.id}
                        </h5>
                        <p className="text-[10px] text-black/50 dark:text-white/50 truncate">
                          {batch.college} · {batch.students} student{batch.students !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-sm font-light text-[#3C83F6] dark:text-white shrink-0">
                        Avg {batch.avg}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Insights */}
            <section className="bg-white dark:bg-white backdrop-blur-xl border border-black/10 dark:border-black/20 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-5 shrink-0">
                <h3 className="admin-section-heading">Content Insights</h3>
                <button
                  onClick={() => navigate('/question-bank')}
                  className="admin-micro-label text-[#3C83F6] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                >
                  View Details →
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-4 items-stretch">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <article className="bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20 p-4 flex items-center gap-3 min-h-[124px]">
                    <div className="w-11 h-11 rounded-full bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-white flex items-center justify-center shrink-0">
                      <FiCode className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-4xl font-light tracking-tight text-[#3C83F6] dark:text-white leading-none">{contentInsights.totalQuestions}</p>
                      <p className="text-sm text-black/55 dark:text-white/55 mt-1">Total Questions</p>
                    </div>
                  </article>

                  <article className="bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20 p-4 flex items-center gap-3 min-h-[124px]">
                    <div className="w-11 h-11 rounded-full bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-white flex items-center justify-center shrink-0">
                      <FiGitBranch className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-4xl font-light tracking-tight text-[#3C83F6] dark:text-white leading-none">{contentInsights.usedInTracks}</p>
                      <p className="text-sm text-black/55 dark:text-white/55 mt-1">Used in Tracks</p>
                    </div>
                  </article>

                  <article className="bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20 p-4 flex items-center gap-3 min-h-[124px]">
                    <div className="w-11 h-11 rounded-full bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-white flex items-center justify-center shrink-0">
                      <FiFileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-4xl font-light tracking-tight text-[#3C83F6] dark:text-white leading-none">{contentInsights.unusedQuestions}</p>
                      <p className="text-sm text-black/55 dark:text-white/55 mt-1">Unused Questions</p>
                    </div>
                  </article>

                  <article className="bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20 p-4 flex items-center gap-3 min-h-[124px]">
                    <div className="w-11 h-11 rounded-full bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-white flex items-center justify-center shrink-0">
                      <FiBarChart2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-4xl font-light tracking-tight text-[#3C83F6] dark:text-white leading-none">{contentInsights.avgTrackLength}</p>
                      <p className="text-sm text-black/55 dark:text-white/55 mt-1">Avg Track Length</p>
                    </div>
                  </article>
                </div>

                <article className="bg-white dark:bg-white rounded-xl border border-black/10 dark:border-black/20 p-5 flex flex-col justify-between min-h-[264px]">
                  <h4 className="text-xl font-medium text-black/85 dark:text-white/90 mb-5">Difficulty Distribution</h4>
                  <div className="space-y-4">
                    {contentInsights.difficulty.map((item) => {
                      const widthPercentage = Math.round((item.count / maxDifficultyCount) * 100);
                      const barColor =
                        item.label === 'Easy' ? 'bg-emerald-500' :
                        item.label === 'Medium' ? 'bg-amber-500' :
                        'bg-red-500';

                      return (
                        <div key={item.label} className="grid grid-cols-[56px_1fr_24px] items-center gap-3">
                          <span className="text-sm font-medium text-black/65 dark:text-white/65">{item.label}</span>
                          <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-white/15 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${widthPercentage}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-black/80 dark:text-white/85 text-right">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-6 text-sm text-black/55 dark:text-white/55">
                    Track Templates: <span className="font-semibold text-black/80 dark:text-white/90">{contentInsights.trackTemplates}</span>
                  </p>
                </article>
              </div>
            </section>

            {/* Platform Health */}
            <div className="bg-white dark:bg-white backdrop-blur-xl border border-black/10 dark:border-black/20 p-8 rounded-xl">
              <h3 className="admin-section-heading mb-8">Platform Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="min-h-[150px] bg-white dark:bg-white rounded-2xl border border-black/10 dark:border-black/20 p-5 flex flex-col justify-between">
                  <span className="admin-micro-label text-black/40 dark:text-white/40">Engagement Rate</span>
                  <div>
                    <span className="text-5xl font-light tracking-tighter text-[#3C83F6] dark:text-white">{analyticsData.platformHealth.engagementRate}%</span>
                    <div className="mt-3 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3C83F6] dark:bg-white transition-all duration-1000 rounded-full"
                        style={{ width: `${analyticsData.platformHealth.engagementRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="min-h-[150px] bg-white dark:bg-white rounded-2xl border border-black/10 dark:border-black/20 p-5 flex flex-col justify-between">
                  <span className="admin-micro-label text-black/40 dark:text-white/40">Resources Uploaded</span>
                  <span className="text-5xl font-light tracking-tighter text-[#3C83F6] dark:text-white">{analyticsData.platformHealth.resourcesUploaded}</span>
                </div>

                <div className="min-h-[150px] bg-white dark:bg-white rounded-2xl border border-black/10 dark:border-black/20 p-5 flex flex-col justify-between">
                  <span className="admin-micro-label text-black/40 dark:text-white/40">Resources Viewed</span>
                  <span className="text-5xl font-light tracking-tighter text-[#3C83F6] dark:text-white">{analyticsData.platformHealth.resourcesViewed}</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default Analytics;
