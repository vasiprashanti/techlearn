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
  FiEdit2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiGrid,
  FiCheckSquare,
  FiMoreHorizontal,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiLayers,
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

const TARGET_COMPANY_OPTIONS = [
  'Google',
  'Amazon',
  'Microsoft',
  'TCS',
  'Infosys',
  'Accenture',
  'Cognizant',
  'Deloitte',
  'Capgemini',
  'Wipro',
  'Adobe',
  'Flipkart',
  'Walmart',
  'Razorpay',
  'Atlassian',
  'HCL',
];

const TARGET_ROLE_OPTIONS = [
  'Software Developer',
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Data Analyst',
  'AI / ML Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Cloud Engineer',
  'QA / Test Engineer',
  'System Engineer',
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

const normalizeSearchString = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');

const validatePhaseCoverage = (phases, totalDays) => {
  if (!totalDays || totalDays <= 0) return { valid: false, message: 'Duration must be greater than 0.' };
  if (!phases || !phases.length) return { valid: false, message: 'Phases must be configured.' };
  let expectedStart = 1;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    const s = Number(p.startDay);
    const e = Number(p.endDay);
    const name = PHASE_LABELS[p.phase] || p.phase;
    if (!Number.isInteger(s) || !Number.isInteger(e) || s < 1 || e < 1) {
      return { valid: false, message: `${name}: Start and End must be positive whole numbers.` };
    }
    if (s > e) {
      return { valid: false, message: `${name}: Start Day (${s}) cannot exceed End Day (${e}).` };
    }
    if (s < expectedStart) {
      return { valid: false, message: `Overlap: ${name} starts on Day ${s}, but previous phase ends on Day ${expectedStart - 1}.` };
    }
    if (s > expectedStart) {
      return { valid: false, message: `Gap: Days ${expectedStart} to ${s - 1} are not covered before ${name}.` };
    }
    expectedStart = e + 1;
  }
  if (expectedStart - 1 !== totalDays) {
    return { valid: false, message: `Phases end at Day ${expectedStart - 1}, but total duration is ${totalDays} Days.` };
  }
  return { valid: true, message: `Phases cover all ${totalDays} days exactly once (no gaps or overlaps).` };
};

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [skillSearch, setSkillSearch] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [otherSkillDraft, setOtherSkillDraft] = useState('');

  const [companySearch, setCompanySearch] = useState('');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [otherCompanyDraft, setOtherCompanyDraft] = useState('');

  const [roleSearch, setRoleSearch] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [otherRoleDraft, setOtherRoleDraft] = useState('');
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
    targetRoles: [],
  });

  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminAPI.getProgramOptions().then((response) => {
      if (response?.success) {
        const fetchedSkills = (response.skills || response.skillTags || []).filter(Boolean);
        const fetchedCompanies = (response.companies || response.targetCompanies || []).filter(Boolean);
        const fetchedRoles = (response.roles || response.targetRoles || []).filter(Boolean);

        setProgramOptions({
          skills: fetchedSkills.length ? fetchedSkills : SKILL_TAG_OPTIONS,
          companies: fetchedCompanies.length ? fetchedCompanies : TARGET_COMPANY_OPTIONS,
          roles: fetchedRoles.length ? fetchedRoles : TARGET_ROLE_OPTIONS,
        });
      }
    }).catch(() => {
      setProgramOptions({
        skills: SKILL_TAG_OPTIONS,
        companies: TARGET_COMPANY_OPTIONS,
        roles: TARGET_ROLE_OPTIONS,
      });
    });
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
        const num = Number(name === 'durationDays' ? value : prev.durationDays) || 0;
        const multiplier = (name === 'durationUnit' ? value : prev.durationUnit) === 'Weeks' ? 7 : 1;
        const totalDurationDays = num * multiplier;
        next.phases = getDefaultPhases(prev.programType, totalDurationDays);
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

  const handleAddSkill = (skillName) => {
    const raw = String(skillName || '').trim();
    if (!raw) return;
    const normalized = normalizeSearchString(raw);
    const existing = (programOptions.skills.length ? programOptions.skills : SKILL_TAG_OPTIONS).find(
      (s) => normalizeSearchString(s) === normalized
    );
    const finalSkill = existing || raw;
    setFormData((prev) => {
      const already = prev.skillTags.some((s) => normalizeSearchString(s) === normalized);
      if (already) return prev;
      return { ...prev, skillTags: [...prev.skillTags, finalSkill] };
    });
    setSkillSearch('');
    setOtherSkillDraft('');
    setSkillDropdownOpen(false);
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skillTags: prev.skillTags.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddCompany = (companyName) => {
    const raw = String(companyName || '').trim();
    if (!raw) return;
    const normalized = normalizeSearchString(raw);
    const existing = programOptions.companies.find(
      (c) => normalizeSearchString(c) === normalized
    );
    const finalCompany = existing || raw;
    setFormData((prev) => {
      const already = prev.targetCompanies.some((c) => normalizeSearchString(c) === normalized);
      if (already) return prev;
      return { ...prev, targetCompanies: [...prev.targetCompanies, finalCompany] };
    });
    setCompanySearch('');
    setOtherCompanyDraft('');
    setCompanyDropdownOpen(false);
  };

  const handleRemoveCompany = (companyToRemove) => {
    setFormData((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies.filter((c) => c !== companyToRemove),
    }));
  };

  const handleAddRole = (roleName) => {
    const raw = String(roleName || '').trim();
    if (!raw) return;
    const normalized = normalizeSearchString(raw);
    const existing = programOptions.roles.find(
      (r) => normalizeSearchString(r) === normalized
    );
    const finalRole = existing || raw;
    setFormData((prev) => {
      const rolesList = Array.isArray(prev.targetRoles) ? prev.targetRoles : [];
      const already = rolesList.some((r) => normalizeSearchString(r) === normalized);
      if (already) return prev;
      return { ...prev, targetRoles: [...rolesList, finalRole] };
    });
    setRoleSearch('');
    setOtherRoleDraft('');
    setRoleDropdownOpen(false);
  };

  const handleRemoveRole = (roleToRemove) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: (Array.isArray(prev.targetRoles) ? prev.targetRoles : []).filter((r) => r !== roleToRemove),
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
      pricingPlans: [],
      learningGoalsText: '',
      placementCategory: 'Both',
      targetCompanies: [],
      skillTags: [],
      targetRoles: [],
    });
    setSkillSearch('');
    setOtherSkillDraft('');
    setSkillDropdownOpen(false);
    setCompanySearch('');
    setOtherCompanyDraft('');
    setCompanyDropdownOpen(false);
    setRoleSearch('');
    setOtherRoleDraft('');
    setRoleDropdownOpen(false);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (program, e) => {
    if (e) e.stopPropagation();
    setEditingProgram(program);
    const existingRoles = Array.isArray(program.targetRoles)
      ? program.targetRoles
      : parseCommaString(program.targetRolesText || '');
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
      billingOptions: (Array.isArray(program.billingOptions) && program.billingOptions.length)
        ? program.billingOptions
        : (Array.isArray(program.pricingPlans) && program.pricingPlans.length)
          ? [...new Set(program.pricingPlans.map(p => p.billingPeriod).filter(Boolean))]
          : [],
      monthlyStructuredFee: String(program.monthlyStructuredFee ?? (program.pricingPlans?.find(p => p.billingPeriod === 'Monthly' || p.key?.includes('basic'))?.price || '')),
      monthlyTrainerLedFee: String(program.monthlyTrainerLedFee ?? (program.pricingPlans?.find(p => p.billingPeriod === 'Monthly' && p.availability === 'Trainer-Led')?.price || '')),
      annualStructuredFee: String(program.annualStructuredFee ?? (program.pricingPlans?.find(p => p.billingPeriod === 'Annual' || p.key?.includes('pro'))?.price || program.programFee || '')),
      annualTrainerLedFee: String(program.annualTrainerLedFee ?? (program.pricingPlans?.find(p => p.billingPeriod === 'Annual' && p.availability === 'Trainer-Led')?.price || '')),
      programFee: String(program.programFee || 0),
      pricingPlans: [],
      learningGoalsText: '',
      placementCategory: 'Both',
      targetCompanies: Array.isArray(program.targetCompanies) ? program.targetCompanies : [],
      skillTags: Array.isArray(program.skillTags) ? program.skillTags : [],
      targetRoles: existingRoles,
    });
    setSkillSearch('');
    setOtherSkillDraft('');
    setSkillDropdownOpen(false);
    setCompanySearch('');
    setOtherCompanyDraft('');
    setCompanyDropdownOpen(false);
    setRoleSearch('');
    setOtherRoleDraft('');
    setRoleDropdownOpen(false);
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
        targetRoles: Array.isArray(formData.targetRoles) ? formData.targetRoles : parseCommaString(formData.targetRolesText || ''),
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

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

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
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
                    <FiAlertCircle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* ── PROGRAM INFORMATION ── */}
                <div className="space-y-3">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Program Name*</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Full Stack Development Placement Sprint"
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
                      placeholder="Description of the program, curriculum coverage, and learner outcomes..."
                      value={formData.description}
                      onChange={handleFormChange}
                      className={programFormInputClass}
                    />
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
                </div>

                {/* ── DURATION ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                    <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                      <select
                        name="durationUnit"
                        value={formData.durationUnit}
                        onChange={handleFormChange}
                        className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                      >
                        <option className={dropdownOptionClass} value="Days">Days</option>
                        <option className={dropdownOptionClass} value="Weeks">Weeks</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                    </div>
                  </div>
                </div>

                {/* ── DELIVERY & PRICING ── */}
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Availability*</label>
                      <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                        <select
                          name="availability"
                          value={formData.availability}
                          onChange={handleFormChange}
                          className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                        >
                          <option className={dropdownOptionClass} value="Structured">Structured</option>
                          <option className={dropdownOptionClass} value="Trainer-Led">Trainer-Led</option>
                          <option className={dropdownOptionClass} value="Both">Both</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                      </div>
                    </div>
                    <div>
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Pricing*</label>
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
                  </div>

                  {formData.pricingType === 'Paid' && (
                    <div className="rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] p-4 space-y-3">
                      <div>
                        <label className="admin-micro-label text-black/45 dark:text-white/45">Billing Options* (Select at least one)</label>
                        <div className="flex gap-4 text-sm font-medium text-slate-700 dark:text-slate-200 mt-1">
                          {['Monthly', 'Annual'].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.billingOptions.includes(option)}
                                onChange={() =>
                                  setFormData((current) => ({
                                    ...current,
                                    billingOptions: current.billingOptions.includes(option)
                                      ? current.billingOptions.filter((item) => item !== option)
                                      : [...current.billingOptions, option],
                                  }))
                                }
                                className="h-4 w-4 rounded border-black/20 text-[#3C83F6] focus:ring-[#3C83F6]"
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Conditional Fee Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                        {formData.billingOptions.includes('Monthly') && (formData.availability === 'Structured' || formData.availability === 'Both') && (
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Monthly Structured Fee (₹)*
                            <input
                              type="number"
                              min="0"
                              step="1"
                              required
                              name="monthlyStructuredFee"
                              value={formData.monthlyStructuredFee}
                              onChange={handleFormChange}
                              placeholder="e.g. 499"
                              className={programFormInputClass}
                            />
                          </label>
                        )}
                        {formData.billingOptions.includes('Monthly') && (formData.availability === 'Trainer-Led' || formData.availability === 'Both') && (
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Monthly Trainer-Led Fee (₹)*
                            <input
                              type="number"
                              min="0"
                              step="1"
                              required
                              name="monthlyTrainerLedFee"
                              value={formData.monthlyTrainerLedFee}
                              onChange={handleFormChange}
                              placeholder="e.g. 999"
                              className={programFormInputClass}
                            />
                          </label>
                        )}
                        {formData.billingOptions.includes('Annual') && (formData.availability === 'Structured' || formData.availability === 'Both') && (
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Annual Structured Fee (₹)*
                            <input
                              type="number"
                              min="0"
                              step="1"
                              required
                              name="annualStructuredFee"
                              value={formData.annualStructuredFee}
                              onChange={handleFormChange}
                              placeholder="e.g. 4999"
                              className={programFormInputClass}
                            />
                          </label>
                        )}
                        {formData.billingOptions.includes('Annual') && (formData.availability === 'Trainer-Led' || formData.availability === 'Both') && (
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Annual Trainer-Led Fee (₹)*
                            <input
                              type="number"
                              min="0"
                              step="1"
                              required
                              name="annualTrainerLedFee"
                              value={formData.annualTrainerLedFee}
                              onChange={handleFormChange}
                              placeholder="e.g. 9999"
                              className={programFormInputClass}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── VISIBILITY ── */}
                <div className="pt-1">
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Visibility*</label>
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

                {/* ── SKILLS ── */}
                <div className="pt-1">
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Skill Tags*</label>
                  <div className="relative mt-1">
                    <button
                      type="button"
                      onClick={() => setSkillDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/35 dark:focus:ring-[#7fb1ff]/35 text-slate-800 dark:text-white"
                    >
                      <span className="truncate">
                        {formData.skillTags.length === 0
                          ? 'Select Skill Tags'
                          : `${formData.skillTags.length} skill${formData.skillTags.length > 1 ? 's' : ''} selected: ${formData.skillTags.slice(0, 3).join(', ')}${formData.skillTags.length > 3 ? '...' : ''}`}
                      </span>
                      <FiChevronDown
                        className={`w-4 h-4 text-black/45 dark:text-white/60 shrink-0 transition-transform duration-200 ${
                          skillDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {skillDropdownOpen && (
                      <div
                        className="absolute left-0 right-0 top-full mt-1.5 z-[150] rounded-xl border border-black/10 dark:border-white/15 p-3 shadow-2xl space-y-3"
                        style={{ backgroundColor: isDarkMode ? '#0f1f43' : '#ffffff' }}
                      >
                        {/* Selected Skill Chips */}
                        {formData.skillTags.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-semibold text-black/50 dark:text-white/50">
                                Selected ({formData.skillTags.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, skillTags: [] }))}
                                className="text-[10px] text-red-500 hover:underline"
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {formData.skillTags.map((skill) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#3C83F6]/10 px-2.5 py-1 text-xs font-semibold text-[#3C83F6] dark:bg-[#bceaff]/15 dark:text-[#bceaff]"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="hover:opacity-75 focus:outline-none ml-0.5"
                                    aria-label={`Remove ${skill}`}
                                  >
                                    <FiX className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Searchable dropdown & Other Skill Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              value={skillSearch}
                              onChange={(e) => setSkillSearch(e.target.value)}
                              placeholder="Search skills..."
                              className={programFormInputClass}
                            />
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={otherSkillDraft}
                              onChange={(e) => setOtherSkillDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddSkill(otherSkillDraft);
                                }
                              }}
                              placeholder="Other Skill (new)"
                              className={programFormInputClass}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSkill(otherSkillDraft)}
                              className="shrink-0 px-3.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-xs font-bold text-white transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Available Skill Options List */}
                        <div className="border-t border-black/5 dark:border-white/10 pt-2">
                          <span className="text-[11px] font-semibold text-black/50 dark:text-white/50 block mb-1">
                            Available Skills
                          </span>
                          <div className="max-h-40 overflow-y-auto space-y-0.5">
                            {((programOptions.skills.length ? programOptions.skills : SKILL_TAG_OPTIONS).filter((s) =>
                              !formData.skillTags.includes(s) && (!skillSearch.trim() || normalizeSearchString(s).includes(normalizeSearchString(skillSearch)))
                            )).length === 0 ? (
                              <p className="px-2 py-1.5 text-xs text-black/45 dark:text-white/45">
                                {skillSearch.trim() ? 'No matching skills found.' : 'All standard skills selected.'}
                              </p>
                            ) : (
                              (programOptions.skills.length ? programOptions.skills : SKILL_TAG_OPTIONS)
                                .filter((s) => !formData.skillTags.includes(s) && (!skillSearch.trim() || normalizeSearchString(s).includes(normalizeSearchString(skillSearch))))
                                .map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleAddSkill(tag)}
                                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                                  >
                                    <span>+ {tag}</span>
                                    <span className="text-[10px] text-black/30 dark:text-white/30">Add</span>
                                  </button>
                                ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── PLACEMENT TARGETING (Placement only) ── */}
                {formData.programType === 'Placement' && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] dark:border-blue-400/20 dark:bg-blue-400/[0.03] p-4 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#3C83F6] dark:text-[#bceaff]">Placement Targeting</p>

                    {/* Target Companies */}
                    <div className="pt-1">
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Target Companies*</label>
                      <div className="relative mt-1">
                        <button
                          type="button"
                          onClick={() => setCompanyDropdownOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/35 dark:focus:ring-[#7fb1ff]/35 text-slate-800 dark:text-white"
                        >
                          <span className="truncate">
                            {formData.targetCompanies.length === 0
                              ? 'Select Target Companies'
                              : `${formData.targetCompanies.length} compan${formData.targetCompanies.length > 1 ? 'ies' : 'y'} selected: ${formData.targetCompanies.slice(0, 3).join(', ')}${formData.targetCompanies.length > 3 ? '...' : ''}`}
                          </span>
                          <FiChevronDown
                            className={`w-4 h-4 text-black/45 dark:text-white/60 shrink-0 transition-transform duration-200 ${
                              companyDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {companyDropdownOpen && (
                          <div
                            className="absolute left-0 right-0 top-full mt-1.5 z-[150] rounded-xl border border-black/10 dark:border-white/15 p-3 shadow-2xl space-y-3"
                            style={{ backgroundColor: isDarkMode ? '#0f1f43' : '#ffffff' }}
                          >
                            {/* Selected Company Chips */}
                            {formData.targetCompanies.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-semibold text-black/50 dark:text-white/50">
                                    Selected ({formData.targetCompanies.length})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, targetCompanies: [] }))}
                                    className="text-[10px] text-red-500 hover:underline"
                                  >
                                    Clear all
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                  {formData.targetCompanies.map((comp) => (
                                    <span
                                      key={comp}
                                      className="inline-flex items-center gap-1 rounded-full bg-[#3C83F6]/10 px-2.5 py-1 text-xs font-semibold text-[#3C83F6] dark:bg-[#bceaff]/15 dark:text-[#bceaff]"
                                    >
                                      {comp}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCompany(comp)}
                                        className="hover:opacity-75 focus:outline-none ml-0.5"
                                        aria-label={`Remove ${comp}`}
                                      >
                                        <FiX className="h-3 w-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Searchable input & Other Company Input */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <input
                                  type="text"
                                  value={companySearch}
                                  onChange={(e) => setCompanySearch(e.target.value)}
                                  placeholder="Search companies..."
                                  className={programFormInputClass}
                                />
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={otherCompanyDraft}
                                  onChange={(e) => setOtherCompanyDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddCompany(otherCompanyDraft);
                                    }
                                  }}
                                  placeholder="Other Company (new)"
                                  className={programFormInputClass}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddCompany(otherCompanyDraft)}
                                  className="shrink-0 px-3.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-xs font-bold text-white transition-colors"
                                >
                                  Add
                                </button>
                              </div>
                            </div>

                            {/* Available Companies Options List */}
                            <div className="border-t border-black/5 dark:border-white/10 pt-2">
                              <span className="text-[11px] font-semibold text-black/50 dark:text-white/50 block mb-1">
                                Available Companies
                              </span>
                              <div className="max-h-40 overflow-y-auto space-y-0.5">
                                {(((programOptions.companies && programOptions.companies.length ? programOptions.companies : TARGET_COMPANY_OPTIONS)).filter((c) =>
                                  !formData.targetCompanies.includes(c) && (!companySearch.trim() || normalizeSearchString(c).includes(normalizeSearchString(companySearch)))
                                )).length === 0 ? (
                                  <p className="px-2 py-1.5 text-xs text-black/45 dark:text-white/45">
                                    {companySearch.trim() ? 'No matching companies found.' : 'All companies selected.'}
                                  </p>
                                ) : (
                                  ((programOptions.companies && programOptions.companies.length ? programOptions.companies : TARGET_COMPANY_OPTIONS))
                                    .filter((c) => !formData.targetCompanies.includes(c) && (!companySearch.trim() || normalizeSearchString(c).includes(normalizeSearchString(companySearch))))
                                    .map((comp) => (
                                      <button
                                        key={comp}
                                        type="button"
                                        onClick={() => handleAddCompany(comp)}
                                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                                      >
                                        <span>+ {comp}</span>
                                        <span className="text-[10px] text-black/30 dark:text-white/30">Add</span>
                                      </button>
                                    ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Target Roles */}
                    <div className="pt-1">
                      <label className="admin-micro-label text-black/45 dark:text-white/45">Target Roles*</label>
                      <div className="relative mt-1">
                        <button
                          type="button"
                          onClick={() => setRoleDropdownOpen((prev) => !prev)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus:outline-none focus:ring-2 focus:ring-[#3C83F6]/35 dark:focus:ring-[#7fb1ff]/35 text-slate-800 dark:text-white"
                        >
                          <span className="truncate">
                            {(Array.isArray(formData.targetRoles) ? formData.targetRoles : []).length === 0
                              ? 'Select Target Roles'
                              : `${(formData.targetRoles || []).length} role${(formData.targetRoles || []).length > 1 ? 's' : ''} selected: ${(formData.targetRoles || []).slice(0, 3).join(', ')}${(formData.targetRoles || []).length > 3 ? '...' : ''}`}
                          </span>
                          <FiChevronDown
                            className={`w-4 h-4 text-black/45 dark:text-white/60 shrink-0 transition-transform duration-200 ${
                              roleDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {roleDropdownOpen && (
                          <div
                            className="absolute left-0 right-0 top-full mt-1.5 z-[150] rounded-xl border border-black/10 dark:border-white/15 p-3 shadow-2xl space-y-3"
                            style={{ backgroundColor: isDarkMode ? '#0f1f43' : '#ffffff' }}
                          >
                            {/* Selected Role Chips */}
                            {((Array.isArray(formData.targetRoles) ? formData.targetRoles : [])).length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-semibold text-black/50 dark:text-white/50">
                                    Selected ({(formData.targetRoles || []).length})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, targetRoles: [] }))}
                                    className="text-[10px] text-red-500 hover:underline"
                                  >
                                    Clear all
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                  {(formData.targetRoles || []).map((role) => (
                                    <span
                                      key={role}
                                      className="inline-flex items-center gap-1 rounded-full bg-[#3C83F6]/10 px-2.5 py-1 text-xs font-semibold text-[#3C83F6] dark:bg-[#bceaff]/15 dark:text-[#bceaff]"
                                    >
                                      {role}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveRole(role)}
                                        className="hover:opacity-75 focus:outline-none ml-0.5"
                                        aria-label={`Remove ${role}`}
                                      >
                                        <FiX className="h-3 w-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Searchable input & Other Role Input */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <input
                                  type="text"
                                  value={roleSearch}
                                  onChange={(e) => setRoleSearch(e.target.value)}
                                  placeholder="Search roles..."
                                  className={programFormInputClass}
                                />
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={otherRoleDraft}
                                  onChange={(e) => setOtherRoleDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddRole(otherRoleDraft);
                                    }
                                  }}
                                  placeholder="Other Role (new)"
                                  className={programFormInputClass}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddRole(otherRoleDraft)}
                                  className="shrink-0 px-3.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-xs font-bold text-white transition-colors"
                                >
                                  Add
                                </button>
                              </div>
                            </div>

                            {/* Available Roles Options List */}
                            <div className="border-t border-black/5 dark:border-white/10 pt-2">
                              <span className="text-[11px] font-semibold text-black/50 dark:text-white/50 block mb-1">
                                Available Roles
                              </span>
                              <div className="max-h-40 overflow-y-auto space-y-0.5">
                                {(((programOptions.roles && programOptions.roles.length ? programOptions.roles : TARGET_ROLE_OPTIONS)).filter((r) =>
                                  !(Array.isArray(formData.targetRoles) ? formData.targetRoles : []).includes(r) && (!roleSearch.trim() || normalizeSearchString(r).includes(normalizeSearchString(roleSearch)))
                                )).length === 0 ? (
                                  <p className="px-2 py-1.5 text-xs text-black/45 dark:text-white/45">
                                    {roleSearch.trim() ? 'No matching roles found.' : 'All roles selected.'}
                                  </p>
                                ) : (
                                  ((programOptions.roles && programOptions.roles.length ? programOptions.roles : TARGET_ROLE_OPTIONS))
                                    .filter((r) => !(Array.isArray(formData.targetRoles) ? formData.targetRoles : []).includes(r) && (!roleSearch.trim() || normalizeSearchString(r).includes(normalizeSearchString(roleSearch))))
                                    .map((role) => (
                                      <button
                                        key={role}
                                        type="button"
                                        onClick={() => handleAddRole(role)}
                                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                                      >
                                        <span>+ {role}</span>
                                        <span className="text-[10px] text-black/30 dark:text-white/30">Add</span>
                                      </button>
                                    ))
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PROGRAM STRUCTURE: LEARNING PHASES (End of Form) ── */}
                {(() => {
                  const formDurationDays = (Number(formData.durationDays) || 0) * (formData.durationUnit === 'Weeks' ? 7 : 1);
                  const phaseValidation = validatePhaseCoverage(formData.phases, formDurationDays);

                  return (
                    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3C83F6] dark:text-[#bceaff]">Program Structure — Learning Phases</p>
                          <p className="mt-0.5 text-xs text-black/55 dark:text-white/55">Phases must cover every day exactly once.</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          phaseValidation.valid
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}>
                          {phaseValidation.valid ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
                          {phaseValidation.valid ? 'Coverage Valid' : 'Coverage Issue'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {formData.phases.map((phase, index) => (
                          <div key={phase.phase} className="grid grid-cols-[minmax(0,1fr)_90px_90px] items-end gap-2">
                            <div className="min-w-0">
                              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Phase</span>
                              <div className="flex h-10 items-center rounded-lg border border-black/10 bg-white/70 px-3 text-xs font-semibold text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white">
                                {PHASE_LABELS[phase.phase] || phase.phase}
                              </div>
                            </div>
                            <label className="block">
                              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">Start Day</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={phase.startDay}
                                onChange={(event) => handlePhaseChange(index, 'startDay', event.target.value)}
                                className={programFormInputClass}
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-black/40 dark:text-white/40">End Day</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={phase.endDay}
                                onChange={(event) => handlePhaseChange(index, 'endDay', event.target.value)}
                                className={programFormInputClass}
                              />
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className={`text-xs flex items-center gap-1.5 font-medium ${
                        phaseValidation.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {phaseValidation.valid ? <FiCheckCircle className="w-3.5 h-3.5 shrink-0" /> : <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span>{phaseValidation.message}</span>
                      </div>
                    </div>
                  );
                })()}
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
      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        } pt-20 sm:pt-24 md:pt-28 pb-12 px-3 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
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

          {/* Header & Stats Cards - Matching Hiring / Courses */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="admin-page-title text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  Program Management
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                  Manage learning programs, curriculum pathways, enrolment status, and student access.
                </p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="dashboard-primary-btn h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold shrink-0 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Add Program
              </button>
            </div>

            {/* Quick Summary Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Total Programs */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <FiFolder className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Total Programs</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">{pagination.total || programs.length}</span>
                </div>
              </div>

              {/* Published */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Published</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</span>
                </div>
              </div>

              {/* Drafts */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Drafts</span>
                  <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">{draftCount}</span>
                </div>
              </div>

              {/* Total Students */}
              <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/70 backdrop-blur-sm p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <FiUsers className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium truncate">Total Students</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">{totalStudents}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Program Listing Section */}
          <section className="space-y-4">
            {/* Toolbar: Program Type Filter + Status Filter Pills + Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {/* Program Type Pills */}
                <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-0.5 text-xs shrink-0">
                  {["All", ...PROGRAM_TYPES].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedType(type === "All" ? "" : type);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className={`px-2.5 py-1.5 rounded-md transition font-semibold whitespace-nowrap ${
                        (selectedType === "" && type === "All") || selectedType === type
                          ? "bg-[#3C83F6] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Status Pills */}
                <div className="flex items-center rounded-lg border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-0.5 text-xs shrink-0">
                  {["All", "Published", "Draft", "Archived"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(st === "All" ? "" : st);
                        setPagination((prev) => ({ ...prev, page: 1 }));
                      }}
                      className={`px-2.5 py-1.5 rounded-md transition font-semibold whitespace-nowrap ${
                        (selectedStatus === "" && st === "All") || selectedStatus === st
                          ? "bg-[#3C83F6] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64 shrink-0">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  placeholder="Search programs..."
                  className="w-full h-9 pl-9 pr-7 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <LoadingScreen />
              </div>
            ) : programs.length === 0 ? (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl p-8 sm:p-16 text-center shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
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
                <div className="overflow-x-auto overflow-y-auto max-h-[78vh] w-full bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl shadow-xs minimal-scrollbar">
                  <table className={`w-full min-w-[850px] border-collapse ${selectionMode ? '' : 'program-selection-hidden'}`}>
                    <thead>
                      <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40 select-none">
                        <th className="px-3.5 py-3 text-center w-12 shrink-0">
                          <input type="checkbox" aria-label="Select all programs" checked={programs.length > 0 && programs.every((program) => selectedProgramIds.includes(program._id))} onChange={(event) => { if (event.target.checked) setSelectedProgramIds((current) => [...new Set([...current, ...programs.map((program) => program._id)])]); else setSelectedProgramIds((current) => current.filter((id) => !programs.some((program) => program._id === id))); }} className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6]" />
                        </th>
                        <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-14 whitespace-nowrap">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-black/45 dark:text-white/50 min-w-[240px] whitespace-nowrap">Program Name</th>
                        <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-36 whitespace-nowrap">Program Type</th>
                        <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-36 whitespace-nowrap">Status</th>
                        <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Students</th>
                        <th className="px-3.5 py-3 text-center text-xs font-semibold text-black/45 dark:text-white/50 w-28 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
                      {programs.map((program, index) => (
                        <tr key={program._id} onClick={() => navigate(`/programs/${program._id}`)} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                          <td className="px-3.5 py-3.5 text-center"><input type="checkbox" aria-label={`Select ${program.name}`} checked={selectedProgramIds.includes(program._id)} onChange={() => handleSelectToggle(program._id)} onClick={(event) => event.stopPropagation()} className="w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6]" /></td>
                          <td className="px-3.5 py-3.5 text-center text-xs text-slate-400 dark:text-slate-500 tabular-nums">{index + 1 + ((pagination.page || 1) - 1) * (pagination.limit || programs.length)}</td>
                          <td className="px-4 py-3.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                            <div className="max-w-[280px] truncate" title={program.name}>
                              {program.name}
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{getProgramType(program.programType)}</td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap" onClick={(event) => event.stopPropagation()}><div className="inline-block relative"><select value={program.status === 'Active' ? 'Published' : program.status} onChange={(event) => handleStatusChange(program, event.target.value)} className={`appearance-none pr-6 px-2.5 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer transition ${program.status === 'Published' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : program.status === 'Draft' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'}`}><option value="Published">Published</option><option value="Draft">Draft</option><option value="Archived">Archived</option></select><FiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" /></div></td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">{program.studentCount || 0}</span></td>
                          <td className="px-3.5 py-3.5 text-center whitespace-nowrap" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-center gap-1.5"><button aria-label={`View ${program.name}`} onClick={() => navigate(`/programs/${program._id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"><FiEye className="w-3.5 h-3.5" /></button><button aria-label={`Edit ${program.name}`} onClick={(event) => handleOpenEditModal(program, event)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#3C83F6] hover:bg-black/5 dark:hover:bg-white/10 transition"><FiEdit2 className="w-3.5 h-3.5" /></button><button aria-label={`Delete ${program.name}`} onClick={() => setProgramToDelete(program)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"><FiTrash2 className="w-3.5 h-3.5" /></button></div></td>
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
