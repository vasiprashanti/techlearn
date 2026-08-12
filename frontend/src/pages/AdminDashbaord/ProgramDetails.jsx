import { useState, useEffect, useCallback, useMemo, createElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import StudentReportModal from '../../components/AdminDashbaord/StudentReportModal';
import { adminAPI } from '../../services/adminApi';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiFolder,
  FiUsers,
  FiLayers,
  FiBookOpen,
  FiFileText,
  FiGitCommit,
  FiAward,
  FiClipboard,
  FiCheckCircle,
  FiActivity,
  FiBarChart2,
  FiSearch,
  FiX,
  FiExternalLink,
  FiChevronRight,
  FiAlertCircle,
  FiTag,
  FiClock,
  FiEye,
  FiGlobe,
  FiLock,
} from 'react-icons/fi';

const SECTIONS = [
  { key: 'batches', label: 'Batches', icon: FiLayers, field: 'batchIds', route: '/batches' },
  { key: 'students', label: 'Students', icon: FiUsers, field: 'studentIds', route: '/students' },
  { key: 'courses', label: 'Courses', icon: FiBookOpen, field: 'courseIds', route: '/admin/courses' },
  { key: 'roadmaps', label: 'Roadmaps', icon: FiFileText, field: 'roadmapIds', route: '/admin/roadmaps' },
  { key: 'track-templates', label: 'Track Templates', icon: FiGitCommit, field: 'trackTemplateIds', route: '/track-templates' },
  { key: 'certificates', label: 'Certificates', icon: FiAward, field: 'certificateTemplateIds', route: '/certificates' },
  { key: 'projects', label: 'Projects', icon: FiClipboard, field: 'projectIds', route: '/admin/projects' },
];

const getProgramType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'placement' || normalized.includes('placement') ? 'Placement' : 'Skill';
};

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (value) => {
  const date = toValidDate(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatCompactDate = (value) => {
  const date = toValidDate(value);
  return date
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';
};

const parseDurationDays = (duration) => {
  if (typeof duration === 'number' && Number.isFinite(duration)) return Math.max(1, Math.round(duration));

  const match = String(duration || '').match(/(\d+(?:\.\d+)?)\s*-?\s*(day|days|week|weeks|month|months|year|years)/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const unit = match[2].toLowerCase();
  const multiplier = unit.startsWith('year')
    ? 365
    : unit.startsWith('month')
    ? 30
    : unit.startsWith('week')
    ? 7
    : 1;

  return Math.max(1, Math.round(amount * multiplier));
};

const findStudentBatch = (student, enrollment, program) => {
  const enrollmentBatch = enrollment?.batchId;
  if (enrollmentBatch && typeof enrollmentBatch === 'object') return enrollmentBatch;
  if (enrollment && !enrollmentBatch) return null;

  const batchId = enrollmentBatch || student?.batchId?._id || student?.batchId;
  return (program?.batchIds || []).find((batch) => String(batch?._id || batch) === String(batchId)) || null;
};

const buildStudentTableRow = (student, program) => {
  const enrollment = student?.enrollment || null;
  const batch = findStudentBatch(student, enrollment, program);
  const started = toValidDate(
    student?.scheduleStartDate
      || student?.programStartDate
      || batch?.startDate
      || enrollment?.individualStartDate
      || enrollment?.assignedAt
      || student?.createdAt
  );
  const totalDays = parseDurationDays(program?.duration);
  const startDay = startOfDay(started);
  const today = startOfDay(new Date());
  const rawDayNumber = startDay && today
    ? Math.floor((today.getTime() - startDay.getTime()) / DAY_IN_MILLISECONDS) + 1
    : null;
  const dayNumber = Number.isFinite(student?.programDayNumber)
    ? (totalDays ? Math.min(totalDays, Math.max(0, student.programDayNumber)) : student.programDayNumber)
    : (rawDayNumber && totalDays
      ? Math.min(totalDays, Math.max(1, rawDayNumber))
      : rawDayNumber);
  const expires = toValidDate(batch?.expiryDate)
    || toValidDate(student?.scheduleExpiryDate)
    || toValidDate(student?.programExpiryDate)
    || (started && totalDays
      ? new Date(startOfDay(started).getTime() + ((totalDays - 1) * DAY_IN_MILLISECONDS))
      : null);
  const isPaid = student?.programAccess
    ? student.programAccess === 'Paid'
    : enrollment?.accessTier === 'Member' || program?.pricingType === 'Paid';
  const fee = Number(program?.programFee);
  const feeLabel = Number.isFinite(fee) && fee > 0 ? ` ₹${fee.toLocaleString('en-IN')}` : '';
  const configuredPlan = String(student?.programPlan || '').trim();
  const planBase = configuredPlan || (isPaid
    ? (program?.accessTier === 'Member' ? 'Member' : 'Paid')
    : (totalDays ? `${totalDays}-Day Trial` : 'Free Access'));

  return {
    access: isPaid ? 'Paid' : 'Trial',
    plan: isPaid && feeLabel && !planBase.includes('₹') ? `${planBase}${feeLabel}` : planBase,
    started,
    expires,
    progress: dayNumber
      ? (totalDays ? `Day ${dayNumber} / ${totalDays}` : `Day ${dayNumber}`)
      : '—',
    status: student?.programStatus || student?.status || enrollment?.status || 'Active',
  };
};

const StudentDatabaseTable = ({ students, program, onOpenStudent, onDetach }) => (
  <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-[920px] w-full text-left">
        <caption className="sr-only">Students enrolled in this program</caption>
        <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
          <tr className="border-b border-black/10 dark:border-white/10">
            {['#', 'Student', 'Access', 'Plan', 'Started', 'Expires', 'Progress', 'Status'].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45 whitespace-nowrap"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-sm text-black/45 dark:text-white/45">
                No students match the current search and filters.
              </td>
            </tr>
          ) : students.map((student, index) => {
            const row = buildStudentTableRow(student, program);
            const isActive = row.status === 'Active';

            return (
              <tr
                key={student._id}
                onClick={() => onOpenStudent(student)}
                className="group border-b border-black/5 dark:border-white/5 last:border-b-0 hover:bg-[#3C83F6]/[0.04] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3.5 text-xs font-semibold tabular-nums text-black/45 dark:text-white/45">
                  {String(index + 1).padStart(3, '0')}
                </td>
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenStudent(student);
                    }}
                    className="text-left group/student"
                  >
                    <span className="block text-sm font-bold text-slate-800 dark:text-white group-hover/student:text-[#3C83F6] dark:group-hover/student:text-[#bceaff] transition-colors whitespace-nowrap">
                      {student.name || student.email || 'Unnamed Student'}
                    </span>
                    {student.email && (
                      <span className="block max-w-[190px] truncate text-[11px] text-black/40 dark:text-white/40 mt-0.5">
                        {student.email}
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    row.access === 'Paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                  }`}>
                    {row.access}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {row.plan}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatCompactDate(row.started)}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatCompactDate(row.expires)}
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {row.progress}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300'
                    }`}>
                      {row.status}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDetach(student);
                      }}
                      title="Detach from Program"
                      aria-label={`Detach ${student.name || 'student'} from Program`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
  </div>
);

const ReportActivity = ({ label, activity, tone }) => (
  <div className="flex items-center justify-between gap-2 text-[10px] leading-tight">
    <span className={`font-bold ${tone}`}>{label}</span>
    <span className={`text-right ${activity?.attempted ? 'text-slate-700 dark:text-slate-200' : 'text-black/35 dark:text-white/35'}`}>
      {activity?.attempted ? `${activity.status} · ${activity.result}` : 'Not attempted'}
    </span>
  </div>
);

const ProgramReportsTable = ({ students, program, onOpenStudent }) => {
  const reportDays = Math.max(1, Number(program?.programReports?.days) || 30);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-black/45 dark:text-white/45">
          Program Day is anchored to each learner&apos;s original enrollment date. Each day shows Daily Task and Daily Challenge activity.
        </p>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
          Day 1–{reportDays}
        </span>
      </div>
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[3400px] w-full text-left">
            <caption className="sr-only">Day-wise program reports for enrolled students</caption>
            <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
              <tr className="border-b border-black/10 dark:border-white/10">
                <th scope="col" className="sticky left-0 z-20 w-14 min-w-14 px-3 py-3 bg-[#f9fbfd] dark:bg-[#12244a] text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">#</th>
                <th scope="col" className="sticky left-14 z-20 w-56 min-w-56 px-3 py-3 bg-[#f9fbfd] dark:bg-[#12244a] text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">Student</th>
                {Array.from({ length: reportDays }, (_, index) => (
                  <th key={index + 1} scope="col" className="w-28 min-w-28 px-2 py-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">
                    Day {index + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const report = student.programReport || {};
                const days = report.days || [];
                return (
                  <tr
                    key={student._id}
                    className="group border-b border-black/5 dark:border-white/5 last:border-b-0 hover:bg-[#3C83F6]/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="sticky left-0 z-10 px-3 py-3.5 bg-white/95 dark:bg-[#0f1f43]/95 text-xs font-semibold tabular-nums text-black/45 dark:text-white/45">
                      {String(index + 1).padStart(3, '0')}
                    </td>
                    <td className="sticky left-14 z-10 px-3 py-3.5 bg-white/95 dark:bg-[#0f1f43]/95">
                      <button
                        type="button"
                        onClick={() => onOpenStudent(student)}
                        className="text-left group/student"
                      >
                        <span className="block max-w-[210px] truncate text-sm font-bold text-slate-800 dark:text-white group-hover/student:text-[#3C83F6] dark:group-hover/student:text-[#bceaff] transition-colors">
                          {student.name || student.email || 'Unnamed Student'}
                        </span>
                        <span className="block max-w-[210px] truncate text-[11px] text-black/40 dark:text-white/40 mt-0.5">
                          {student.email || student.rollNo || '—'}
                        </span>
                      </button>
                    </td>
                    {Array.from({ length: reportDays }, (_, index) => {
                      const day = days[index] || {};
                      return (
                        <td key={index + 1} className="w-28 min-w-28 px-2 py-2.5 align-top border-l border-black/5 dark:border-white/5">
                          <div className="space-y-1.5">
                            <ReportActivity label="Task" activity={day.dailyTask} tone="text-emerald-600 dark:text-emerald-300" />
                            <ReportActivity label="Challenge" activity={day.dailyChallenge} tone="text-blue-600 dark:text-blue-300" />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {students.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-black/45 dark:text-white/45">
            No students match the current search and filters.
          </div>
        )}
      </div>
    </div>
  );
};

const statusBadgeClass = (status) => {
  if (status === 'Active' || status === 'Published')
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (status === 'Draft')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (status === 'Archived')
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
};

export default function ProgramDetails() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const requestedSection = searchParams.get('attachType');
    return SECTIONS.some((section) => section.key === requestedSection) ? requestedSection : 'students';
  });
  const [studentsSubTab, setStudentsSubTab] = useState('students');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPeriodFilter, setStudentPeriodFilter] = useState('current');
  const [studentStatusFilter, setStudentStatusFilter] = useState('active-completed');
  const [studentAccessFilter, setStudentAccessFilter] = useState('all');
  const [studentPlanFilter, setStudentPlanFilter] = useState('all');
  const [studentSort, setStudentSort] = useState('latest');

  const [attachModalType, setAttachModalType] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [attaching, setAttaching] = useState(false);

  const [detachItem, setDetachItem] = useState(null);
  const [detaching, setDetaching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [toastMessage, setToastMessage] = useState(searchParams.get('msg') || '');

  const fetchProgramDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getProgramById(programId);
      if (res && res.success && res.program) {
        setProgram(res.program);
      } else {
        setError('Program not found');
      }
    } catch (err) {
      console.error('Error fetching program detail:', err);
      setError(err.message || 'Failed to fetch program detail');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchProgramDetail();
  }, [fetchProgramDetail]);

  useEffect(() => {
    const returnType = searchParams.get('attachType');
    const autoAttachId = searchParams.get('newId');

    if (returnType && SECTIONS.some((s) => s.key === returnType)) {
      setActiveTab(returnType);
      if (autoAttachId) {
        adminAPI
          .attachProgramEntities(programId, returnType, [autoAttachId])
          .then(() => {
            setToastMessage('Newly created item was automatically attached to Program!');
            fetchProgramDetail();
          })
          .catch((err) => console.error('Auto-attach error:', err));
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, programId, fetchProgramDetail, setSearchParams]);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const visibleStudentItems = useMemo(() => {
    const students = Array.isArray(program?.studentIds) ? program.studentIds : [];
    const search = studentSearch.trim().toLowerCase();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const getStartedTime = (student) => {
      const row = buildStudentTableRow(student, program);
      return row.started ? row.started.getTime() : 0;
    };
    const getStatusPriority = (status) => ({ Active: 0, Completed: 1, Expired: 2 }[status] ?? 3);
    const getProgressValue = (student) => {
      if (Number.isFinite(student?.programDayNumber)) return Number(student.programDayNumber);
      const match = String(buildStudentTableRow(student, program).progress || '').match(/Day\s+(\d+)/i);
      return match ? Number(match[1]) : 0;
    };

    const filtered = students.filter((student) => {
      const row = buildStudentTableRow(student, program);
      const searchable = [student.name, student.email, student.rollNo, student._id, student.userId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (search && !searchable.includes(search)) return false;

      if (studentPeriodFilter === 'current') {
        const started = toValidDate(student.programStartDate) || row.started;
        if (!started || started.getFullYear() !== currentYear || started.getMonth() !== currentMonth) return false;
      }

      if (studentStatusFilter === 'active-completed' && !['Active', 'Completed'].includes(row.status)) return false;
      if (studentStatusFilter !== 'active-completed' && studentStatusFilter !== 'all' && row.status !== studentStatusFilter) return false;
      if (studentAccessFilter !== 'all' && row.access !== studentAccessFilter) return false;

      if (studentPlanFilter !== 'all') {
        const plan = String(row.plan || '').toLowerCase();
        const matchesPlan = studentPlanFilter === 'trial'
          ? row.access === 'Trial' || plan.includes('trial')
          : plan.includes(studentPlanFilter);
        if (!matchesPlan) return false;
      }

      return true;
    });

    return filtered.sort((first, second) => {
      const firstRow = buildStudentTableRow(first, program);
      const secondRow = buildStudentTableRow(second, program);
      if (studentSort === 'name-asc' || studentSort === 'name-desc') {
        const comparison = String(first.name || first.email || '').localeCompare(String(second.name || second.email || ''), undefined, { sensitivity: 'base' });
        return studentSort === 'name-asc' ? comparison : -comparison;
      }
      if (studentSort === 'progress-high' || studentSort === 'progress-low') {
        const comparison = getProgressValue(first) - getProgressValue(second);
        return studentSort === 'progress-high' ? -comparison : comparison;
      }

      const firstTime = getStartedTime(first);
      const secondTime = getStartedTime(second);
      if (studentSort === 'oldest') return firstTime - secondTime;

      const statusComparison = getStatusPriority(firstRow.status) - getStatusPriority(secondRow.status);
      if (statusComparison !== 0) return statusComparison;
      return secondTime - firstTime;
    });
  }, [program, studentSearch, studentPeriodFilter, studentStatusFilter, studentAccessFilter, studentPlanFilter, studentSort]);

  const fetchAvailableEntities = async (entityType, search = '') => {
    try {
      setAvailableLoading(true);
      const res = await adminAPI.getAvailableProgramEntities(programId, entityType, { search, limit: 50 });
      if (res && res.success) {
        setAvailableItems(res.items || []);
      }
    } catch (err) {
      console.error('Error fetching available entities:', err);
    } finally {
      setAvailableLoading(false);
    }
  };

  const handleOpenAttachModal = (entityType) => {
    setAttachModalType(entityType);
    setSelectedIds([]);
    setSelectedBatchId('');
    setAvailableSearch('');
    fetchAvailableEntities(entityType, '');
    if (entityType === 'students') {
      adminAPI.getBatches()
        .then((res) => {
          const items = Array.isArray(res) ? res : (res?.batches || res?.items || res?.data || []);
          setBatches(items.map((batch) => ({
            id: batch.id || batch._id,
            name: batch.name || batch.id || 'Untitled Batch',
          })).filter((batch) => batch.id));
        })
        .catch((err) => {
          console.error('Error fetching batches for program enrollment:', err);
          setBatches([]);
        });
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleConfirmAttach = async () => {
    if (selectedIds.length === 0 || !attachModalType) return;
    try {
      setAttaching(true);
      await adminAPI.attachProgramEntities(
        programId,
        attachModalType,
        selectedIds,
        attachModalType === 'students' ? { batchId: selectedBatchId || null } : {}
      );
      setAttachModalType(null);
      setSelectedIds([]);
      setToastMessage(`Successfully attached ${selectedIds.length} item(s) to Program!`);
      fetchProgramDetail();
    } catch (err) {
      console.error('Error attaching entities:', err);
      alert(err.message || 'Failed to attach entities');
    } finally {
      setAttaching(false);
    }
  };

  const handleConfirmDetach = async () => {
    if (!detachItem) return;
    try {
      setDetaching(true);
      await adminAPI.detachProgramEntity(programId, detachItem.typeKey, detachItem.item._id);
      setDetachItem(null);
      setToastMessage('Successfully detached item from Program.');
      fetchProgramDetail();
    } catch (err) {
      console.error('Error detaching entity:', err);
      alert(err.message || 'Failed to detach entity');
    } finally {
      setDetaching(false);
    }
  };

  const handleCreateNewResource = (section) => {
    const returnUrl = encodeURIComponent(`/programs/${programId}?attachType=${section.key}`);
    navigate(`${section.route}?returnTo=${returnUrl}&programId=${programId}&attachType=${section.key}`);
  };

  const getItemTitle = (item, typeKey) => {
    if (typeKey === 'students') return item.name || item.email || 'Unnamed Student';
    if (typeKey === 'courses') return item.title || 'Untitled Course';
    if (typeKey === 'roadmaps') return item.title || 'Untitled Roadmap';
    if (typeKey === 'track-templates') return item.name || 'Untitled Track Template';
    if (typeKey === 'certificates') return item.name || 'Untitled Certificate';
    if (typeKey === 'projects') return item.title || 'Untitled Project';
    return item.name || item.title || 'Untitled Item';
  };

  const getItemSubtitle = (item, typeKey) => {
    if (typeKey === 'students') return `${item.email || ''} ${item.rollNo ? `(${item.rollNo})` : ''}`;
    if (typeKey === 'batches') return `Start: ${item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}`;
    if (typeKey === 'courses') return `${item.level || ''} • ${item.courseType || ''}`;
    if (typeKey === 'track-templates') return `Type: ${item.trackType || 'N/A'}`;
    if (typeKey === 'projects') return `Category: ${item.category || 'N/A'} • ${item.duration_days ? `${item.duration_days} Days` : ''}`;
    if (typeKey === 'certificates') return item.description || 'Certificate Template';
    return item.description || '';
  };

  const getItemLink = (item, typeKey) => {
    if (typeKey === 'batches') return `/batches/${item._id}`;
    if (typeKey === 'students') return `/students`;
    if (typeKey === 'courses') return `/admin/courses`;
    if (typeKey === 'roadmaps') return `/admin/roadmaps`;
    if (typeKey === 'track-templates') return `/track-templates/${item._id}`;
    if (typeKey === 'certificates') return `/certificates`;
    if (typeKey === 'projects') return `/admin/projects/edit/${item._id}`;
    return null;
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !program) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex flex-col justify-center items-center gap-4">
          <FiAlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold">{error || 'Program Not Found'}</h2>
          <button
            onClick={() => navigate('/programs')}
            className="px-5 py-2.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] text-white text-sm font-semibold transition-colors"
          >
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  const currentSection = SECTIONS.find((s) => s.key === activeTab) || SECTIONS[0];
  const CurrentSectionIcon = currentSection.icon;
  const attachedItems = program[currentSection.field] || [];
  const programStats = program.programStats || {};
  const totalEnrolled = Number.isFinite(Number(programStats.totalEnrolled))
    ? Number(programStats.totalEnrolled)
    : attachedItems.length;
  const programPrice = program.pricingType === 'Paid'
    ? `₹${Number(program.programFee || 0).toLocaleString('en-IN')}`
    : 'Free';

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Background Gradient — identical to Programs / Question Bank */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      <Sidebar />

      <StudentReportModal
        studentId={selectedStudent?._id || selectedStudent?.id}
        batchId={selectedStudent?.enrollment?.batchId?._id
          || selectedStudent?.enrollment?.batchId
          || selectedStudent?.batchId?._id
          || selectedStudent?.batchId}
        studentBasic={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        isOpen={Boolean(selectedStudent)}
        context="program"
      />

      {/* ── Attach Existing Modal ───────────────────────────────────────────── */}
      {attachModalType && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setAttachModalType(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                  Attach Existing {currentSection.label}
                </h3>
                <p className="text-[11px] text-black/45 dark:text-white/45 mt-0.5">
                  Select items to attach to this program
                </p>
              </div>
              <button
                onClick={() => setAttachModalType(null)}
                className="text-sm text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2 shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search available ${currentSection.label.toLowerCase()}...`}
                  value={availableSearch}
                  onChange={(e) => {
                    setAvailableSearch(e.target.value);
                    fetchAvailableEntities(attachModalType, e.target.value);
                  }}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35"
                />
              </div>
            </div>

            {attachModalType === 'students' && (
              <div className="px-5 pb-2 shrink-0">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-black/50 dark:text-white/50 mb-1.5">
                  Batch (Optional)
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                >
                  <option value="">No batch — individual program schedule</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>{batch.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-black/45 dark:text-white/45 mt-1.5">
                  Leave empty for Day 1 to start on the learner's enrollment date.
                </p>
              </div>
            )}

            {/* Item List */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
              {availableLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#3C83F6] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : availableItems.length === 0 ? (
                <div className="p-10 text-center rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5">
                  <p className="text-sm font-medium text-black/50 dark:text-white/50">No attachable items found.</p>
                </div>
              ) : (
                availableItems.map((item) => {
                  const isSelected = selectedIds.includes(item._id);
                  return (
                    <div
                      key={item._id}
                      onClick={() => !item.isAttached && handleToggleSelect(item._id)}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                        item.isAttached
                          ? 'opacity-50 cursor-not-allowed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5'
                          : isSelected
                          ? 'border-[#3C83F6]/60 bg-[#3C83F6]/8 dark:border-blue-400/50 dark:bg-blue-500/10'
                          : 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={item.isAttached}
                        checked={item.isAttached || isSelected}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded text-[#3C83F6] focus:ring-[#3C83F6] border-black/15 dark:border-white/20 bg-white dark:bg-black/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {getItemTitle(item, attachModalType)}
                        </p>
                        <p className="text-[11px] text-black/45 dark:text-white/45 truncate mt-0.5">
                          {getItemSubtitle(item, attachModalType)}
                        </p>
                      </div>
                      {item.isAttached && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-300 whitespace-nowrap">
                          Attached
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-[#0a1737]/50">
              <span className="text-xs text-black/45 dark:text-white/45">
                {selectedIds.length} item(s) selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAttachModalType(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedIds.length === 0 || attaching}
                  onClick={handleConfirmAttach}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#3C83F6] hover:bg-[#2f73e0] text-white transition-colors disabled:opacity-50 shadow-sm"
                >
                  {attaching ? 'Attaching...' : `Attach (${selectedIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detach Confirmation Modal ───────────────────────────────────────── */}
      {detachItem && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDetachItem(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Detach Item?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Remove{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {getItemTitle(detachItem.item, detachItem.typeKey)}
              </span>{' '}
              from this program?
            </p>
            <div className="px-3.5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs mb-5">
              This only removes the association — the resource itself won't be deleted.
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                disabled={detaching}
                onClick={() => setDetachItem(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={detaching}
                onClick={handleConfirmDetach}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {detaching ? 'Detaching...' : 'Detach'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 h-screen z-10 lg:ml-64 pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto space-y-4">

          {/* Toast */}
          {toastMessage && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage('')}>
                <FiX className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              </button>
            </div>
          )}

          {/* Back */}
          <button
            onClick={() => navigate('/programs')}
            className="flex items-center gap-1.5 text-xs font-semibold text-black/50 dark:text-white/50 hover:text-[#3C83F6] dark:hover:text-[#bceaff] transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Back to Programs
          </button>

          {/* ── Compact Program Header ─────────────────────────────────────── */}
          <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl px-5 py-4 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadgeClass(program.status)}`}>
                    {program.status}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40 dark:text-white/40">
                    Program
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug truncate">
                  {program.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200">
                  <FiTag className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
                  {getProgramType(program.programType)}
                </span>
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200">
                  <FiClock className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
                  {program.duration || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-xs font-semibold border border-emerald-300/60 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {programPrice}
                </span>
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-200">
                  <FiUsers className="w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]" />
                  {totalEnrolled} Students
                </span>
              </div>
            </div>
          </div>

          {/* ── Program Monitoring Stats ───────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Total Enrolled', value: totalEnrolled, icon: FiUsers },
              { label: 'Current Enrolled', value: programStats.currentEnrolled ?? 0, icon: FiClock },
              { label: 'Active Today', value: programStats.activeToday ?? 0, icon: FiActivity },
              { label: 'Completed', value: programStats.completed ?? 0, icon: FiCheckCircle },
              { label: 'Accuracy', value: programStats.accuracy === null || programStats.accuracy === undefined ? '—' : `${programStats.accuracy}%`, icon: FiBarChart2 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-[#0f1f43] px-4 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.03)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">{stat.label}</span>
                  {createElement(stat.icon, { className: 'w-3.5 h-3.5 text-[#3C83F6] dark:text-[#bceaff]' })}
                </div>
                <p className="mt-1 text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* ── Section Navigation Tabs ──────────────────────────────────────── */}
          <div className="-mt-1 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const count = (program[sec.field] || []).length;
              const isActive = activeTab === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveTab(sec.key)}
                  className={`flex items-center gap-1.5 h-8 px-3 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#3C83F6] dark:bg-[#bceaff] text-white dark:text-[#06224d] shadow-sm'
                      : 'border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{sec.label}</span>
                    <span className={`px-1.5 py-0 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/25 dark:bg-black/20 text-white dark:text-[#06224d]'
                      : 'bg-black/8 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Section Panel ─────────────────────────────────────────────────── */}
          <section className="space-y-3">
            {/* Section Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  {currentSection.key === 'students' ? 'Students' : `Attached ${currentSection.label}`}
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#3C83F6]/10 dark:bg-[#bceaff]/15 text-[#3C83F6] dark:text-[#bceaff]">
                    {attachedItems.length}
                  </span>
                </h2>
                <p className="text-xs text-black/45 dark:text-white/45 mt-0.5">
                  {currentSection.key === 'students'
                    ? 'Operational enrollment database for this program'
                    : `Manage attached ${currentSection.label.toLowerCase()} or add new resources`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateNewResource(currentSection)}
                  className="h-9 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                  Create New
                </button>
                <button
                  onClick={() => handleOpenAttachModal(currentSection.key)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white px-4 text-xs font-bold transition-colors shadow-sm"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Attach Existing
                </button>
              </div>
            </div>

            {/* Attached Items */}
            {currentSection.key === 'students' ? (
              <>
                <div className="flex items-center gap-1 border-b border-black/5 dark:border-white/5">
                  {[
                    { key: 'students', label: 'Students' },
                    { key: 'reports', label: 'Reports' },
                  ].map((subTab) => (
                    <button
                      key={subTab.key}
                      type="button"
                      onClick={() => setStudentsSubTab(subTab.key)}
                      className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
                        studentsSubTab === subTab.key
                          ? 'border-[#3C83F6] text-[#3C83F6] dark:border-[#bceaff] dark:text-[#bceaff]'
                          : 'border-transparent text-black/45 dark:text-white/45 hover:text-black/70 dark:hover:text-white/70'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0f1f43]/80 p-3 shadow-[0_3px_10px_rgba(15,23,42,0.03)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.1)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40 pointer-events-none" />
                      <input
                        type="search"
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        placeholder="Search students..."
                        aria-label="Search students"
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                      />
                    </div>
                    <select
                      value={studentSort}
                      onChange={(event) => setStudentSort(event.target.value)}
                      aria-label="Sort students"
                      className="h-9 min-w-[155px] px-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    >
                      <option value="latest">Latest Joined</option>
                      <option value="oldest">Oldest Joined</option>
                      <option value="name-asc">Name A–Z</option>
                      <option value="name-desc">Name Z–A</option>
                      <option value="progress-high">Progress Highest</option>
                      <option value="progress-low">Progress Lowest</option>
                    </select>
                    <select
                      value={studentPeriodFilter}
                      onChange={(event) => setStudentPeriodFilter(event.target.value)}
                      aria-label="Student period filter"
                      className="h-9 min-w-[125px] px-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    >
                      <option value="current">Current Month</option>
                      <option value="all">All Time</option>
                    </select>
                    <select
                      value={studentStatusFilter}
                      onChange={(event) => setStudentStatusFilter(event.target.value)}
                      aria-label="Student status filter"
                      className="h-9 min-w-[145px] px-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    >
                      <option value="active-completed">Status: Active + Completed</option>
                      <option value="all">Status: All</option>
                      <option value="Active">Status: Active</option>
                      <option value="Completed">Status: Completed</option>
                      <option value="Expired">Status: Expired</option>
                    </select>
                    <select
                      value={studentAccessFilter}
                      onChange={(event) => setStudentAccessFilter(event.target.value)}
                      aria-label="Student access filter"
                      className="h-9 min-w-[105px] px-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    >
                      <option value="all">Access: All</option>
                      <option value="Trial">Access: Trial</option>
                      <option value="Paid">Access: Paid</option>
                    </select>
                    <select
                      value={studentPlanFilter}
                      onChange={(event) => setStudentPlanFilter(event.target.value)}
                      aria-label="Student plan filter"
                      className="h-9 min-w-[105px] px-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    >
                      <option value="all">Plan: All</option>
                      <option value="trial">Plan: Trial</option>
                      <option value="basic">Plan: Basic</option>
                      <option value="pro">Plan: Pro</option>
                    </select>
                  </div>
                </div>

                {studentsSubTab === 'reports' ? (
                  <ProgramReportsTable
                    students={visibleStudentItems}
                    program={program}
                    onOpenStudent={setSelectedStudent}
                  />
                ) : (
                  <StudentDatabaseTable
                    students={visibleStudentItems}
                    program={program}
                    onOpenStudent={setSelectedStudent}
                    onDetach={(student) => setDetachItem({ typeKey: currentSection.key, item: student })}
                  />
                )}
              </>
            ) : attachedItems.length === 0 ? (
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl p-16 text-center shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
                <div className="w-14 h-14 rounded-2xl bg-[#3C83F6]/10 dark:bg-[#bceaff]/20 text-[#3C83F6] dark:text-[#bceaff] flex items-center justify-center mx-auto mb-4">
                  <CurrentSectionIcon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                  No {currentSection.label} Attached
                </h3>
                <p className="text-sm text-black/45 dark:text-white/45 mb-6">
                  Attach existing {currentSection.label.toLowerCase()} or create new ones to include in this program.
                </p>
                <button
                  onClick={() => handleOpenAttachModal(currentSection.key)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white px-5 text-xs font-bold transition-colors shadow-sm"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Attach {currentSection.label}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {attachedItems.map((item) => {
                  const link = getItemLink(item, currentSection.key);
                  const statusClass = statusBadgeClass(item.status);
                  return (
                    <article
                      key={item._id}
                      className="rounded-xl overflow-hidden border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-200"
                    >
                      {/* Tinted top */}
                      <div className="px-4 pt-4 pb-3 bg-[#d8e6ef] dark:bg-[#24384e] border-b border-black/10 dark:border-white/10">
                        {item.status && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mb-1.5 ${statusClass}`}>
                            {item.status}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {getItemTitle(item, currentSection.key)}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {getItemSubtitle(item, currentSection.key)}
                        </p>
                      </div>

                      {/* Bottom actions */}
                      <div className="px-4 py-3 flex items-center justify-between gap-2 bg-white/70 dark:bg-transparent">
                        {link ? (
                          <button
                            onClick={() => navigate(link)}
                            className="text-xs font-semibold text-[#3C83F6] dark:text-[#bceaff] hover:underline flex items-center gap-1"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        ) : (
                          <span />
                        )}
                        <button
                          onClick={() => setDetachItem({ typeKey: currentSection.key, item })}
                          title="Detach from Program"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
