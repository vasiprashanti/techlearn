import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import {  FiSearch, FiActivity, FiServer, FiDatabase, FiLock, FiAlertCircle , FiBell } from 'react-icons/fi';

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

// --- NEW MOCK DATA ---
const healthData = {
  kpis: [
    { label: "Uptime", value: "99.97%" },
    { label: "Avg Execution Time", value: "1.2s" },
    { label: "Queue Size", value: "3" },
    { label: "Errors (24h)", value: "7" }
  ],
  services: [
    { name: "Judge API", status: "Operational", ping: "45ms", icon: <FiActivity /> },
    { name: "Database", status: "Operational", ping: "12ms", icon: <FiDatabase /> },
    { name: "File Storage", status: "Operational", ping: "89ms", icon: <FiServer /> },
    { name: "Auth Service", status: "Operational", ping: "23ms", icon: <FiLock /> }
  ],
  recentAlerts: [
    { time: "2 min ago", msg: "Judge timeout on submission #4821", type: "warning" },
    { time: "1 hr ago", msg: "Rate limit hit for batch CS-2024A", type: "warning" },
    { time: "3 hr ago", msg: "Slow query detected on students table", type: "warning" }
  ]
};

const SystemHealth = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  // CMD+K LISTENER
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

  // Focus search input
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
              <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setIsSearchOpen(false)}>
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
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 
            ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} 
            pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            {/* Header */}
            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div>
                <h1 className="admin-page-title">System Health</h1>

              </div>
              
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {healthData.kpis.map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 p-6 flex flex-col justify-between hover:bg-white dark:hover:bg-[#162a52] transition-colors rounded-xl">
                  <span className="admin-micro-label text-black/50 dark:text-white/50 mb-4">{kpi.label}</span>
                  <span className="text-3xl font-light tracking-tighter text-[#3C83F6] dark:text-white">{kpi.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Service Status Grid */}
              <div className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 p-8 rounded-xl flex flex-col min-h-[400px]">
                <h3 className="admin-section-heading mb-8 shrink-0">Service Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  {healthData.services.map((service, i) => (
                    <div key={i} className="bg-white dark:bg-[#0f1f43] backdrop-blur-md border border-black/10 dark:border-white/15 p-6 rounded-xl flex flex-col justify-between hover:bg-white dark:hover:bg-[#162a52] transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-black/40 dark:text-white/40 w-8 h-8 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-full">{service.icon}</div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="admin-micro-label text-emerald-600 dark:text-emerald-400">
                            {service.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-black dark:text-white mb-1">{service.name}</h4>
                        <p className="text-[10px] font-medium text-black/40 dark:text-white/40">{service.ping}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Alerts Panel */}
              <div className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 p-8 rounded-xl flex flex-col min-h-[400px]">
                <h3 className="admin-section-heading mb-8 shrink-0">Recent Alerts</h3>
                <div className="flex-1 flex flex-col gap-4">
                  {healthData.recentAlerts.map((alert, i) => (
                    <div key={i} className="flex gap-5 items-start bg-white dark:bg-[#0f1f43] p-5 rounded-xl border border-black/10 dark:border-white/15 hover:bg-white dark:hover:bg-[#162a52] transition-colors">
                      <div className="mt-0.5 text-amber-500 shrink-0">
                        <FiAlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black dark:text-white mb-1 leading-relaxed">{alert.msg}</p>
                        <span className="admin-micro-label text-black/40 dark:text-white/40">{alert.time}</span>
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

export default SystemHealth;


