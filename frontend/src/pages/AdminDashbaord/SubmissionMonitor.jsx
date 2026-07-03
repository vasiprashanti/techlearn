import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptySubmissionState } from '../../data/adminEmptyStates';
import { FiSearch, FiMonitor, FiCheckCircle, FiClock, FiPlayCircle, FiXCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

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

const statusConfig = {
  'Accepted':     { Icon: FiCheckCircle, label: 'text-emerald-500 dark:text-emerald-400' },
  'Wrong Answer': { Icon: FiXCircle,     label: 'text-rose-500 dark:text-rose-400' },
  'Running':      { Icon: FiPlayCircle,  label: 'text-[#3C83F6] dark:text-blue-400' },
  'TLE':          { Icon: FiAlertCircle, label: 'text-amber-500 dark:text-amber-400' },
  'Passed':       { Icon: FiCheckCircle, label: 'text-emerald-500 dark:text-emerald-400' },
  'Failed':       { Icon: FiXCircle,     label: 'text-rose-500 dark:text-rose-400' },
  'Partial Pass': { Icon: FiAlertCircle, label: 'text-amber-500 dark:text-amber-400' },
  'Timeout':      { Icon: FiAlertCircle, label: 'text-amber-500 dark:text-amber-400' },
  'Error':        { Icon: FiAlertCircle, label: 'text-rose-500 dark:text-rose-400' },
  'Pending':      { Icon: FiClock,       label: 'text-[#3C83F6] dark:text-blue-400' },
};

const fallbackStatusConfig = {
  Icon: FiAlertCircle,
  label: 'text-slate-500 dark:text-slate-300',
};

const getSubmissionStatusConfig = (status) => statusConfig[status] || fallbackStatusConfig;

const langPill = 'inline-flex items-center justify-center min-w-[56px] h-6 px-2.5 rounded-full text-xs font-semibold bg-[#dce9f6] dark:bg-white/10 text-[#1f3652] dark:text-white/85';

export default function SubmissionMonitor() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [submissionEntries, setSubmissionEntries] = useState(emptySubmissionState.submissions);
  const [submissionKpis, setSubmissionKpis] = useState(emptySubmissionState.kpis);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);
  const loadSubmissions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const remoteData = await adminAPI.getSubmissions();
      setSubmissionEntries(preferRemoteData(remoteData?.submissions, emptySubmissionState.submissions));
      setSubmissionKpis(preferRemoteData(remoteData?.kpis, emptySubmissionState.kpis));
      setPendingStudents(preferRemoteData(remoteData?.pendingStudents, []));
    } catch {
      setSubmissionEntries(emptySubmissionState.submissions);
      setSubmissionKpis(emptySubmissionState.kpis);
      setPendingStudents([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);
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

  const filteredSubs = submissionEntries.filter(s => {
    const q = tableSearch.toLowerCase();
    return !q ||
      s.student.toLowerCase().includes(q) ||
      String(s.email || '').toLowerCase().includes(q) ||
      s.question.toLowerCase().includes(q) ||
      s.batch.toLowerCase().includes(q);
  });

  const challengeHistory = useMemo(() => {
    const grouped = new Map();
    filteredSubs.forEach((submission) => {
      const key = `${submission.student}-${submission.question}`;
      const current = grouped.get(key) || {
        student: submission.student,
        question: submission.question,
        batch: submission.batch,
        attempts: 0,
        lastStatus: submission.status,
        xpEarned: 0,
        lastSubmitted: submission.when,
      };
      current.attempts += 1;
      current.lastStatus = submission.status;
      current.xpEarned += Number(submission.xpEarned || 0);
      current.lastSubmitted = submission.when || current.lastSubmitted;
      grouped.set(key, current);
    });
    return Array.from(grouped.values()).slice(0, 8);
  }, [filteredSubs]);

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
                <p className="text-xs text-black/45 dark:text-white/40 mt-0.5">{selectedSubmission.student} • {selectedSubmission.email || selectedSubmission.batch}</p>
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
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                <p className="admin-micro-label text-black/40 dark:text-white/40">XP Earned</p>
                <p className="text-sm mt-1 font-semibold text-[#3C83F6] dark:text-blue-300">{Number(selectedSubmission.xpEarned || 0)} XP</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/60 dark:bg-white/5">
                <p className="admin-micro-label text-black/40 dark:text-white/40 mb-2">Output Preview</p>
                <pre className="text-xs text-black/65 dark:text-white/65 whitespace-pre-wrap">Status: {selectedSubmission.status}\nResult: {selectedSubmission.outputPreview || 'Submission evaluated'}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography ${isDarkMode ? 'dark' : ''}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen z-10 transition-all duration-700 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="max-w-[1400px] mx-auto space-y-4">

            <div>
              <h1 className="admin-page-title">Submission Monitor</h1>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total Today',   value: submissionKpis.totalToday, icon: FiMonitor },
                { label: 'Accepted',      value: submissionKpis.accepted, icon: FiCheckCircle },
                { label: 'Success Rate',  value: `${submissionKpis.successRate}%`, icon: FiCheckCircle },
                { label: 'Avg Exec Time', value: submissionKpis.avgExecutionTime, icon: FiClock },
                { label: 'Pending Students', value: submissionKpis.pendingStudents || pendingStudents.length || 0, icon: FiAlertCircle },
              ].map(({ label, value, icon }) => {
                const KpiIcon = icon;
                return (
                  <div key={label} className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#e4ecf7] dark:bg-white/10 flex items-center justify-center text-[#6d8198] dark:text-white/70">
                        <KpiIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold leading-none tracking-tight text-[#0e2240] dark:text-white">{value}</p>
                        <p className="mt-1 text-xs font-medium text-[#567089] dark:text-white/60">{label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative w-full md:max-w-[520px]">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40 pointer-events-none" />
                <input type="text" placeholder="Search by student, email, or question..." value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                  className="dashboard-input-surface h-10 rounded-full pl-11 pr-4 text-[13px] sm:text-sm leading-none" />
              </div>
              <button
                onClick={() => {
                  setTableSearch('');
                  loadSubmissions();
                }}
                disabled={isRefreshing}
                className="dashboard-secondary-btn w-full sm:w-auto h-10 shrink-0 px-3.5 text-xs"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {filteredSubs.map((s) => {
                const sc = getSubmissionStatusConfig(s.status);
                const StatusIcon = sc.Icon;
                return (
                  <article
                    key={s.id}
                    onClick={() => setSelectedSubmission(s)}
                    className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1f43] p-4 shadow-sm transition-colors cursor-pointer hover:bg-black/[0.015] dark:hover:bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[#1d3149] dark:text-white/90 break-words">{s.student}</h3>
                        <p className="mt-1 text-sm text-[#6a8097] dark:text-white/60 break-words">{s.batch}</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold ${sc.label}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {s.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs text-[#6a8097] dark:text-white/55">Question</p>
                        <p className="mt-1 text-sm text-[#2d3e54] dark:text-white/75 break-words">{s.question}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#6a8097] dark:text-white/55">Language</p>
                          <p className="mt-1"><span className={langPill}>{s.lang}</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6a8097] dark:text-white/55">XP Earned</p>
                          <p className="mt-1 text-sm font-semibold text-[#3C83F6] dark:text-blue-300">{Number(s.xpEarned || 0)} XP</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6a8097] dark:text-white/55">Exec Time</p>
                          <p className={`mt-1 text-sm font-semibold tabular-nums ${s.exec === '-' ? 'text-black/25 dark:text-white/25' : 'text-[#6a8097] dark:text-white/60'}`}>{s.exec}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-[#6a8097] dark:text-white/55">When</p>
                        <p className="mt-1 text-xs text-[#6a8097] dark:text-white/55">{s.when}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
              {filteredSubs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 px-4 py-10 text-center text-sm text-black/30 dark:text-white/30">
                  No submissions match your filters.
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="admin-section-heading">Pending Students</h2>
                <span className="text-xs font-semibold text-[#567089] dark:text-white/60">{pendingStudents.length} pending</span>
              </div>
              {pendingStudents.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {pendingStudents.slice(0, 9).map((student) => (
                    <div key={student.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-[#f0f5fb] dark:bg-white/[0.04] px-3 py-2">
                      <p className="text-sm font-semibold text-[#1d3149] dark:text-white/90 truncate">{student.name}</p>
                      <p className="text-xs text-[#6a8097] dark:text-white/55 truncate">{student.batch} · {student.email}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-6 text-center text-sm text-black/35 dark:text-white/35">
                  No pending students for the current submission view.
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="admin-section-heading">Challenge History</h2>
                <span className="text-xs font-semibold text-[#567089] dark:text-white/60">{challengeHistory.length} groups</span>
              </div>
              {challengeHistory.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {challengeHistory.map((entry) => (
                    <div key={`${entry.student}-${entry.question}`} className="rounded-xl border border-black/10 dark:border-white/10 bg-[#f0f5fb] dark:bg-white/[0.04] px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1d3149] dark:text-white/90 truncate">{entry.student}</p>
                          <p className="mt-1 text-xs text-[#6a8097] dark:text-white/55 truncate">{entry.question}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#dce9f6] px-2 py-1 text-[10px] font-bold text-[#3C83F6] dark:bg-white/10 dark:text-blue-300">
                          {entry.attempts} attempts
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#6a8097] dark:text-white/55">
                        <span>{entry.batch}</span>
                        <span>•</span>
                        <span>{entry.lastStatus}</span>
                        <span>•</span>
                        <span>{entry.xpEarned} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-6 text-center text-sm text-black/35 dark:text-white/35">
                  Challenge history will appear once submissions are available.
                </p>
              )}
            </div>

            <div className="hidden lg:block bg-white/60 dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-scroll">
              <table className="w-full min-w-[1120px] table-auto">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]" />
                  <col className="w-[9%]"  />
                </colgroup>
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/30 border-b border-black/10 dark:border-white/10">
                    {['Student', 'Batch', 'Question', 'Language', 'Status', 'XP', 'Exec Time', 'When'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6a8097] dark:text-white/55">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/8 dark:divide-white/10">
                  {filteredSubs.map(s => {
                    const sc = getSubmissionStatusConfig(s.status);
                    const StatusIcon = sc.Icon;
                    return (
                      <tr onClick={() => setSelectedSubmission(s)} key={s.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-black/10 dark:border-white/10 last:border-b-0">
                        <td className="px-4 py-3">
                          <span className="text-base font-semibold text-[#1d3149] dark:text-white/90 truncate leading-none block">{s.student}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#6a8097] dark:text-white/60">{s.batch}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-[#2d3e54] dark:text-white/75 block truncate">{s.question}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={langPill}>{s.lang}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap ${sc.label}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-[#3C83F6] dark:text-blue-300">{Number(s.xpEarned || 0)} XP</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold tabular-nums ${s.exec === '-' ? 'text-black/25 dark:text-white/25' : 'text-[#6a8097] dark:text-white/60'}`}>{s.exec}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#6a8097] dark:text-white/55 whitespace-nowrap">{s.when}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
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



