import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// Context & Data
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { adminStats } from "../../data/adminDashboardMock";

// Components
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; 
import LoadingScreen from "../../components/Loader/Loader3D"; 

// Icons
import { FiSearch } from "react-icons/fi";
import {
  FaUsers,
  FaUserCheck,
  FaBookOpen,
  FaFolderOpen,
  FaUserFriends,
} from "react-icons/fa";

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
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // --- AdminDashboard States ---
  const [loading, setLoading] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // --- Dashboard States ---
  const { theme, toggleTheme } = useTheme();
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

      {/* Main Layout */}
      <div
        className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${
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
          className={`flex-1 transition-all duration-700 ease-in-out z-10 
            ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} 
            pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto
            ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-6">
            <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
              <h1 className="text-2xl font-normal tracking-tight text-[#3C83F6] dark:text-white">
                Overview
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

                <button
                  onClick={toggleTheme}
                  className="text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
                >
                  {isDarkMode ? "Light" : "Dark"}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                  >
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </button>

                  {/* Profile Dropdown */}
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

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {adminStats.kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-5 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-black/60 transition-colors rounded-xl"
                >
                  <span className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">
                    {kpi.title}
                  </span>
                  <div className="mt-6 mb-1">
                    <span className="text-3xl font-normal tracking-tighter text-[#3C83F6] dark:text-white">
                      {kpi.value}
                    </span>
                  </div>
                  <span className="text-[10px] text-black/40 dark:text-white/40">
                    {kpi.subtitle}
                  </span>
                </div>
              ))}
            </div>

            {/* Middle Section: Charts & Top Students */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px]">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-8 shrink-0">
                  College Performance Ranking
                </h3>
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
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-xl flex flex-col min-h-[300px]">
                <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-6 shrink-0">
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
                      <div className="text-sm font-normal text-[#3C83F6] dark:text-white shrink-0 pl-2">
                        {student.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Asymmetric Bento Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* Left Column: Stacked Grids */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                
                {/* Box 1: Recent Student Activity */}
                <div className="flex-1 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-xl flex flex-col">
                  <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-6 shrink-0">
                    Recent Activity
                  </h3>
                  <div className="flex flex-col justify-between gap-4">
                    {adminStats.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/50 flex items-center justify-center text-[10px] font-medium text-[#3C83F6] dark:text-white border border-black/10 dark:border-white/10 shrink-0 shadow-sm group-hover:bg-[#3C83F6] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                            {activity.name.charAt(0)}
                          </div>
                          <div className="min-w-0 pr-2">
                            <h4 className="text-sm font-medium text-black dark:text-white truncate group-hover:text-[#3C83F6] transition-colors">
                              {activity.name}
                            </h4>
                            <p className="text-[10px] text-black/50 dark:text-white/50 truncate">
                              {activity.batch} · Streak: {activity.streak}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-black/30 dark:text-white/30 shrink-0">
                          {activity.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Box 2: Most Solved Questions */}
                <div className="flex-1 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-xl flex flex-col">
                  <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 mb-6 shrink-0">
                    Trending Questions
                  </h3>
                  <div className="flex flex-col justify-between gap-3">
                    {adminStats.mostSolved.map((question, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                        <div className="min-w-0 pr-4">
                          <h4 className="text-sm font-medium text-black dark:text-white group-hover:text-[#3C83F6] transition-colors truncate">
                            {question.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 truncate">
                            <span
                              className={`text-[8px] uppercase tracking-widest px-1.5 py-0.5 border rounded-sm shrink-0
                              ${
                                question.difficulty === "Easy"
                                  ? "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                                  : question.difficulty === "Medium"
                                  ? "border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                                  : "border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5"
                              }
                            `}
                            >
                              {question.difficulty}
                            </span>
                            <p className="text-[10px] text-black/50 dark:text-white/50 truncate">
                              {question.track}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 pl-2">
                           <span className="text-xs font-semibold text-[#3C83F6] dark:text-white">
                             {question.count}
                           </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Double-Wide Horizontal Batches */}
              <div className="lg:col-span-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-6 md:p-8 rounded-xl flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">
                    Active & Upcoming Batches
                  </h3>
                  <button className="text-[10px] font-medium text-[#3C83F6] dark:text-blue-400 hover:underline">
                    View All
                  </button>
                </div>
                
                {/* Single Column, Stretching Full Width */}
                <div className="flex flex-col gap-3 flex-1">
                  {adminStats.batches.map((batch, i) => (
                    <div 
                      key={i} 
                      className="p-4 border border-black/5 dark:border-white/5 bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 transition-colors rounded-xl cursor-pointer group shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      
                      {/* Left: ID & College */}
                      <div className="flex flex-col min-w-[200px]">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-semibold text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {batch.id}
                          </h4>
                          <span
                            className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border rounded-full
                            ${
                              batch.status === "Active"
                                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                            }
                          `}
                          >
                            {batch.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-black/60 dark:text-white/60 font-medium truncate">
                          {batch.college}
                        </p>
                      </div>

                      {/* Middle: Track (Hidden on super small screens to preserve layout) */}
                      <div className="flex-1 min-w-[150px] hidden md:block border-l border-black/5 dark:border-white/5 pl-4">
                         <p className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-widest mb-0.5">Track</p>
                         <p className="text-[11px] font-medium text-black/80 dark:text-white/80 truncate">
                           {batch.track}
                         </p>
                      </div>

                      {/* Right: Dates */}
                      <div className="flex items-center gap-2 text-[10px] text-black/50 dark:text-white/50 uppercase tracking-widest shrink-0 bg-white/50 dark:bg-black/50 px-3 py-2 rounded-lg border border-black/5 dark:border-white/5">
                        <span className="font-medium text-black/70 dark:text-white/70">{batch.start}</span>
                        <span>→</span>
                        <span className="font-medium text-black/70 dark:text-white/70">{batch.end}</span>
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
}