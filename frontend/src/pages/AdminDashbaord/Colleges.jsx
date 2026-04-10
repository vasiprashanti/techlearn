import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar"; // ✅ CORRECT - goes to /admin
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyColleges } from '../../data/adminEmptyStates';
import { FiSearch, FiPlus, FiHome, FiCheckCircle, FiChevronDown, FiMoreHorizontal, FiArrowUpRight } from 'react-icons/fi';

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

const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, searchInputRef, filteredRoutes, navigate }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
          <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
          <input ref={searchInputRef} type="text" placeholder="Search pages, tracks, or settings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
          <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={onClose}><span>ESC</span></div>
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

const Colleges = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [colleges, setColleges] = useState(emptyColleges);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [formState, setFormState] = useState({ name: '', code: '', city: '', status: 'Active', contactPerson: '', contactEmail: '' });
  const [collegeSearchTerm, setCollegeSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [pendingDeleteCollege, setPendingDeleteCollege] = useState(null);
  const [isDeletingCollege, setIsDeletingCollege] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const collegeFormInputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    let cancelled = false;

    adminAPI
      .getColleges()
      .then((remoteColleges) => {
        if (!cancelled) {
          setColleges(preferRemoteData(remoteColleges, emptyColleges));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setColleges(emptyColleges);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);
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

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const clickedTrigger = event.target.closest('.college-actions-trigger');
      const clickedMenu = event.target.closest('.college-actions-menu');
      if (!clickedTrigger && !clickedMenu) {
        setOpenActionMenuId(null);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredColleges = colleges.filter((college) => {
    const matchesStatus = statusFilter === 'All' || college.status === statusFilter;
    const query = collegeSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      college.name.toLowerCase().includes(query) ||
      String(college.code || '').toLowerCase().includes(query) ||
      String(college.id || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });
  const activeCount = colleges.filter(c => c.status === 'Active').length;

  const normalizeCollege = (college) => ({
    id: college?.id || college?._id || '',
    name: college?.name || 'Untitled College',
    code: college?.code || '',
    city: college?.city || '',
    status: college?.status || 'Active',
    contactPerson: college?.contactPerson || '',
    contactEmail: college?.contactEmail || '',
    avgScore: Number(college?.avgScore || 0),
    activeStudents: Number(college?.activeStudents || 0),
    totalStudents: Number(college?.totalStudents || 0),
    totalBatches: Number(college?.totalBatches || 0),
    activeBatches: Number(college?.activeBatches || 0),
    imageUrl: college?.imageUrl || '',
  });

  const openCreate = () => {
    setEditingCollege(null);
    setFormState({ name: '', code: '', city: '', status: 'Active', contactPerson: '', contactEmail: '' });
    setSaveError('');
    setDeleteError('');
    setIsFormOpen(true);
  };

  const openEdit = (college) => {
    setEditingCollege(college);
    setFormState({
      name: college.name || '',
      code: college.code || '',
      city: college.city || '',
      status: college.status || 'Active',
      contactPerson: college.contactPerson || '',
      contactEmail: college.contactEmail || '',
    });
    setSaveError('');
    setIsFormOpen(true);
  };

  const saveCollege = async () => {
    if (!formState.name.trim()) {
      setSaveError('College name is required');
      return;
    }
    if (!formState.code.trim()) {
      setSaveError('College code is required');
      return;
    }
    if (!formState.contactEmail.trim()) {
      setSaveError('Contact email is required');
      return;
    }

    const payload = {
      name: formState.name.trim(),
      code: formState.code.trim().toUpperCase(),
      city: formState.city.trim(),
      status: formState.status,
      contactPerson: formState.contactPerson.trim(),
      contactEmail: formState.contactEmail.trim(),
    };

    try {
      if (editingCollege) {
        const updated = await adminAPI.updateCollege(editingCollege.id, payload);

        try {
          const refreshed = await adminAPI.getColleges();
          setColleges(preferRemoteData(refreshed, colleges));
        } catch {
          setColleges((prev) =>
            prev.map((c) => (c.id === editingCollege.id ? { ...c, ...normalizeCollege(updated), ...payload } : c))
          );
        }
      } else {
        const created = await adminAPI.createCollege(payload);
        setColleges((prev) => [normalizeCollege(created), ...prev]);

        try {
          const refreshed = await adminAPI.getColleges();
          setColleges(preferRemoteData(refreshed, colleges));
        } catch {
          // Keep created row in UI if refresh fails; it was already persisted by API.
        }
      }

      setIsFormOpen(false);
      setSaveError('');
    } catch (error) {
      setSaveError(error?.message || 'Failed to save college. Please try again.');
    }
  };

  const deleteCollege = async (college) => {
    setDeleteError('');
    setIsDeletingCollege(true);
    try {
      await adminAPI.deleteCollege(college.id);
      const refreshed = await adminAPI.getColleges();
      setColleges(preferRemoteData(refreshed, colleges.filter((c) => c.id !== college.id)));
      setPendingDeleteCollege(null);
    } catch (error) {
      setDeleteError(error?.message || 'Failed to delete college.');
    } finally {
      setIsDeletingCollege(false);
    }
  };

  return (
    <>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchInputRef={searchInputRef} filteredRoutes={filteredRoutes} navigate={navigate} />

      {isFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">{editingCollege ? 'Edit College' : 'Add College'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">College Name*</label>
                  <input
                    value={formState.name}
                    onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                    className={collegeFormInputClass}
                    placeholder="Enter college name"
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">College Code*</label>
                  <input
                    value={formState.code}
                    onChange={(e) => setFormState((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className={collegeFormInputClass}
                    placeholder="E.g. MIT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">City</label>
                  <input
                    value={formState.city}
                    onChange={(e) => setFormState((p) => ({ ...p, city: e.target.value }))}
                    className={collegeFormInputClass}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={formState.status}
                      onChange={(e) => setFormState((p) => ({ ...p, status: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                    >
                      <option className={dropdownOptionClass} value="Active">Active</option>
                      <option className={dropdownOptionClass} value="Inactive">Inactive</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Contact Person</label>
                  <input
                    value={formState.contactPerson}
                    onChange={(e) => setFormState((p) => ({ ...p, contactPerson: e.target.value }))}
                    className={collegeFormInputClass}
                    placeholder="Enter contact person"
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Contact Email*</label>
                  <input
                    type="email"
                    value={formState.contactEmail}
                    onChange={(e) => setFormState((p) => ({ ...p, contactEmail: e.target.value }))}
                    className={collegeFormInputClass}
                    placeholder="Enter contact email"
                  />
                </div>
              </div>

              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCollege}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] text-white hover:bg-[#2f73e0] transition-colors"
                >
                  {editingCollege ? 'Save Changes' : 'Create College'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteCollege && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPendingDeleteCollege(null)} />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10">
              <h3 className="text-base font-semibold text-black/80 dark:text-white">Delete College</h3>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">
                Are you sure you want to delete {pendingDeleteCollege.name}?
              </p>
              {deleteError && <p className="text-xs text-red-500 mt-2">{deleteError}</p>}
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPendingDeleteCollege(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCollege(pendingDeleteCollege)}
                disabled={isDeletingCollege}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500 text-white hover:bg-red-600 disabled:opacity-70 transition-colors"
              >
                {isDeletingCollege ? 'Deleting...' : 'Delete'}
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
          <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">

            {/* Header */}
            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? 'bg-[#daf0fa]/78 dark:bg-[#001233]/76' : 'bg-[#daf0fa]/92 dark:bg-[#001233]/90'}`}>
              <div>
                <h1 className="admin-page-title">Colleges</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* Top Section */}
            <section className="space-y-4 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                {/* Controls Row: Search (left, wide), Dropdown (middle), Add (right) */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2.5">
                  <div className="flex flex-col sm:flex-row w-full gap-2.5">
                    <div className="relative w-full sm:flex-1 min-w-0">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                      <input
                        value={collegeSearchTerm}
                        onChange={(e) => setCollegeSearchTerm(e.target.value)}
                        placeholder="Search colleges..."
                        className="w-full h-10 sm:h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-11 pr-4 text-[13px] sm:text-sm leading-none text-black/80 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/35 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
                      />
                    </div>
                    <div className="relative w-full sm:w-[172px] shrink-0 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-white dark:hover:bg-[#162a52] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none w-full h-10 sm:h-9 rounded-xl bg-transparent px-3.5 pr-9 text-sm font-semibold tracking-tight text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="All">All Status</option>
                        <option className={dropdownOptionClass} value="Active">Active</option>
                        <option className={dropdownOptionClass} value="Inactive">Inactive</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                    <div className="flex-1 hidden sm:block" />
                    <button
                      onClick={openCreate}
                      className="h-10 sm:h-9 w-full sm:w-auto px-5 sm:px-7 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-white text-sm font-semibold whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 transition-colors ml-0 sm:ml-auto"
                      style={{ minWidth: 0 }}
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      Add College
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <article className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl px-5 py-4 min-h-[112px] sm:min-h-[104px] flex items-center gap-3.5 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-white flex items-center justify-center shrink-0">
                    <FiHome className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-3xl sm:text-3xl font-light tracking-tight leading-none text-black dark:text-white">{colleges.length}</p>
                    <p className="mt-1 text-sm text-black/60 dark:text-white/60">Total Colleges</p>
                  </div>
                </article>

                <article className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl px-5 py-4 min-h-[112px] sm:min-h-[104px] flex items-center gap-3.5 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-light tracking-tight leading-none text-black dark:text-white">{activeCount}</p>
                    <p className="mt-1 text-sm text-black/60 dark:text-white/60">Active Colleges</p>
                  </div>
                </article>
              </div>
            </section>

            {/* College Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredColleges.map((college) => {
                const activityRate = college.totalStudents > 0 ? Math.round((college.activeStudents / college.totalStudents) * 100) : 0;
                return (
                  <div key={college.id} className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 p-5 sm:p-4 rounded-2xl flex flex-col gap-4 sm:gap-3.5 h-full hover:bg-white dark:hover:bg-[#162a52] transition-colors group shadow-sm">

                    <div className="flex items-start justify-between min-h-[40px] sm:min-h-[36px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#3C83F6] to-[#5f98ef] text-white dark:text-white flex items-center justify-center text-base font-semibold border border-[#3C83F6]/20 dark:border-white/10 shadow-sm">
                          {college.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[1.05rem] sm:text-base font-semibold text-black/90 dark:text-white break-words sm:truncate sm:max-w-[190px]">{college.name}</h3>
                          <p className="text-sm text-black/50 dark:text-white/50 mt-0.5 truncate">{college.code || college.id}</p>
                        </div>
                      </div>

                      <div className="relative shrink-0 self-start">
                        <button
                          type="button"
                          className="college-actions-trigger w-8 h-8 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenActionMenuId((current) => (current === college.id ? null : college.id));
                          }}
                        >
                          <FiMoreHorizontal className="w-4 h-4" />
                        </button>

                        {openActionMenuId === college.id && (
                          <div className="college-actions-menu absolute right-0 top-11 w-36 rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#071739] backdrop-blur-xl shadow-xl z-20 overflow-hidden">
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                openEdit(college);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-sm text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionMenuId(null);
                                setDeleteError('');
                                setPendingDeleteCollege(college);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-white dark:bg-[#0f1f43] rounded-xl p-3 border border-black/10 dark:border-white/15 min-h-[74px] flex flex-col justify-center">
                        <p className="text-xs text-black/55 dark:text-white/55">Avg Score</p>
                        <p className={`text-2xl font-semibold tracking-tight mt-0.5 ${college.avgScore >= 80 ? 'text-black dark:text-white' : college.avgScore > 0 ? 'text-amber-500' : 'text-black/20 dark:text-white/20'}`}>
                          {college.avgScore}%
                        </p>
                      </div>

                      <div className="bg-white dark:bg-[#0f1f43] rounded-xl p-3 border border-black/10 dark:border-white/15 min-h-[74px] flex flex-col justify-center">
                        <p className="text-xs text-black/55 dark:text-white/55">Activity Rate</p>
                        <p className="text-xl font-semibold tracking-tight mt-0.5 text-black dark:text-white">
                          {college.activeStudents} / {college.totalStudents}
                          <span className="text-sm font-medium text-black/50 dark:text-white/50 ml-1">({activityRate}%)</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <button
                        onClick={() => navigate(`/colleges/${college.id}`, { state: { college } })}
                        className="w-full h-10 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-white text-sm font-semibold tracking-tight flex items-center justify-center gap-1.5 transition-colors"
                      >
                        View College
                        <FiArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </main>
      </div>
    </>
  );
};

export default Colleges;


