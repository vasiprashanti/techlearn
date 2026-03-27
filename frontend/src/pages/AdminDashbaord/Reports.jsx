import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import {  FiSearch, FiDownload, FiClock , FiBell } from 'react-icons/fi';

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
  { id: 'notifications', title: 'Notifications', category: 'Operations' },
  { id: 'audit-logs', title: 'Audit Logs', category: 'Operations' },
  { id: 'reports', title: 'Reports', category: 'Operations' },
];

const reportTypes = [
  { id: 1, title: 'Batch Leaderboard',    desc: 'Rankings and scores for each batch',              formats: ['CSV', 'Excel'] },
  { id: 2, title: 'Student Performance',  desc: 'Individual student progress and scores',           formats: ['CSV', 'Excel'] },
  { id: 3, title: 'Submission Records',   desc: 'All submissions with status and timings',          formats: ['CSV'] },
  { id: 4, title: 'College Performance',  desc: 'Aggregate performance by college',                 formats: ['CSV', 'Excel'] },
  { id: 5, title: 'Batch Summary',        desc: 'Batch details, tracks, and student counts',        formats: ['CSV', 'Excel'] },
  { id: 6, title: 'Question Usage',       desc: 'Question bank usage across tracks and batches',    formats: ['CSV'] },
];

const recentExports = [
  { id: 1, title: 'Batch Leaderboard - CS-2024A', format: 'CSV',   date: 'Mar 8, 2025' },
  { id: 2, title: 'Student Performance - All',    format: 'Excel', date: 'Mar 7, 2025' },
  { id: 3, title: 'College Performance',          format: 'CSV',   date: 'Mar 5, 2025' },
];

const formatStyle = {
  CSV:   { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  Excel: { bg: 'bg-blue-500/10 border-blue-500/20',       text: 'text-[#3C83F6] dark:text-blue-400' },
};

export default function Reports() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState(null);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(prev => !prev); }
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

  const handleRouteSelect = (id) => { setIsSearchOpen(false); navigate('/' + id); };

  const handleDownload = (key) => {
    setDownloading(key);
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input ref={searchInputRef} type="text" placeholder="Search pages, tracks, or settings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
              <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setIsSearchOpen(false)}><span>ESC</span></div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results found for &ldquo;{searchQuery}&rdquo;</div>
              ) : filteredRoutes.map(route => (
                <button key={route.id} onClick={() => handleRouteSelect(route.id)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                  <div>
                    <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>

                  </div>
                  <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1400px] mx-auto space-y-8">

            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Reports</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {reportTypes.map(report => (
                <div key={report.id} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-black/60 transition-colors group">
                  <div>
                    <h3 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{report.title}</h3>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-1.5">{report.desc}</p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex items-center gap-2">
                    {report.formats.map(fmt => {
                      const key = `${report.id}-${fmt}`;
                      const isLoading = downloading === key;
                      const fs = formatStyle[fmt];
                      return (
                        <button
                          key={fmt}
                          onClick={() => handleDownload(key)}
                          className={`flex items-center gap-1.5 admin-micro-label px-3 py-1.5 rounded-lg border font-medium transition-all ${fs.bg} ${fs.text} hover:opacity-80 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <FiDownload className={`w-3 h-3 ${isLoading ? 'animate-bounce' : ''}`} />
                          {isLoading ? 'Exporting...' : fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Exports */}
            <div>
              <h2 className="admin-section-heading mb-4">Recent Exports</h2>
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
                {recentExports.map((exp, i) => {
                  const fs = formatStyle[exp.format];
                  return (
                    <div key={exp.id} className={`flex items-center justify-between px-6 py-4 group hover:bg-white/30 dark:hover:bg-white/5 transition-colors ${i < recentExports.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-white/40">
                          <FiClock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{exp.title}</p>
                          <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{exp.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border font-medium ${fs.bg} ${fs.text}`}>{exp.format}</span>
                        <button onClick={() => handleDownload(`re-${exp.id}`)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-[#3C83F6] dark:hover:text-blue-400">
                          <FiDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
