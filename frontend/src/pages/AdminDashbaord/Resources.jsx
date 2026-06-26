import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI } from '../../services/adminApi';
import { FiSearch, FiPlus, FiX, FiEdit2, FiTrash2, FiChevronDown, FiMap, FiUpload, FiEye } from 'react-icons/fi';

const createRoadmapForm = () => ({
  title: '',
  description: '',
  markdownBody: '',
  assignedBatchIds: [],
  status: 'Active',
  attachedNoteTitle: '',
  attachedNoteDay: '',
  fileName: '',
});

const searchRoutes = [
  { id: 'dashboard', title: 'Dashboard', category: 'Overview' },
  { id: 'analytics', title: 'Analytics', category: 'Overview' },
  { id: 'system-health', title: 'System Health', category: 'Overview' },
  { id: 'colleges', title: 'Colleges', category: 'Organization' },
  { id: 'batches', title: 'Batches', category: 'Organization' },
  { id: 'students', title: 'Students', category: 'Organization' },
  { id: 'question-bank', title: 'Question Bank', category: 'Learning' },
  { id: 'track-templates', title: 'Track Templates', category: 'Learning' },
  { id: 'admin/roadmaps', title: 'Roadmaps', category: 'Learning' },
  { id: 'certificates', title: 'Certificates', category: 'Learning' },
  { id: 'submission-monitor', title: 'Submission Monitor', category: 'Operations' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [roadmapSearchQuery, setRoadmapSearchQuery] = useState('');

  const [roadmapEntries, setRoadmapEntries] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [editingRoadmapId, setEditingRoadmapId] = useState(null);
  const [viewingRoadmap, setViewingRoadmap] = useState(null);
  const [roadmapForm, setRoadmapForm] = useState(createRoadmapForm());
  const [roadmapFormError, setRoadmapFormError] = useState('');
  const [isSavingRoadmap, setIsSavingRoadmap] = useState(false);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      adminAPI.getRoadmaps(),
      adminAPI.getBatches(),
    ])
      .then(([remoteRoadmaps, remoteBatches]) => {
        if (cancelled) return;
        setRoadmapEntries(Array.isArray(remoteRoadmaps) ? remoteRoadmaps : []);
        setBatchOptions((Array.isArray(remoteBatches) ? remoteBatches : []).map((batch) => ({
          id: batch.id || batch._id,
          name: batch.name || 'Untitled Batch',
          college: batch.college || '',
        })));
      })
      .catch(() => {
        if (!cancelled) {
          setRoadmapEntries([]);
          setBatchOptions([]);
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

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRouteSelect = (id) => { setIsSearchOpen(false); navigate('/' + id); };

  const openAddRoadmapModal = () => {
    setEditingRoadmapId(null);
    setRoadmapForm(createRoadmapForm());
    setRoadmapFormError('');
    setIsRoadmapModalOpen(true);
  };

  const openEditRoadmapModal = (roadmap) => {
    setEditingRoadmapId(roadmap.id || roadmap._id);
    setRoadmapForm({
      title: roadmap.title || '',
      description: roadmap.description || '',
      markdownBody: roadmap.markdownBody || '',
      assignedBatchIds: (roadmap.assignedBatchIds || []).map((batchId) => String(batchId)),
      status: roadmap.status || 'Active',
      attachedNoteTitle: roadmap.attachedNoteTitle || '',
      attachedNoteDay: roadmap.attachedNoteDay || '',
      fileName: 'Assigned Roadmap.md',
    });
    setRoadmapFormError('');
    setIsRoadmapModalOpen(true);
  };

  const closeRoadmapModal = () => {
    setIsRoadmapModalOpen(false);
    setEditingRoadmapId(null);
    setRoadmapForm(createRoadmapForm());
    setRoadmapFormError('');
    setIsSavingRoadmap(false);
  };

  const toggleRoadmapBatch = (batchId) => {
    setRoadmapForm((prev) => {
      const nextId = String(batchId);
      const selected = new Set((prev.assignedBatchIds || []).map(String));
      if (selected.has(nextId)) selected.delete(nextId);
      else selected.add(nextId);
      return { ...prev, assignedBatchIds: Array.from(selected) };
    });
  };

  const saveRoadmap = async () => {
    if (!roadmapForm.title.trim()) {
      setRoadmapFormError('Roadmap title is required.');
      return;
    }

    if (!roadmapForm.markdownBody.trim()) {
      setRoadmapFormError('Roadmap markdown is required.');
      return;
    }

    setIsSavingRoadmap(true);
    setRoadmapFormError('');

    const payload = {
      title: roadmapForm.title.trim(),
      description: roadmapForm.description.trim(),
      markdownBody: roadmapForm.markdownBody.trim(),
      assignedBatchIds: roadmapForm.assignedBatchIds,
      status: roadmapForm.status,
      attachedNoteTitle: roadmapForm.attachedNoteTitle.trim(),
      attachedNoteDay: roadmapForm.attachedNoteDay,
    };

    try {
      if (editingRoadmapId) {
        await adminAPI.updateRoadmap(editingRoadmapId, payload);
      } else {
        await adminAPI.createRoadmap(payload);
      }
      const refreshed = await adminAPI.getRoadmaps();
      setRoadmapEntries(Array.isArray(refreshed) ? refreshed : []);
      closeRoadmapModal();
    } catch (error) {
      setRoadmapFormError(error?.message || 'Failed to save roadmap.');
    } finally {
      setIsSavingRoadmap(false);
    }
  };

  const deleteRoadmap = async (roadmap) => {
    const confirmed = window.confirm(`Delete "${roadmap.title}"?`);
    if (!confirmed) return;

    try {
      await adminAPI.deleteRoadmap(roadmap.id || roadmap._id);
      setRoadmapEntries((prev) => prev.filter((entry) => String(entry.id || entry._id) !== String(roadmap.id || roadmap._id)));
    } catch (error) {
      window.alert(error?.message || 'Failed to delete roadmap.');
    }
  };

  if (!mounted) return <LoadingScreen />;

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

      {isRoadmapModalOpen && (
        <div className="fixed inset-0 z-[135] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeRoadmapModal} />
          <div className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f274f] shadow-2xl p-6">
            <button
              onClick={closeRoadmapModal}
              className="absolute right-4 top-4 text-black/45 dark:text-white/55 hover:text-black dark:hover:text-white"
              aria-label="Close roadmap form"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-[#0f1f3d] dark:text-white">{editingRoadmapId ? 'Edit Roadmap' : 'Create Roadmap'}</h2>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Roadmap Title*</label>
                  <input
                    value={roadmapForm.title}
                    onChange={(e) => setRoadmapForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#122b52] px-3 text-sm text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Description</label>
                  <input
                    value={roadmapForm.description}
                    onChange={(e) => setRoadmapForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#122b52] px-3 text-sm text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Markdown File (.md)*</label>
                  <div className="mt-2 flex items-center justify-center border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-[#122b52]/50 hover:bg-white/60 dark:hover:bg-[#122b52]/80 hover:border-[#3C83F6] dark:hover:border-blue-400 transition-all duration-200 py-20 px-6 text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept=".md"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setRoadmapForm((prev) => ({
                              ...prev,
                              markdownBody: evt.target?.result || '',
                              fileName: file.name,
                            }));
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-300/10 text-[#3C83F6] dark:text-blue-300 flex items-center justify-center">
                        <FiUpload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          {roadmapForm.fileName ? roadmapForm.fileName : 'Click to upload Markdown file'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">
                          Only Markdown (.md) files are supported
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Status</label>
                  <div className="mt-1 relative rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43]">
                    <select
                      value={roadmapForm.status}
                      onChange={(e) => setRoadmapForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                    >
                      <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white">Active</option>
                      <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white">Draft</option>
                      <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white">Archived</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/55 dark:bg-[#122b52] p-3 space-y-3">
                  <p className="text-xs font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Attach Resource to Note</p>
                  <div>
                    <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Note Title</label>
                    <input
                      value={roadmapForm.attachedNoteTitle}
                      onChange={(e) => setRoadmapForm((prev) => ({ ...prev, attachedNoteTitle: e.target.value }))}
                      placeholder="e.g. Day 3 Notes"
                      className="mt-1 w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43] px-3 text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Day Number</label>
                    <input
                      type="number"
                      min="1"
                      value={roadmapForm.attachedNoteDay}
                      onChange={(e) => setRoadmapForm((prev) => ({ ...prev, attachedNoteDay: e.target.value }))}
                      placeholder="Optional"
                      className="mt-1 w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43] px-3 text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#5f7592] dark:text-slate-300">Assign to Batches</p>
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#122b52] p-2 space-y-1">
                    {batchOptions.map((batch) => {
                      const checked = roadmapForm.assignedBatchIds.map(String).includes(String(batch.id));
                      return (
                        <label key={batch.id} className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm text-slate-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRoadmapBatch(batch.id)}
                            className="mt-1"
                          />
                          <span>
                            <span className="block font-medium">{batch.name}</span>
                            {batch.college && <span className="block text-[11px] text-[#5f7592] dark:text-slate-300">{batch.college}</span>}
                          </span>
                        </label>
                      );
                    })}
                    {batchOptions.length === 0 && (
                      <p className="px-2 py-3 text-xs text-[#5f7592] dark:text-slate-300">No batches available.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={saveRoadmap}
                  disabled={isSavingRoadmap}
                  className="w-full h-10 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] disabled:opacity-70 text-white text-sm font-semibold"
                >
                  {isSavingRoadmap ? 'Saving...' : editingRoadmapId ? 'Save Changes' : 'Create Roadmap'}
                </button>
                {roadmapFormError && <p className="text-xs text-red-500">{roadmapFormError}</p>}
              </aside>
            </div>
          </div>
        </div>
      )}

      {viewingRoadmap && (
        <div className="fixed inset-0 z-[135] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setViewingRoadmap(null)} />
          <div className="relative w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f274f] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 dark:border-white/10 px-6 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-[#0f1f3d] dark:text-white">{viewingRoadmap.title}</h2>
                  <span className="rounded-full bg-[#d6e6f4] dark:bg-[#21446f] px-2.5 py-0.5 text-xs font-semibold text-[#0f2b54] dark:text-blue-200">
                    {viewingRoadmap.status || 'Active'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5f7592] dark:text-slate-300">{viewingRoadmap.description || 'No description'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(viewingRoadmap.assignedBatches || []).length > 0 ? (
                    viewingRoadmap.assignedBatches.map((batch) => (
                      <span key={batch.id} className="rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5 text-[11px] text-[#0f2b54] dark:text-slate-200">
                        {batch.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#5f7592] dark:text-slate-300">No batches assigned</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingRoadmap(null)}
                className="shrink-0 text-black/45 dark:text-white/55 hover:text-black dark:hover:text-white"
                aria-label="Close roadmap preview"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-6 py-6">
              <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-[#0f1f3d] dark:prose-headings:text-white prose-p:text-[#31445f] dark:prose-p:text-slate-300 prose-li:text-[#31445f] dark:prose-li:text-slate-300 prose-a:text-[#3C83F6] prose-pre:bg-[#071831] prose-pre:text-slate-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {viewingRoadmap.markdownBody || 'No roadmap content available.'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)} className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-8">
            <div>
              <h1 className="admin-page-title">Roadmaps</h1>
            </div>

            <section className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#e8eef5] dark:bg-[#1a3a66] flex items-center justify-center shrink-0">
                    <FiMap className="w-4 h-4 text-[#3C83F6] dark:text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-[15px] font-semibold text-[#0b1b38] dark:text-white">Batch Roadmaps</h2>
                    <p className="text-[11px] md:text-xs text-[#5f7592] dark:text-slate-300 truncate">Create one roadmap and assign it to multiple batches.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <div className="relative w-48 sm:w-56">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={roadmapSearchQuery}
                      onChange={(e) => setRoadmapSearchQuery(e.target.value)}
                      placeholder="Search roadmaps..."
                      className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    />
                  </div>
                  <button onClick={openAddRoadmapModal} className="dashboard-primary-btn h-9 px-4 text-xs shrink-0">
                    <FiPlus className="w-3.5 h-3.5" />
                    Create Roadmap
                  </button>
                </div>
              </div>

              {roadmapEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-8 text-center text-sm text-black/40 dark:text-white/40">
                  No roadmaps created yet. Users will keep seeing the default roadmap until a batch roadmap is assigned.
                </div>
              ) : (
                <div className="overflow-auto max-h-[78vh] bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl">
                  <table className="w-full min-w-[900px] table-fixed">
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 select-none">
                        <th className="px-4 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-12 whitespace-nowrap">#</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[200px] whitespace-nowrap">Roadmap Title</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Actions</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[240px] whitespace-nowrap">Description</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Status</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-36 whitespace-nowrap">Batches</th>
                        <th className="px-4 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="border-t border-black/5 dark:border-white/10">
                      {roadmapEntries.filter((roadmap) => {
                        const query = roadmapSearchQuery.toLowerCase();
                        const batchNames = (roadmap.assignedBatches || []).map((b) => b.name).join(' ').toLowerCase();
                        return (
                          (roadmap.title || '').toLowerCase().includes(query) ||
                          (roadmap.description || '').toLowerCase().includes(query) ||
                          (roadmap.status || '').toLowerCase().includes(query) ||
                          batchNames.includes(query)
                        );
                      }).map((roadmap, index) => {
                        const truncatedDesc = roadmap.description
                          ? (roadmap.description.length > 40 ? `${roadmap.description.substring(0, 40)}...` : roadmap.description)
                          : 'No description';
                        const batchCount = (roadmap.assignedBatches || []).length;
                        const batchLabel = batchCount === 0
                          ? 'None'
                          : (roadmap.assignedBatches || []).map((b) => b.name).join(', ');

                        return (
                          <tr key={roadmap.id || roadmap._id} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                            <td className="px-4 py-2.5 text-center text-[11px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap">
                              {index + 1}
                            </td>
                            <td className="px-4 py-2.5 text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-white/85 truncate" title={roadmap.title}>
                              {roadmap.title}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setViewingRoadmap(roadmap)}
                                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 text-slate-500 dark:text-slate-400"
                                  aria-label={`View ${roadmap.title}`}
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditRoadmapModal(roadmap)}
                                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 text-slate-500 dark:text-slate-400"
                                  aria-label={`Edit ${roadmap.title}`}
                                >
                                  <FiEdit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteRoadmap(roadmap)}
                                  className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 text-slate-500 dark:text-slate-400"
                                  aria-label={`Delete ${roadmap.title}`}
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-[11px] sm:text-xs text-slate-500 dark:text-white/60 truncate" title={roadmap.description}>
                              {truncatedDesc}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="shrink-0 rounded-full bg-[#d6e6f4] dark:bg-[#21446f] px-2.5 py-0.5 text-[10px] font-semibold text-[#0f2b54] dark:text-blue-200">
                                {roadmap.status || 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-white/60 whitespace-nowrap">
                              {batchCount} batch{batchCount === 1 ? '' : 'es'}
                            </td>
                            <td className="px-4 py-2.5 text-[11px] sm:text-xs text-slate-500 dark:text-white/60 truncate" title={batchLabel}>
                              {batchLabel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
