import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { FiSearch, FiEye, FiEdit2, FiTrash2, FiPlus, FiCode, FiDatabase, FiCpu, FiArrowUp, FiArrowDown, FiClock, FiChevronDown } from 'react-icons/fi';

// --- Mock Data ---
const mockTracks = [
  {
    id: 'trk_dsa_01',
    name: 'DSA Track',
    description: '30-day Data Structures & Algorithms curriculum',
    totalDays: 30,
    questionsAssigned: 4,
    status: 'Active',
    icon: FiCode,
    category: 'Data Structures & Algorithms',
  },
  {
    id: 'trk_core_01',
    name: 'Core Track',
    description: '20-day Core CS fundamentals',
    totalDays: 20,
    questionsAssigned: 1,
    status: 'Active',
    icon: FiCpu,
    category: 'Web Development',
  },
  {
    id: 'trk_sql_01',
    name: 'SQL Track',
    description: '15-day SQL mastery',
    totalDays: 15,
    questionsAssigned: 1,
    status: 'Active',
    icon: FiDatabase,
    category: 'Database Management',
  },
];

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

const statusPillClass = (status) =>
  status === 'Active'
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

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
  const [tracks, setTracks] = useState(mockTracks);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createTemplateForm, setCreateTemplateForm] = useState({
    name: '',
    category: '',
    description: '',
    totalDays: '30',
    status: 'Active',
  });
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [historyTrack, setHistoryTrack] = useState(null);
  const [trackQuestions, setTrackQuestions] = useState({
    trk_dsa_01: ['Two Sum', 'Binary Search', 'Merge Intervals', 'Tree Traversal'],
    trk_core_01: ['OS Basics', 'Computer Networks Intro', 'DBMS Normalization'],
    trk_sql_01: ['SELECT & WHERE', 'JOIN Mastery', 'Window Functions'],
  });
  const [versionHistory, setVersionHistory] = useState({
    trk_dsa_01: ['v3 • Added Merge Intervals', 'v2 • Reordered Tree Traversal', 'v1 • Initial template'],
    trk_core_01: ['v2 • Added DBMS Normalization', 'v1 • Initial template'],
    trk_sql_01: ['v1 • Initial template'],
  });
  const searchInputRef = useRef(null);

  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

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
    setCreateTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeCreateTemplateModal = () => {
    setIsCreateTemplateOpen(false);
    setEditingTemplateId(null);
    setCreateTemplateForm({
      name: '',
      category: '',
      description: '',
      totalDays: '30',
      status: 'Active',
    });
  };

  const openCreateTemplateModal = () => {
    setEditingTemplateId(null);
    setCreateTemplateForm({
      name: '',
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
      category: track.category || '',
      description: track.description || '',
      totalDays: String(track.totalDays || 1),
      status: track.status || 'Active',
    });
    setIsCreateTemplateOpen(true);
  };

  const submitTemplate = () => {
    if (!createTemplateForm.name.trim() || !createTemplateForm.category) return;

    const totalDays = Number(createTemplateForm.totalDays) > 0 ? Number(createTemplateForm.totalDays) : 1;

    if (editingTemplateId) {
      setTracks((prev) =>
        prev.map((track) =>
          track.id === editingTemplateId
            ? {
                ...track,
                name: createTemplateForm.name.trim(),
                category: createTemplateForm.category,
                description:
                  createTemplateForm.description.trim() || `${totalDays}-day ${createTemplateForm.category} track template`,
                totalDays,
                status: createTemplateForm.status,
              }
            : track
        )
      );
    } else {
      const newId = `trk_${Date.now()}`;
      const newTrack = {
        id: newId,
        name: createTemplateForm.name.trim(),
        description: createTemplateForm.description.trim() || `${totalDays}-day ${createTemplateForm.category} track template`,
        totalDays,
        questionsAssigned: 0,
        status: createTemplateForm.status,
        icon: FiCode,
        category: createTemplateForm.category,
      };

      setTracks((prev) => [newTrack, ...prev]);
      setTrackQuestions((prev) => ({ ...prev, [newId]: [] }));
      setVersionHistory((prev) => ({ ...prev, [newId]: ['v1 • Initial template'] }));
    }

    closeCreateTemplateModal();
  };

  const deleteTemplate = (trackId) => {
    setTracks((prev) => prev.filter((track) => track.id !== trackId));
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
          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1737] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h2 className="text-xl font-semibold text-[#3C83F6] dark:text-white">{editingTemplateId ? 'Edit Template' : 'Create Template'}</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Template name*</label>
                <input
                  value={createTemplateForm.name}
                  onChange={(e) => updateCreateTemplateField('name', e.target.value)}
                  placeholder="Enter template name"
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Category*</label>
                <div className="relative mt-1">
                  <select
                    value={createTemplateForm.category}
                    onChange={(e) => updateCreateTemplateField('category', e.target.value)}
                    className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 pr-12 text-sm"
                  >
                    <option value="">Select category</option>
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    <option value="Database Management">Database Management</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Python Programming">Python Programming</option>
                    <option value="Machine Learning">Machine Learning</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/45" />
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-black/50 dark:text-white/50">Description</label>
                <textarea
                  value={createTemplateForm.description}
                  onChange={(e) => updateCreateTemplateField('description', e.target.value)}
                  rows={3}
                  placeholder="Describe this template"
                  className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Total days</label>
                  <input
                    type="number"
                    min="1"
                    value={createTemplateForm.totalDays}
                    onChange={(e) => updateCreateTemplateField('totalDays', e.target.value)}
                    className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-sm"
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/50 dark:text-white/50">Status</label>
                  <div className="relative mt-1">
                    <select
                      value={createTemplateForm.status}
                      onChange={(e) => updateCreateTemplateField('status', e.target.value)}
                      className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 pr-12 text-sm"
                    >
                      <option value="Active">active</option>
                      <option value="Draft">draft</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/45" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={closeCreateTemplateModal}
                  className="h-10 px-5 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTemplate}
                  className="h-10 px-5 rounded-xl bg-[#3C83F6] hover:bg-[#2563eb] text-white text-sm font-semibold"
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

      {/* Main Layout */}
      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div
          className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
            isDarkMode
              ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]'
              : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'
          }`}
        />

        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10
            ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
            pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* Header — same as AdminDashboard */}
            <header className={`sticky top-0 z-40 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div className="flex-1" />
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* Search + Create Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/40 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl backdrop-blur-md text-sm text-black/70 dark:text-white/70 placeholder:text-black/30 dark:placeholder:text-white/30 outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTracks.map((track) => {
                  const Icon = track.icon;
                  const iconTileBgClass =
                    track.id === 'trk_dsa_01'
                      ? 'from-blue-500/15 to-indigo-500/15'
                      : track.id === 'trk_core_01'
                        ? 'from-orange-500/15 to-amber-500/15'
                        : 'from-violet-500/15 to-purple-500/15';
                  const iconColorClass =
                    track.id === 'trk_dsa_01'
                      ? 'text-blue-600 dark:text-blue-300'
                      : track.id === 'trk_core_01'
                        ? 'text-orange-600 dark:text-orange-300'
                        : 'text-violet-600 dark:text-violet-300';
                  return (
                    <div key={track.id} className="rounded-2xl bg-white dark:bg-[#0f1e3e] border border-black/10 dark:border-white/10 p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                      <div className="space-y-4">
                      {/* Top row: icon + status badge */}
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 ${iconTileBgClass}`}>
                          <Icon className={`w-[22px] h-[22px] ${iconColorClass}`} />
                        </div>
                        <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(track.status)}`}>
                          {track.status}
                        </span>
                      </div>

                      {/* Track name + description */}
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a] dark:text-white">
                          {track.name}
                        </h3>
                        <p className="text-xs text-[#64748b] dark:text-slate-300 mt-1 line-clamp-2">
                          {track.description}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2.5">
                        <div className="rounded-xl bg-[#e8edf4] dark:bg-white/15 px-4 py-2.5 border border-black/5 dark:border-white/10">
                          <span className="text-xs text-[#64748b] dark:text-slate-300">Total Days</span>
                          <p className="text-sm font-semibold text-[#0f172a] dark:text-white">{track.totalDays}</p>
                        </div>
                        <div className="rounded-xl bg-[#e8edf4] dark:bg-white/15 px-4 py-2.5 border border-black/5 dark:border-white/10">
                          <span className="text-xs text-[#64748b] dark:text-slate-300">Questions Assigned</span>
                          <p className="text-sm font-semibold text-[#0f172a] dark:text-white">
                            {track.questionsAssigned} / {track.totalDays}
                          </p>
                        </div>
                      </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center gap-2 mt-5">
                        <button
                          onClick={() => navigate(`/track-templates/${track.id}`)}
                          className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-md px-4 text-sm font-medium bg-[#3C83F6] hover:bg-[#2563eb] text-white transition-colors whitespace-nowrap"
                        >
                          <FiEye className="w-[15px] h-[15px]" />
                          View Template
                        </button>
                        <button onClick={() => openEditTemplateModal(track)} className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-[#16294d] text-black/70 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                          <FiEdit2 className="w-[15px] h-[15px]" />
                        </button>
                        <button onClick={() => setDeleteTarget(track)} className="h-10 w-10 inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-[#16294d] text-black/70 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                          <FiTrash2 className="w-[15px] h-[15px]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}

