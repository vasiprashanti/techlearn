import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { FiSearch, FiPlus, FiBell, FiEdit2, FiTrash2, FiChevronDown, FiHome } from 'react-icons/fi';

const searchRoutes = [
  { id: "dashboard",          title: "Dashboard",          category: "Overview"     },
  { id: "analytics",          title: "Analytics",          category: "Overview"     },
  { id: "system-health",      title: "System Health",      category: "Overview"     },
  { id: "colleges",           title: "Colleges",           category: "Organization" },
  { id: "batches",            title: "Batches",            category: "Organization" },
  { id: "students",           title: "Students",           category: "Organization" },
  { id: "question-bank",      title: "Question Bank",      category: "Learning"     },
  { id: "track-templates",    title: "Track Templates",    category: "Learning"     },
  { id: "resources",          title: "Resources",          category: "Learning"     },
  { id: "certificates",       title: "Certificates",       category: "Learning"     },
  { id: "submission-monitor", title: "Submission Monitor", category: "Operations"   },
  { id: "notifications",      title: "Notifications",      category: "Operations"   },
  { id: "audit-logs",         title: "Audit Logs",         category: "Operations"   },
  { id: "reports",            title: "Reports",            category: "Operations"   },
];

const batchesData = [
  { id: "CS-2024A",  college: "MIT",                 track: "Data Structures & Algorithms", status: "Active",    start: "Jun 1, 2024",  end: "Dec 1, 2024",  students: 2 },
  { id: "CS-2024B",  college: "MIT",                 track: "Web Development",              status: "Active",    start: "Jul 15, 2024", end: "Jan 15, 2025", students: 2 },
  { id: "DS-2024A",  college: "Stanford University", track: "Python Programming",           status: "Active",    start: "Jun 15, 2024", end: "Dec 15, 2024", students: 3 },
  { id: "WD-2024A",  college: "IIT Delhi",           track: "Web Development",              status: "Active",    start: "Aug 1, 2024",  end: "Feb 1, 2025",  students: 1 },
  { id: "WD-2024B",  college: "IIT Delhi",           track: "Database Management",          status: "Upcoming",  start: "Sep 1, 2024",  end: "Mar 1, 2025",  students: 1 },
  { id: "ML-2024A",  college: "Harvard University",  track: "Machine Learning",             status: "Completed", start: "Jun 1, 2024",  end: "Nov 30, 2024", students: 2 },
  { id: "DSA-2024C", college: "IIT Delhi",           track: "Data Structures & Algorithms", status: "Active",    start: "Oct 1, 2024",  end: "Apr 1, 2025",  students: 1 },
];

const colleges = ["All Colleges", "MIT", "Stanford University", "IIT Delhi", "Harvard University", "IIT Bombay"];
const collegeOptions = colleges.filter((c) => c !== 'All Colleges');

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return 'TBD';
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? 'TBD'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Upcoming → indigo instead of amber
const statusBadge = (status) => {
  if (status === 'Active')    return 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5';
  if (status === 'Upcoming')  return 'border-indigo-400/20 text-indigo-500 dark:text-indigo-400 bg-indigo-400/5';
  return 'border-black/10 dark:border-white/10 text-black/35 dark:text-white/30 bg-black/3';
};

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, searchInputRef, filteredRoutes, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
          <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
          <input
            ref={searchInputRef} type="text"
            placeholder="Search pages, tracks, or settings..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
          />
          <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={onClose}>
            <span>ESC</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredRoutes.length === 0
            ? <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results found for "{searchQuery}"</div>
            : filteredRoutes.map(route => (
              <button key={route.id} onClick={() => { onClose(); navigate(`/${route.id}`); }} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                <div>
                  <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>

                </div>
                <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            ))
          }
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
  const [batches, setBatches] = useState(batchesData);
  const [mounted, setMounted]           = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [pendingDeleteBatch, setPendingDeleteBatch] = useState(null);
  const [createError, setCreateError] = useState('');
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [createBatchForm, setCreateBatchForm] = useState({
    batchName: '',
    college: '',
    startDate: '',
    endDate: '',
    assignedTrack: '',
    batchSize: '',
    status: 'Active',
  });
  const [searchQuery, setSearchQuery]   = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All Colleges');
  const [statusFilter, setStatusFilter]   = useState('All Status');
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(p => !p); }
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
  const filteredBatches = batches.filter(b => {
    const searchText = batchSearchTerm.trim().toLowerCase();
    const matchCollege = collegeFilter === 'All Colleges' || b.college === collegeFilter;
    const matchStatus  = statusFilter  === 'All Status'   || b.status  === statusFilter;
    const matchSearch =
      searchText.length === 0 ||
      b.id.toLowerCase().includes(searchText) ||
      b.college.toLowerCase().includes(searchText) ||
      b.track.toLowerCase().includes(searchText);
    return matchCollege && matchStatus && matchSearch;
  });

  const counts = {
    Active:    batches.filter(b => b.status === 'Active').length,
    Upcoming:  batches.filter(b => b.status === 'Upcoming').length,
    Completed: batches.filter(b => b.status === 'Completed').length,
  };

  const openCreateBatch = () => {
    setEditingBatchId(null);
    setCreateError('');
    setCreateBatchForm({
      batchName: '',
      college: '',
      startDate: '',
      endDate: '',
      assignedTrack: '',
      batchSize: '',
      status: 'Active',
    });
    setIsCreateFormOpen(true);
  };

  const openEditBatch = (batch) => {
    setEditingBatchId(batch.id);
    setCreateError('');
    setCreateBatchForm({
      batchName: batch.id,
      college: batch.college,
      startDate: '',
      endDate: '',
      assignedTrack: batch.track,
      batchSize: String(batch.students),
      status: batch.status,
    });
    setIsCreateFormOpen(true);
  };

  const createBatch = () => {
    if (!createBatchForm.batchName.trim()) {
      setCreateError('Batch name is required');
      return;
    }
    if (!createBatchForm.college) {
      setCreateError('College is required');
      return;
    }
    if (!createBatchForm.assignedTrack.trim()) {
      setCreateError('Assigned track is required');
      return;
    }
    if (createBatchForm.startDate && createBatchForm.endDate && createBatchForm.startDate > createBatchForm.endDate) {
      setCreateError('End date must be after start date');
      return;
    }

    const idPrefix = createBatchForm.batchName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 10) || 'BATCH';

    const newBatch = {
      id: `${idPrefix}-${String(batches.length + 1).padStart(3, '0')}`,
      college: createBatchForm.college,
      track: createBatchForm.assignedTrack.trim(),
      status: createBatchForm.status,
      start: formatDisplayDate(createBatchForm.startDate),
      end: formatDisplayDate(createBatchForm.endDate),
      students: Number.parseInt(createBatchForm.batchSize || '0', 10) || 0,
    };

    if (editingBatchId) {
      setBatches((prev) => prev.map((batch) => batch.id === editingBatchId ? { ...batch, ...newBatch, id: editingBatchId } : batch));
    } else {
      setBatches((prev) => [newBatch, ...prev]);
    }
    setIsCreateFormOpen(false);
    setEditingBatchId(null);
  };

  const deleteBatch = (batchId) => {
    setBatches((prev) => prev.filter((batch) => batch.id !== batchId));
    setPendingDeleteBatch(null);
  };

  return (
    <>
      <SearchModal
        isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef} filteredRoutes={filteredRoutes} navigate={navigate}
      />

      {isCreateFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsCreateFormOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
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
                    onChange={(e) => setCreateBatchForm((p) => ({ ...p, batchName: e.target.value }))}
                    placeholder="Enter batch name"
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">College*</label>
                  <div className="relative mt-1">
                    <select
                      value={createBatchForm.college}
                      onChange={(e) => setCreateBatchForm((p) => ({ ...p, college: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                    >
                      <option value="">Select college</option>
                      {collegeOptions.map((college) => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Start Date</label>
                  <input
                    type="date"
                    value={createBatchForm.startDate}
                    onChange={(e) => setCreateBatchForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">End Date</label>
                  <input
                    type="date"
                    value={createBatchForm.endDate}
                    onChange={(e) => setCreateBatchForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Assigned Track*</label>
                  <input
                    value={createBatchForm.assignedTrack}
                    onChange={(e) => setCreateBatchForm((p) => ({ ...p, assignedTrack: e.target.value }))}
                    placeholder="E.g. Data Structures"
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Batch Size</label>
                  <input
                    type="number"
                    min="0"
                    value={createBatchForm.batchSize}
                    onChange={(e) => setCreateBatchForm((p) => ({ ...p, batchSize: e.target.value }))}
                    placeholder="Enter batch size"
                    className="mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  />
                </div>
              </div>

              <div>
                <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                <div className="relative mt-1">
                  <select
                    value={createBatchForm.status}
                    onChange={(e) => setCreateBatchForm((p) => ({ ...p, status: e.target.value }))}
                    className="appearance-none w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
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
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition-colors"
                >
                  {editingBatchId ? 'Save Changes' : 'Create Batch'}
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
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">Are you sure you want to delete {pendingDeleteBatch.id}?</p>
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
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1600px] mx-auto space-y-8">

            {/* Header */}
            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Batches</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* Top controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_170px_auto] gap-2.5 items-center">
              <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
                <input
                  value={batchSearchTerm}
                  onChange={(e) => setBatchSearchTerm(e.target.value)}
                  placeholder="Search batches..."
                  className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/40 pl-10 pr-3 text-sm text-black/70 dark:text-white/70 outline-none focus:border-black/20 dark:focus:border-white/20"
                />
              </div>

              <div className="relative min-w-0">
                <select
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/40 px-3.5 pr-9 text-sm text-black/70 dark:text-white/70 outline-none focus:border-black/20 dark:focus:border-white/20"
                >
                  {colleges.map((college) => <option key={college} value={college}>{college}</option>)}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>

              <div className="relative min-w-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/40 px-3.5 pr-9 text-sm text-black/70 dark:text-white/70 outline-none focus:border-black/20 dark:focus:border-white/20"
                >
                  <option value="All Status">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/35 dark:text-white/35" />
              </div>

              <button
                onClick={openCreateBatch}
                className="h-10 px-5 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#2f73e0] transition-colors whitespace-nowrap"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Create Batch
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Active',    count: counts.Active,    color: 'text-emerald-500'                          },
                { label: 'Upcoming',  count: counts.Upcoming,  color: 'text-indigo-500 dark:text-indigo-400'      },
                { label: 'Completed', count: counts.Completed, color: 'text-black/35 dark:text-white/40'          },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-2xl px-6 py-5">
                  <p className="admin-micro-label text-black/40 dark:text-white/40">{label}</p>
                  <p className={`text-3xl font-light tracking-tight mt-2 ${color}`}>{count}</p>
                </div>
              ))}
            </div>

            {/* Batch Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-5">
              {filteredBatches.map((batch) => (
                <div key={batch.id} className="bg-white/45 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 p-4 rounded-2xl flex flex-col gap-3.5 hover:bg-white/65 dark:hover:bg-black/55 transition-colors group shadow-sm">

                  {/* College + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-black/55 dark:text-white/55">
                      <FiHome className="w-3.5 h-3.5" />
                      <span>{batch.college}</span>
                    </p>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusBadge(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>

                  {/* Batch title */}
                  <div className="space-y-0.5">
                    <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-black/90 dark:text-white leading-none">{batch.id}</h3>
                    <p className="text-sm md:text-base text-black/55 dark:text-white/50 leading-snug line-clamp-2">{batch.track}</p>
                  </div>

                  <div className="h-px bg-black/5 dark:bg-white/10" />

                  {/* Start / End / Students */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[11px] text-black/45 dark:text-white/45">Start</p>
                      <p className="text-sm md:text-base font-medium text-black/90 dark:text-white truncate">{batch.start}</p>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[11px] text-black/45 dark:text-white/45">End</p>
                      <p className="text-sm md:text-base font-medium text-black/90 dark:text-white truncate">{batch.end}</p>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-[11px] text-black/45 dark:text-white/45">Students</p>
                      <p className="text-sm md:text-base font-medium text-black/90 dark:text-white">{batch.students}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_42px_42px] gap-2 pt-0.5">
                    <button
                      onClick={() => navigate(`/batches/${batch.id}`, { state: { batch } })}
                      className="w-full h-10 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#2f73e0] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                      View Batch
                    </button>
                    <button
                      onClick={() => openEditBatch(batch)}
                      className="h-10 rounded-xl border border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 text-black/65 dark:text-white/75 hover:bg-white/60 dark:hover:bg-white/10 inline-flex items-center justify-center transition-colors"
                      aria-label={`Edit ${batch.id}`}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPendingDeleteBatch(batch)}
                      className="h-10 rounded-xl border border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 text-black/65 dark:text-white/75 hover:bg-red-500/10 hover:text-red-500 inline-flex items-center justify-center transition-colors"
                      aria-label={`Delete ${batch.id}`}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default Batches;
