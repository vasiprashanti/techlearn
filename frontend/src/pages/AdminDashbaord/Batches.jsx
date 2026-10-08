import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from "../../components/AdminDashbaord/Admin_Sidebar";
import ModernDatePicker from '../../components/AdminDashbaord/ModernDatePicker';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI, hasMeaningfulAdminData, preferRemoteData, readAdminSessionCache, writeAdminSessionCache } from '../../services/adminApi';
import { emptyBatches } from '../../data/adminEmptyStates';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiArchive,
  FiX,
} from 'react-icons/fi';

const BATCH_TYPES = ['All', 'Skill', 'Placement'];
const STATUS_OPTIONS = ['All', 'Draft', 'Active', 'Completed', 'Archived'];
const SCHEDULE_OPTIONS = ['Mon–Fri', 'Sat–Sun', 'Mon, Wed, Fri', 'Tue, Thu, Sat', 'Daily'];


const getCreatedMonthLabel = (createdAtDate) => {
  if (!createdAtDate) return '';
  const date = new Date(createdAtDate);
  if (Number.isNaN(date.getTime())) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const normalizeBatch = (batch) => {
  const activeTrack = batch.currentActiveTrack || batch.track || batch.assignedTrack;
  const trackName = (!activeTrack || activeTrack === 'None') ? 'No Track' : activeTrack;
  const programType = batch.programType || batch.program?.programType || (
    batch.programSelection === 'Full Stack Project Program' ? 'Skill' : (batch.programSelection || '')
  );

  return {
    ...batch,
    id: batch.id || batch._id || batch.name,
    name: batch.name || batch.id || 'Untitled Batch',
    college: batch.college || '',
    collegeId: batch.collegeId?._id || batch.collegeId || null,
    collegeIds: Array.isArray(batch.collegeIds)
      ? batch.collegeIds.map((c) => String(c?._id || c?.id || c))
      : (batch.collegeId ? [String(batch.collegeId?._id || batch.collegeId?.id || batch.collegeId)] : []),
    assignedTrack: batch.assignedTrack || '',
    assignedTrackTemplateId: batch.assignedTrackTemplateId || '',
    assignedTrackTemplateIds: Array.isArray(batch.assignedTrackTemplateIds)
      ? batch.assignedTrackTemplateIds.map(String)
      : (batch.assignedTrackTemplateId ? [String(batch.assignedTrackTemplateId)] : []),
    assignedTrackTemplateCategory: batch.assignedTrackTemplateCategory || '',
    startDateValue: batch.startDateValue || (batch.startDate ? new Date(batch.startDate).toISOString().slice(0, 10) : ''),
    expiryDateValue: batch.expiryDateValue || (batch.expiryDate ? new Date(batch.expiryDate).toISOString().slice(0, 10) : ''),
    batchSize: typeof batch.batchSize === 'number' ? batch.batchSize : null,
    track: trackName,
    status: batch.status || 'Draft',
    start: batch.start || 'TBD',
    end: batch.end || 'TBD',
    students: Number(batch.students || 0),
    programId: batch.programId?._id || batch.programId || '',
    programType: programType ? (String(programType).toLowerCase() === 'skill' ? 'Skill' : 'Placement') : null,
    program: batch.program || null,
    schedule: batch.schedule || 'Mon–Fri',
    createdAt: batch.createdAt || null,
  };
};

const getProgramDurationDays = (program) => {
  const canonical = Number(program?.durationDays);
  if (Number.isInteger(canonical) && canonical > 0) return canonical;
  const match = String(program?.duration || '').match(/(d+(?:.d+)?)s*-?s*(day|days|week|weeks|month|months|year|years)/i);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = match[2].toLowerCase();
  const multiplier = unit.startsWith('year') ? 365 : unit.startsWith('month') ? 30 : unit.startsWith('week') ? 7 : 1;
  return Math.max(1, Math.round(amount * multiplier));
};

const getProgramEndDate = (startDate, program) => {
  const durationDays = getProgramDurationDays(program);
  if (!startDate || !durationDays) return '';
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + durationDays - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getBatchRelevance = (batch, query) => {
  if (!query) return 0;
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = String(batch.name || '').toLowerCase();
  const college = String(batch.college || '').toLowerCase();
  const programName = String(batch.program?.name || '').toLowerCase();
  const id = String(batch.id || '').toLowerCase();

  const fields = [name, college, programName, id];

  for (const field of fields) {
    if (field === q) return 1000;
    if (field.startsWith(q)) return 500;
    if (field.includes(q)) return 200;
  }

  const terms = q.split(/s+/).filter(Boolean);
  if (terms.length > 1) {
    const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[]]/g, '$&'));
    const orderRegex = new RegExp(escapedTerms.join('.*'), 'i');
    for (const field of fields) {
      if (orderRegex.test(field)) return 100;
    }
  }

  let matchedTerms = 0;
  for (const term of terms) {
    if (fields.some(field => field.includes(term))) matchedTerms++;
  }
  if (matchedTerms === terms.length) return 50;
  if (matchedTerms > 0) return 10 * matchedTerms;

  return 0;
};

const Batches = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [batches, setBatches] = useState(() => readAdminSessionCache('batches', emptyBatches));
  const [colleges, setColleges] = useState(() => readAdminSessionCache('batches-colleges', []));
  const [, setTrackTemplates] = useState(() => readAdminSessionCache('batches-track-templates', []));
  const [programs, setPrograms] = useState([]);
  const [, setCourses] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(() => !hasMeaningfulAdminData(readAdminSessionCache('batches', emptyBatches)));
  const [mounted, setMounted] = useState(false);

  // Filters & Search
  const [batchTypeFilter, setBatchTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced Filters Popover state
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [draftMonthFilter, setDraftMonthFilter] = useState('All Months');
  const [draftCollegeFilter, setDraftCollegeFilter] = useState('All Colleges');
  const [appliedMonthFilter, setAppliedMonthFilter] = useState('All Months');
  const [appliedCollegeFilter, setAppliedCollegeFilter] = useState('All Colleges');
  const filterPopoverRef = useRef(null);

  // Table selection & pagination
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [pendingDeleteBatch, setPendingDeleteBatch] = useState(null);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  // Inline status updating batchId tracking
  const [updatingStatusBatchId, setUpdatingStatusBatchId] = useState(null);

  // Create / Edit Modal State
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [createError, setCreateError] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [collegeSearchInput, setCollegeSearchInput] = useState('');
  const [programDropdownOpen, setProgramDropdownOpen] = useState(false);
  const [programSearchInput, setProgramSearchInput] = useState('');
  const [trackTemplateDropdownOpen, setTrackTemplateDropdownOpen] = useState(false);
  const [supportingCourseDropdownOpen, setSupportingCourseDropdownOpen] = useState(false);

  const collegeDropdownRef = useRef(null);
  const programDropdownRef = useRef(null);
  const trackTemplateDropdownRef = useRef(null);
  const supportingCourseDropdownRef = useRef(null);

  const [createBatchForm, setCreateBatchForm] = useState({
    batchName: '',
    college: '',
    collegeIds: [],
    allColleges: false,
    startDate: '',
    endDate: '',
    programType: 'Placement',
    programId: '',
    schedule: 'Mon–Fri',
    batchSize: '',
    status: 'Draft',
    assignedTrack: '',
    assignedTrackTemplateIds: [],
    courses: [],
  });

  const isDarkMode = theme === 'dark';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const batchFormInputClass = 'mt-1 w-full px-3 py-2 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  const loadBatchPageData = useCallback(async () => {
    const [remoteBatches, remoteColleges, remoteTrackTemplates, remoteCourses, remotePrograms] = await Promise.all([
      adminAPI.getBatches(),
      adminAPI.getColleges(),
      adminAPI.getTrackTemplates().catch(() => []),
      adminAPI.getCourses().catch(() => ({ courses: [] })),
      adminAPI.getPrograms({ status: 'Active', limit: 100 }).catch(() => ({ programs: [] })),
    ]);

    const normalizedBatches = preferRemoteData(remoteBatches, emptyBatches).map(normalizeBatch);
    const normalizedColleges = preferRemoteData(remoteColleges, []).map((college) => ({
      id: college.id || college._id,
      name: college.name || 'Untitled College',
    }));

    setBatches(normalizedBatches);
    setColleges(normalizedColleges);
    const assignableTemplates = preferRemoteData(remoteTrackTemplates, [])
      .filter((template) => template.status === 'Active')
      .map((template) => ({
        id: template.id || template._id,
        name: template.name || 'Untitled template',
        trackType: template.trackType || 'Track',
      }));
    setTrackTemplates(assignableTemplates);

    const assignableCourses = (remoteCourses?.courses || remoteCourses || [])
      .filter((c) => !c.courseType || c.courseType === 'Self-paced')
      .map((c) => ({
        id: c.id || c._id,
        title: c.title || 'Untitled Course',
      }));
    setCourses(assignableCourses);

    const assignablePrograms = (remotePrograms?.programs || remotePrograms?.data || remotePrograms || [])
      .filter((program) => program?.status === 'Active' && ['Placement', 'Skill'].includes(program.programType))
      .map((program) => ({
        id: program.id || program._id,
        name: program.name || 'Untitled Program',
        programType: program.programType,
        duration: program.duration || '',
        durationDays: program.durationDays || null,
      }))
      .filter((program) => program.id);
    setPrograms(assignablePrograms);

    writeAdminSessionCache('batches', normalizedBatches);
    writeAdminSessionCache('batches-colleges', normalizedColleges);
    writeAdminSessionCache('batches-track-templates', assignableTemplates);
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
    return () => { cancelled = true; };
  }, [loadBatchPageData]);

  // Click outside to close dropdowns and filter popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isFilterPopoverOpen && filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setIsFilterPopoverOpen(false);
      }
      if (collegeDropdownOpen && collegeDropdownRef.current && !collegeDropdownRef.current.contains(e.target)) {
        setCollegeDropdownOpen(false);
      }
      if (programDropdownOpen && programDropdownRef.current && !programDropdownRef.current.contains(e.target)) {
        setProgramDropdownOpen(false);
      }
      if (trackTemplateDropdownOpen && trackTemplateDropdownRef.current && !trackTemplateDropdownRef.current.contains(e.target)) {
        setTrackTemplateDropdownOpen(false);
      }
      if (supportingCourseDropdownOpen && supportingCourseDropdownRef.current && !supportingCourseDropdownRef.current.contains(e.target)) {
        setSupportingCourseDropdownOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsFilterPopoverOpen(false);
        setCollegeDropdownOpen(false);
        setProgramDropdownOpen(false);
        setTrackTemplateDropdownOpen(false);
        setSupportingCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isFilterPopoverOpen, collegeDropdownOpen, programDropdownOpen, trackTemplateDropdownOpen, supportingCourseDropdownOpen]);

  // Available months and colleges for filters
  const availableMonths = Array.from(
    new Set(batches.map((b) => getCreatedMonthLabel(b.createdAt)).filter(Boolean))
  );
  const collegeOptions = Array.from(
    new Set(colleges.map((c) => c.name).filter(Boolean))
  );

  // Active filters count
  const activeAdvancedFilterCount = (appliedMonthFilter !== 'All Months' ? 1 : 0) + (appliedCollegeFilter !== 'All Colleges' ? 1 : 0);

  // Dynamic summary stats (calculated from all batch records)
  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === 'Active').length;
  const completedBatches = batches.filter((b) => b.status === 'Completed' || b.status === 'Expired').length;
  const archivedBatches = batches.filter((b) => b.status === 'Archived').length;

  // Filtered batches for table display
  const filteredBatches = batches.filter((batch) => {
    // 1. Batch Type filter
    if (batchTypeFilter !== 'All') {
      if (batch.programType !== batchTypeFilter) return false;
    }

    // 2. Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Completed') {
        if (batch.status !== 'Completed' && batch.status !== 'Expired') return false;
      } else if (batch.status !== statusFilter) {
        return false;
      }
    }

    // 3. Advanced Month filter
    if (appliedMonthFilter !== 'All Months') {
      if (getCreatedMonthLabel(batch.createdAt) !== appliedMonthFilter) return false;
    }

    // 4. Advanced College filter
    if (appliedCollegeFilter !== 'All Colleges') {
      const collegeMatches = (batch.college || '').includes(appliedCollegeFilter) ||
        (Array.isArray(batch.collegeIds) && colleges.some(c => c.name === appliedCollegeFilter && batch.collegeIds.includes(String(c.id))));
      if (!collegeMatches) return false;
    }

    // 5. Search by Batch Name
    if (searchTerm.trim()) {
      const relevance = getBatchRelevance(batch, searchTerm.trim());
      if (relevance <= 0) return false;
    }

    return true;
  }).sort((a, b) => {
    if (searchTerm.trim()) {
      const relA = getBatchRelevance(a, searchTerm.trim());
      const relB = getBatchRelevance(b, searchTerm.trim());
      if (relA !== relB) return relB - relA;
    }
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

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

  const handleDeleteSingleBatch = async (batchId) => {
    setCreateError('');
    setIsDeletingBatch(true);
    try {
      await adminAPI.deleteBatch(batchId);
      await loadBatchPageData();
      setPendingDeleteBatch(null);
    } catch (error) {
      setCreateError(error.message || 'Failed to delete batch.');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  // Inline status update
  const handleInlineStatusChange = async (batchId, nextStatus) => {
    setUpdatingStatusBatchId(batchId);
    try {
      await adminAPI.updateBatch(batchId, { status: nextStatus });
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, status: nextStatus } : b))
      );
    } catch (err) {
      console.error('Failed to update status inline:', err);
      alert(err.message || 'Failed to update batch status.');
      await loadBatchPageData();
    } finally {
      setUpdatingStatusBatchId(null);
    }
  };

  // Open Create Modal
  const openCreateBatch = () => {
    setEditingBatchId(null);
    setCreateError('');
    setCollegeSearchInput('');
    setProgramSearchInput('');
    setCreateBatchForm({
      batchName: '',
      college: '',
      collegeIds: [],
      allColleges: false,
      startDate: '',
      endDate: '',
      programType: 'Placement',
      programId: '',
      schedule: 'Mon–Fri',
      batchSize: '',
      status: 'Draft',
      assignedTrack: '',
      assignedTrackTemplateIds: [],
      courses: [],
    });
    setIsCreateFormOpen(true);
  };

  // Open Edit Modal
  const openEditBatch = (batch) => {
    const assignedTrackTemplateIds = Array.isArray(batch.assignedTrackTemplateIds)
      ? batch.assignedTrackTemplateIds.map(String)
      : (batch.assignedTrackTemplateId ? [String(batch.assignedTrackTemplateId)] : []);

    const allCourses = [
      batch.attachedCourse ? String(batch.attachedCourse._id || batch.attachedCourse.id || batch.attachedCourse) : null,
      ...(Array.isArray(batch.supportingCourses) ? batch.supportingCourses.map(c => String(c.id || c._id || c)) : [])
    ].filter(Boolean);

    const collegeIds = Array.isArray(batch.collegeIds)
      ? batch.collegeIds.map(String)
      : (batch.collegeId ? [String(batch.collegeId._id || batch.collegeId.id || batch.collegeId)] : []);

    const selectedProgramId = batch.programId?._id || batch.programId || '';
    const selectedProgram = programs.find((program) => String(program.id) === String(selectedProgramId));
    const rawProgramType = batch.programType || selectedProgram?.programType || batch.programSelection;
    const normalizedProgram = (String(rawProgramType || '').toLowerCase() === 'skill' || rawProgramType === 'Full Stack Project Program')
      ? 'Skill'
      : 'Placement';

    setEditingBatchId(batch.id);
    setCreateError('');
    setCollegeSearchInput('');
    setProgramSearchInput('');
    setCreateBatchForm({
      batchName: batch.name || '',
      college: batch.college || '',
      collegeIds,
      allColleges: batch.allColleges === true,
      startDate: batch.startDateValue || '',
      endDate: selectedProgram
        ? (getProgramEndDate(batch.startDateValue || '', selectedProgram) || batch.expiryDateValue || '')
        : (batch.expiryDateValue || ''),
      programType: normalizedProgram,
      programId: selectedProgramId ? String(selectedProgramId) : '',
      schedule: batch.schedule || 'Mon–Fri',
      batchSize: batch.batchSize ? String(batch.batchSize) : '',
      status: batch.status || 'Draft',
      assignedTrack: batch.assignedTrack || '',
      assignedTrackTemplateIds,
      courses: allCourses,
    });
    setIsCreateFormOpen(true);
  };

  const handleProgramTypeChange = (newType) => {
    setCreateBatchForm((prev) => {
      const programStillValid = programs.some(
        (p) => String(p.id) === String(prev.programId) && p.programType === newType
      );
      return {
        ...prev,
        programType: newType,
        programId: programStillValid ? prev.programId : '',
        endDate: programStillValid ? prev.endDate : '',
      };
    });
  };

  const handleSelectProgram = (prog) => {
    setCreateBatchForm((prev) => ({
      ...prev,
      programId: String(prog.id),
      endDate: getProgramEndDate(prev.startDate, prog) || prev.endDate,
    }));
    setProgramDropdownOpen(false);
  };

  const handleSaveBatchForm = async () => {
    if (!createBatchForm.batchName.trim()) {
      setCreateError('Batch name is required.');
      return;
    }
    if (!createBatchForm.allColleges && (!createBatchForm.collegeIds || createBatchForm.collegeIds.length === 0)) {
      setCreateError('College is required.');
      return;
    }
    if (!createBatchForm.startDate) {
      setCreateError('Start date is required.');
      return;
    }
    if (!createBatchForm.endDate) {
      setCreateError('End date is required.');
      return;
    }
    if (createBatchForm.startDate > createBatchForm.endDate) {
      setCreateError('End date must be on or after start date.');
      return;
    }
    if (!createBatchForm.programId) {
      setCreateError('Program is required. Please select a program.');
      return;
    }
    if (createBatchForm.batchSize && (!/^d+$/.test(createBatchForm.batchSize) || Number(createBatchForm.batchSize) <= 0)) {
      setCreateError('Batch size must be a positive whole number.');
      return;
    }

    setCreateError('');
    setIsSavingBatch(true);

    try {
      const payload = {
        name: createBatchForm.batchName.trim(),
        collegeId: createBatchForm.collegeIds[0],
        collegeIds: createBatchForm.collegeIds,
        allColleges: createBatchForm.allColleges,
        startDate: createBatchForm.startDate,
        expiryDate: createBatchForm.endDate,
        programId: createBatchForm.programId,
        programType: createBatchForm.programType,
        programSelection: createBatchForm.programType,
        schedule: createBatchForm.schedule || 'Mon–Fri',
        batchSize: createBatchForm.batchSize ? Number(createBatchForm.batchSize) : null,
        status: createBatchForm.status || 'Draft',
        confirmTrackReplacement: true,
      };

      if (editingBatchId) {
        try {
          await adminAPI.updateBatch(editingBatchId, payload);
        } catch (err) {
          if (err.code === 'PROGRAM_REPLACEMENT_CONFIRMATION_REQUIRED') {
            const confirmed = window.confirm(
              `This batch has ${err.data?.studentCount || 'some'} students. Changing the batch program will also update the program for all students in this batch. Do you want to proceed?`
            );
            if (confirmed) {
              await adminAPI.updateBatch(editingBatchId, {
                ...payload,
                confirmProgramReplacement: true,
              });
            } else {
              return;
            }
          } else {
            throw err;
          }
        }
      } else {
        await adminAPI.createBatch(payload);
      }

      await loadBatchPageData();
      setIsCreateFormOpen(false);
      setEditingBatchId(null);
    } catch (err) {
      console.error('Error saving batch:', err);
      setCreateError(err.message || 'Failed to save batch.');
    } finally {
      setIsSavingBatch(false);
    }
  };

  const selectedProgramInForm = programs.find((p) => String(p.id) === String(createBatchForm.programId));
  const availableProgramsForForm = programs.filter((p) => p.programType === createBatchForm.programType);
  const filteredCollegesInDropdown = colleges.filter((c) =>
    c.name.toLowerCase().includes(collegeSearchInput.toLowerCase())
  );
  const filteredProgramsInDropdown = availableProgramsForForm.filter((p) =>
    p.name.toLowerCase().includes(programSearchInput.toLowerCase())
  );

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Background Gradient */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      {/* Single Delete Confirmation Modal */}
      {pendingDeleteBatch && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPendingDeleteBatch(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">Delete Batch?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingDeleteBatch.name}</span>? Existing student history and submissions will be affected.
            </p>
            {createError && <p className="mt-2 text-xs text-red-500">{createError}</p>}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setPendingDeleteBatch(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSingleBatch(pendingDeleteBatch.id)}
                disabled={isDeletingBatch}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isDeletingBatch ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBulkDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Bulk Delete Batches?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the {selectedBatchIds.length} selected batches? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Batch Modal */}
      {isCreateFormOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsCreateFormOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white border border-black/10 dark:bg-[#0a1737] dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-visible">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                {editingBatchId ? 'Edit Batch' : 'Create New Batch'}
              </h2>
              <button
                onClick={() => setIsCreateFormOpen(false)}
                className="text-sm text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4 minimal-scrollbar overflow-x-visible">
              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}

              {/* Row 1: Batch Name & College */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    Batch Name*
                  </label>
                  <input
                    value={createBatchForm.batchName}
                    onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, batchName: e.target.value }))}
                    placeholder="e.g. Java Backend — Batch 1"
                    className={batchFormInputClass}
                  />
                </div>

                <div className="relative" ref={collegeDropdownRef}>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    College*
                  </label>
                  <button
                    type="button"
                    onClick={() => setCollegeDropdownOpen(!collegeDropdownOpen)}
                    className="mt-1 w-full text-left px-3 py-2 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none flex items-center justify-between"
                  >
                    <span className="truncate">
                      {createBatchForm.allColleges ? 'All Colleges' : createBatchForm.collegeIds.length > 0
                        ? colleges.filter(college => createBatchForm.collegeIds.includes(String(college.id))).map(college => college.name).join(', ')
                        : 'Select Colleges'}
                    </span>
                    <FiChevronDown className="w-4 h-4 ml-2 text-black/45 dark:text-white/60 shrink-0" />
                  </button>

                  {collegeDropdownOpen && (
                    <div style={{ backgroundColor: isDarkMode ? '#0f1f43' : '#ffffff' }} className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 space-y-1">
                      <label className="flex gap-2 px-2 py-2 text-sm"><input type="checkbox" checked={createBatchForm.allColleges} onChange={event => setCreateBatchForm(previous => ({ ...previous, allColleges: event.target.checked, collegeIds: event.target.checked ? [] : previous.collegeIds }))} />All Colleges</label>
                      <input
                        type="text"
                        value={collegeSearchInput}
                        onChange={(e) => setCollegeSearchInput(e.target.value)}
                        placeholder="Search colleges..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white outline-none mb-1"
                      />
                      {filteredCollegesInDropdown.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-slate-400">No colleges found.</p>
                      ) : (
                        filteredCollegesInDropdown.map((col) => {
                          const colId = String(col.id);
                          const isSelected = createBatchForm.collegeIds.includes(colId);
                          return (
                            <button
                              key={colId}
                              type="button"
                              onClick={() => {
                                setCreateBatchForm((prev) => ({
                                  ...prev,
                                  allColleges: false,
                                  collegeIds: prev.collegeIds.includes(colId) ? prev.collegeIds.filter(id => id !== colId) : [...prev.collegeIds, colId],
                                  college: col.name,
                                }));
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${isSelected ? 'bg-[#3C83F6] text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                              {col.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Program Type & Program */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    Program Type*
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={createBatchForm.programType}
                      onChange={(e) => handleProgramTypeChange(e.target.value)}
                      className="appearance-none w-full px-3 py-2 pr-10 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                    >
                      <option className={dropdownOptionClass} value="Skill">Skill</option>
                      <option className={dropdownOptionClass} value="Placement">Placement</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                <div className="relative" ref={programDropdownRef}>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    Program*
                  </label>
                  <button
                    type="button"
                    onClick={() => setProgramDropdownOpen(!programDropdownOpen)}
                    className="mt-1 w-full text-left px-3 py-2 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none flex items-center justify-between"
                  >
                    <span className="truncate">
                      {selectedProgramInForm ? selectedProgramInForm.name : `Select a ${createBatchForm.programType} Program`}
                    </span>
                    <FiChevronDown className="w-4 h-4 ml-2 text-black/45 dark:text-white/60 shrink-0" />
                  </button>

                  {programDropdownOpen && (
                    <div style={{ backgroundColor: isDarkMode ? "#0f1f43" : "#ffffff" }} className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 space-y-1">
                      <input
                        type="text"
                        value={programSearchInput}
                        onChange={(e) => setProgramSearchInput(e.target.value)}
                        placeholder="Search programs..."
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white outline-none mb-1"
                      />
                      {filteredProgramsInDropdown.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-slate-400">No active {createBatchForm.programType} programs found.</p>
                      ) : (
                        filteredProgramsInDropdown.map((prog) => {
                          const isSelected = String(createBatchForm.programId) === String(prog.id);
                          return (
                            <button
                              key={prog.id}
                              type="button"
                              onClick={() => handleSelectProgram(prog)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${isSelected ? 'bg-[#3C83F6] text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                              <span className="truncate">{prog.name}</span>
                              <span className="text-[10px] opacity-75 shrink-0 ml-2">{prog.duration}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    Start Date*
                  </label>
                  <div className="mt-1">
                    <ModernDatePicker
                      value={createBatchForm.startDate}
                      onChange={(nextDate) =>
                        setCreateBatchForm((prev) => ({
                          ...prev,
                          startDate: nextDate,
                          endDate: selectedProgramInForm
                            ? (getProgramEndDate(nextDate, selectedProgramInForm) || prev.endDate)
                            : (prev.endDate && nextDate && prev.endDate < nextDate ? '' : prev.endDate),
                        }))
                      }
                      placeholder="Select start date"
                      ariaLabel="Start date"
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    End Date*
                  </label>
                  <div className="mt-1">
                    {selectedProgramInForm ? (
                      <div className="w-full px-3 py-2 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.04] text-slate-700 dark:text-slate-200">
                        {createBatchForm.endDate || 'Calculated from Program'}
                      </div>
                    ) : (
                      <ModernDatePicker
                        value={createBatchForm.endDate}
                        onChange={(nextDate) => setCreateBatchForm((prev) => ({ ...prev, endDate: nextDate }))}
                        minDate={createBatchForm.startDate ? new Date(`${createBatchForm.startDate}T00:00:00`) : undefined}
                        placeholder="Select end date"
                        ariaLabel="End date"
                      />
                    )}
                  </div>
                  {selectedProgramInForm && (
                    <p className="mt-1 text-[11px] text-black/40 dark:text-white/45">Automatically computed from program duration.</p>
                  )}
                </div>
              </div>

              {/* Row 4: Schedule, Batch Size, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    Schedule*
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={createBatchForm.schedule}
                      onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, schedule: e.target.value }))}
                      className="appearance-none w-full px-3 py-2 pr-10 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                    >
                      {SCHEDULE_OPTIONS.map((opt) => (
                        <option className={dropdownOptionClass} key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>

                <div>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={createBatchForm.batchSize}
                    onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, batchSize: e.target.value.replace(/[^d]/g, '') }))}
                    className={batchFormInputClass}
                    placeholder="e.g. 50"
                  />
                </div>

                <div>
                  <label className="admin-micro-label text-black/55 dark:text-white/55 font-semibold text-xs">
                    Status
                  </label>
                  <div className="relative mt-1">
                    <select
                      value={createBatchForm.status}
                      onChange={(e) => setCreateBatchForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="appearance-none w-full px-3 py-2 pr-10 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                    >
                      <option className={dropdownOptionClass} value="Draft">Draft</option>
                      <option className={dropdownOptionClass} value="Active">Active</option>
                      <option className={dropdownOptionClass} value="Completed">Completed</option>
                      <option className={dropdownOptionClass} value="Archived">Archived</option>
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2 shrink-0 bg-slate-50/50 dark:bg-black/10 rounded-b-2xl">
              <button
                onClick={() => setIsCreateFormOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBatchForm}
                disabled={isSavingBatch}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#3C83F6] text-white hover:bg-[#2f73e0] disabled:opacity-70 transition-colors shadow-sm"
              >
                {isSavingBatch ? 'Saving...' : editingBatchId ? 'Save Changes' : 'Create Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-20 sm:pt-24 md:pt-28 pb-12 px-3 sm:px-6 md:px-10 lg:px-12 xl:px-14 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Section 1: Page Header & Top-Right Create Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#00113b] dark:text-white">
                Batch Management
              </h1>
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage learning batches, schedules, and program integrations.
              </p>
            </div>
            <button
              onClick={openCreateBatch}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-white px-4 sm:px-5 text-xs sm:text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto shrink-0"
            >
              <FiPlus className="w-4 h-4" />
              Create New Batch
            </button>
          </div>

          {/* Section 1B & 3: Summary Stats Cards (All four stats fit in one row on mobile with reduced padding and compact typography) */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
            {/* Card 1: Total Batches */}
            <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-1.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3.5 text-center sm:text-left">
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 text-[#3C83F6] flex items-center justify-center shrink-0">
                <FiLayers className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                  Total
                </span>
                <span className="text-xs sm:text-xl font-bold text-slate-800 dark:text-white leading-none">
                  {totalBatches}
                </span>
              </div>
            </div>

            {/* Card 2: Active Batches */}
            <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-1.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3.5 text-center sm:text-left">
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FiCheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                  Active
                </span>
                <span className="text-xs sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                  {activeBatches}
                </span>
              </div>
            </div>

            {/* Card 3: Completed Batches */}
            <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-1.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3.5 text-center sm:text-left">
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FiClock className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                  Completed
                </span>
                <span className="text-xs sm:text-xl font-bold text-amber-600 dark:text-amber-400 leading-none">
                  {completedBatches}
                </span>
              </div>
            </div>

            {/* Card 4: Archived Batches */}
            <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-1.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3.5 text-center sm:text-left">
              <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                <FiArchive className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">
                  Archived
                </span>
                <span className="text-xs sm:text-xl font-bold text-slate-700 dark:text-slate-300 leading-none">
                  {archivedBatches}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Filters Toolbar (Batch Type, Search, Status, Advanced Filter Popover) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {/* A. Batch Type Pills: All, Skill, Placement */}
              <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-0.5 text-xs shrink-0">
                {BATCH_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBatchTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-md transition font-semibold whitespace-nowrap ${
                      batchTypeFilter === type
                        ? 'bg-[#3C83F6] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* C. Status Pills: All, Draft, Active, Completed, Archived */}
              <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-0.5 text-xs shrink-0">
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-md transition font-semibold whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#3C83F6] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              {/* B. Search Batches by Batch Name */}
              <div className="relative flex-1 md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search batches..."
                  className="w-full h-9 pl-8 pr-7 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* D. Advanced Filter Popover Button */}
              <div className="relative shrink-0" ref={filterPopoverRef}>
                <button
                  type="button"
                  onClick={() => {
                    setDraftMonthFilter(appliedMonthFilter);
                    setDraftCollegeFilter(appliedCollegeFilter);
                    setIsFilterPopoverOpen(!isFilterPopoverOpen);
                  }}
                  className={`h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                    activeAdvancedFilterCount > 0
                      ? 'border-[#3C83F6] bg-[#3C83F6]/10 text-[#3C83F6] dark:text-[#bceaff]'
                      : 'border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <FiFilter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                  {activeAdvancedFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#3C83F6] text-white text-[10px] flex items-center justify-center font-bold">
                      {activeAdvancedFilterCount}
                    </span>
                  )}
                </button>

                {/* Advanced Filter Popover Panel */}
                {isFilterPopoverOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0a1737] border border-black/10 dark:border-white/15 rounded-2xl shadow-2xl p-4 z-50 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Advanced Filters</span>
                      <button
                        type="button"
                        onClick={() => setIsFilterPopoverOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Filter by Month */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Filter by Month
                      </label>
                      <div className="relative">
                        <select
                          value={draftMonthFilter}
                          onChange={(e) => setDraftMonthFilter(e.target.value)}
                          className="appearance-none w-full px-3 py-1.5 pr-8 text-xs font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                        >
                          <option className={dropdownOptionClass} value="All Months">All Months</option>
                          {availableMonths.map((m) => (
                            <option className={dropdownOptionClass} key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                      </div>
                    </div>

                    {/* Filter by College */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Filter by College
                      </label>
                      <div className="relative">
                        <select
                          value={draftCollegeFilter}
                          onChange={(e) => setDraftCollegeFilter(e.target.value)}
                          className="appearance-none w-full px-3 py-1.5 pr-8 text-xs font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] text-slate-800 dark:text-white outline-none"
                        >
                          <option className={dropdownOptionClass} value="All Colleges">All Colleges</option>
                          {collegeOptions.map((c) => (
                            <option className={dropdownOptionClass} key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/45 dark:text-white/60" />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftMonthFilter('All Months');
                          setDraftCollegeFilter('All Colleges');
                          setAppliedMonthFilter('All Months');
                          setAppliedCollegeFilter('All Colleges');
                          setIsFilterPopoverOpen(false);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium"
                      >
                        Remove All Filters
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedMonthFilter(draftMonthFilter);
                          setAppliedCollegeFilter(draftCollegeFilter);
                          setIsFilterPopoverOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#3C83F6] hover:bg-[#2f73e0] text-white text-xs font-semibold transition shadow-xs"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Batches Table */}
          {isLoadingBatches ? (
            <div className="py-20 flex justify-center">
              <LoadingScreen message="Loading batches..." />
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl p-8 sm:p-16 text-center shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
              <div className="w-14 h-14 rounded-2xl bg-[#3C83F6]/10 dark:bg-[#bceaff]/20 text-[#3C83F6] dark:text-[#bceaff] flex items-center justify-center mx-auto mb-4">
                <FiLayers className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                No Batches Found
              </h3>
              <p className="text-sm text-black/45 dark:text-white/45 mb-6">
                {searchTerm || batchTypeFilter !== 'All' || statusFilter !== 'Active' || activeAdvancedFilterCount > 0
                  ? 'Try adjusting your filters or search query.'
                  : 'Get started by creating your first batch.'}
              </p>
              {searchTerm || batchTypeFilter !== 'All' || statusFilter !== 'Active' || activeAdvancedFilterCount > 0 ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setBatchTypeFilter('All');
                    setStatusFilter('Active');
                    setAppliedMonthFilter('All Months');
                    setAppliedCollegeFilter('All Colleges');
                  }}
                  className="h-9 px-5 rounded-xl border border-[#3C83F6]/30 bg-[#3C83F6]/10 text-[#3C83F6] dark:text-[#bceaff] text-xs font-semibold hover:bg-[#3C83F6]/20 transition-colors"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  onClick={openCreateBatch}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-white px-5 text-xs font-bold transition-colors shadow-sm"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Create Batch
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto w-full bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs minimal-scrollbar">
              <table className="w-full min-w-[980px] border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0b1736] shadow-xs">
                  <tr className="border-b border-black/5 dark:border-white/10 select-none">
                    <th className="px-3.5 py-3 text-center w-12 shrink-0">
                      <input
                        type="checkbox"
                        aria-label="Select all batches"
                        checked={filteredBatches.length > 0 && filteredBatches.every((b) => selectedBatchIds.includes(b.id))}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedBatchIds((current) => [...new Set([...current, ...filteredBatches.map((b) => b.id)])]);
                          } else {
                            setSelectedBatchIds((current) => current.filter((id) => !filteredBatches.some((b) => b.id === id)));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6]"
                      />
                    </th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-14 whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[200px] whitespace-nowrap">Batch Name</th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 whitespace-nowrap">Program Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[180px] whitespace-nowrap">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[160px] whitespace-nowrap">College</th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-24 whitespace-nowrap">Students</th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Schedule</th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-32 whitespace-nowrap">Status</th>
                    <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
                  {filteredBatches.map((batch, index) => {
                    const rowNumber = String(index + 1).padStart(3, '0');
                    const programTypeName = batch.programType || (batch.program?.programType) || '—';
                    const programDisplayName = batch.program?.name || (batch.programId ? 'Program Linked' : 'Not Assigned');

                    return (
                      <tr
                        key={batch.id}
                        onClick={() => navigate(`/batches/${batch.id}`, { state: { batch } })}
                        className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        {/* Checkbox */}
                        <td className="px-3.5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${batch.name}`}
                            checked={selectedBatchIds.includes(batch.id)}
                            onChange={() => handleSelectToggle(batch.id)}
                            className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6]"
                          />
                        </td>

                        {/* # */}
                        <td className="px-3.5 py-3.5 text-center text-slate-400 dark:text-slate-500 tabular-nums">
                          {rowNumber}
                        </td>

                        {/* Batch Name */}
                        <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                          <div className="max-w-[240px] truncate" title={batch.name}>
                            {batch.name}
                          </div>
                        </td>

                        {/* Program Type */}
                        <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                          {programTypeName === 'Skill' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                              Skill
                            </span>
                          ) : programTypeName === 'Placement' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                              Placement
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Program */}
                        <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                          <div className="max-w-[200px] truncate" title={programDisplayName}>
                            {programDisplayName}
                          </div>
                        </td>

                        {/* College */}
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          <div className="max-w-[180px] truncate" title={batch.college || 'Unassigned College'}>
                            {batch.college || 'Unassigned College'}
                          </div>
                        </td>

                        {/* Students */}
                        <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {batch.students || 0}
                          </span>
                        </td>

                        {/* Schedule */}
                        <td className="px-3.5 py-3.5 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {batch.schedule || 'Mon–Fri'}
                        </td>

                        {/* Status (Interactive dropdown that updates immediately) */}
                        <td className="px-3.5 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-block relative">
                            <select
                              value={batch.status || 'Draft'}
                              disabled={updatingStatusBatchId === batch.id}
                              onChange={(e) => handleInlineStatusChange(batch.id, e.target.value)}
                              className={`appearance-none pr-6 px-2.5 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer transition disabled:opacity-50 ${
                                batch.status === 'Active'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : batch.status === 'Draft'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                  : batch.status === 'Completed' || batch.status === 'Expired'
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <option value="Draft">Draft</option>
                              <option value="Active">Active</option>
                              <option value="Completed">Completed</option>
                              <option value="Archived">Archived</option>
                            </select>
                            <FiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
                          </div>
                        </td>

                        {/* Actions (Eye Icon opens selected batch's details) */}
                        <td className="px-3.5 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`View ${batch.name}`}
                              onClick={() => navigate(`/batches/${batch.id}`, { state: { batch } })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"
                              title="View Batch Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Edit ${batch.name}`}
                              onClick={() => openEditBatch(batch)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition"
                              title="Edit Batch"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${batch.name}`}
                              onClick={() => setPendingDeleteBatch(batch)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              title="Delete Batch"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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
        </div>
      </main>
    </div>
  );
};

export default Batches;
