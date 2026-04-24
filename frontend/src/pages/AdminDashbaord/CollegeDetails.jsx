import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import ModernDatePicker from '../../components/AdminDashbaord/ModernDatePicker';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import {
  FiArrowLeft,
  FiUsers,
  FiActivity,
  FiLayers,
  FiTrendingUp,
  FiBarChart2,
  FiArrowUpRight,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiChevronDown,
} from 'react-icons/fi';

const statusPillClass = (status) =>
  status === 'Active'
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

const normalizeBatchRow = (batch) => ({
  id: batch.id || batch._id || batch.name,
  name: batch.name || 'Untitled Batch',
  students: Number(batch.students || 0),
  avgScore: Number(batch.avgScore || 0),
  status: batch.status || 'Draft',
});

const emptyBatchForm = {
  batchName: '',
  startDate: '',
  assignedTrack: '',
  endDate: '',
  batchSize: '',
  status: 'Draft',
};

const CollegeDetails = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { collegeId } = useParams();
  const isDarkMode = theme === 'dark';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [collegeDetail, setCollegeDetail] = useState(null);
  const [isLoadingCollege, setIsLoadingCollege] = useState(true);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [pendingDeleteBatch, setPendingDeleteBatch] = useState(null);
  const [trackOptions, setTrackOptions] = useState([]);
  const [batchFormError, setBatchFormError] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState(emptyBatchForm);

  useEffect(() => {
    setMounted(true);
  }, []);

  const college = useMemo(() => {
    if (collegeDetail) {
      return {
        ...collegeDetail,
        batches: Array.isArray(collegeDetail.batches) ? collegeDetail.batches.map(normalizeBatchRow) : [],
      };
    }

    const stateCollege = location.state?.college;
    if (stateCollege?.id === collegeId) {
      return {
        ...stateCollege,
        code: stateCollege.code || '',
        city: stateCollege.city || '',
        activeBatches: stateCollege.activeBatches || 0,
        submissionRate: stateCollege.submissionRate || 0,
        batches: Array.isArray(stateCollege.batches) ? stateCollege.batches.map(normalizeBatchRow) : [],
      };
    }

    return {
      id: collegeId,
      name: collegeId?.split('-')[0] || 'College',
      code: '',
      city: '',
      status: 'Active',
      totalStudents: 0,
      activeStudents: 0,
      activeBatches: 0,
      avgScore: 0,
      submissionRate: 0,
      batches: [],
    };
  }, [collegeDetail, location.state, collegeId]);

  const loadCollegeDetail = useCallback(async () => {
    const remoteCollege = await adminAPI.getCollege(collegeId);
    setCollegeDetail(preferRemoteData(remoteCollege, null));
  }, [collegeId]);

  useEffect(() => {
    let cancelled = false;

    loadCollegeDetail()
      .catch(() => {
        if (!cancelled) {
          setCollegeDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCollege(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadCollegeDetail]);

  const loadTrackOptions = useCallback(async () => {
    const remoteTrackTemplates = await adminAPI.getTrackTemplates();
    const normalizedTrackOptions = Array.from(
      new Set(
        preferRemoteData(remoteTrackTemplates, [])
          .map((template) => String(template?.name || '').trim())
          .filter(Boolean)
      )
    );
    setTrackOptions(normalizedTrackOptions);
  }, []);

  const openCreateBatch = async () => {
    setEditingBatchId(null);
    setBatchFormError('');
    setBatchForm(emptyBatchForm);
    setIsBatchFormOpen(true);
    if (trackOptions.length === 0) {
      loadTrackOptions().catch(() => {});
    }
  };

  const openEditBatch = async (batchId) => {
    setBatchFormError('');
    setEditingBatchId(batchId);
    setIsBatchFormOpen(true);
    if (trackOptions.length === 0) {
      loadTrackOptions().catch(() => {});
    }

    try {
      const batchDetailResponse = await adminAPI.getBatch(batchId);
      const batchDetail = preferRemoteData(batchDetailResponse, null);

      setBatchForm({
        batchName: batchDetail?.name || '',
        startDate: batchDetail?.startDateValue || '',
        assignedTrack: batchDetail?.assignedTrack || '',
        endDate: batchDetail?.expiryDateValue || '',
        batchSize: batchDetail?.batchSize ? String(batchDetail.batchSize) : '',
        status: batchDetail?.status || 'Draft',
      });
    } catch (error) {
      setBatchForm(emptyBatchForm);
      setBatchFormError(error.message || 'Failed to load batch details.');
    }
  };

  const saveBatch = async () => {
    if (!batchForm.batchName.trim()) {
      setBatchFormError('Batch name is required');
      return;
    }
    if (!batchForm.startDate || !batchForm.endDate) {
      setBatchFormError('Start date and end date are required');
      return;
    }
    if (batchForm.startDate > batchForm.endDate) {
      setBatchFormError('End date must be after start date');
      return;
    }
    if (batchForm.batchSize && (!/^\d+$/.test(batchForm.batchSize) || Number(batchForm.batchSize) <= 0)) {
      setBatchFormError('Batch size must be a positive number');
      return;
    }

    setBatchFormError('');
    setIsSavingBatch(true);

    try {
      const payload = {
        collegeId,
        name: batchForm.batchName.trim(),
        startDate: batchForm.startDate,
        expiryDate: batchForm.endDate,
        assignedTrack: batchForm.assignedTrack,
        batchSize: batchForm.batchSize ? Number(batchForm.batchSize) : null,
        status: batchForm.status,
      };

      if (editingBatchId) {
        await adminAPI.updateBatch(editingBatchId, payload);
      } else {
        await adminAPI.createBatch(payload);
      }

      await loadCollegeDetail();
      setIsBatchFormOpen(false);
      setEditingBatchId(null);
      setBatchForm(emptyBatchForm);
    } catch (error) {
      setBatchFormError(error.message || 'Failed to save batch');
    } finally {
      setIsSavingBatch(false);
    }
  };

  const deleteBatch = async () => {
    if (!pendingDeleteBatch?.id) return;

    setBatchFormError('');
    setIsDeletingBatch(true);

    try {
      await adminAPI.deleteBatch(pendingDeleteBatch.id);
      await loadCollegeDetail();
      setPendingDeleteBatch(null);
    } catch (error) {
      setBatchFormError(error.message || 'Failed to delete batch');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const batchFormInputClass =
    'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  return (
    <>
      {isBatchFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBatchFormOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-visible">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">{editingBatchId ? 'Edit Batch' : 'Create Batch'}</h2>
              <button onClick={() => setIsBatchFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Batch Name*</label>
                  <input
                    value={batchForm.batchName}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, batchName: e.target.value }))}
                    placeholder="Enter batch name"
                    className={batchFormInputClass}
                  />
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Status</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={batchForm.status}
                      onChange={(e) => setBatchForm((prev) => ({ ...prev, status: e.target.value }))}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Start Date*</label>
                  <div className="mt-1">
                    <ModernDatePicker
                      value={batchForm.startDate}
                      onChange={(nextDate) =>
                        setBatchForm((prev) => ({
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
                      value={batchForm.endDate}
                      onChange={(nextDate) => setBatchForm((prev) => ({ ...prev, endDate: nextDate }))}
                      minDate={batchForm.startDate ? new Date(`${batchForm.startDate}T00:00:00`) : undefined}
                      placeholder="Select end date"
                      ariaLabel="End date"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Assigned Track</label>
                  <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                    <select
                      value={batchForm.assignedTrack}
                      onChange={(e) => setBatchForm((prev) => ({ ...prev, assignedTrack: e.target.value }))}
                      className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none disabled:opacity-60"
                      disabled={trackOptions.length === 0}
                    >
                      <option className={dropdownOptionClass} value="">
                        {trackOptions.length ? 'Optional track template' : 'No tracks available'}
                      </option>
                      {trackOptions.map((trackName) => (
                        <option className={dropdownOptionClass} key={trackName} value={trackName}>{trackName}</option>
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
                    value={batchForm.batchSize}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, batchSize: e.target.value.replace(/[^\d]/g, '') }))}
                    className={batchFormInputClass}
                    placeholder="Enter batch size"
                  />
                </div>
              </div>

              {batchFormError && <p className="text-xs text-red-500">{batchFormError}</p>}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsBatchFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBatch}
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
                Are you sure you want to delete {pendingDeleteBatch.name}?
              </p>
              {batchFormError && <p className="text-xs text-red-500 mt-2">{batchFormError}</p>}
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPendingDeleteBatch(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={deleteBatch}
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
          className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          } pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="max-w-[1600px] mx-auto space-y-8">
            <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
              <div className="flex-1" />
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {isLoadingCollege ? (
              <section className="min-h-[50vh] flex items-center justify-center">
                <LoadingScreen
                  fullScreen={false}
                  message="Loading college..."
                  className="w-full rounded-3xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl"
                />
              </section>
            ) : (
              <section className="space-y-5">
                <button
                  onClick={() => navigate('/colleges')}
                  className="inline-flex items-center gap-2 text-sm text-black/55 dark:text-white/55 hover:text-black/80 dark:hover:text-white/80 transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back to Colleges
                </button>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3C83F6] to-[#5f98ef] text-white flex items-center justify-center text-3xl font-semibold shadow-md">
                    {college.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-black/90 dark:text-white">{college.name}</h2>
                    <p className="mt-1 text-lg text-black/55 dark:text-white/55">{college.code || college.id} {college.city ? `· ${college.city}` : ''}</p>
                  </div>
                  <span className={`ml-auto inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(college.status)}`}>
                    {college.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                    <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiUsers className="w-4 h-4 shrink-0" />Total Students</p>
                    <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.totalStudents}</p>
                  </div>
                  <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                    <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiActivity className="w-4 h-4 shrink-0" />Active Students Today</p>
                    <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.activeStudents}</p>
                  </div>
                  <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                    <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiLayers className="w-4 h-4 shrink-0" />Active Batches</p>
                    <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.activeBatches}</p>
                  </div>
                  <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                    <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiTrendingUp className="w-4 h-4 shrink-0" />Average Score</p>
                    <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.avgScore}%</p>
                  </div>
                  <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 min-h-[110px] flex flex-col justify-between">
                    <p className="flex items-center gap-2 text-sm leading-snug text-black/55 dark:text-white/55 min-h-[34px]"><FiBarChart2 className="w-4 h-4 shrink-0" />Submission Rate</p>
                    <p className="mt-2 text-3xl font-semibold text-black dark:text-white leading-none">{college.submissionRate}%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="admin-section-heading">Batches</h3>
                    <button
                      onClick={openCreateBatch}
                      className="h-10 px-4 rounded-xl bg-[#3C83F6] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#2f73e0] transition-colors"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      Create Batch
                    </button>
                  </div>

                  <div className="bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,1.3fr)_100px_110px_100px_190px] gap-3 px-5 py-3 text-sm font-semibold text-black/50 dark:text-white/50 border-b border-black/5 dark:border-white/10">
                      <span>Batch Name</span>
                      <span>Students</span>
                      <span>Avg Score</span>
                      <span>Status</span>
                      <span className="text-right">Actions</span>
                    </div>

                    {college.batches.length === 0 ? (
                      <div className="px-5 py-7 text-black/45 dark:text-white/45 text-sm">No batches mapped to this college yet.</div>
                    ) : (
                      college.batches.map((batch) => (
                        <div key={batch.id} className="grid grid-cols-[minmax(0,1.3fr)_100px_110px_100px_190px] gap-3 px-5 py-4 text-base text-black/80 dark:text-white border-b border-black/5 dark:border-white/10 last:border-b-0">
                          <span className="font-semibold truncate">{batch.name}</span>
                          <span>{batch.students}</span>
                          <span>{batch.avgScore}%</span>
                          <span>
                            <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(batch.status)}`}>
                              {batch.status}
                            </span>
                          </span>
                          <span className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/batches/${batch.id}`, { state: { batch } })}
                              className="inline-flex items-center gap-1.5 text-sm text-[#3C83F6] dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
                            >
                              View
                              <FiArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditBatch(batch.id)}
                              className="w-9 h-9 rounded-xl border border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 text-black/65 dark:text-white/75 hover:bg-white/60 dark:hover:bg-white/10 inline-flex items-center justify-center transition-colors"
                              aria-label={`Edit ${batch.name}`}
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setBatchFormError('');
                                setPendingDeleteBatch(batch);
                              }}
                              className="w-9 h-9 rounded-xl border border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 text-black/65 dark:text-white/75 hover:bg-red-500/10 hover:text-red-500 inline-flex items-center justify-center transition-colors"
                              aria-label={`Delete ${batch.name}`}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default CollegeDetails;
