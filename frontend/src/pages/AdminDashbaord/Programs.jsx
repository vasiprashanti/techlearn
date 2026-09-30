import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import { adminAPI } from '../../services/adminApi';
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiFolder,
  FiUsers,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiGrid,
  FiCheckSquare,
  FiMoreHorizontal,
} from 'react-icons/fi';

const PROGRAM_TYPES = ['Placement', 'Skill'];

const PHASE_TYPES = ['learning', 'revision', 'company_preparation', 'mock_interview', 'final_assessment'];
const PHASE_TYPES_BY_PROGRAM_TYPE = { Placement: PHASE_TYPES, Skill: PHASE_TYPES };

const PHASE_LABELS = {
  learning: 'Learning',
  revision: 'Revision',
  company_preparation: 'Company Preparation',
  mock_interview: 'Mock Interview',
  final_assessment: 'Final Assessment',
};

const PLACEMENT_CATEGORIES = ['On-Campus', 'Off-Campus', 'Both'];
const LEARNING_GOALS = ['Get Placed', 'Learn New Skills', 'Exploring TechLearn'];

const getDefaultPricingPlans = (programType) => programType === 'Skill'
  ? [
      { key: 'skill-basic', title: 'Skill Program', price: '399', benefitsText: 'Recorded videos, 1 live doubt session' },
      { key: 'skill-pro', title: 'Skill Program Pro', price: '699', benefitsText: 'Recorded videos, 1 live doubt session' },
    ]
  : [
      { key: 'placement-basic', title: 'Placement Program', price: '799', benefitsText: 'Recorded videos, Live sessions' },
      { key: 'placement-pro', title: 'Placement Program Pro', price: '1199', benefitsText: 'Recorded videos, Live sessions' },
    ];

const SKILL_TAG_OPTIONS = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'HTML/CSS',
  'SQL',
  'DSA',
  'Aptitude',
  'System Design',
  'Cloud',
];

const parseDurationDays = (value) => {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)\s*-?\s*(day|days|week|weeks|month|months|year|years)/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = unit.startsWith('year')
    ? 365
    : unit.startsWith('month')
      ? 30
      : unit.startsWith('week')
        ? 7
        : 1;
  return Math.round(amount * multiplier);
};

const getMinimumDurationDays = () => 5;

const getDefaultPhases = (programType, value) => {
  const durationDays = Number(value);
  if (!Number.isInteger(durationDays) || durationDays < getMinimumDurationDays(programType)) return [];

  const baseLengths = programType === 'Placement' ? [Math.max(1, durationDays - 8), 2, 4, 1, 1] : [Math.max(1, durationDays - 4), 1, 1, 1, 1];
  const lengths = [...baseLengths];
  const total = lengths.reduce((sum, item) => sum + item, 0);
  lengths[0] += durationDays - total;
  let nextStartDay = 1;

  return PHASE_TYPES_BY_PROGRAM_TYPE[programType].map((phase, index) => {
    const startDay = nextStartDay;
    const endDay = startDay + lengths[index] - 1;
    nextStartDay = endDay + 1;
    return { phase, startDay: String(startDay), endDay: String(endDay) };
  });
};

const normalizePhases = (phases, programType, durationDays) => {
  const defaults = getDefaultPhases(programType, durationDays);
  if (!Array.isArray(phases) || phases.length !== defaults.length) return defaults;

  return defaults.map((fallback, index) => ({
    phase: fallback.phase,
    startDay: String(phases[index]?.startDay ?? fallback.startDay),
    endDay: String(phases[index]?.endDay ?? fallback.endDay),
  }));
};

const getProgramType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'placement' || normalized.includes('placement') ? 'Placement' : 'Skill';
};

const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
const parseCommaString = (str) => (str || '').split(',').map((item) => item.trim()).filter(Boolean);

const statusBadgeClass = (status) => {
  if (status === 'Published') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (status === 'Draft') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (status === 'Archived') return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
};

export default function Programs() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('programType') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedMonth] = useState(searchParams.get('month') || '');
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('desc');

  // Bulk Selection State
  const [selectedProgramIds, setSelectedProgramIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [skillTagsOpen, setSkillTagsOpen] = useState(false);
  const [targetCompanyDraft, setTargetCompanyDraft] = useState('');
  const [targetRoleDraft, setTargetRoleDraft] = useState('');
  const [programOptions, setProgramOptions] = useState({ skills: [], companies: [], roles: [] });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    programType: 'Placement',
    durationDays: '30',
    durationUnit: 'Days',
    phases: getDefaultPhases('Placement', 30),
    status: 'Draft',
    visibility: 'Public',
    pricingType: 'Free',
    availability: 'Structured',
    billingOptions: [],
    monthlyStructuredFee: '0',
    monthlyTrainerLedFee: '0',
    annualStructuredFee: '0',
    annualTrainerLedFee: '0',
    programFee: '0',
    pricingPlans: getDefaultPricingPlans('Placement'),
    learningGoalsText: '',
    placementCategory: 'Both',
    targetCompanies: [],
    skillTags: [],
    targetRolesText: '',
  });

  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminAPI.getProgramOptions().then((response) => {
      if (response?.success) setProgramOptions({ skills: response.skills || [], companies: response.companies || [], roles: response.roles || [] });
    }).catch(() => {});
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: searchTerm,
        programType: selectedType,
        status: selectedStatus,
        month: selectedMonth,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      };
      const res = await adminAPI.getPrograms(params);
      if (res && res.success) {
        setPrograms(res.programs || []);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err.message || 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedStatus, selectedMonth, sortBy, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleSelectToggle = (id) => {
    setSelectedProgramIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedProgramIds([]);
    setSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedProgramIds.map((id) => adminAPI.deleteProgram(id)));
      await fetchPrograms();
      setSelectedProgramIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Failed to bulk delete programs:', err);
      alert(err.message || 'Failed to bulk delete selected programs.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'programType') {
      setFormData((prev) => ({
        ...prev,
        programType: value,
        phases: getDefaultPhases(value, prev.durationDays),
        placementCategory: value === 'Placement' ? prev.placementCategory : 'Both',
        pricingPlans: getDefaultPricingPlans(value),
        learningGoalsText: prev.learningGoalsText === 'Get Placed' && value === 'Skill'
          ? 'Learn New Skills'
          : prev.learningGoalsText === 'Learn New Skills' && value === 'Placement'
            ? 'Get Placed'
            : prev.learningGoalsText,
      }));
      return;
    }
    if (name === 'durationDays' || name === 'durationUnit') {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        const duration = name === 'durationUnit' && value === 'Weeks' ? Number(prev.durationDays) * 7 : Number(next.durationDays);
        next.phases = getDefaultPhases(prev.programType, duration);
        return next;
      });
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhaseChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      phases: prev.phases.map((phase, phaseIndex) => (
        phaseIndex === index ? { ...phase, [field]: value } : phase
      )),
    }));
  };

  const handlePricingPlanChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      pricingPlans: prev.pricingPlans.map((plan, planIndex) => (
        planIndex === index ? { ...plan, [field]: value } : plan
      )),
    }));
  };

  const handleToggleSkillTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      skillTags: prev.skillTags.includes(tag)
        ? prev.skillTags.filter((item) => item !== tag)
        : [...prev.skillTags, tag],
    }));
  };

  const handleAddTargetCompany = () => {
    const company = targetCompanyDraft.trim().replace(/,$/, '');
    if (!company) return;
    setFormData((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies.includes(company)
        ? prev.targetCompanies
        : [...prev.targetCompanies, company],
    }));
    setTargetCompanyDraft('');
  };

  const handleTargetCompanyKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAddTargetCompany();
    }
  };

  const handleRemoveTargetCompany = (company) => {
    setFormData((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies.filter((item) => item !== company),
    }));
  };

  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setFormData({
      name: '',
      description: '',
      programType: 'Placement',
      durationDays: '30',
      durationUnit: 'Days',
      phases: getDefaultPhases('Placement', 30),
      status: 'Draft',
      visibility: 'Public',
      pricingType: 'Free',
      availability: 'Structured',
      billingOptions: [],
      monthlyStructuredFee: '0',
      monthlyTrainerLedFee: '0',
      annualStructuredFee: '0',
      annualTrainerLedFee: '0',
      programFee: '0',
      pricingPlans: getDefaultPricingPlans('Placement'),
      learningGoalsText: 'Get Placed',
      placementCategory: 'Both',
      targetCompanies: [],
      skillTags: [],
      targetRolesText: '',
    });
    setTargetCompanyDraft('');
    setSkillTagsOpen(false);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (program, e) => {
    if (e) e.stopPropagation();
    setEditingProgram(program);
    setFormData({
      name: program.name || '',
      description: program.description || '',
      programType: getProgramType(program.programType),
      durationDays: String(program.durationDays || parseDurationDays(program.duration) || 30),
      durationUnit: String(program.duration || '').toLowerCase().includes('week') ? 'Weeks' : 'Days',
      phases: normalizePhases(program.phases, getProgramType(program.programType), program.durationDays || parseDurationDays(program.duration) || 30),
      status: program.status || 'Draft',
      visibility: program.visibility || 'Public',
      pricingType: program.pricingType || 'Free',
      availability: program.availability || 'Structured',
      billingOptions: Array.isArray(program.billingOptions) ? program.billingOptions : [],
      monthlyStructuredFee: String(program.monthlyStructuredFee || 0),
      monthlyTrainerLedFee: String(program.monthlyTrainerLedFee || 0),
      annualStructuredFee: String(program.annualStructuredFee || 0),
      annualTrainerLedFee: String(program.annualTrainerLedFee || 0),
      programFee: String(program.programFee || 0),
      pricingPlans: Array.isArray(program.pricingPlans) && program.pricingPlans.length
        ? program.pricingPlans.map((plan) => ({
            key: plan.key || '',
            title: plan.title || '',
            price: String(plan.price ?? ''),
            benefitsText: Array.isArray(plan.benefits) ? plan.benefits.join(', ') : '',
          }))
        : getDefaultPricingPlans(getProgramType(program.programType)),
      learningGoalsText: Array.isArray(program.learningGoals) && program.learningGoals[0]
        ? program.learningGoals[0]
        : getProgramType(program.programType) === 'Skill' ? 'Learn New Skills' : 'Get Placed',
      placementCategory: Array.isArray(program.placementCategories) && ['On-Campus', 'Off-Campus', 'Both'].includes(program.placementCategories[0])
        ? program.placementCategories[0]
        : 'Both',
      targetCompanies: Array.isArray(program.targetCompanies) ? program.targetCompanies : [],
      skillTags: Array.isArray(program.skillTags) ? program.skillTags : [],
      targetRolesText: Array.isArray(program.targetRoles) ? program.targetRoles.join(', ') : '',
    });
    setTargetCompanyDraft('');
    setSkillTagsOpen(false);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    setModalError('');

    const finalType = formData.programType.trim();
    const durationDays = Number(formData.durationDays) * (formData.durationUnit === 'Weeks' ? 7 : 1);

    if (!formData.name.trim()) { setModalError('Program name is required'); return; }
    if (!finalType) { setModalError('Program type is required'); return; }
    if (!Number.isInteger(durationDays) || durationDays < getMinimumDurationDays(finalType)) {
      setModalError(`${finalType} programs must be at least ${getMinimumDurationDays(finalType)} days long.`);
      return;
    }
    if (!formData.phases.length || formData.phases.length !== PHASE_TYPES_BY_PROGRAM_TYPE[finalType].length) {
      setModalError('Configure every phase before saving the program.');
      return;
    }
    let expectedStartDay = 1;
    const phases = formData.phases.map((phase) => ({
      phase: phase.phase,
      startDay: Number(phase.startDay),
      endDay: Number(phase.endDay),
    }));
    for (const phase of phases) {
      if (!Number.isInteger(phase.startDay) || !Number.isInteger(phase.endDay) || phase.startDay !== expectedStartDay || phase.endDay < phase.startDay) {
        setModalError('Phases must be ordered and have no gaps or overlaps.');
        return;
      }
      expectedStartDay = phase.endDay + 1;
    }
    if (expectedStartDay - 1 !== durationDays) {
      setModalError(`Phases must cover exactly days 1 through ${durationDays}.`);
      return;
    }
    if (formData.pricingType === 'Paid') {
      if (!formData.billingOptions.length) { setModalError('Select at least one billing option for Paid programs.'); return; }
      const availabilityFields = {
        Structured: ['monthlyStructuredFee', 'annualStructuredFee'],
        'Trainer-Led': ['monthlyTrainerLedFee', 'annualTrainerLedFee'],
        Both: ['monthlyStructuredFee', 'monthlyTrainerLedFee', 'annualStructuredFee', 'annualTrainerLedFee'],
      }[formData.availability] || [];
      const requiredFields = availabilityFields.filter((field) => field.startsWith('monthly') ? formData.billingOptions.includes('Monthly') : formData.billingOptions.includes('Annual'));
      if (requiredFields.some((field) => !Number.isFinite(Number(formData[field])) || Number(formData[field]) < 0)) {
        setModalError('Enter a valid fee for every selected billing and delivery option.');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        programType: finalType,
        duration: `${formData.durationDays} ${formData.durationUnit}`,
        durationDays,
        phases,
        visibility: formData.visibility,
        pricingType: formData.pricingType,
        availability: formData.availability,
        billingOptions: formData.pricingType === 'Paid' ? formData.billingOptions : [],
        monthlyStructuredFee: Number(formData.monthlyStructuredFee) || 0,
        monthlyTrainerLedFee: Number(formData.monthlyTrainerLedFee) || 0,
        annualStructuredFee: Number(formData.annualStructuredFee) || 0,
        annualTrainerLedFee: Number(formData.annualTrainerLedFee) || 0,
        programFee: formData.pricingType === 'Paid' ? Number(formData.monthlyStructuredFee || formData.monthlyTrainerLedFee || formData.annualStructuredFee || formData.annualTrainerLedFee) : 0,
        pricingPlans: [],
        learningGoals: [],
        placementCategories: [],
        targetCompanies: formData.targetCompanies,
        skillTags: formData.skillTags,
        targetRoles: parseCommaString(formData.targetRolesText),
      };

      if (editingProgram) {
        await adminAPI.updateProgram(editingProgram._id, payload);
      } else {
        await adminAPI.createProgram(payload);
      }

      setIsModalOpen(false);
      fetchPrograms();
    } catch (err) {
      console.error('Error saving program:', err);
      setModalError(err.message || 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!programToDelete) return;
    try {
      setDeleting(true);
      await adminAPI.deleteProgram(programToDelete._id);
      setProgramToDelete(null);
      fetchPrograms();
    } catch (err) {
      console.error('Error deleting program:', err);
      alert(err.message || 'Failed to delete program');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddTargetRole = () => {
    const role = targetRoleDraft.trim().replace(/,$/, '');
    if (!role) return;
    setFormData((prev) => ({ ...prev, targetRolesText: [...new Set([...parseCommaString(prev.targetRolesText), role])].join(', ') }));
    setTargetRoleDraft('');
  };

  const handleStatusChange = async (program, status) => {
    if (!status || status === program.status) return;
    try {
      await adminAPI.updateProgram(program._id, { status });
      await fetchPrograms();
    } catch (err) {
      console.error('Error updating program status:', err);
      alert(err.message || 'Failed to update program status');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setSearchParams({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const programFormInputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35';

  const activeCount = programs.filter(p => p.status === 'Published').length;
  const draftCount = programs.filter(p => p.status === 'Draft').length;
  const totalStudents = programs.reduce((sum, p) => sum + (p.studentCount || 0), 0);

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Background Gradient — matches Question Bank exactly */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      <Sidebar />

      {/* Single Delete Confirmation Modal */}
      {programToDelete && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setProgramToDelete(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">Delete Program?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This program will be removed from active use. Student XP, accuracy, progress, submissions, assessment results, and historical records will be preserved. Continue deleting{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{programToDelete.name}</span>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setProgramToDelete(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProgram}
                disabled={deleting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : 'Delete'}
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
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Bulk Delete Programs?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              These programs will be removed from active use. Student history will be preserved. Continue?
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

      {/* Create / Edit Program Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="course-form-modal relative w-full max-w-2xl bg-white border border-black/10 dark:bg-[#0a1737] dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-visible">
            {/* Fixed Header */}
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                {editingProgram ? 'Edit Program' : 'Create Program'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-sm text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmitProgram} className="flex min-h-0 flex-1 flex-col overflow-visible">
              {/* Scrollable Body */}
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible p-5 space-y-4 minimal-scrollbar">
                {modalError && (
                  <p className="text-sm text-red-500 dark:text-red-400">{modalError}</p>
                )}

                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Program Name*</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. 30-Day Placement Sprint – August 2026"
                    value={formData.name}
                    onChange={handleFormChange}
                    className={programFormInputClass}
                  />
                </div>

                <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Description*</label>
                  <textarea
                    name="description"
                    rows={2}
                    required
                    placeholder="Provide an overview of this learning program..."
                    value={formData.description}
                    onChange={handleFormChange}
                    className={programFormInputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Availability*</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select name="availability" value={formData.availability} onChange={handleFormChange} className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none">
                        <option className={dropdownOptionClass} value="Structured">Structured</option>
                        <option className={dropdownOptionClass} value="Trainer-Led">Trainer-Led</option>
                        <option className={dropdownOptionClass} value="Both">Both</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Program Type*</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="programType"
                        value={formData.programType}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        {PROGRAM_TYPES.map((t) => (
                          <option key={t} className={dropdownOptionClass} value={t}>{t}</option>
                        ))}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Duration*</label>
                    <input
                      type="number"
                      name="durationDays"
                      min="1"
                      step="1"
                      required
                      placeholder="e.g. 30"
                      value={formData.durationDays}
                      onChange={handleFormChange}
                      className={programFormInputClass}
                    />
                  </div>
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Duration Unit*</label>
                    <select name="durationUnit" value={formData.durationUnit} onChange={handleFormChange} className={programFormInputClass}>
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#3C83F6] dark:text-[#bceaff]">Learning Phases</p>
                    <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">Phases must cover every day exactly once. Changing the duration regenerates the default ranges, which you can then adjust.</p>
                  </div>
                  <div className="space-y-2">
                    {formData.phases.map((phase, index) => (
                      <div key={phase.phase} className="grid grid-cols-[minmax(0,1fr)_90px_90px] items-end gap-2">
                        <div className="min-w-0">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Phase</span>
                          <div className="flex h-10 items-center rounded-lg border border-black/10 bg-white/70 px-3 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                            {PHASE_LABELS[phase.phase]}
                          </div>
                        </div>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Start</span>
                          <input type="number" min="1" step="1" value={phase.startDay} onChange={(event) => handlePhaseChange(index, 'startDay', event.target.value)} className={programFormInputClass} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">End</span>
                          <input type="number" min="1" step="1" value={phase.endDay} onChange={(event) => handlePhaseChange(index, 'endDay', event.target.value)} className={programFormInputClass} />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Visibility</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="Public">Public</option>
                        <option className={dropdownOptionClass} value="Private">Private</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Pricing</label>
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="pricingType"
                        value={formData.pricingType}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="Free">Free</option>
                        <option className={dropdownOptionClass} value="Paid">Paid</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>

                  {false && formData.pricingType === 'Paid' && <div />}
                </div>

                {formData.pricingType === 'Paid' && (
                  <div className="rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] p-3 space-y-3">
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Billing Options*</label>
                    <div className="flex gap-4 text-sm text-slate-700 dark:text-slate-200">
                      {['Monthly', 'Annual'].map((option) => (
                        <label key={option} className="flex items-center gap-2">
                          <input type="checkbox" checked={formData.billingOptions.includes(option)} onChange={() => setFormData((current) => ({ ...current, billingOptions: current.billingOptions.includes(option) ? current.billingOptions.filter((item) => item !== option) : [...current.billingOptions, option] }))} />
                          {option}
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        ['monthlyStructuredFee', 'Monthly Structured Fee (₹)'],
                        ['monthlyTrainerLedFee', 'Monthly Trainer-Led Fee (₹)'],
                        ['annualStructuredFee', 'Annual Structured Fee (₹)'],
                        ['annualTrainerLedFee', 'Annual Trainer-Led Fee (₹)'],
                      ].map(([name, label]) => (
                        <label key={name} className="text-xs text-slate-600 dark:text-slate-300">
                          {label}
                          <input type="number" min="0" step="0.01" name={name} value={formData[name]} onChange={handleFormChange} className={programFormInputClass} />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {false && formData.pricingType === 'Paid' && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3 dark:border-blue-400/20 dark:bg-blue-400/[0.04]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#3C83F6] dark:text-[#bceaff]">Annual Pricing Plans</p>
                    <p className="mt-1 text-[11px] text-black/45 dark:text-white/45">Configure the plans shown to learners. Prices are read from this program at checkout.</p>
                    <div className="mt-3 space-y-3">
                      {formData.pricingPlans.map((plan, index) => (
                        <div key={`${plan.key}-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_120px]">
                          <input aria-label={`Plan ${index + 1} title`} value={plan.title} onChange={(event) => handlePricingPlanChange(index, 'title', event.target.value)} placeholder="Plan name" className={programFormInputClass} required />
                          <input aria-label={`Plan ${index + 1} benefits`} value={plan.benefitsText} onChange={(event) => handlePricingPlanChange(index, 'benefitsText', event.target.value)} placeholder="Benefits, comma separated" className={programFormInputClass} />
                          <input aria-label={`Plan ${index + 1} price`} type="number" min="0" step="1" value={plan.price} onChange={(event) => handlePricingPlanChange(index, 'price', event.target.value)} placeholder="₹ price" className={programFormInputClass} required />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 border-t border-black/5 dark:border-white/5 space-y-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#3C83F6] dark:text-[#bceaff] pt-1">Student Matching Metadata</p>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Skill Tags</label>
                      <button
                        type="button"
                        onClick={() => setSkillTagsOpen((open) => !open)}
                        className={`${programFormInputClass} flex items-center justify-between text-left`}
                      >
                        <span className={formData.skillTags.length ? 'text-slate-800 dark:text-white' : 'text-black/35 dark:text-white/40'}>
                          {formData.skillTags.length ? formData.skillTags.join(', ') : 'Select skills'}
                        </span>
                        <FiChevronDown className="h-4 w-4 shrink-0 text-black/45 dark:text-white/60" />
                      </button>
                      {skillTagsOpen && (
                        <div
                          className="course-skills-dropdown absolute left-0 right-0 top-full mt-1.5 z-[150] rounded-xl border border-black/10 dark:border-white/15 p-3 shadow-xl max-h-56 overflow-y-auto"
                          style={{
                            backgroundColor: isDarkMode ? '#0f1f43' : '#ffffff',
                            opacity: 1,
                            backdropFilter: 'none',
                            WebkitBackdropFilter: 'none',
                          }}
                        >
                          {(programOptions.skills.length ? programOptions.skills : SKILL_TAG_OPTIONS).map((tag) => (
                            <label key={tag} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10">
                              <input type="checkbox" checked={formData.skillTags.includes(tag)} onChange={() => handleToggleSkillTag(tag)} className="h-3.5 w-3.5 rounded border-black/20 text-[#3C83F6] focus:ring-[#3C83F6]" />
                              {tag}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {formData.programType === 'Placement' && <>
                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Target Companies</label>
                      <div className="mt-1 flex gap-2"><input type="text" value={targetCompanyDraft} onChange={(event) => setTargetCompanyDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); handleAddTargetCompany(); } }} placeholder="Search or add a company" list="program-company-options" className={programFormInputClass} /><button type="button" onClick={handleAddTargetCompany} className="mt-1 rounded-xl bg-[#3C83F6] px-3 text-xs font-bold text-white">Add</button></div>
                      <datalist id="program-company-options">{programOptions.companies.map((company) => <option key={company} value={company} />)}</datalist>
                      <div className="mt-2 flex flex-wrap gap-1.5">{formData.targetCompanies.map((company) => <span key={company} className="rounded-full bg-[#3C83F6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#3C83F6] dark:bg-[#bceaff]/15 dark:text-[#bceaff]">{company}<button type="button" className="ml-1" onClick={() => handleRemoveTargetCompany(company)}><FiX className="inline h-3 w-3" /></button></span>)}</div>
                    </div>

                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Target Roles</label>
                      <div className="mt-1 flex gap-2"><input type="text" value={targetRoleDraft} onChange={(event) => setTargetRoleDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); handleAddTargetRole(); } }} placeholder="Search or add a role" list="program-role-options" className={programFormInputClass} /><button type="button" onClick={handleAddTargetRole} className="mt-1 rounded-xl bg-[#3C83F6] px-3 text-xs font-bold text-white">Add</button></div>
                      <datalist id="program-role-options">{programOptions.roles.map((role) => <option key={role} value={role} />)}</datalist>
                      <div className="mt-2 flex flex-wrap gap-1.5">{parseCommaString(formData.targetRolesText).map((role) => <span key={role} className="rounded-full bg-[#3C83F6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#3C83F6]">{role}<button type="button" className="ml-1" onClick={() => setFormData((prev) => ({ ...prev, targetRolesText: parseCommaString(prev.targetRolesText).filter((item) => item !== role).join(', ') }))}><FiX className="inline h-3 w-3" /></button></span>)}</div>
                    </div>
                    </>}
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3 shrink-0 bg-white/50 dark:bg-[#0a1737]/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6] hover:bg-[#2f73e0] text-white transition-colors disabled:opacity-70 shadow-sm"
                >
                  {saving ? 'Saving...' : editingProgram ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-screen transition-all duration-700 ease-in-out z-10 lg:ml-64 pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              <div className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <button onClick={fetchPrograms} className="font-semibold underline underline-offset-2">Retry</button>
              </div>
            </div>
          )}

          {/* Page Title */}
          <div>
            <h1 className="admin-page-title">Programs</h1>
          </div>

          {/* Stat Cards — match the Program Details layout */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{pagination.total || programs.length}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Total Programs</span>
                <FiFolder className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{activeCount}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Published Programs</span>
                <FiCheckSquare className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{draftCount}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Draft Programs</span>
                <FiGrid className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{totalStudents}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">Total Students</span>
                <FiUsers className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
              </div>
            </article>
          </section>

          {/* Program Listing Section */}
          <section className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-4">
              {/* Left Column: Title, Select All & Search */}
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">All Programs</h2>

                <button type="button" onClick={() => { setSelectionMode(true); setSelectedProgramIds(programs.map((program) => program._id)); }} className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10">Select All</button>
                {false && (<div className="flex items-center gap-2 px-2.5 py-1 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl h-9 shrink-0">
                  <input
                    type="checkbox"
                    checked={programs.length > 0 && programs.every(p => selectedProgramIds.includes(p._id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newSelections = new Set([...selectedProgramIds, ...programs.map(p => p._id)]);
                        setSelectedProgramIds(Array.from(newSelections));
                      } else {
                        setSelectedProgramIds(selectedProgramIds.filter(id => !programs.some(p => p._id === id)));
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white dark:bg-black/30"
                  />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">Select All</span>
                </div>)}

                {/* Search Bar cleanly placed on left */}
                <div className="relative w-44 sm:w-60">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-9 pr-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-[11px] font-bold text-slate-800 dark:text-white placeholder:font-normal placeholder:text-black/40 dark:placeholder:text-white/40 outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 w-full"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <FiX className="w-3 h-3 text-black/40 dark:text-white/40" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Dropdowns + Clear + Add Button */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter Dropdown */}
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="appearance-none h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-2.5 pr-7 text-[11px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 cursor-pointer max-w-[130px] text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    <option className={dropdownOptionClass} value="">All Types</option>
                    {PROGRAM_TYPES.map((t) => (
                      <option key={t} className={dropdownOptionClass} value={t}>{t}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-black/45 dark:text-white/60" />
                </div>

                {/* Status Filter Dropdown */}
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="appearance-none h-9 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-2.5 pr-7 text-[11px] font-bold text-slate-800 dark:text-white outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30 cursor-pointer"
                  >
                    <option className={dropdownOptionClass} value="">All Statuses</option>
                    <option className={dropdownOptionClass} value="Published">Published</option>
                    <option className={dropdownOptionClass} value="Draft">Draft</option>
                    <option className={dropdownOptionClass} value="Archived">Archived</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-black/45 dark:text-white/60" />
                </div>

                {(searchTerm || selectedType || selectedStatus || selectedMonth) && (
                  <button
                    onClick={handleClearFilters}
                    className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <FiX className="w-3 h-3" /> Clear
                  </button>
                )}

                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white px-4 text-xs font-bold transition-colors shadow-sm shrink-0"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Program
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <LoadingScreen />
              </div>
            ) : programs.length === 0 ? (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl p-16 text-center shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
                <div className="w-14 h-14 rounded-2xl bg-[#3C83F6]/10 dark:bg-[#bceaff]/20 text-[#3C83F6] dark:text-[#bceaff] flex items-center justify-center mx-auto mb-4">
                  <FiFolder className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  {searchTerm || selectedType || selectedStatus ? 'No Programs Found' : 'No Programs Yet'}
                </h3>
                <p className="text-sm text-black/45 dark:text-white/45 mb-6">
                  {searchTerm || selectedType || selectedStatus
                    ? 'Try adjusting your filters or search criteria.'
                    : 'Create a program to start building structured learning pathways.'}
                </p>
                {searchTerm || selectedType || selectedStatus ? (
                  <button
                    onClick={handleClearFilters}
                    className="h-9 px-5 rounded-xl border border-[#3C83F6]/30 bg-[#3C83F6]/10 text-[#3C83F6] dark:text-[#bceaff] text-xs font-semibold hover:bg-[#3C83F6]/20 transition-colors"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white px-5 text-xs font-bold transition-colors shadow-sm"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    Add Program
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-auto max-h-[78vh] bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs">
                  <table className={`w-full min-w-full table-fixed ${selectionMode ? '' : 'program-selection-hidden'}`}>
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 select-none"><th className="px-3 py-2.5 text-center w-[7%]"><input type="checkbox" aria-label="Select all programs" checked={programs.length > 0 && programs.every((program) => selectedProgramIds.includes(program._id))} onChange={(event) => { if (event.target.checked) setSelectedProgramIds((current) => [...new Set([...current, ...programs.map((program) => program._id)])]); else setSelectedProgramIds((current) => current.filter((id) => !programs.some((program) => program._id === id))); }} className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6]" /></th><th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[6%]">#</th><th className="px-3 py-2.5 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[29%]">Program Name</th><th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[15%]">Program Type</th><th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[17%]">Status</th><th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[14%]">Students</th><th className="px-3 py-2.5 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[12%]">Actions</th></tr>
                    </thead>
                    <tbody className="border-t border-black/5 dark:border-white/10">
                      {programs.map((program, index) => (
                        <tr key={program._id} onClick={() => navigate(`/programs/${program._id}`)} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <td className="px-3 py-3 text-center"><input type="checkbox" aria-label={`Select ${program.name}`} checked={selectedProgramIds.includes(program._id)} onChange={() => handleSelectToggle(program._id)} onClick={(event) => event.stopPropagation()} className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6]" /></td>
                          <td className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500 tabular-nums">{index + 1 + ((pagination.page || 1) - 1) * (pagination.limit || programs.length)}</td>
                          <td className="px-3 py-3 text-[12px] sm:text-sm font-semibold text-slate-800 dark:text-white truncate">{program.name}</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-500 dark:text-slate-400">{getProgramType(program.programType)}</td>
                          <td className="px-3 py-3 text-center" onClick={(event) => event.stopPropagation()}><div className="inline-block relative"><select value={program.status === 'Active' ? 'Published' : program.status} onChange={(event) => handleStatusChange(program, event.target.value)} className={`appearance-none pr-6 px-2.5 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer transition ${program.status === 'Published' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : program.status === 'Draft' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}><option value="Published">Published</option><option value="Draft">Draft</option><option value="Archived">Archived</option></select><FiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" /></div></td>
                          <td className="px-3 py-3 text-center"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">{program.studentCount || 0}</span></td>
                          <td className="px-3 py-3 text-center" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-center gap-1.5"><button aria-label={`View ${program.name}`} onClick={() => navigate(`/programs/${program._id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"><FiEye className="w-3.5 h-3.5" /></button><button aria-label={`Delete ${program.name}`} onClick={() => setProgramToDelete(program)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"><FiTrash2 className="w-3.5 h-3.5" /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between py-4">
                    <span className="text-xs font-medium text-black/50 dark:text-white/50">
                      Page {pagination.page} of {pagination.totalPages} · {pagination.total} programs
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FiChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                        className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Floating Bulk Action Bar — identical to Question Bank */}
          {selectedProgramIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3.5 rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43]/85 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-300">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                {selectedProgramIds.length} {selectedProgramIds.length === 1 ? 'program' : 'programs'} selected
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
}

/* ─── ProgramCard ─── styled after CategoryCard with Checkbox selection */
function ProgramCard({ program, selected, onSelectToggle, onEdit, onDelete, onView, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.program-actions-container')) setMenuOpen(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const statusColor = statusBadgeClass(program.status);

  return (
    <article className={`relative rounded-xl overflow-hidden border ${selected ? 'border-[#3C83F6] ring-1 ring-[#3C83F6]/50 dark:border-blue-400 dark:ring-blue-400/50' : 'border-black/10 dark:border-white/15'} bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] h-full flex flex-col justify-between hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group`}>
      {/* Checkbox — top-left */}
      <div className="absolute left-3 top-2.5 z-20">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectToggle(program._id)}
          className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white/70 dark:bg-black/30"
        />
      </div>

      {/* Three-dot menu — top-right */}
      <div className="absolute right-2 top-2 z-20 program-actions-container">
        <button
          type="button"
          className="w-6 h-6 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          aria-label="Open program actions"
        >
          <FiMoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 w-36 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => { setMenuOpen(false); onView(); }}
              className="w-full text-left px-3 py-2 text-xs text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => { setMenuOpen(false); onEdit(program); }}
              className="w-full text-left px-3 py-2 text-xs text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(program); }}
              className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Tinted Top Panel — Fixed height for 100% uniform card grid layout */}
      <div
        className="px-4 pt-2.5 pb-2 min-h-[92px] border-b border-black/10 dark:border-white/15 bg-[#dbe7f3]/90 dark:bg-[#1a2d48] pl-10 pr-9 flex flex-col justify-between cursor-pointer"
        onClick={onView}
      >
        <select
          value={program.status === 'Active' ? 'Published' : program.status}
          onChange={(event) => onStatusChange(program, event.target.value)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Change status for ${program.name}`}
          className={`self-start rounded-full border-0 px-2 py-0.5 text-[9px] font-bold uppercase outline-none cursor-pointer ${statusColor}`}
        >
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Archived">Archived</option>
        </select>
        <div className="min-h-[30px] flex items-center py-0.5">
          <h3 className="text-xs md:text-sm leading-tight font-bold text-slate-900 dark:text-white line-clamp-2">{program.name}</h3>
        </div>
        <p className="text-[10px] md:text-[11px] leading-snug text-slate-500 dark:text-slate-400 truncate pb-0.5">
          {getProgramType(program.programType)}
        </p>
      </div>

      {/* Bottom Panel */}
      <div className="px-4 py-3.5 flex-1 flex flex-col justify-between gap-3 text-left bg-white/70 dark:bg-transparent">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400">
            <span>Duration</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums truncate max-w-[100px]">{program.duration || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400">
            <span>Students</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{program.studentCount || 0}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400">
            <span>Pricing</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {program.pricingType === 'Paid' ? `₹${program.programFee}` : 'Free'}
            </span>
          </div>
        </div>

        <button
          onClick={onView}
          className="w-full h-9 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <FiEye className="w-3.5 h-3.5" /> View Program
        </button>
      </div>
    </article>
  );
}
