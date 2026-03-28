import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { FiSearch, FiPlus, FiBell, FiX, FiChevronDown, FiUsers, FiSend } from 'react-icons/fi';
import { adminNotifications } from '../../data/adminNotificationsData';

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

export default function Notifications() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', target: 'All Students' });
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(prev => !prev); }
      if (e.key === 'Escape') { setIsSearchOpen(false); }
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

  const global = adminNotifications.filter((n) => n.isGlobal).length;
  const targeted = adminNotifications.filter((n) => !n.isGlobal).length;

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

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setShowCompose(false)} />
          <div className="relative w-full max-w-2xl bg-[#dfe9f5] dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-4 md:p-5">
            <button
              onClick={() => setShowCompose(false)}
              className="absolute right-5 top-5 text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
              aria-label="Close send notification modal"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold tracking-tight text-[#1c2c43] dark:text-white mb-4">Send Notification</h2>

            <div className="space-y-3.5">
              <div>
                <label className="text-sm font-semibold text-[#1d2d43] dark:text-white/90 mb-1 block">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Daily Reminder"
                  className="w-full h-10 px-3.5 text-sm bg-[#e4edf7] dark:bg-[#14264d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/25 text-[#1f3148] dark:text-white/85 placeholder:text-[#61778f] dark:placeholder:text-white/40 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1d2d43] dark:text-white/90 mb-1 block">Message</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#e4edf7] dark:bg-[#14264d] border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/25 text-[#1f3148] dark:text-white/85 placeholder:text-[#61778f] dark:placeholder:text-white/40 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1d2d43] dark:text-white/90 mb-1 block">Audience</label>
                <div className="relative">
                  <FiUsers className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#445b74] dark:text-white/60" />
                  <select
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    className="w-full h-10 appearance-none text-sm pl-10 pr-9 rounded-xl border border-black/10 dark:border-white/10 bg-[#e4edf7] dark:bg-[#14264d] text-[#1f3148] dark:text-white/85 focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/25 transition-colors cursor-pointer"
                  >
                    {['All Students', 'Specific College', 'Specific batch'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6d8198] dark:text-white/60" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mt-4">
              <button onClick={() => setShowCompose(false)} className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#3C83F6] text-white text-xs font-semibold hover:bg-[#2f73e0] transition-colors shadow-sm">
                <FiSend className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 min-h-[100dvh] transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1400px] mx-auto space-y-5">

            <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Notifications</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <section className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#1f3147] dark:text-white">Notifications</h2>
                <p className="mt-1 text-xs text-[#5f7590] dark:text-white/60">Send announcements to students, batches, or colleges</p>
              </div>
              <button onClick={() => setShowCompose(true)} className="shrink-0 min-w-[200px] inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-2xl bg-[#3C83F6] text-white text-sm font-semibold hover:bg-[#2f73e0] transition-colors shadow-sm">
                <FiPlus className="w-3.5 h-3.5" />
                <span>New Notification</span>
              </button>
            </section>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Total Sent',    value: adminNotifications.length },
                { label: 'Platform-wide', value: global },
                { label: 'Targeted',      value: targeted },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4">
                  <p className="text-3xl font-semibold leading-none tracking-tight text-[#0e2240] dark:text-white">{value}</p>
                  <p className="mt-1.5 text-sm font-medium text-[#567089] dark:text-white/60">{label}</p>
                </div>
              ))}
            </div>

            {/* Notification Cards */}
            <div className="bg-white dark:bg-[#0f1f43] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              {adminNotifications.map((n, index) => (
                <div key={n.id} className={`flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-black/[0.015] dark:hover:bg-white/[0.03] transition-colors ${index < adminNotifications.length - 1 ? 'border-b border-black/8 dark:border-white/10' : ''}`}>
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#e4ecf7] dark:bg-white/10 flex items-center justify-center shrink-0">
                      <FiBell className="w-3.5 h-3.5 text-[#6d8198] dark:text-white/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[#11284a] dark:text-white/90">{n.title}</p>
                      <p className="truncate text-sm text-[#5c7590] dark:text-white/60">{n.body}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center justify-center min-w-[96px] h-7 px-2.5 rounded-full bg-[#dce9f6] dark:bg-white/10 border border-black/8 dark:border-white/10 text-xs font-semibold text-[#163156] dark:text-white/85">
                      {n.target}
                    </span>
                    <p className="mt-1 text-xs font-medium text-[#607893] dark:text-white/55">{n.date}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
