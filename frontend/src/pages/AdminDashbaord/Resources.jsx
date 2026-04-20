import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyResources } from '../../data/adminEmptyStates';
import { FiSearch, FiPlus, FiEye, FiDownload, FiFileText, FiVideo, FiLink2, FiX, FiEdit2, FiTrash2, FiMoreHorizontal, FiUpload, FiChevronDown } from 'react-icons/fi';

const resourceCategoryOptions = ['Courses', 'Important Topics', 'Resume Templates'];

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

export default function Resources() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [resourceEntries, setResourceEntries] = useState(emptyResources);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    category: '',
    file: null,
    fileName: '',
  });
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [isSavingResource, setIsSavingResource] = useState(false);
  const [openResourceMenuId, setOpenResourceMenuId] = useState(null);
  const [resourceMenuPosition, setResourceMenuPosition] = useState({ top: 0, left: 0 });
  const [resourceFormError, setResourceFormError] = useState('');
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';
  const isPersistedResource = (resourceId) => /^[a-f0-9]{24}$/i.test(String(resourceId || ''));

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    let cancelled = false;

    adminAPI
      .getResources()
      .then((remoteResources) => {
        if (!cancelled) {
          const normalized = preferRemoteData(remoteResources, emptyResources).map((resource) => ({
            ...resource,
            id: resource.id || resource._id,
            date: resource.date || resource.createdAt?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
            views: resource.views || 0,
          }));
          setResourceEntries(normalized);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResourceEntries(emptyResources);
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

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        setOpenResourceMenuId(null);
        return;
      }
      const clickedTrigger = target.closest('.resource-actions-trigger');
      const clickedMenu = target.closest('.resource-actions-menu');
      if (!clickedTrigger && !clickedMenu) {
        setOpenResourceMenuId(null);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRouteSelect = (id) => { setIsSearchOpen(false); navigate('/' + id); };

  const filteredResources = resourceEntries.filter(r => {
    const matchSearch = !tableSearch || r.title.toLowerCase().includes(tableSearch.toLowerCase()) || r.category.toLowerCase().includes(tableSearch.toLowerCase());
    return matchSearch;
  });

  const activeMenuResource = filteredResources.find((resource) => String(resource.id) === String(openResourceMenuId));

  const totalViews = resourceEntries.reduce((acc, r) => acc + r.views, 0);
  const uniqueCategories = [...new Set(resourceEntries.map(r => r.category))].length;

  const typeIconMap = {
    PDF: FiFileText,
    Sheet: FiFileText,
    Video: FiVideo,
    Link: FiLink2,
  };

  const detectResourceType = (fileName = '', mimeType = '') => {
    const name = String(fileName).toLowerCase();
    const mime = String(mimeType).toLowerCase();
    if (mime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(name)) return 'Video';
    if (mime.includes('sheet') || /\.(xls|xlsx|csv)$/i.test(name)) return 'Sheet';
    if (mime.includes('pdf') || /\.pdf$/i.test(name)) return 'PDF';
    return 'PDF';
  };

  const openAddResourceModal = () => {
    setEditingResourceId(null);
    setResourceForm({ title: '', category: '', file: null, fileName: '' });
    setResourceFormError('');
    setIsAddResourceOpen(true);
  };

  const openEditResourceModal = (resource) => {
    setEditingResourceId(resource.id);
    setResourceForm({
      title: resource.title || '',
      category: resource.category || '',
      file: null,
      fileName: '',
    });
    setResourceFormError('');
    setOpenResourceMenuId(null);
    setIsAddResourceOpen(true);
  };

  const closeAddResourceModal = () => {
    setIsAddResourceOpen(false);
    setEditingResourceId(null);
    setResourceForm({ title: '', category: '', file: null, fileName: '' });
    setIsSavingResource(false);
    setResourceFormError('');
  };

  const normalizeResource = (resource) => ({
    ...resource,
    id: resource?.id || resource?._id,
    date: resource?.date || resource?.createdAt?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
    views: resource?.views || 0,
  });

  const addResource = async () => {
    if (!resourceForm.title.trim()) {
      setResourceFormError('Resource name is required.');
      return;
    }

    if (!resourceForm.category) {
      setResourceFormError('Resource category is required.');
      return;
    }

    if (!editingResourceId && !resourceForm.file) {
      setResourceFormError('Please upload a resource file.');
      return;
    }

    setIsSavingResource(true);

    const fileType = detectResourceType(resourceForm.fileName || resourceForm.file?.name, resourceForm.file?.type);

    const toDataUrl = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
      reader.readAsDataURL(file);
    });

    let uploadedUrl = '';
    try {
      if (resourceForm.file) {
        uploadedUrl = await toDataUrl(resourceForm.file);
      }
    } catch (error) {
      setResourceFormError(error?.message || 'Failed to process uploaded file.');
      setIsSavingResource(false);
      return;
    }

    const newResource = {
      id: Date.now(),
      title: resourceForm.title.trim(),
      category: resourceForm.category,
      date: new Date().toISOString().slice(0, 10),
      type: fileType,
      url: uploadedUrl,
      views: 0,
    };

    try {
      const existingEntry = editingResourceId
        ? resourceEntries.find((entry) => String(entry.id) === String(editingResourceId))
        : null;

      const payload = {
        title: resourceForm.title.trim(),
        category: resourceForm.category,
        type: uploadedUrl ? fileType : (existingEntry?.type || fileType),
        url: uploadedUrl || existingEntry?.url || '',
      };

      let created;
      if (editingResourceId && isPersistedResource(editingResourceId)) {
        created = await adminAPI.updateResource(editingResourceId, payload);
        if (!uploadedUrl && existingEntry?.url) {
          created = { ...created, url: existingEntry.url, type: existingEntry.type || fileType };
        }
      } else if (editingResourceId) {
        setResourceEntries((prev) => prev.map((entry) => (
          String(entry.id) === String(editingResourceId)
            ? normalizeResource({
                ...entry,
                ...payload,
                url: uploadedUrl || existingEntry?.url || entry.url,
                type: uploadedUrl ? fileType : (entry.type || fileType),
              })
            : entry
        )));
        closeAddResourceModal();
        return;
      } else {
        created = await adminAPI.createResource(payload);
      }

      try {
        const refreshed = await adminAPI.getResources();
        const normalized = preferRemoteData(refreshed, [newResource, ...resourceEntries]).map(normalizeResource);
        setResourceEntries(normalized);
      } catch {
        // Mutation succeeded; keep UI in sync if refetch fails.
        if (editingResourceId) {
          setResourceEntries((prev) => prev.map((entry) => (
            String(entry.id) === String(editingResourceId)
              ? normalizeResource({ ...entry, ...(created || payload) })
              : entry
          )));
        } else {
          setResourceEntries((prev) => [normalizeResource(created || newResource), ...prev]);
        }
      }

      closeAddResourceModal();
    } catch (error) {
      setResourceFormError(error?.message || 'Failed to save resource.');
    } finally {
      setIsSavingResource(false);
    }
  };

  const deleteResource = async (resource) => {
    const confirmed = window.confirm(`Delete \"${resource.title}\"?`);
    if (!confirmed) return;

    try {
      if (isPersistedResource(resource.id)) {
        await adminAPI.deleteResource(resource.id);
      }
      setResourceEntries((prev) => prev.filter((entry) => String(entry.id) !== String(resource.id)));
    } catch (error) {
      window.alert(error?.message || 'Failed to delete resource.');
    }
  };

  const downloadResource = (resource) => {
    const url = String(resource?.url || '').trim();
    if (!url) {
      window.alert('No download URL is available for this resource yet.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
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

            <h2 className="text-xl font-semibold text-[#0f1f3d] dark:text-white">{editingResourceId ? 'Edit Resource' : 'Add Resource'}</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Resource Name*</label>
                <input
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter resource title"
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#122b52] px-3 text-sm text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Category*</label>
                <div className="mt-1 relative rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                  >
                    <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="">Select category</option>
                    {resourceCategoryOptions.map((option) => (
                      <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Upload Resource*</label>
                <label className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#122b52] px-3 text-sm text-slate-800 dark:text-white inline-flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-[#17345f] transition-colors">
                  <span className="truncate pr-3 text-black/70 dark:text-white/80">{resourceForm.fileName || 'Choose file to upload'}</span>
                  <span className="inline-flex items-center gap-1.5 shrink-0 text-[#3C83F6] dark:text-blue-300 font-semibold">
                    <FiUpload className="w-3.5 h-3.5" />
                    Browse
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setResourceForm((prev) => ({
                        ...prev,
                        file,
                        fileName: file?.name || '',
                      }));
                    }}
                  />
                </label>
                {editingResourceId && !resourceForm.fileName && (
                  <p className="mt-1 text-[11px] text-[#5f7592] dark:text-slate-300">Upload a new file only if you want to replace the existing one.</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={addResource}
                  disabled={isSavingResource}
                  className="h-10 px-5 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] text-white text-sm font-semibold"
                >
                  {isSavingResource ? 'Saving...' : editingResourceId ? 'Save Changes' : 'Add'}
                </button>
              </div>

              {resourceFormError && <p className="text-xs text-red-500">{resourceFormError}</p>}
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-6">

            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
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
              <div className="relative max-w-lg flex-1 min-w-0 w-full sm:w-auto">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full h-10 sm:h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-11 pr-4 text-[13px] sm:text-sm leading-none text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                />
              </div>

              <button onClick={openAddResourceModal} className="w-full sm:w-auto h-9 px-3.5 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                <FiPlus className="w-3.5 h-3.5" />
                Add Resource
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0f274f] max-h-[560px] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredResources.map((res, i) => {
                const TypeIcon = typeIconMap[res.type] || FiFileText;
                return (
                  <article key={res.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-4 py-3 ${i < filteredResources.length - 1 ? 'border-b border-black/10 dark:border-white/10' : ''}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center shrink-0">
                        <TypeIcon className="w-3.5 h-3.5 text-[#6e809b] dark:text-slate-300" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm md:text-base font-normal text-[#0b1b38] dark:text-white break-words">{res.title}</h3>
                        <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300 break-words">{res.category} · {res.date}</p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 shrink-0 mt-0.5 sm:mt-0">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#d6e6f4] text-[#0f2b54] dark:bg-[#21446f] dark:text-blue-200">
                        {res.type}
                      </span>
                      <div className="inline-flex items-center gap-2 shrink-0">
                        <div className="inline-flex items-center gap-1 text-sm text-[#5f7592] dark:text-slate-300">
                          <FiEye className="w-3.5 h-3.5" />
                          <span>{res.views}</span>
                        </div>
                        <button
                          type="button"
                          className="resource-actions-trigger h-8 w-8 rounded-full inline-flex items-center justify-center border border-transparent text-[#0f1f3d] dark:text-slate-200 transition-all hover:border-[#3C83F6] hover:text-[#3C83F6] hover:ring-2 hover:ring-[#3C83F6]/40 hover:bg-black/5 dark:hover:bg-white/10"
                          onClick={(event) => {
                            event.stopPropagation();
                            const rect = event.currentTarget.getBoundingClientRect();
                            const menuWidth = 144;
                            const menuHeight = 132;
                            const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));
                            const showAbove = rect.bottom + menuHeight + 8 > window.innerHeight;
                            const top = showAbove
                              ? Math.max(8, rect.top - menuHeight - 8)
                              : rect.bottom + 8;

                            setResourceMenuPosition({ top, left });
                            setOpenResourceMenuId((current) => (current === res.id ? null : res.id));
                          }}
                          aria-label={`Open actions for ${res.title}`}
                        >
                          <FiMoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {openResourceMenuId && activeMenuResource && (
        <div
          className="resource-actions-menu fixed z-[220] w-36 rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#071739] backdrop-blur-xl shadow-xl overflow-hidden"
          style={{ top: `${resourceMenuPosition.top}px`, left: `${resourceMenuPosition.left}px` }}
        >
          <button
            onClick={() => {
              setOpenResourceMenuId(null);
              downloadResource(activeMenuResource);
            }}
            className="w-full text-left px-3.5 py-2.5 text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-2"
          >
            <FiDownload className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={() => {
              setOpenResourceMenuId(null);
              openEditResourceModal(activeMenuResource);
            }}
            className="w-full text-left px-3.5 py-2.5 text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-2"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => {
              setOpenResourceMenuId(null);
              deleteResource(activeMenuResource);
            }}
            className="w-full text-left px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors inline-flex items-center gap-2"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </>
  );
}



