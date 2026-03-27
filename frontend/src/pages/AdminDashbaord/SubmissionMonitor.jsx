import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import {  FiSearch, FiRefreshCw , FiBell } from 'react-icons/fi';

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

const submissions = [
  { id: 1, student: 'Alex Johnson',   batch: 'CS-2024A',  question: 'Two Sum',                lang: 'Python',     status: 'Accepted',     exec: '120ms',  when: '2m ago'  },
  { id: 2, student: 'Sarah Williams', batch: 'DS-2024A',  question: 'DataFrame Manipulation', lang: 'Python',     status: 'Wrong Answer', exec: '340ms',  when: '5m ago'  },
  { id: 3, student: 'Mike Chen',      batch: 'CS-2024B',  question: 'React Component Design', lang: 'JavaScript', status: 'Running',      exec: '—',      when: 'now'     },
  { id: 4, student: 'Priya Patel',    batch: 'DSA-2024C', question: 'Binary Tree Traversal',  lang: 'C++',        status: 'TLE',          exec: '2000ms', when: '8m ago'  },
  { id: 5, student: 'Kevin Zhang',    batch: 'ML-2024A',  question: 'Linear Regression',      lang: 'Python',     status: 'Accepted',     exec: '890ms',  when: '12m ago' },
  { id: 6, student: 'Lisa Anderson',  batch: 'CS-2024A',  question: 'Maximum Subarray Sum',   lang: 'Java',       status: 'Accepted',     exec: '95ms',   when: '15m ago' },
  { id: 7, student: 'David Kim',      batch: 'WD-2024B',  question: 'SQL Join Operations',    lang: 'SQL',        status: 'Wrong Answer', exec: '45ms',   when: '20m ago' },
  { id: 8, student: 'Tom Brown',      batch: 'CS-2024B',  question: 'Reverse Linked List',    lang: 'Python',     status: 'Accepted',     exec: '110ms',  when: '25m ago' },
];

const statusConfig = {
  'Accepted':     { dot: 'bg-emerald-500',             label: 'text-slate-700 dark:text-emerald-400', pill: 'bg-white dark:bg-emerald-500/10 border border-black/[0.18] dark:border-emerald-500/20' },
  'Wrong Answer': { dot: 'bg-slate-400 dark:bg-rose-400',   label: 'text-slate-600 dark:text-rose-400',    pill: 'bg-white dark:bg-rose-500/10 border border-black/[0.18] dark:border-rose-500/20'    },
  'Running':      { dot: 'bg-[#3C83F6] animate-pulse', label: 'text-slate-700 dark:text-blue-400',    pill: 'bg-white dark:bg-blue-500/10 border border-black/[0.18] dark:border-blue-500/20'    },
  'TLE':          { dot: 'bg-slate-400 dark:bg-amber-400',  label: 'text-slate-600 dark:text-amber-400',  pill: 'bg-white dark:bg-amber-500/10 border border-black/[0.18] dark:border-amber-500/20'  },
};

const langColor = {
  'Python':     'text-blue-600 dark:text-blue-400',
  'JavaScript': 'text-amber-600 dark:text-amber-400',
  'C++':        'text-violet-600 dark:text-violet-400',
  'Java':       'text-rose-500 dark:text-rose-400',
  'SQL':        'text-teal-600 dark:text-teal-400',
};

export default function SubmissionMonitor() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All Batches');
  const [langFilter, setLangFilter] = useState('All Languages');
  const [slowOnly, setSlowOnly] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
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

  const uniqueBatches = ['All Batches', ...new Set(submissions.map((s) => s.batch))];
  const uniqueLangs = ['All Languages', ...new Set(submissions.map((s) => s.lang))];

  const filteredSubs = submissions.filter(s => {
    const q = tableSearch.toLowerCase();
    const matchSearch = !q || s.student.toLowerCase().includes(q) || s.question.toLowerCase().includes(q) || s.batch.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchBatch = batchFilter === 'All Batches' || s.batch === batchFilter;
    const matchLang = langFilter === 'All Languages' || s.lang === langFilter;
    const execMs = Number.parseInt(s.exec, 10);
    const matchSpeed = !slowOnly || (Number.isFinite(execMs) && execMs > 500);
    return matchSearch && matchStatus && matchBatch && matchLang && matchSpeed;
  });

  const accepted = submissions.filter(s => s.status === 'Accepted').length;

  return (
    <>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input ref={searchInputRef} type="text" placeholder="Search pages, tracks, or settings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
              <div className="text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 cursor-pointer" onClick={() => setIsSearchOpen(false)}>ESC</div>
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

      {selectedSubmission && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedSubmission(null)} />
          <div className="relative w-full max-w-3xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#3C83F6] dark:text-white">Submission Detail</h2>
                <p className="text-xs text-black/45 dark:text-white/40 mt-0.5">{selectedSubmission.student} • {selectedSubmission.batch}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-sm text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70">Close</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                <p className="admin-micro-label text-black/40 dark:text-white/40">Question</p>
                <p className="text-sm mt-1 text-black/75 dark:text-white/80">{selectedSubmission.question}</p>
              </div>
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                <p className="admin-micro-label text-black/40 dark:text-white/40">Language</p>
                <p className="text-sm mt-1 text-black/75 dark:text-white/80">{selectedSubmission.lang}</p>
              </div>
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                <p className="admin-micro-label text-black/40 dark:text-white/40">Execution Time</p>
                <p className="text-sm mt-1 text-black/75 dark:text-white/80">{selectedSubmission.exec}</p>
              </div>
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                <p className="admin-micro-label text-black/40 dark:text-white/40">Submitted</p>
                <p className="text-sm mt-1 text-black/75 dark:text-white/80">{selectedSubmission.when}</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                <p className="admin-micro-label text-black/40 dark:text-white/40 mb-2">Output Preview</p>
                <pre className="text-xs text-black/65 dark:text-white/65 whitespace-pre-wrap">Status: {selectedSubmission.status}\nMemory: 64MB\nResult: {selectedSubmission.status === 'Accepted' ? 'All test cases passed' : 'Failed on hidden test cases'}</pre>
              </div>
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
                <h1 className="admin-page-title">Submission Monitor</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Today',   value: submissions.length },
                { label: 'Accepted',      value: accepted           },
                { label: 'Success Rate',  value: `${Math.round((accepted / submissions.length) * 100)}%` },
                { label: 'Avg Exec Time', value: '320ms'            },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/5 rounded-2xl px-6 py-5">
                  <p className="admin-micro-label text-black/35 dark:text-white/40">{label}</p>
                  <p className="text-3xl font-light tracking-tight text-[#3C83F6] dark:text-white mt-3">{value}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25 dark:text-white/25 pointer-events-none" />
                  <input type="text" placeholder="Search student, question..." value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-[13px] bg-white/60 dark:bg-white/5 border border-black/[0.07] dark:border-white/10 rounded-xl focus:outline-none focus:bg-white/80 dark:focus:bg-white/8 text-slate-700 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-all w-52" />
                </div>
                <div className="relative">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="appearance-none text-[11px] tracking-wide pl-3.5 pr-7 py-2 rounded-xl border border-black/[0.07] dark:border-white/10 bg-white/60 dark:bg-black/40 text-slate-600 dark:text-white/60 focus:outline-none cursor-pointer">
                    {['All', 'Accepted', 'Wrong Answer', 'Running', 'TLE'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[9px]">▾</span>
                </div>
                <div className="relative">
                  <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
                    className="appearance-none text-[11px] tracking-wide pl-3.5 pr-7 py-2 rounded-xl border border-black/[0.07] dark:border-white/10 bg-white/60 dark:bg-black/40 text-slate-600 dark:text-white/60 focus:outline-none cursor-pointer">
                    {uniqueBatches.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[9px]">▾</span>
                </div>
                <div className="relative">
                  <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
                    className="appearance-none text-[11px] tracking-wide pl-3.5 pr-7 py-2 rounded-xl border border-black/[0.07] dark:border-white/10 bg-white/60 dark:bg-black/40 text-slate-600 dark:text-white/60 focus:outline-none cursor-pointer">
                    {uniqueLangs.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[9px]">▾</span>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-black/50 dark:text-white/50 px-2">
                  <input type="checkbox" checked={slowOnly} onChange={(e) => setSlowOnly(e.target.checked)} />
                  Slow only
                </label>
              </div>
              <button className="flex items-center gap-1.5 admin-micro-label text-black/35 dark:text-white/35 hover:text-black/60 dark:hover:text-white/60 transition-colors border border-black/[0.07] dark:border-white/10 px-3 py-2 rounded-xl hover:bg-white/40 dark:hover:bg-white/5">
                <FiRefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Table */}
            <div className="bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-black/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[21%]" />
                  <col className="w-[10%]" />
                  <col className="w-[23%]" />
                  <col className="w-[10%]" />
                  <col className="w-[17%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]"  />
                </colgroup>
                <thead>
                  <tr className="bg-black/[0.025] dark:bg-white/[0.025] border-b border-black/[0.05] dark:border-white/[0.05]">
                    {['Student', 'Batch', 'Question', 'Language', 'Status', 'Exec', 'When'].map(h => (
                      <th key={h} className="text-left px-5 py-3 admin-micro-label text-black/30 dark:text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {filteredSubs.map(s => {
                    const sc = statusConfig[s.status];
                    return (
                      <tr onClick={() => setSelectedSubmission(s)} key={s.id} className="group hover:bg-black/[0.015] dark:hover:bg-white/[0.03] transition-colors cursor-pointer">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-white/80 flex items-center justify-center text-[11px] font-bold shrink-0">{s.student.charAt(0)}</div>
                            <span className="text-[13px] font-medium text-[#3C83F6] dark:text-white/90 truncate leading-none">{s.student}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono text-black/45 dark:text-white/45 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md tracking-tight">{s.batch}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] text-slate-600 dark:text-white/60 block truncate">{s.question}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[12px] font-medium ${langColor[s.lang] || 'text-slate-500 dark:text-white/50'}`}>{s.lang}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 admin-micro-label px-2.5 py-1 rounded-lg font-medium whitespace-nowrap ${sc.pill} ${sc.label}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[12px] font-mono tabular-nums ${s.exec === '—' ? 'text-black/20 dark:text-white/20' : 'text-slate-500 dark:text-white/50'}`}>{s.exec}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] text-black/30 dark:text-white/30 whitespace-nowrap">{s.when}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredSubs.length === 0 && (
                <div className="py-16 text-center text-sm text-black/30 dark:text-white/30">No submissions match your filters.</div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
