import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import LoadingScreen from '../../components/Loader/Loader3D';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyTrackTemplates } from '../../data/adminEmptyStates';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiCode, FiDatabase, FiCpu, FiArrowUp, FiArrowDown, FiClock, FiChevronDown, FiGlobe, FiTerminal, FiBarChart2, FiMoreHorizontal } from 'react-icons/fi';
import { PiBrainLight } from 'react-icons/pi';

// --- Mock Data ---
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
  { id: 'settings', title: 'Settings', category: 'Configuration' },
];

const iconMapForTrack = (iconKeyOrCategory) => {
  if (iconKeyOrCategory === 'chart') return FiBarChart2;
  if (iconKeyOrCategory === 'globe') return FiGlobe;
  if (iconKeyOrCategory === 'terminal') return FiTerminal;
  if (iconKeyOrCategory === 'brain') return PiBrainLight;
  if (iconKeyOrCategory === 'database' || iconKeyOrCategory === 'Database Management') return FiDatabase;
  if (iconKeyOrCategory === 'cpu' || iconKeyOrCategory === 'Web Development') return FiCpu;
  return FiCode;
};

export default function TrackTemplate() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();


  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [tracks, setTracks] = useState(emptyTrackTemplates);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [templateFormError, setTemplateFormError] = useState('');
  const [createTemplateForm, setCreateTemplateForm] = useState({
    name: '',
    trackType: 'Daily Challenge',
    category: '',
    description: '',
    totalDays: '30',
    status: 'Active',
  });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [historyTrack, setHistoryTrack] = useState(null);
  const [trackQuestions, setTrackQuestions] = useState({});
  const [versionHistory, setVersionHistory] = useState({});
  const [questionCategories, setQuestionCategories] = useState([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const searchInputRef = useRef(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!event.target.closest('.track-actions-trigger') && !event.target.closest('.track-actions-menu')) {
        setOpenActionMenuId(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleSelectToggle = (id) => {
    setSelectedTrackIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedTrackIds([]);
  };

  const handleBulkDelete = async () => {
    setTemplateFormError('');
    setIsBulkDeleting(true);
    try {
      await adminAPI.bulkDeleteTrackTemplates(selectedTrackIds);
      await loadTrackTemplatePageData();
      setSelectedTrackIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (error) {
      setTemplateFormError(error.message || 'Failed to bulk delete track templates.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const isDarkMode = theme === 'dark';

  const loadTrackTemplatePageData = useCallback(async () => {
    const [remoteTracks, remoteCategories] = await Promise.all([
      adminAPI.getTrackTemplates(),
      adminAPI.getQuestionCategories(),
    ]);

    const normalizedTracks = preferRemoteData(remoteTracks, emptyTrackTemplates).map((track) => ({
      ...track,
      id: track.id || track._id,
      icon: track.icon || iconMapForTrack(track.iconKey || track.category),
      assignedBatch: track.assignedBatch || '',
    }));
    const normalizedCategories = preferRemoteData(remoteCategories, [])
      .map((category) => category.title)
      .filter(Boolean);

    setTracks(normalizedTracks);
    setQuestionCategories(normalizedCategories);
  }, []);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    let cancelled = false;

    loadTrackTemplatePageData()
      .then(() => {
        if (!cancelled) {
          setTemplateFormError('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTracks(emptyTrackTemplates);
          setQuestionCategories([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadTrackTemplatePageData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter(route =>
    route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRouteSelect = (id) => {
    setIsSearchOpen(false);
    navigate(`/${id}`);
  };

  const filteredTracks = tracks.filter((track) => {
    const query = templateSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      track.name.toLowerCase().includes(query) ||
      track.description.toLowerCase().includes(query) ||
      track.category.toLowerCase().includes(query)
    );
  });

  const moveQuestion = (trackId, index, direction) => {
    setTrackQuestions((prev) => {
      const current = [...(prev[trackId] || [])];
      const target = index + direction;
      if (target < 0 || target >= current.length) return prev;
      [current[index], current[target]] = [current[target], current[index]];
      return { ...prev, [trackId]: current };
    });
  };

  const saveOrdering = (trackId) => {
    setVersionHistory((prev) => ({
      ...prev,
      [trackId]: [`v${(prev[trackId]?.length || 0) + 1} • Updated question ordering`, ...(prev[trackId] || [])],
    }));
    setSelectedTrack(null);
  };

  const updateCreateTemplateField = (field, value) => {
    setCreateTemplateForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'trackType' && value === 'Daily Task') {
        next.category = 'Daily Task';
      } else if (field === 'trackType' && prev.trackType === 'Daily Task' && value !== 'Daily Task') {
        next.category = '';
      }
      return next;
    });
  };

  const closeCreateTemplateModal = () => {
    setIsCreateTemplateOpen(false);
    setEditingTemplateId(null);
    setTemplateFormError('');
    setCreateTemplateForm({
      name: '',
      trackType: 'Daily Challenge',
      category: '',
      description: '',
      totalDays: '30',
      status: 'Active',
    });
  };

  const openCreateTemplateModal = () => {
    setEditingTemplateId(null);
    setTemplateFormError('');
    setCreateTemplateForm({
      name: '',
      trackType: 'Daily Challenge',
      category: '',
      description: '',
      totalDays: '30',
      status: 'Active',
    });
    setIsCreateTemplateOpen(true);
  };

  const openEditTemplateModal = (track) => {
    setEditingTemplateId(track.id);
    setCreateTemplateForm({
      name: track.name || '',
      trackType: track.trackType || 'Daily Challenge',
      category: track.category || '',
      description: track.description || '',
      totalDays: String(track.totalDays || 1),
      status: track.status || 'Active',
    });
    setTemplateFormError('');
    setIsCreateTemplateOpen(true);
  };

  const submitTemplate = async () => {
    const isDailyTask = createTemplateForm.trackType === 'Daily Task';
    const effectiveCategory = isDailyTask ? (createTemplateForm.category || 'Daily Task') : createTemplateForm.category;

    if (!createTemplateForm.name.trim() || !effectiveCategory) {
      setTemplateFormError('Template name and category are required.');
      return;
    }
    const totalDays = Number(createTemplateForm.totalDays) > 0 ? Number(createTemplateForm.totalDays) : 1;

    const payload = {
      name: createTemplateForm.name.trim(),
      trackType: createTemplateForm.trackType || 'Daily Challenge',
      category: effectiveCategory,
      description: createTemplateForm.description.trim() || `${totalDays}-day ${effectiveCategory} track template`,
      totalDays,
      status: createTemplateForm.status,
    };

    try {
      setTemplateFormError('');
      if (editingTemplateId) {
        await adminAPI.updateTrackTemplate(editingTemplateId, payload);
      } else {
        await adminAPI.createTrackTemplate(payload);
      }
      await loadTrackTemplatePageData();
      closeCreateTemplateModal();
    } catch (error) {
      setTemplateFormError(error?.message || 'Failed to save template.');
    }
  };

  const deleteTemplate = async (trackId) => {
    try {
      await adminAPI.deleteTrackTemplate(trackId);
      await loadTrackTemplatePageData();
    } catch {
      setTemplateFormError('Failed to delete template.');
    }
    setTrackQuestions((prev) => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
    setVersionHistory((prev) => {
      const next = { ...prev };
      delete next[trackId];
      return next;
    });
    if (selectedTrack?.id === trackId) setSelectedTrack(null);
    if (historyTrack?.id === trackId) setHistoryTrack(null);
    if (deleteTarget?.id === trackId) setDeleteTarget(null);
  };

  const duplicateTemplate = async (trackId) => {
    try {
      await adminAPI.duplicateTrackTemplate(trackId);
      await loadTrackTemplatePageData();
    } catch (error) {
      setTemplateFormError(error?.message || 'Failed to duplicate template.');
    }
  };

  return (
    <>
      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages, tracks, or settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
              />
              <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0">
                <span>ESC</span>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">
                  No results found for "{searchQuery}"
                </div>
              ) : (
                filteredRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => handleRouteSelect(route.id)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {route.title}
                      </h4>
                      <p className="admin-micro-label text-black/40 dark:text-white/40 mt-1">
                        {route.category}
                      </p>
                    </div>
                    <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTrack && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedTrack(null)} />
          <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">Question Ordering • {selectedTrack.name}</h2>
              <button onClick={() => setSelectedTrack(null)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-3">
              {(trackQuestions[selectedTrack.id] || []).map((q, idx) => (
                <div key={q + idx} className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5">
                  <span className="text-sm text-black/75 dark:text-white/80">Day {idx + 1}: {q}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => moveQuestion(selectedTrack.id, idx, -1)} className="w-8 h-8 rounded-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-black/50 dark:text-white/60 hover:text-[#3C83F6] dark:hover:text-white"><FiArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveQuestion(selectedTrack.id, idx, 1)} className="w-8 h-8 rounded-lg border border-black/10 dark:border-white/10 flex items-center justify-center text-black/50 dark:text-white/60 hover:text-[#3C83F6] dark:hover:text-white"><FiArrowDown className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => saveOrdering(selectedTrack.id)} className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6]/10 text-[#3C83F6] dark:text-white dark:bg-white/10 dark:border-white/20">Save Ordering</button>
            </div>
          </div>
        </div>
      )}

      {historyTrack && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setHistoryTrack(null)} />
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">Version History • {historyTrack.name}</h2>
              <button onClick={() => setHistoryTrack(null)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-2">
              {(versionHistory[historyTrack.id] || []).map((entry, idx) => (
                <div key={entry + idx} className="rounded-xl border border-black/10 dark:border-white/10 p-3 bg-white/60 dark:bg-white/5 text-xs text-black/65 dark:text-white/65 flex items-center gap-2">
                  <FiClock className="w-3.5 h-3.5" />{entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCreateTemplateOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeCreateTemplateModal} />
          <div
            className="relative w-full max-w-[420px] max-h-[84vh] rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="sticky top-0 z-10 px-3.5 py-2.5 border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 backdrop-blur">
              <h2 className="text-base font-semibold text-[#3C83F6] dark:text-white">{editingTemplateId ? 'Edit Template' : 'Create Template'}</h2>
            </div>

            <div className="p-3.5 space-y-2.5">
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Template name*</label>
                <input
                  value={createTemplateForm.name}
                  onChange={(e) => updateCreateTemplateField('name', e.target.value)}
                  placeholder="Enter template name"
                  className="mt-1 w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3 text-sm text-[#1a2335] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35"
                />
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Track Type*</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={createTemplateForm.trackType || 'Daily Challenge'}
                    onChange={(e) => updateCreateTemplateField('trackType', e.target.value)}
                    className="appearance-none w-full h-9 rounded-xl border-0 bg-transparent px-3 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                  >
                    <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="Daily Challenge">Daily Challenge (Single Timed DSA)</option>
                    <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="Daily Task">Daily Task (Multi-Task/Day)</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div>
                {createTemplateForm.trackType === 'Daily Task' ? (
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50">Select Categories to Include* (Multiple allowed)</label>
                    <div className="mt-1.5 p-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] space-y-2 max-h-40 overflow-y-auto">
                      {questionCategories.map((cat) => {
                        const selectedList = createTemplateForm.category && createTemplateForm.category !== 'Daily Task'
                          ? createTemplateForm.category.split(',').map((c) => c.trim())
                          : [];
                        const isChecked = selectedList.includes(cat);
                        return (
                          <label key={cat} className="flex items-center gap-2 text-sm text-slate-800 dark:text-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let nextList = [...selectedList];
                                if (e.target.checked) {
                                  if (!nextList.includes(cat)) {
                                    nextList.push(cat);
                                  }
                                } else {
                                  nextList = nextList.filter((c) => c !== cat);
                                }
                                const nextCategoryVal = nextList.length > 0 ? nextList.join(', ') : 'Daily Task';
                                updateCreateTemplateField('category', nextCategoryVal);
                              }}
                              className="rounded border-black/10 text-[#3C83F6] focus:ring-[#3C83F6]"
                            />
                            <span>{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] text-black/45 dark:text-white/45">
                      If no categories are selected, it defaults to including all categories.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="admin-micro-label text-black/50 dark:text-white/50">Category*</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        value={createTemplateForm.category}
                        onChange={(e) => updateCreateTemplateField('category', e.target.value)}
                        className="appearance-none w-full h-9 rounded-xl border-0 bg-transparent px-3 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                      >
                        <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="">Select category</option>
                        {questionCategories.map((category) => (
                          <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                    {questionCategories.length === 0 && (
                      <p className="mt-2 text-xs text-black/45 dark:text-white/45">
                        No categories available. Add a question category first.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Description</label>
                <textarea
                  value={createTemplateForm.description}
                  onChange={(e) => updateCreateTemplateField('description', e.target.value)}
                  rows={3}
                  placeholder="Describe this template"
                  className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3 py-2 text-sm text-[#1a2335] dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Total days</label>
                  <input
                    type="number"
                    min="1"
                    value={createTemplateForm.totalDays}
                    onChange={(e) => updateCreateTemplateField('totalDays', e.target.value)}
                    className="mt-1 w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3 text-sm text-[#1a2335] dark:text-white"
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Status</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={createTemplateForm.status}
                      onChange={(e) => updateCreateTemplateField('status', e.target.value)}
                      className="appearance-none w-full h-9 rounded-xl border-0 bg-transparent px-3 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                    >
                      <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="Active">active</option>
                      <option className="bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white" value="Draft">draft</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>

              {templateFormError && (
                <p className="text-xs text-red-500">{templateFormError}</p>
              )}

              <div className="pt-0.5 flex items-center justify-end gap-2">
                <button
                  onClick={closeCreateTemplateModal}
                  className="h-9 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTemplate}
                  className="h-9 px-4 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] text-white text-sm font-semibold"
                >
                  {editingTemplateId ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-black/85 dark:text-white/90">Delete Template?</h3>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-10 px-5 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTemplate(deleteTarget.id)}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBulkDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Bulk Delete Templates?</h3>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Are you sure you want to delete the {selectedTrackIds.length} selected track templates? This action cannot be undone.
            </p>
            {templateFormError && <p className="text-xs text-red-500 mt-2">{templateFormError}</p>}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="h-10 px-5 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
            isDarkMode
              ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
              : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10
            ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
            pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">

            <div>
              <h1 className="admin-page-title">Track Templates</h1>
            </div>

            {/* Search + Create Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl h-10 sm:h-9 shrink-0">
                <input
                  type="checkbox"
                  checked={filteredTracks.length > 0 && filteredTracks.every(t => selectedTrackIds.includes(t.id || t._id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelections = new Set([...selectedTrackIds, ...filteredTracks.map(t => t.id || t._id)]);
                      setSelectedTrackIds(Array.from(newSelections));
                    } else {
                      setSelectedTrackIds(selectedTrackIds.filter(id => !filteredTracks.some(t => (t.id || t._id) === id)));
                    }
                  }}
                  className="w-4 h-4 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white dark:bg-black/30"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Select All</span>
              </div>

              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full h-10 sm:h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-11 pr-4 text-[13px] sm:text-sm leading-none text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                />
              </div>

              <button
                onClick={openCreateTemplateModal}
                className="w-full md:w-auto md:ml-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] border border-[#3C83F6] text-white transition-colors font-semibold text-sm"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Create Template
              </button>
            </div>

            <p className="admin-micro-label text-black/30 dark:text-white/30 -mt-2">
              {filteredTracks.length} of {tracks.length} templates
            </p>

            {/* 3-Column Card Grid */}
            {filteredTracks.length === 0 ? (
              <div className="py-20 text-center admin-micro-label text-black/30 dark:text-white/30">
                No templates match your search
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredTracks.map((track) => {
                  const templateId = track.id || track._id;
                  const Icon = track.icon;
                  const isSelected = selectedTrackIds.includes(templateId);
                  const trackTheme = { topTint: 'bg-[#d8e6ef] dark:bg-[#24384e]' };
                  return (
                    <div key={templateId || track.name} className={`relative rounded-xl overflow-hidden border ${isSelected ? 'border-[#3C83F6] ring-1 ring-[#3C83F6]/50 dark:border-blue-400 dark:ring-blue-400/50' : 'border-black/10 dark:border-white/15'} bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] h-full flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group`}>
                      <div className="absolute left-3 top-2.5 z-20">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectToggle(templateId)}
                          className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white/70 dark:bg-black/30"
                        />
                      </div>

                      {/* Action Menu (3 dots) */}
                      <div className={`absolute right-2 top-2 z-20`}>
                        <button
                          type="button"
                          className="track-actions-trigger w-6 h-6 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenActionMenuId(openActionMenuId === templateId ? null : templateId);
                          }}
                          aria-label="Open track actions"
                        >
                          <FiMoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {openActionMenuId === templateId && (
                          <div className="track-actions-menu absolute right-0 top-7 w-36 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                openEditTemplateModal(track);
                              }}
                              className="w-full text-left px-3 py-2 text-xs transition-colors text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                              disabled={!templateId}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                duplicateTemplate(templateId);
                              }}
                              className="w-full text-left px-3 py-2 text-xs transition-colors text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
                              disabled={!templateId}
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setDeleteTarget(track);
                              }}
                              className="w-full text-left px-3 py-2 text-xs transition-colors text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                              disabled={!templateId}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Top Panel (highlighted/green sections of the cards) */}
                      {/* pl-11 to account for checkbox on the left */}
                      <div className={`px-4 pt-4 pb-3.5 min-h-[72px] border-b border-black/10 dark:border-white/15 ${trackTheme.topTint} pl-11 pr-9 flex items-center`}>
                        <div className="flex items-center justify-between gap-2.5 text-left w-full">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs md:text-sm leading-snug font-bold text-slate-900 dark:text-white truncate">{track.name}</h3>
                            <p className="mt-0.5 text-[10px] md:text-[11px] leading-tight text-slate-500 dark:text-slate-350 truncate">{track.category || 'Daily Challenge'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Panel */}
                      <div className="px-4 py-3.5 mt-auto bg-white/70 dark:bg-transparent flex flex-col gap-2 text-left">
                        <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-550 dark:text-slate-400">
                          <span>Total Days</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{track.totalDays}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-550 dark:text-slate-400">
                          <span>Questions</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{track.questionsAssigned}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-550 dark:text-slate-400">
                          <span>Status</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{track.status}</span>
                        </div>

                        <button
                          onClick={() => {
                            if (!templateId) return;
                            navigate(`/track-templates/${templateId}`);
                          }}
                          disabled={!templateId}
                          className="mt-3 w-full h-9 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-[#06224d] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          View Tasks
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedTrackIds.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3.5 rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43]/85 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-300">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {selectedTrackIds.length} {selectedTrackIds.length === 1 ? 'template' : 'templates'} selected
                </span>
                <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                <button
                  onClick={handleClearSelection}
                  className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                  className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}

