import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import {  FiSearch , FiBell } from 'react-icons/fi';

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

const logs = [
  { id: 1, action: 'Created batch',          detail: 'CS-2024A',      actor: 'Admin User', type: 'Batch',    ts: '2025-03-08 14:32', verb: 'Created' },
  { id: 2, action: 'Updated track template', detail: 'DSA Track',     actor: 'Admin User', type: 'Track',    ts: '2025-03-08 13:15', verb: 'Updated' },
  { id: 3, action: 'Deleted question',       detail: 'Old Two Sum',   actor: 'Admin User', type: 'Question', ts: '2025-03-08 11:45', verb: 'Deleted' },
  { id: 4, action: 'Added student',          detail: 'John Doe',      actor: 'Admin User', type: 'Student',  ts: '2025-03-07 16:20', verb: 'Created' },
  { id: 5, action: 'Updated college',        detail: 'MIT',           actor: 'Admin User', type: 'College',  ts: '2025-03-07 10:10', verb: 'Updated' },
  { id: 6, action: 'Created track template', detail: 'SQL Track v2',  actor: 'Admin User', type: 'Track',    ts: '2025-03-06 09:30', verb: 'Created' },
  { id: 7, action: 'Deleted batch',          detail: 'TEST-001',      actor: 'Admin User', type: 'Batch',    ts: '2025-03-05 17:00', verb: 'Deleted' },
  { id: 8, action: 'Updated question',       detail: 'Binary Search', actor: 'Admin User', type: 'Question', ts: '2025-03-05 14:22', verb: 'Updated' },
];

const verbConfig = {
  Created: {
    dot:  'bg-emerald-500',
    text: 'text-slate-700 dark:text-emerald-400',
    pill: 'bg-white dark:bg-emerald-500/10 border border-black/[0.18] dark:border-emerald-500/20',
  },
  Updated: {
    dot:  'bg-[#3C83F6]',
    text: 'text-slate-700 dark:text-[#3C83F6]',
    pill: 'bg-white dark:bg-blue-500/10 border border-black/[0.18] dark:border-blue-500/20',
  },
  Deleted: {
    dot:  'bg-slate-400 dark:bg-white/40',
    text: 'text-slate-500 dark:text-white/50',
    pill: 'bg-white dark:bg-white/[0.05] border border-black/[0.18] dark:border-white/10',
  },
};

const typeConfig = {
  Batch:    { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/20' },
  Track:    { text: 'text-slate-600 dark:text-amber-400',   bg: 'bg-slate-50 dark:bg-amber-500/10 border border-slate-300 dark:border-amber-500/20'    },
  Question: { text: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20'        },
  Student:  { text: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/20'        },
  College:  { text: 'text-slate-600 dark:text-white/50',    bg: 'bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10'             },
};

export default function AuditLogs() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [verbFilter, setVerbFilter] = useState('All');
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

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

  const filteredLogs = logs.filter(l => {
    const q = tableSearch.toLowerCase();
    const matchSearch = !q || l.action.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.type.toLowerCase().includes(q);
    return matchSearch && (verbFilter === 'All' || l.verb === verbFilter);
  });

  const today = logs.filter(l => l.ts.startsWith('2025-03-08')).length;
  const deletions = logs.filter(l => l.verb === 'Deleted').length;

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

        <main className={`flex-1 h-screen z-10 transition-all duration-700 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="max-w-[1400px] mx-auto space-y-8">

            {/* Header */}
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Audit Logs</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Actions', value: logs.length },
                { label: 'Today',         value: today       },
                { label: 'Deletions',     value: deletions   },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/5 rounded-2xl px-6 py-5">
                  <p className="admin-micro-label text-black/35 dark:text-white/40">{label}</p>
                  <p className="text-3xl font-light tracking-tight text-[#3C83F6] dark:text-white mt-3">{value}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search action, detail, type..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-[13px] bg-white/60 dark:bg-white/5 border border-black/[0.07] dark:border-white/10 rounded-xl focus:outline-none focus:bg-white/80 dark:focus:bg-white/8 text-slate-700 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-all w-56"
                />
              </div>
              <div className="relative">
                <select
                  value={verbFilter}
                  onChange={e => setVerbFilter(e.target.value)}
                  className="appearance-none text-[11px] tracking-wide pl-3.5 pr-7 py-2 rounded-xl border border-black/[0.07] dark:border-white/10 bg-white/60 dark:bg-black/40 text-slate-600 dark:text-white/60 focus:outline-none cursor-pointer"
                >
                  {['All', 'Created', 'Updated', 'Deleted'].map(v => <option key={v}>{v}</option>)}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[9px]">▾</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[11%]" />
                  <col className="w-[41%]" />
                  <col className="w-[13%]" />
                  <col className="w-[15%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="bg-black/[0.025] dark:bg-white/[0.025] border-b border-black/[0.05] dark:border-white/[0.05]">
                    {['Action', 'Details', 'Type', 'By', 'Timestamp'].map(h => (
                      <th key={h} className="text-left px-5 py-3 admin-micro-label text-black/30 dark:text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {filteredLogs.map(log => {
                    const vc = verbConfig[log.verb];
                    const tc = typeConfig[log.type];
                    return (
                      <tr key={log.id} className="group hover:bg-black/[0.015] dark:hover:bg-white/[0.03] transition-colors">

                        {/* Verb pill */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 admin-micro-label px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${vc.pill} ${vc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${vc.dot}`} />
                            {log.verb}
                          </span>
                        </td>

                        {/* Action + detail — action in blue, detail muted */}
                        <td className="px-5 py-3.5">
                          <p className="text-[13px] font-medium text-[#3C83F6] dark:text-white/90 truncate">{log.action}</p>
                          <p className="text-[11px] text-black/35 dark:text-white/35 mt-0.5 truncate">{log.detail}</p>
                        </td>

                        {/* Type chip */}
                        <td className="px-5 py-3.5">
                          <span className={`admin-micro-label font-medium px-2 py-0.5 rounded-md ${tc?.text} ${tc?.bg}`}>
                            {log.type}
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] text-black/45 dark:text-white/45 truncate block">{log.actor}</span>
                        </td>

                        {/* Timestamp */}
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] font-mono text-black/30 dark:text-white/30 whitespace-nowrap">{log.ts}</span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
