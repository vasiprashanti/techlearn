import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import ThemeToggle from '../../components/Dashboard/ThemeToggle';
import { FiSearch } from 'react-icons/fi';

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

const logs = [
  { id: 1, action: 'Created batch',           detail: 'CS-2024A',        actor: 'Admin User', type: 'Batch',    ts: '2025-03-08 14:32', verb: 'Created' },
  { id: 2, action: 'Updated track template',  detail: 'DSA Track',       actor: 'Admin User', type: 'Track',    ts: '2025-03-08 13:15', verb: 'Updated' },
  { id: 3, action: 'Deleted question',        detail: 'Old Two Sum',     actor: 'Admin User', type: 'Question', ts: '2025-03-08 11:45', verb: 'Deleted' },
  { id: 4, action: 'Added student',           detail: 'John Doe',        actor: 'Admin User', type: 'Student',  ts: '2025-03-07 16:20', verb: 'Created' },
  { id: 5, action: 'Updated college',         detail: 'MIT',             actor: 'Admin User', type: 'College',  ts: '2025-03-07 10:10', verb: 'Updated' },
  { id: 6, action: 'Created track template',  detail: 'SQL Track v2',    actor: 'Admin User', type: 'Track',    ts: '2025-03-06 09:30', verb: 'Created' },
  { id: 7, action: 'Deleted batch',           detail: 'TEST-001',        actor: 'Admin User', type: 'Batch',    ts: '2025-03-05 17:00', verb: 'Deleted' },
  { id: 8, action: 'Updated question',        detail: 'Binary Search',   actor: 'Admin User', type: 'Question', ts: '2025-03-05 14:22', verb: 'Updated' },
];

const verbStyle = {
  Created: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  Updated: { bg: 'bg-blue-500/10 border-blue-500/20',     text: 'text-[#3C83F6] dark:text-blue-400' },
  Deleted: { bg: 'bg-rose-500/10 border-rose-500/20',     text: 'text-rose-600 dark:text-rose-400' },
};

const typeColor = {
  Batch:    'text-violet-600 dark:text-violet-400',
  Track:    'text-amber-600 dark:text-amber-400',
  Question: 'text-[#3C83F6] dark:text-blue-400',
  Student:  'text-emerald-600 dark:text-emerald-400',
  College:  'text-rose-600 dark:text-rose-400',
};

export default function AuditLogs() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [verbFilter, setVerbFilter] = useState('All');
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

  const filteredLogs = logs.filter(l => {
    const matchSearch = !tableSearch ||
      l.action.toLowerCase().includes(tableSearch.toLowerCase()) ||
      l.detail.toLowerCase().includes(tableSearch.toLowerCase()) ||
      l.type.toLowerCase().includes(tableSearch.toLowerCase());
    const matchVerb = verbFilter === 'All' || l.verb === verbFilter;
    return matchSearch && matchVerb;
  });

  const today = logs.filter(l => l.ts.startsWith('2025-03-08')).length;
  const deletions = logs.filter(l => l.verb === 'Deleted').length;

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

      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-8 pb-12 px-6 md:px-12 lg:px-16 overflow-auto ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1400px] mx-auto space-y-8">

            <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
              <div>
                <h1 className="text-2xl font-light tracking-tight text-[#3C83F6] dark:text-white">Audit Logs</h1>
                <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 mt-1">Track all admin actions on the platform</p>
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
                { label: 'Total Actions', value: logs.length,  color: 'text-[#3C83F6] dark:text-white' },
                { label: 'Today',         value: today,        color: 'text-[#3C83F6] dark:text-white' },
                { label: 'Deletions',     value: deletions,    color: 'text-rose-600 dark:text-rose-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50">{label}</span>
                  <div className="mt-6"><span className={`text-4xl font-light tracking-tighter ${color}`}>{value}</span></div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                <input type="text" placeholder="Search action or detail..." value={tableSearch} onChange={e => setTableSearch(e.target.value)} className="pl-9 pr-4 py-2.5 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-colors w-56" />
              </div>
              <div className="relative">
                <select value={verbFilter} onChange={e => setVerbFilter(e.target.value)} className="appearance-none text-[11px] tracking-wide pl-4 pr-8 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 text-black/60 dark:text-white/60 focus:outline-none transition-colors cursor-pointer">
                  {['All', 'Created', 'Updated', 'Deleted'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[10px]">▾</span>
              </div>
            </div>

            {/* Logs Timeline */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-6 py-3 border-b border-black/5 dark:border-white/5 gap-4">
                {['', 'Action', 'Type', 'Actor', 'Timestamp'].map((h, i) => (
                  <span key={i} className="text-[9px] uppercase tracking-widest text-black/40 dark:text-white/40 font-medium">{h}</span>
                ))}
              </div>
              {filteredLogs.map((log, i) => {
                const vs = verbStyle[log.verb];
                return (
                  <div key={log.id} className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center px-6 py-4 gap-4 group hover:bg-white/30 dark:hover:bg-white/5 transition-colors ${i < filteredLogs.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}>
                    <span className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border font-medium whitespace-nowrap ${vs.bg} ${vs.text}`}>{log.verb}</span>
                    <div>
                      <p className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{log.action}</p>
                      <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{log.detail} · by {log.actor}</p>
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${typeColor[log.type] || 'text-black/50 dark:text-white/50'}`}>{log.type}</span>
                    <span className="text-xs text-black/40 dark:text-white/40 whitespace-nowrap">{log.actor}</span>
                    <span className="text-xs font-mono text-black/40 dark:text-white/40 whitespace-nowrap">{log.ts}</span>
                  </div>
                );
              })}
              {filteredLogs.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No logs match your filters.</div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
