import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import ThemeToggle from '../../components/Dashboard/ThemeToggle';
import { FiSearch, FiPlus, FiBell, FiGlobe, FiUsers } from 'react-icons/fi';

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

const notifications = [
  { id: 1, title: 'Daily Challenge Reminder', body: "Don't forget to solve today's challenge!", target: 'All Students', isGlobal: true,  date: '2025-03-08 09:00' },
  { id: 2, title: 'Maintenance Notice',        body: 'Platform will be under maintenance tonight 11 PM - 2 AM.', target: 'All Students', isGlobal: true,  date: '2025-03-07 18:00' },
  { id: 3, title: 'Batch Announcement',        body: 'New track template has been assigned to your batch.',  target: 'CS-2024A',    isGlobal: false, date: '2025-03-06 10:00' },
];

export default function Notifications() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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

  const global = notifications.filter(n => n.isGlobal).length;
  const targeted = notifications.filter(n => !n.isGlobal).length;

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
                    <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">{route.category}</p>
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
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#020b23]/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6">
            <h2 className="text-sm font-medium text-[#3C83F6] dark:text-white mb-5">New Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-1.5 block">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..." className="w-full px-4 py-2.5 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-colors" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-1.5 block">Message</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your message..." rows={3} className="w-full px-4 py-2.5 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-colors resize-none" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40 mb-1.5 block">Target</label>
                <div className="relative">
                  <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className="w-full appearance-none text-sm pl-4 pr-8 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 text-black/60 dark:text-white/60 focus:outline-none transition-colors cursor-pointer">
                    {['All Students', 'CS-2024A', 'CS-2024B', 'DS-2024A', 'DSA-2024C', 'ML-2024A', 'WD-2024B'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[10px]">▾</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors">Cancel</button>
              <button onClick={() => setShowCompose(false)} className="px-5 py-2 rounded-xl bg-[#3C83F6] dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-blue-600 dark:hover:bg-gray-100 transition-colors shadow-md">Send</button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1400px] mx-auto space-y-8">

            <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
              <div>
                <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">Notifications</h1>
                <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">Send announcements to students, batches, or colleges</p>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={() => setIsSearchOpen(true)} className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group">
                  <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors" />
                  <span className="text-sm text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">Search...</span>
                  <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded"><span>⌘</span><span>K</span></div>
                </button>
                <ThemeToggle />
                <div className="relative">
                  <button onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </button>
                  {profileDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">{user?.firstName?.charAt(0)?.toUpperCase() || 'A'}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-black dark:text-white truncate">{user?.firstName || user?.email || 'Admin User'}</h3>
                              <p className="text-xs text-black/60 dark:text-white/60 truncate">{user?.email || 'admin@techlearn.com'}</p>
                              <div className="mt-1"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-white/10 dark:text-white border border-[#3C83F6]/20 dark:border-white/20">Administrator</span></div>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <button onClick={() => setProfileDropdownOpen(false)} className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                            <div><div className="font-medium">Profile Settings</div><div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div></div>
                          </button>
                          <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10" />
                          <button onClick={() => { setProfileDropdownOpen(false); logout(); }} className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></div>
                            <div><div className="font-medium">Log Out</div><div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out of your account</div></div>
                          </button>
                        </div>
                        <div className="px-4 py-2 bg-black/[0.025] dark:bg-white/[0.025] border-t border-black/5 dark:border-white/5">
                          <p className="text-[9px] text-black/40 dark:text-white/40 text-center">TechLearn Admin Panel v2.0</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Sent',    value: notifications.length },
                { label: 'Platform-wide', value: global },
                { label: 'Targeted',      value: targeted },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">{label}</span>
                  <div className="mt-6"><span className="text-4xl font-light tracking-tighter text-[#3C83F6] dark:text-white">{value}</span></div>
                </div>
              ))}
            </div>

            {/* Top bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50">Sent Notifications</h2>
              <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3C83F6] dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-blue-600 dark:hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg">
                <FiPlus className="w-4 h-4" />
                <span>New Notification</span>
              </button>
            </div>

            {/* Notification Cards */}
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-5 flex items-start gap-4 hover:bg-white/60 dark:hover:bg-black/60 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.isGlobal ? 'bg-[#3C83F6]/10 text-[#3C83F6] dark:text-blue-400' : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'}`}>
                    {n.isGlobal ? <FiGlobe className="w-4 h-4" /> : <FiUsers className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{n.title}</h3>
                      <span className="text-[10px] text-black/40 dark:text-white/40 whitespace-nowrap shrink-0">{n.date}</span>
                    </div>
                    <p className="text-sm text-black/60 dark:text-white/60 mt-1">{n.body}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-medium ${n.isGlobal ? 'bg-[#3C83F6]/10 text-[#3C83F6] border-[#3C83F6]/20 dark:text-blue-400' : 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400'}`}>
                        {n.target}
                      </span>
                    </div>
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
