import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyAuditLogs, emptyAuditSummary } from '../../data/adminEmptyStates';
import { FiSearch, FiPlus, FiEdit3, FiTrash2, FiDownload } from 'react-icons/fi';

const searchRoutes = [
  { id: 'dashboard',          title: 'Dashboard',          category: 'Overview'     },
  { id: 'analytics',          title: 'Analytics',          category: 'Overview'     },
  { id: 'system-health',      title: 'System Health',      category: 'Overview'     },
  { id: 'colleges',           title: 'Colleges',           category: 'Organization' },
  { id: 'batches',            title: 'Batches',            category: 'Organization' },
  { id: 'students',           title: 'Students',           category: 'Organization' },
  { id: 'question-bank',      title: 'Question Bank',      category: 'Learning'     },
  { id: 'track-templates',    title: 'Track Templates',    category: 'Learning'     },
  { id: 'resources',          title: 'Resources',          category: 'Learning'     },
  { id: 'certificates',       title: 'Certificates',       category: 'Learning'     },
  { id: 'submission-monitor', title: 'Submission Monitor', category: 'Operations'   },
  { id: 'notifications',      title: 'Notifications',      category: 'Operations'   },
  { id: 'audit-logs',         title: 'Audit Logs',         category: 'Operations'   },
  { id: 'reports',            title: 'Reports',            category: 'Operations'   },
];

const verbConfig = {
  Created: {
    Icon: FiPlus,
    iconWrap: 'text-emerald-500 dark:text-emerald-400',
  },
  Updated: {
    Icon: FiEdit3,
    iconWrap: 'text-[#3C83F6] dark:text-blue-300',
  },
  Deleted: {
    Icon: FiTrash2,
    iconWrap: 'text-red-500 dark:text-red-300',
  },
};

export default function AuditLogs() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [logEntries, setLogEntries] = useState(emptyAuditLogs);
  const [summary, setSummary] = useState(emptyAuditSummary);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    let cancelled = false;

    adminAPI
      .getAuditLogs(tableSearch)
      .then((remoteData) => {
        if (!cancelled) {
          setLogEntries(preferRemoteData(remoteData?.logs, emptyAuditLogs));
          setSummary(preferRemoteData(remoteData?.summary, emptyAuditSummary));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogEntries(emptyAuditLogs);
          setSummary(emptyAuditSummary);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tableSearch]);

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(p => !p); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
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

  const filteredLogs = logEntries.filter(l => {
    const q = tableSearch.toLowerCase();
    return !q || l.action.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.type.toLowerCase().includes(q);
  });

  const exportLogs = () => {
    const headers = ['Action', 'Detail', 'Actor', 'Type', 'Timestamp', 'Verb'];
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = filteredLogs.map((log) => [
      log.action,
      log.detail,
      log.actor,
      log.type,
      log.ts,
      log.verb,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const href = URL.createObjectURL(blob);
    link.href = href;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  return (
    <>
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages, tracks, or settings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
              />
              <div
                className="text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setIsSearchOpen(false)}
              >ESC</div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0
                ? <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results for &ldquo;{searchQuery}&rdquo;</div>
                : filteredRoutes.map(r => (
                  <button key={r.id} onClick={() => handleRouteSelect(r.id)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                    <div>
                      <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{r.title}</h4>

                    </div>
                    <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">›</span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography ${isDarkMode ? 'dark' : ''}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen z-10 transition-all duration-700 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="max-w-[1500px] mx-auto space-y-5">

            {/* Header */}
            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div>
                <h1 className="admin-page-title">Audit Logs</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <section className="space-y-0.5">
              <h2 className="text-2xl font-semibold tracking-tight text-[#1f3147] dark:text-white">Audit Logs</h2>
              <p className="text-sm text-[#6e839b] dark:text-white/60">Track all admin actions on the platform</p>
            </section>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Total Actions', value: summary.totalActions },
                { label: 'Today',         value: summary.today },
                { label: 'Deletions',     value: summary.deletions },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-xl px-5 py-4">
                  <p className="text-3xl leading-none font-semibold tracking-tight text-[#1e2f45] dark:text-white">{value}</p>
                  <p className="mt-1.5 text-xs font-semibold text-[#8498ad] dark:text-white/55">{label}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="relative w-full sm:flex-1 min-w-0 sm:max-w-[540px]">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="dashboard-input-surface h-10 rounded-full pl-11 pr-4 text-[13px] sm:text-sm leading-none"
                />
              </div>
              <button
                onClick={exportLogs}
                className="dashboard-primary-btn h-10 shrink-0 px-4 text-sm"
              >
                <FiDownload className="w-3.5 h-3.5" />
                Export Logs
              </button>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden shadow-sm max-h-[520px] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredLogs.map((log, i) => {
                const cfg = verbConfig[log.verb] || verbConfig.Updated;
                const Icon = cfg.Icon;
                return (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between gap-2.5 px-4 py-2.5 hover:bg-black/[0.015] dark:hover:bg-white/[0.03] transition-colors ${
                      i < filteredLogs.length - 1 ? 'border-b border-black/8 dark:border-white/10' : ''
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full bg-[#e5edf8] dark:bg-white/10 flex items-center justify-center ${cfg.iconWrap}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#23364d] dark:text-white/90">{log.action}</p>
                        <p className="truncate text-xs text-[#7388a0] dark:text-white/60">{log.detail} · by {log.actor}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center justify-center min-w-[56px] h-6 px-2 rounded-full text-[10px] font-semibold bg-[#dce9f6] dark:bg-white/10 border border-black/8 dark:border-white/10 text-[#294460] dark:text-white/85">
                        {log.type}
                      </span>
                      <p className="mt-1 text-[11px] font-semibold text-[#8ea0b3] dark:text-white/55">{log.ts}</p>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="py-16 text-center text-sm text-black/30 dark:text-white/30">No logs match your filters.</div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}



