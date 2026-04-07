import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyReportsState } from '../../data/adminEmptyStates';
import { FiSearch, FiDownload, FiClock, FiAward, FiUsers, FiCode, FiHome, FiBookOpen, FiFileText } from 'react-icons/fi';

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
  { id: 1, title: 'Batch Leaderboard',   desc: 'Rankings and scores for each batch',           formats: ['CSV', 'Excel'], icon: FiAward },
  { id: 2, title: 'Student Performance', desc: 'Individual student progress and scores',        formats: ['CSV', 'Excel'], icon: FiUsers },
  { id: 3, title: 'Submission Records',  desc: 'All submissions with status and timings',       formats: ['CSV'],          icon: FiCode },
  { id: 4, title: 'College Performance', desc: 'Aggregate performance by college',              formats: ['CSV', 'Excel'], icon: FiHome },
  { id: 5, title: 'Batch Summary',       desc: 'Batch details, tracks, and student counts',     formats: ['CSV', 'Excel'], icon: FiBookOpen },
  { id: 6, title: 'Question Usage',      desc: 'Question bank usage across tracks and batches', formats: ['CSV'],          icon: FiFileText },
];

const formatStyle = {
  CSV:   { bg: 'bg-[#dbe8f5] dark:bg-white/10 border border-black/6 dark:border-white/10', text: 'text-[#1e2f46] dark:text-white/85' },
  Excel: { bg: 'bg-[#dbe8f5] dark:bg-white/10 border border-black/6 dark:border-white/10', text: 'text-[#1e2f46] dark:text-white/85' },
};

export default function Reports() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [reportEntries, setReportEntries] = useState(emptyReportsState.reportTypes);
  const [recentExportEntries, setRecentExportEntries] = useState(emptyReportsState.recentExports);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    let cancelled = false;

    adminAPI
      .getReports()
      .then((remoteData) => {
        if (!cancelled) {
          const normalizedReports = preferRemoteData(remoteData?.reportTypes, reportTypes).map((report, index) => ({
            ...reportTypes[index],
            ...report,
            id: report.id || report.key || reportTypes[index]?.id || index + 1,
            title: report.title || reportTypes[index]?.title,
            desc: report.desc || report.description || reportTypes[index]?.desc,
            formats: report.formats || reportTypes[index]?.formats || ['CSV'],
          }));
          setReportEntries(normalizedReports);
          setRecentExportEntries(preferRemoteData(remoteData?.recentExports, emptyReportsState.recentExports));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReportEntries(emptyReportsState.reportTypes);
          setRecentExportEntries(emptyReportsState.recentExports);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1400px] mx-auto space-y-5 sm:space-y-6">

            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div>
                <h1 className="admin-page-title">Reports</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <section className="pt-2 sm:pt-1">
              <div className="rounded-2xl bg-white/72 dark:bg-[#0f1f43]/72 border border-black/10 dark:border-white/10 p-4 sm:p-0 sm:rounded-none sm:bg-transparent sm:dark:bg-transparent sm:border-0">
                <h2 className="text-[1.35rem] sm:text-xl leading-none font-semibold tracking-tight text-[#1b2b42] dark:text-white">Reports</h2>
                <p className="mt-2 sm:mt-1 text-[13px] sm:text-xs leading-relaxed text-[#5f7590] dark:text-white/60">Export platform data for analysis and record-keeping</p>
              </div>
            </section>

            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-3.5">
              {reportEntries.map(report => (
                <article key={report.id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1f43] p-4 sm:p-4 min-h-0 sm:min-h-[132px] shadow-sm transition-colors flex flex-col">
                  <div className="flex items-start gap-3.5 sm:gap-3 min-h-0 sm:min-h-[68px]">
                    <div className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl sm:rounded-lg bg-[#e4ecf7] dark:bg-white/10 text-[#4283ea] dark:text-white flex items-center justify-center shrink-0">
                      <report.icon className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[1.08rem] sm:text-base leading-tight font-semibold text-[#1a2a41] dark:text-white">{report.title}</h3>
                      <p className="mt-1.5 sm:mt-1 text-[13px] sm:text-[11px] leading-relaxed sm:leading-snug text-[#67809a] dark:text-white/60">{report.desc}</p>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-auto pt-0.5 sm:pt-3 flex items-center gap-2.5 sm:gap-2 flex-wrap">
                    {report.formats.map(fmt => {
                      const key = `${report.id}-${fmt}`;
                      const isLoading = downloading === key;
                      const fs = formatStyle[fmt];
                      return (
                        <button
                          key={fmt}
                          onClick={() => handleDownload(key)}
                          className={`inline-flex items-center gap-1.5 px-3 sm:px-2.5 h-8 sm:h-7 rounded-full text-xs sm:text-[11px] font-semibold transition-all ${fs.bg} ${fs.text} hover:brightness-95 ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <FiDownload className={`w-3 h-3 ${isLoading ? 'animate-bounce' : ''}`} />
                          {isLoading ? 'Exporting...' : fmt}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            {/* Recent Exports */}
            <section className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3.5">
              <h2 className="text-xl leading-none font-semibold text-[#1b2b42] dark:text-white">Recent Exports</h2>
              <div className="mt-3 overflow-visible sm:overflow-hidden rounded-xl border-0 sm:border border-black/10 dark:border-white/10 space-y-2 sm:space-y-0">
                {recentExportEntries.map((exp, i) => {
                  const fs = formatStyle[exp.format];
                  return (
                    <div key={exp.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-2.5 rounded-xl sm:rounded-none border border-black/10 dark:border-white/10 sm:border-0 bg-white dark:bg-[#102448] sm:dark:bg-transparent hover:bg-[#f5f8fc] dark:hover:bg-white/[0.03] transition-colors ${i < recentExportEntries.length - 1 ? 'sm:border-b sm:border-black/10 sm:dark:border-white/10' : ''}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#e4ecf7] dark:bg-white/10 flex items-center justify-center text-[#5f7590] dark:text-white/70">
                          <FiClock className="w-3 h-3" />
                        </div>
                        <p className="truncate text-base sm:text-sm font-semibold text-[#22344b] dark:text-white/90">{exp.title}</p>
                      </div>

                      <div className="w-full sm:w-auto shrink-0 flex items-center justify-between sm:justify-start gap-2.5 pl-8 sm:pl-0">
                        <span className={`inline-flex items-center justify-center min-w-[52px] h-6 px-2 rounded-full text-[10px] font-semibold ${fs.bg} ${fs.text}`}>{exp.format}</span>
                        <span className="text-xs sm:text-[11px] font-medium text-[#7087a0] dark:text-white/60">{exp.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        </main>
      </div>
    </>
  );
}



