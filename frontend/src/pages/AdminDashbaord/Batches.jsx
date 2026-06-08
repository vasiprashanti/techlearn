import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import ModernDatePicker from '../../components/AdminDashbaord/ModernDatePicker';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI, hasMeaningfulAdminData, preferRemoteData, readAdminSessionCache, writeAdminSessionCache } from '../../services/adminApi';
import { emptyBatches } from '../../data/adminEmptyStates';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiHome, FiBookOpen, FiMoreHorizontal } from 'react-icons/fi';

const DEFAULT_TRACK_OPTIONS = [
  { value: 'DSA', label: 'DSA' },
  { value: 'Core', label: 'Core CS' },
  { value: 'SQL', label: 'SQL' },
];

const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const searchRoutes = [
  { id: "dashboard", title: "Dashboard", category: "Overview" },
  { id: "analytics", title: "Analytics", category: "Overview" },
  { id: "system-health", title: "System Health", category: "Overview" },
  { id: "colleges", title: "Colleges", category: "Organization" },
  { id: "batches", title: "Batches", category: "Organization" },
  { id: "students", title: "Students", category: "Organization" },
  { id: "question-bank", title: "Question Bank", category: "Learning" },
  { id: "track-templates", title: "Track Templates", category: "Learning" },
  { id: "resources", title: "Resources", category: "Learning" },
  { id: "certificates", title: "Certificates", category: "Learning" },
  { id: "submission-monitor", title: "Submission Monitor", category: "Operations" },
  { id: "notifications", title: "Notifications", category: "Operations" },
  { id: "audit-logs", title: "Audit Logs", category: "Operations" },
  { id: "reports", title: "Reports", category: "Operations" },
];

const statusBadge = (status) => {
  if (status === 'Active') return 'bg-[#16a34a] text-white';
  if (status === 'Draft') return 'bg-[#dbe7ff] text-[#3c83f6]';
  if (status === 'Expired') return 'bg-[#fee2e2] text-[#b91c1c]';
  return 'bg-[#e5e7eb] text-[#475569]';
};

const normalizeBatch = (batch) => ({
  ...batch,
  id: batch.id || batch._id || batch.name,
  name: batch.name || batch.id || 'Untitled Batch',
  college: batch.college || '',
  assignedTrack: batch.assignedTrack || '',
  batchSize: typeof batch.batchSize === 'number' ? batch.batchSize : null,
  track: batch.track || batch.assignedTrack || '',
  status: batch.status || 'Draft',
  start: batch.start || 'TBD',
  end: batch.end || 'TBD',
  students: Number(batch.students || 0),
});

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, searchInputRef, filteredRoutes, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
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
          <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={onClose}>
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
                onClick={() => {
                  onClose();
                  navigate(`/${route.id}`);
                }}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left"
              >
                <div>
                  <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>
                </div>
                <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
const getBatchTheme = (status) => {
  switch (status) {
    case 'Active':
      return {
        topTint: 'bg-[#d2e9e5] dark:bg-[#204744]',
        iconBg: 'bg-[#e4f4f1] dark:bg-[#285954]',
        iconColor: 'text-[#129775] dark:text-emerald-300',
      };
    case 'Draft':
      return {
        topTint: 'bg-[#d9ddee] dark:bg-[#223454]',
        iconBg: 'bg-[#e6ebf5] dark:bg-[#2f4466]',
        iconColor: 'text-[#3c83f6] dark:text-blue-300',
      };
    case 'Expired':
    case 'Archived':
      return {
        topTint: 'bg-[#efe6d2] dark:bg-[#4f4228]',
        iconBg: 'bg-[#f8f0df] dark:bg-[#625133]',
        iconColor: 'text-[#d17d00] dark:text-amber-300',
      };
    default:
      return {
        topTint: 'bg-[#d8e6ef] dark:bg-[#24384e]',
        iconBg: 'bg-[#e7f0f6] dark:bg-[#30495f]',
        iconColor: 'text-[#3c83f6] dark:text-blue-300',
      };
  }
};

const BatchCard = ({ batch, onEdit, onDelete, navigate, selected, onSelectToggle }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = getBatchTheme(batch.status);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!event.target.closest(`.batch-actions-${batch.id}`)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [batch.id]);

  return (
    <article className={`relative rounded-2xl overflow-hidden border ${selected ? 'border-[#3C83F6] ring-1 ring-[#3C83F6]/50 dark:border-blue-400 dark:ring-blue-400/50' : 'border-black/10 dark:border-white/15'} bg-white dark:bg-[#0f1f43] backdrop-blur-xl shadow-sm h-full flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group`}>
      <div className="absolute left-3.5 top-3.5 z-20">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectToggle(batch.id)}
          className="w-4.5 h-4.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white/70 dark:bg-black/30"
        />
      </div>

      <div className={`absolute right-3 top-3 z-20 batch-actions-${batch.id}`}>
        <button
          type="button"
          className="w-8 h-8 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label="Open batch actions"
        >
          <FiMoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 w-40 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => {
                setMenuOpen(false);
                onEdit(batch);
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm transition-colors text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete(batch);
              }}
              className="w-full text-left px-3.5 py-2.5 text-sm transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={`px-4 pt-6 pb-3 min-h-[112px] border-b border-black/5 dark:border-white/15 ${theme.topTint} pl-10`}>
        <div className="flex items-start gap-2.5">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm shrink-0 ${theme.iconBg}`}>
            <FiBookOpen className={`w-5 h-5 ${theme.iconColor}`} />
          </div>
          <div className="min-h-[64px] flex-1 min-w-0">
            <h3 className="text-base md:text-lg leading-tight font-semibold text-slate-900 dark:text-white truncate">{batch.name}</h3>
            <p className="mt-1 text-[11px] md:text-xs leading-tight text-slate-500 dark:text-slate-300 line-clamp-2">{batch.college || 'Unassigned College'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/65 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                {batch.track || 'No Track'}
              </span>
              <span className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/65 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                {batch.status || 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 mt-auto bg-white/70 dark:bg-transparent">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <span>Start Date</span>
          <span className="font-semibold text-slate-900 dark:text-white">{batch.start}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <span>End Date</span>
          <span className="font-semibold text-slate-900 dark:text-white">{batch.end}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <span>Students</span>
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{batch.students || 0}</span>
        </div>

        <button
          onClick={() => navigate(`/batches/${batch.id}`, { state: { batch } })}
          className="mt-4 w-full h-10 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          View Batch
        </button>
      </div>
    </article>
  );
};

const Batches = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [batches, setBatches] = useState(() => readAdminSessionCache('batches', emptyBatches));
  const [colleges, setColleges] = useState(() => readAdminSessionCache('batches-colleges', []));
  const [isLoadingBatches, setIsLoadingBatches] = useState(() => !hasMeaningfulAdminData(readAdminSessionCache('batches', emptyBatches)));
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [pendingDeleteBatch, setPendingDeleteBatch] = useState(null);
  const [createError, setCreateError] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [createBatchForm, setCreateBatchForm] = useState({
    batchName: '',
    college: '',
    startDate: '',
    assignedTrack: '',
    endDate: '',
    batchSize: '',
    status: 'Draft',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const searchInputRef = useRef(null);

  const handleSelectToggle = (id) => {
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedBatchIds([]);
  };

  const handleBulkDelete = async () => {
    setCreateError('');
    setIsBulkDeleting(true);
    try {
      await adminAPI.bulkDeleteBatches(selectedBatchIds);
      await loadBatchPageData();
      setSelectedBatchIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (error) {
      setCreateError(error.message || 'Failed to bulk delete batches.');
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const isDarkMode = theme === 'dark';
  const todayIsoDate = getTodayIsoDate();
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const batchFormInputClass = 'mt-1 w-full px-3 py-2 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  const loadBatchPageData = useCallback(async () => {
    const [remoteBatches, remoteColleges] = await Promise.all([
      adminAPI.getBatches(),
      adminAPI.getColleges(),
    ]);

    const normalizedBatches = preferRemoteData(remoteBatches, emptyBatches).map(normalizeBatch);
    const normalizedColleges = preferRemoteData(remoteColleges, []).map((college) => ({
      id: college.id || college._id,
      name: college.name || 'Untitled College',
    }));

    setBatches(normalizedBatches);
    setColleges(normalizedColleges);
    writeAdminSessionCache('batches', normalizedBatches);
    writeAdminSessionCache('batches-colleges', normalizedColleges);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;

    loadBatchPageData().catch(() => {
      if (!cancelled) {
        setBatches(emptyBatches);
        setColleges([]);
      }
    }).finally(() => {
      if (!cancelled) {
        setIsLoadingBatches(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadBatchPageData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    else setSearchQuery('');
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter((route) =>
    route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const collegeOptions = Array.from(new Set(colleges.map((college) => college.name).filter(Boolean)));
  const filteredBatches = batches.filter((batch) => {
    const searchText = batchSearchTerm.trim().toLowerCase();
    const matchCollege = collegeFilter === 'All Colleges' || batch.college === collegeFilter;
    const matchStatus = statusFilter === 'All Status' || batch.status === statusFilter;
    const matchSearch =
      searchText.length === 0 ||
      String(batch.id || '').toLowerCase().includes(searchText) ||
      String(batch.name || '').toLowerCase().includes(searchText) ||
      String(batch.college || '').toLowerCase().includes(searchText) ||
      String(batch.track || '').toLowerCase().includes(searchText);
    return matchCollege && matchStatus && matchSearch;
  });

  const counts = {
    Active: batches.filter((batch) => batch.status === 'Active').length,
    Draft: batches.filter((batch) => batch.status === 'Draft').length,
    Archived: batches.filter((batch) => batch.status === 'Archived').length,
  };

  const openCreateBatch = () => {
    setEditingBatchId(null);
    setCreateError('');
    setCreateBatchForm({
      batchName: '',
      college: '',
      startDate: '',
      assignedTrack: '',
      endDate: '',
      batchSize: '',
      status: 'Draft',
    });
    setIsCreateFormOpen(true);
  };

  const openEditBatch = (batch) => {
    setEditingBatchId(batch.id);
    setCreateError('');
    setCreateBatchForm({
      batchName: batch.name || '',
      college: batch.college || '',
      startDate: '',
      assignedTrack: batch.assignedTrack || '',
      endDate: '',
      batchSize: batch.batchSize ? String(batch.batchSize) : '',
      status: batch.status || 'Draft',
    });
    setIsCreateFormOpen(true);
  };

  const createBatch = async () => {
    if (!createBatchForm.batchName.trim()) {
      setCreateError('Batch name is required');
      return;
    }
    if (!createBatchForm.college) {
      setCreateError('College is required');
      return;
    }
    if (!createBatchForm.startDate || !createBatchForm.endDate) {
      setCreateError('Start date and end date are required');
      return;
    }
    if (createBatchForm.startDate < todayIsoDate) {
      setCreateError('Start date must be today or a future date');
      return;
    }
    if (createBatchForm.startDate > createBatchForm.endDate) {
      setCreateError('End date must be after start date');
      return;
    }
    if (createBatchForm.batchSize && (!/^\d+$/.test(createBatchForm.batchSize) || Number(createBatchForm.batchSize) <= 0)) {
      setCreateError('Batch size must be a positive number');
      return;
    }

    const selectedCollege = colleges.find((college) => college.name === createBatchForm.college);
    if (!selectedCollege?.id) {
      setCreateError('Please select a valid college');
      return;
    }

    setCreateError('');
    setIsSavingBatch(true);

    try {
      const payload = {
        collegeId: selectedCollege.id,
        name: createBatchForm.batchName.trim(),
        startDate: createBatchForm.startDate,
        expiryDate: createBatchForm.endDate,
        assignedTrack: createBatchForm.assignedTrack,
        batchSize: createBatchForm.batchSize ? Number(createBatchForm.batchSize) : null,
        status: createBatchForm.status,
      };

      if (editingBatchId) {
        await adminAPI.updateBatch(editingBatchId, payload);
      } else {
        await adminAPI.createBatch(payload);
      }

      await loadBatchPageData();
      setIsCreateFormOpen(false);
      setEditingBatchId(null);
    } catch (error) {
      setCreateError(error.message || (editingBatchId ? 'Failed to update batch.' : 'Failed to create batch.'));
    } finally {
      setIsSavingBatch(false);
    }
  };

  const deleteBatch = async (batchId) => {
    setCreateError('');
    setIsDeletingBatch(true);

    try {
      await adminAPI.deleteBatch(batchId);
      await loadBatchPageData();
      setPendingDeleteBatch(null);
    } catch (error) {
      setCreateError(error.message || 'Failed to delete batch');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  return (
    <>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        filteredRoutes={filteredRoutes}
        navigate={navigate}
      />

      {isCreateFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsCreateFormOpen(false)} />
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-visible">
            <div className="px-5 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#3C83F6] dark:text-white">{editingBatchId ? 'Edit Batch' : 'Create Batch'}</h2>
              <button onClick={() => setIsCreateFormOpen(false)} className="text-xs text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60">Close</button>
            </div>

            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Batch Name*</label>
                  <input
                    value={createBatchForm.batchName}
                    onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, batchName: e.target.value }))}
                    placeholder="Enter batch name"
                    className={batchFormInputClass}
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">College*</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={createBatchForm.college}
                      onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, college: e.target.value }))}
                      className="appearance-none w-full px-3 py-2 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                    >
                      <option className={dropdownOptionClass} value="">Select college</option>
                      {collegeOptions.map((college) => (
                        <option className={dropdownOptionClass} key={college} value={college}>{college}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Start Date*</label>
                  <div className="mt-1">
                    <ModernDatePicker
                      value={createBatchForm.startDate}
                      onChange={(nextDate) =>
                        setCreateBatchForm((prev) => ({
                          ...prev,
                          startDate: nextDate,
                          endDate:
                            prev.endDate && nextDate && prev.endDate < nextDate
                              ? ''
                              : prev.endDate,
                        }))
                      }
                      minDate={new Date(`${todayIsoDate}T00:00:00`)}
                      placeholder="Select start date"
                      ariaLabel="Start date"
                    />
                  </div>
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">End Date*</label>
                  <div className="mt-1">
                    <ModernDatePicker
                      value={createBatchForm.endDate}
                      onChange={(nextDate) =>
                        setCreateBatchForm((prev) => ({
                          ...prev,
                          endDate: nextDate,
                        }))
                      }
                      minDate={createBatchForm.startDate ? new Date(`${createBatchForm.startDate}T00:00:00`) : new Date(`${todayIsoDate}T00:00:00`)}
                      placeholder="Select end date"
                      ariaLabel="End date"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Assigned Track</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={createBatchForm.assignedTrack}
                      onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, assignedTrack: e.target.value }))}
                      className="appearance-none w-full px-3 py-2 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                    >
                      <option className={dropdownOptionClass} value="">Optional track</option>
                      {DEFAULT_TRACK_OPTIONS.map((track) => (
                        <option className={dropdownOptionClass} key={track.value} value={track.value}>{track.label}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={createBatchForm.batchSize}
                    onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, batchSize: e.target.value.replace(/[^\d]/g, '') }))}
                    className={batchFormInputClass}
                    placeholder="Enter batch size"
                  />
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={createBatchForm.status}
                    onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="appearance-none w-full px-3 py-2 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="Draft">Draft</option>
                    <option className={dropdownOptionClass} value="Active">Active</option>
                    <option className={dropdownOptionClass} value="Expired">Expired</option>
                    <option className={dropdownOptionClass} value="Archived">Archived</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              {createError && <p className="text-xs text-red-500">{createError}</p>}

              <div className="pt-1.5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsCreateFormOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBatch}
                  disabled={isSavingBatch}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70 transition-colors"
                >
                  {isSavingBatch ? 'Saving...' : editingBatchId ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteBatch && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPendingDeleteBatch(null)} />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">Delete Batch</h3>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                Are you sure you want to delete {pendingDeleteBatch.name || pendingDeleteBatch.id}?
              </p>
              {createError && <p className="text-xs text-red-500 mt-2">{createError}</p>}
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPendingDeleteBatch(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBatch(pendingDeleteBatch.id)}
                disabled={isDeletingBatch}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 disabled:opacity-70 transition-colors"
              >
                {isDeletingBatch ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBulkDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-red-600 dark:text-red-400">Bulk Delete Batches</h3>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                Are you sure you want to delete the {selectedBatchIds.length} selected batches? This will delete all associated student records and submissions.
              </p>
              {createError && <p className="text-xs text-red-500 mt-2">{createError}</p>}
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 disabled:opacity-70 transition-colors"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            <div>
              <h1 className="admin-page-title">Batches</h1>
            </div>

            {isLoadingBatches ? (
              <section className="min-h-[50vh] flex items-center justify-center">
                <LoadingScreen
                  fullScreen={false}
                  message="Loading batches..."
                  className="w-full rounded-3xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl"
                />
              </section>
            ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[auto_minmax(0,1fr)_160px_150px_auto] gap-2 items-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl h-9 shrink-0">
                <input
                  type="checkbox"
                  checked={filteredBatches.length > 0 && filteredBatches.every(b => selectedBatchIds.includes(b.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelections = new Set([...selectedBatchIds, ...filteredBatches.map(b => b.id)]);
                      setSelectedBatchIds(Array.from(newSelections));
                    } else {
                      setSelectedBatchIds(selectedBatchIds.filter(id => !filteredBatches.some(b => b.id === id)));
                    }
                  }}
                  className="w-4 h-4 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white dark:bg-black/30"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Select All</span>
              </div>

              <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35 dark:text-white/35" />
                <input
                  value={batchSearchTerm}
                  onChange={(e) => setBatchSearchTerm(e.target.value)}
                  placeholder="Search batches..."
                  className="w-full h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-9 pr-3 text-xs sm:text-sm text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                />
              </div>

              <div className="relative min-w-0">
                <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                    className="appearance-none w-full h-9 rounded-xl bg-transparent px-3 pr-8 text-xs sm:text-sm font-semibold tracking-tight text-slate-800 dark:text-white outline-none"
                  >
                    {['All Colleges', ...collegeOptions].map((college) => (
                      <option className={dropdownOptionClass} key={college} value={college}>{college}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div className="relative min-w-0">
                <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none w-full h-9 rounded-xl bg-transparent px-3 pr-8 text-xs sm:text-sm font-semibold tracking-tight text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="All Status">All Status</option>
                    <option className={dropdownOptionClass} value="Draft">Draft</option>
                    <option className={dropdownOptionClass} value="Active">Active</option>
                    <option className={dropdownOptionClass} value="Expired">Expired</option>
                    <option className={dropdownOptionClass} value="Archived">Archived</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <button
                onClick={openCreateBatch}
                className="h-9 px-4 rounded-xl bg-[#3C83F6] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2f73e0] transition-colors whitespace-nowrap"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Create Batch
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
              {[
                { label: 'Active', count: counts.Active, color: 'text-emerald-500' },
                { label: 'Draft', count: counts.Draft, color: 'text-indigo-500 dark:text-indigo-400' },
                { label: 'Archived', count: counts.Archived, color: 'text-black/35 dark:text-white/40' },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-xl px-2 sm:px-5 py-2.5 sm:py-4 flex flex-col items-center sm:items-start text-center sm:text-left">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">{label}</p>
                  <p className={`text-lg sm:text-2xl font-semibold tracking-tight mt-0.5 sm:mt-1 ${color}`}>{count}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  selected={selectedBatchIds.includes(batch.id)}
                  onSelectToggle={handleSelectToggle}
                  onEdit={openEditBatch}
                  onDelete={setPendingDeleteBatch}
                  navigate={navigate}
                />
              ))}
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedBatchIds.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3.5 rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43]/85 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-300">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {selectedBatchIds.length} {selectedBatchIds.length === 1 ? 'batch' : 'batches'} selected
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

            {filteredBatches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 px-4 py-10 text-center text-sm text-black/40 dark:text-white/40">
                No batches found for the selected filters.
              </div>
            )}
            </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Batches;
