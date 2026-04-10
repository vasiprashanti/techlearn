import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import ModernDatePicker from '../../components/AdminDashbaord/ModernDatePicker';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyBatches } from '../../data/adminEmptyStates';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiHome } from 'react-icons/fi';

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
  track: batch.track || '',
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

const Batches = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [batches, setBatches] = useState(emptyBatches);
  const [colleges, setColleges] = useState([]);
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
    endDate: '',
    status: 'Draft',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const batchFormInputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  const loadBatchPageData = useCallback(async () => {
    const [remoteBatches, remoteColleges] = await Promise.all([
      adminAPI.getBatches(),
      adminAPI.getColleges(),
    ]);

    setBatches(preferRemoteData(remoteBatches, emptyBatches).map(normalizeBatch));
    setColleges(
      preferRemoteData(remoteColleges, []).map((college) => ({
        id: college.id || college._id,
        name: college.name || 'Untitled College',
      }))
    );
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;

    loadBatchPageData().catch(() => {
      if (!cancelled) {
        setBatches(emptyBatches);
        setColleges([]);
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
      endDate: '',
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
      endDate: '',
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
    if (createBatchForm.startDate > createBatchForm.endDate) {
      setCreateError('End date must be after start date');
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
      setCreateError(error.message || 'Failed to save batch');
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
          <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-visible">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">{editingBatchId ? 'Edit Batch' : 'Create Batch'}</h2>
              <button onClick={() => setIsCreateFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Start Date*</label>
                  <div className="mt-1">
                    <ModernDatePicker
                      value={createBatchForm.startDate}
                      onChange={(nextDate) =>
                        setCreateBatchForm((prev) => ({
                          ...prev,
                          startDate: nextDate,
                          endDate: prev.endDate && nextDate && prev.endDate < nextDate ? '' : prev.endDate,
                        }))
                      }
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
                      minDate={createBatchForm.startDate ? new Date(`${createBatchForm.startDate}T00:00:00`) : undefined}
                      placeholder="Select end date"
                      ariaLabel="End date"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={createBatchForm.status}
                    onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
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

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsCreateFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBatch}
                  disabled={isSavingBatch}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70 transition-colors"
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

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div>
                <h1 className="admin-page-title">Batches</h1>
              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_170px_auto] gap-2.5 items-center">
              <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                <input
                  value={batchSearchTerm}
                  onChange={(e) => setBatchSearchTerm(e.target.value)}
                  placeholder="Search batches..."
                  className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-3 text-sm text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                />
              </div>

              <div className="relative min-w-0">
                <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                    className="appearance-none w-full h-10 rounded-xl bg-transparent px-3.5 pr-9 text-sm font-semibold tracking-tight text-slate-800 dark:text-white outline-none"
                  >
                    {['All Colleges', ...collegeOptions].map((college) => (
                      <option className={dropdownOptionClass} key={college} value={college}>{college}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div className="relative min-w-0">
                <div className="relative w-full rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none w-full h-10 rounded-xl bg-transparent px-3.5 pr-9 text-sm font-semibold tracking-tight text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="All Status">All Status</option>
                    <option className={dropdownOptionClass} value="Draft">Draft</option>
                    <option className={dropdownOptionClass} value="Active">Active</option>
                    <option className={dropdownOptionClass} value="Expired">Expired</option>
                    <option className={dropdownOptionClass} value="Archived">Archived</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <button
                onClick={openCreateBatch}
                className="h-10 px-5 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2f73e0] transition-colors whitespace-nowrap"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Create Batch
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Active', count: counts.Active, color: 'text-emerald-500' },
                { label: 'Draft', count: counts.Draft, color: 'text-indigo-500 dark:text-indigo-400' },
                { label: 'Archived', count: counts.Archived, color: 'text-black/35 dark:text-white/40' },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl px-6 py-5">
                  <p className="admin-micro-label text-black/40 dark:text-white/40">{label}</p>
                  <p className={`text-3xl font-light tracking-tight mt-2 ${color}`}>{count}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-5">
              {filteredBatches.map((batch) => (
                <div key={batch.id} className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/5 dark:border-white/10 p-4 rounded-2xl flex flex-col gap-3.5 hover:bg-white dark:hover:bg-[#162a52] transition-colors group shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-black/55 dark:text-white/55 min-w-0">
                      <FiHome className="w-3.5 h-3.5" />
                      <span className="break-words">{batch.college || 'Unassigned college'}</span>
                    </p>
                    <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusBadge(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-black/90 dark:text-white leading-none break-words">{batch.name}</h3>
                    <p className="text-[13px] sm:text-sm md:text-base text-black/55 dark:text-white/50 leading-relaxed sm:leading-snug line-clamp-2">
                      {batch.track || 'Track assignment is not available yet.'}
                    </p>
                  </div>

                  <div className="h-px bg-black/5 dark:bg-white/10" />

                  <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[11px] text-black/45 dark:text-white/45">Start</p>
                      <p className="text-sm md:text-base font-medium text-black/90 dark:text-white break-words">{batch.start}</p>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[11px] text-black/45 dark:text-white/45">End</p>
                      <p className="text-sm md:text-base font-medium text-black/90 dark:text-white break-words">{batch.end}</p>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[11px] text-black/45 dark:text-white/45">Students</p>
                      <p className="text-sm md:text-base font-medium text-black/90 dark:text-white">{batch.students}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_42px_42px] gap-2 pt-0.5">
                    <button
                      onClick={() => navigate(`/batches/${batch.id}`, { state: { batch } })}
                      className="col-span-2 sm:col-span-1 w-full h-10 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#2f73e0] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                      View Batch
                    </button>
                    <button
                      onClick={() => openEditBatch(batch)}
                      className="h-9 sm:h-10 rounded-xl border border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 text-black/65 dark:text-white/75 hover:bg-white/60 dark:hover:bg-white/10 inline-flex items-center justify-center transition-colors"
                      aria-label={`Edit ${batch.name}`}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPendingDeleteBatch(batch)}
                      className="h-9 sm:h-10 rounded-xl border border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 text-black/65 dark:text-white/75 hover:bg-red-500/10 hover:text-red-500 inline-flex items-center justify-center transition-colors"
                      aria-label={`Delete ${batch.name}`}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredBatches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 px-4 py-10 text-center text-sm text-black/40 dark:text-white/40">
                No batches found for the selected filters.
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Batches;
