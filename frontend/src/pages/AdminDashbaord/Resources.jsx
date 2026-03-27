import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import {  FiSearch, FiPlus, FiEye, FiExternalLink , FiBell } from 'react-icons/fi';

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

const resources = [
  { id: 1, title: 'DSA Cheat Sheet', category: 'DSA', date: '2024-06-01', type: 'PDF', views: 342 },
  { id: 2, title: 'SQL Practice Problems', category: 'SQL', date: '2024-06-15', type: 'Sheet', views: 218 },
  { id: 3, title: 'System Design Basics', category: 'Core CS', date: '2024-07-01', type: 'Video', views: 567 },
  { id: 4, title: 'Python Official Docs', category: 'Python', date: '2024-07-10', type: 'Link', views: 189 },
  { id: 5, title: 'Binary Trees Explained', category: 'DSA', date: '2024-08-01', type: 'Video', views: 445 },
];

const typeStyles = {
  PDF:   { bg: 'bg-rose-500/10 dark:bg-rose-400/10',   text: 'text-rose-600 dark:text-rose-400',   border: 'border-rose-500/20 dark:border-rose-400/20' },
  Sheet: { bg: 'bg-emerald-500/10 dark:bg-emerald-400/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20 dark:border-emerald-400/20' },
  Video: { bg: 'bg-violet-500/10 dark:bg-violet-400/10', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20 dark:border-violet-400/20' },
  Link:  { bg: 'bg-amber-500/10 dark:bg-amber-400/10',  text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-500/20 dark:border-amber-400/20' },
};

export default function Resources() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
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

  const filteredResources = resources.filter(r => {
    const matchSearch = !tableSearch || r.title.toLowerCase().includes(tableSearch.toLowerCase()) || r.category.toLowerCase().includes(tableSearch.toLowerCase());
    const matchType = typeFilter === 'All' || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalViews = resources.reduce((acc, r) => acc + r.views, 0);
  const uniqueCategories = [...new Set(resources.map(r => r.category))].length;

  const dropdownClass = "appearance-none text-[11px] tracking-wide pl-4 pr-8 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/40 text-black/60 dark:text-white/60 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors cursor-pointer";

  return (
    <>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input ref={searchInputRef} type="text" placeholder="Search pages, tracks, or settings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
              <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setIsSearchOpen(false)}>
                <span>ESC</span>
              </div>
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
                <h1 className="admin-page-title">Resources</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Resources', value: resources.length },
                { label: 'Total Views', value: totalViews.toLocaleString() },
                { label: 'Categories', value: uniqueCategories },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-between">
                  <span className="admin-micro-label text-black/50 dark:text-white/50">{label}</span>
                  <div className="mt-6">
                    <span className="text-4xl font-light tracking-tighter text-[#3C83F6] dark:text-white">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                  <input type="text" placeholder="Search title or category..." value={tableSearch} onChange={e => setTableSearch(e.target.value)} className="pl-9 pr-4 py-2.5 text-sm bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-colors w-56" />
                </div>
                <div className="relative">
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={dropdownClass}>
                    {['All', 'PDF', 'Sheet', 'Video', 'Link'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 text-[10px]">▾</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3C83F6] dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-blue-600 dark:hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg">
                <FiPlus className="w-4 h-4" />
                <span>Add Resource</span>
              </button>
            </div>

            {/* Resources Table */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[minmax(0,1fr)_96px_124px_90px_44px] items-center px-6 py-3 gap-6 border-b border-black/5 dark:border-white/5">
                {['Title', 'Type', 'Date', 'Views', ''].map(h => (
                  <span key={h} className="admin-micro-label text-black/40 dark:text-white/40 font-medium">{h}</span>
                ))}
              </div>
              {filteredResources.map((res, i) => {
                const style = typeStyles[res.type];
                return (
                  <div key={res.id} className={`grid grid-cols-[minmax(0,1fr)_96px_124px_90px_44px] items-center px-6 py-4 gap-6 group hover:bg-white/30 dark:hover:bg-white/5 transition-colors ${i < filteredResources.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{res.title}</p>
                      <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{res.category}</p>
                    </div>
                    <span className={`admin-micro-label px-2.5 py-1 rounded-md border font-medium ${style.bg} ${style.text} ${style.border}`}>{res.type}</span>
                    <span className="text-xs text-black/40 dark:text-white/40 whitespace-nowrap">{res.date}</span>
                    <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                      <FiEye className="w-3.5 h-3.5" />
                      <span>{res.views.toLocaleString()}</span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-[#3C83F6] dark:hover:text-blue-400">
                      <FiExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {filteredResources.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No resources match your filters.</div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
