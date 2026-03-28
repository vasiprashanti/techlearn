import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { FiSearch, FiPlus, FiEye, FiDownload, FiFileText, FiVideo, FiLink2, FiChevronDown, FiX } from 'react-icons/fi';

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

export default function Resources() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [resourceEntries, setResourceEntries] = useState(resources);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    type: '',
    category: '',
  });
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

  const filteredResources = resourceEntries.filter(r => {
    const matchSearch = !tableSearch || r.title.toLowerCase().includes(tableSearch.toLowerCase()) || r.category.toLowerCase().includes(tableSearch.toLowerCase());
    return matchSearch;
  });

  const totalViews = resourceEntries.reduce((acc, r) => acc + r.views, 0);
  const uniqueCategories = [...new Set(resourceEntries.map(r => r.category))].length;

  const typeIconMap = {
    PDF: FiFileText,
    Sheet: FiFileText,
    Video: FiVideo,
    Link: FiLink2,
  };

  const openAddResourceModal = () => {
    setResourceForm({ title: '', type: '', category: '' });
    setIsAddResourceOpen(true);
  };

  const closeAddResourceModal = () => {
    setIsAddResourceOpen(false);
    setResourceForm({ title: '', type: '', category: '' });
  };

  const addResource = () => {
    if (!resourceForm.title.trim() || !resourceForm.type || !resourceForm.category.trim()) return;

    const newResource = {
      id: Date.now(),
      title: resourceForm.title.trim(),
      category: resourceForm.category.trim(),
      date: new Date().toISOString().slice(0, 10),
      type: resourceForm.type,
      views: 0,
    };

    setResourceEntries((prev) => [newResource, ...prev]);
    closeAddResourceModal();
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

      {isAddResourceOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeAddResourceModal} />
          <div className="relative w-full max-w-lg rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f274f] shadow-2xl p-6">
            <button
              onClick={closeAddResourceModal}
              className="absolute right-4 top-4 text-black/45 dark:text-white/55 hover:text-black dark:hover:text-white"
              aria-label="Close add resource form"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-[#0f1f3d] dark:text-white">Add Resource</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Title</label>
                <input
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter resource title"
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/5 px-3 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Type</label>
                <div className="relative mt-1">
                  <select
                    value={resourceForm.type}
                    onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/5 px-3 pr-10 text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="PDF">pdf</option>
                    <option value="Link">link</option>
                    <option value="Video">video</option>
                    <option value="Sheet">sheet</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/50" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Category</label>
                <input
                  value={resourceForm.category}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category"
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-white/5 px-3 text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={addResource}
                  className="h-10 px-5 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] text-white text-sm font-semibold"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-6">

            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Resources</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Total Resources', value: resourceEntries.length },
                { label: 'Total Views', value: totalViews.toLocaleString() },
                { label: 'Categories', value: uniqueCategories },
              ].map(({ label, value }) => (
                <article key={label} className="rounded-2xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 px-5 py-4">
                  <p className="text-xs text-[#5f7491] dark:text-slate-300">{label}</p>
                  <p className="mt-1.5 text-3xl font-bold text-[#0b1b38] dark:text-white">{value}</p>
                </article>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative max-w-lg flex-1 min-w-[240px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748b] dark:text-slate-300" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/55 dark:bg-[#18365f] pl-9 pr-4 text-xs text-[#5f7592] dark:text-slate-200 placeholder:text-[#6e809b] dark:placeholder:text-slate-300/80"
                />
              </div>

              <button onClick={openAddResourceModal} className="h-9 px-3.5 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] text-white text-xs font-semibold inline-flex items-center gap-1.5">
                <FiPlus className="w-3.5 h-3.5" />
                Add Resource
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0f274f]">
              {filteredResources.map((res, i) => {
                const TypeIcon = typeIconMap[res.type] || FiFileText;
                return (
                  <article key={res.id} className={`flex items-center justify-between gap-2.5 px-4 py-3 ${i < filteredResources.length - 1 ? 'border-b border-black/10 dark:border-white/10' : ''}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center shrink-0">
                        <TypeIcon className="w-3.5 h-3.5 text-[#6e809b] dark:text-slate-300" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm md:text-base font-normal text-[#0b1b38] dark:text-white truncate">{res.title}</h3>
                        <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300 truncate">{res.category} · {res.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#d6e6f4] text-[#0f2b54] dark:bg-[#21446f] dark:text-blue-200">
                        {res.type}
                      </span>
                      <div className="inline-flex items-center gap-1 text-sm text-[#5f7592] dark:text-slate-300">
                        <FiEye className="w-3.5 h-3.5" />
                        <span>{res.views}</span>
                      </div>
                      <button className="h-8 w-8 rounded-full inline-flex items-center justify-center border border-transparent text-[#0f1f3d] dark:text-slate-200 transition-all hover:border-[#3C83F6] hover:text-[#3C83F6] hover:ring-2 hover:ring-[#3C83F6]/40 hover:bg-black/5 dark:hover:bg-white/10" aria-label={`Download ${res.title}`}>
                        <FiDownload className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
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
