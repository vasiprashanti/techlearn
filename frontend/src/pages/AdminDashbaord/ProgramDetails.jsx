import { useState, useEffect, useCallback, useMemo, createElement } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import StudentReportModal from '../../components/AdminDashbaord/StudentReportModal';
import ProgramBlueprintsPanel from './ProgramBlueprintsPanel';
import { adminAPI } from '../../services/adminApi';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
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
  FiFilter,
  FiX,
  FiExternalLink,
  FiAlertCircle,
  FiTag,
  FiClock,
  FiEye,
  FiInfo,
  FiCheck,
  FiCalendar,
  FiTarget,
  FiChevronDown,
  FiEdit2,
} from 'react-icons/fi';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: FiInfo, field: null, route: null },
  { key: 'students', label: 'Students', icon: FiUsers, field: 'studentIds', route: '/students' },
  { key: 'batches', label: 'Batches', icon: FiLayers, field: 'batchIds', route: '/batches' },
  { key: 'courses', label: 'Courses', icon: FiBookOpen, field: 'courseIds', route: '/admin/courses' },
  { key: 'track-templates', label: 'Track Templates', icon: FiGitCommit, field: 'trackTemplateIds', route: '/track-templates' },
  { key: 'roadmaps', label: 'Roadmaps', icon: FiFileText, field: 'roadmapIds', route: '/admin/roadmaps' },
  { key: 'blueprints', label: 'Blueprints', icon: FiLayers, field: null, route: null },
  { key: 'certificates', label: 'Certificates', icon: FiAward, field: 'certificateTemplateIds', route: '/certificates' },
  { key: 'projects', label: 'Projects', icon: FiClipboard, field: 'projectIds', route: '/admin/projects' },
  { key: 'analytics', label: 'Analytics', icon: FiBarChart2, field: null, route: null },
];

const getProgramType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'placement' || normalized.includes('placement') ? 'Placement' : 'Skill';
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

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const getTodayIsoDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

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

const formatDateInputValue = (value) => {
  const date = toValidDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
  const paidAmount = Number(
    enrollment?.pricingPlanSnapshot?.price ??
    enrollment?.pricingPlan?.price ??
    student?.pricingPlan?.price ??
    student?.paidAmount ??
    student?.amount
  );
  const fallbackFee = Number(program?.programFee);
  const effectiveFee = Number.isFinite(paidAmount) && paidAmount > 0
    ? paidAmount
    : (Number.isFinite(fallbackFee) && fallbackFee > 0 ? fallbackFee : null);
  const feeLabel = effectiveFee ? ` ₹${effectiveFee.toLocaleString('en-IN')}` : '';

  const planTitle = enrollment?.pricingPlanSnapshot?.title
    || enrollment?.pricingPlan?.title
    || student?.pricingPlan?.title
    || String(student?.programPlan || '').trim();

  const planBase = planTitle || (isPaid
    ? 'Paid'
    : (totalDays ? `${totalDays}-Day Trial` : 'Free Access'));

  const paymentStatus = enrollment?.paymentStatus || (isPaid ? 'Paid' : (program?.pricingType === 'Free' ? 'Free' : 'Pending'));

  return {
    access: isPaid ? 'Paid' : 'Trial',
    payment: paymentStatus,
    plan: isPaid && feeLabel && !planBase.includes('₹') ? `${planBase}${feeLabel}` : planBase,
    started,
    expires,
    progress: dayNumber
      ? (totalDays ? `Day ${dayNumber} / ${totalDays}` : `Day ${dayNumber}`)
      : '—',
    status: student?.programStatus || student?.status || enrollment?.status || 'Active',
  };
};

const StudentDatabaseTable = ({ students, program, onOpenStudent, onDetach, onEditStartDate }) => (
  <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full text-left">
        <caption className="sr-only">Students enrolled in this program</caption>
        <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
          <tr className="border-b border-black/10 dark:border-white/10">
            {[
              { label: '#', width: 'w-12 min-w-12 text-center' },
              { label: 'Student', width: 'w-48 min-w-48 text-left' },
              { label: 'Status', width: 'w-24 min-w-24 text-center' },
              { label: 'Payment', width: 'w-24 min-w-24 text-center' },
              { label: 'Starts', width: 'w-28 min-w-28 text-left' },
              { label: 'Expires', width: 'w-28 min-w-28 text-left' },
              { label: 'Progress', width: 'w-28 min-w-28 text-center' },
              { label: 'Action', width: 'w-16 min-w-16 text-center' },
            ].map(({ label, width }) => (
              <th
                key={label}
                scope="col"
                className={`${width} px-3 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45 whitespace-nowrap`}
              >
                {label}
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
            const statusLower = String(row.status || '').toLowerCase();
            const paymentLower = String(row.payment || '').toLowerCase();

            return (
              <tr
                key={student._id}
                onClick={() => onOpenStudent(student)}
                className="group border-b border-black/5 dark:border-white/5 last:border-b-0 hover:bg-[#3C83F6]/[0.04] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <td className="w-12 min-w-12 px-3 py-3.5 text-center text-xs font-semibold tabular-nums text-black/45 dark:text-white/45">
                  {String(index + 1).padStart(3, '0')}
                </td>
                <td className="w-48 min-w-48 px-3 py-3.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenStudent(student);
                    }}
                    className="text-left group/student"
                  >
                    <span className="block max-w-[170px] truncate text-sm font-bold text-slate-800 dark:text-white group-hover/student:text-[#3C83F6] dark:group-hover/student:text-[#bceaff] transition-colors whitespace-nowrap">
                      {student.name || student.email || 'Unnamed Student'}
                    </span>
                    {student.email && (
                      <span className="block max-w-[170px] truncate text-[11px] text-black/40 dark:text-white/40 mt-0.5">
                        {student.email}
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-3 py-3.5 text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    statusLower === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : statusLower === 'completed'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                        : statusLower === 'paused'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    paymentLower === 'paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : paymentLower === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        : paymentLower === 'failed'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300'
                  }`}>
                    {row.payment}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>{formatCompactDate(row.started)}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditStartDate(student);
                      }}
                      title="Edit this Program's individual start date"
                      aria-label={`Edit start date for ${student.name || 'student'}`}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#3C83F6] opacity-0 transition-opacity hover:bg-[#3C83F6]/10 group-hover:opacity-100 focus:opacity-100 dark:text-[#bceaff]"
                    >
                      <FiClock className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatCompactDate(row.expires)}
                </td>
                <td className="px-3 py-3.5 text-center text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {row.progress}
                </td>
                <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenStudent(student)}
                      title="View Student Report"
                      className="p-1 rounded-lg text-black/40 hover:text-[#3C83F6] dark:text-white/40 dark:hover:text-[#7fb1ff] hover:bg-black/5 dark:hover:bg-white/5 transition-colors inline-block"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDetach(student)}
                      title="Detach from Program"
                      aria-label={`Detach ${student.name || 'student'} from Program`}
                      className="p-1 rounded-lg text-black/40 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors inline-block"
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

const AttachedEntitiesTable = ({
  items,
  typeKey,
  sectionLabel,
  onNavigate,
  onDetach,
  getItemTitle,
  getItemSubtitle,
  getItemLink,
  statusBadgeClass,
}) => {
  const getHeaders = () => {
    switch (typeKey) {
      case 'batches':
        return [
          { label: '#', width: 'w-12 min-w-12 text-center' },
          { label: 'Batch Name', width: 'min-w-[200px] text-left' },
          { label: 'College', width: 'min-w-[140px] text-left' },
          { label: 'Start Date', width: 'w-28 min-w-28 text-left' },
          { label: 'Expiry Date', width: 'w-28 min-w-28 text-left' },
          { label: 'Status', width: 'w-24 min-w-24 text-center' },
          { label: 'Actions', width: 'w-24 min-w-24 text-center' },
        ];
      case 'courses':
        return [
          { label: '#', width: 'w-12 min-w-12 text-center' },
          { label: 'Course Title', width: 'min-w-[220px] text-left' },
          { label: 'Level', width: 'w-28 min-w-28 text-center' },
          { label: 'Delivery Type', width: 'w-32 min-w-32 text-center' },
          { label: 'Topics', width: 'w-24 min-w-24 text-center' },
          { label: 'Status', width: 'w-24 min-w-24 text-center' },
          { label: 'Actions', width: 'w-24 min-w-24 text-center' },
        ];
      case 'track-templates':
        return [
          { label: '#', width: 'w-12 min-w-12 text-center' },
          { label: 'Template Name', width: 'min-w-[220px] text-left' },
          { label: 'Track Type', width: 'min-w-[140px] text-center' },
          { label: 'Created', width: 'w-28 min-w-28 text-left' },
          { label: 'Status', width: 'w-24 min-w-24 text-center' },
          { label: 'Actions', width: 'w-24 min-w-24 text-center' },
        ];
      case 'roadmaps':
        return [
          { label: '#', width: 'w-12 min-w-12 text-center' },
          { label: 'Roadmap Title', width: 'min-w-[240px] text-left' },
          { label: 'Created', width: 'w-28 min-w-28 text-left' },
          { label: 'Status', width: 'w-24 min-w-24 text-center' },
          { label: 'Actions', width: 'w-24 min-w-24 text-center' },
        ];
      case 'projects':
        return [
          { label: '#', width: 'w-12 min-w-12 text-center' },
          { label: 'Project Title', width: 'min-w-[220px] text-left' },
          { label: 'Category', width: 'min-w-[140px] text-center' },
          { label: 'Duration', width: 'w-28 min-w-28 text-center' },
          { label: 'Status', width: 'w-24 min-w-24 text-center' },
          { label: 'Actions', width: 'w-24 min-w-24 text-center' },
        ];
      case 'certificates':
        return [
          { label: '#', width: 'w-12 min-w-12 text-center' },
          { label: 'Certificate Name', width: 'min-w-[220px] text-left' },
          { label: 'Description', width: 'min-w-[200px] text-left' },
          { label: 'Status', width: 'w-24 min-w-24 text-center' },
          { label: 'Actions', width: 'w-24 min-w-24 text-center' },
        ];
      default:
        return [
          { label: '#', width: 'w-12 min-w-12 text-center' },
          { label: 'Title', width: 'min-w-[220px] text-left' },
          { label: 'Details', width: 'min-w-[160px] text-left' },
          { label: 'Status', width: 'w-24 min-w-24 text-center' },
          { label: 'Actions', width: 'w-24 min-w-24 text-center' },
        ];
    }
  };

  const headers = getHeaders();

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <caption className="sr-only">Attached {sectionLabel} in this program</caption>
          <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
            <tr className="border-b border-black/10 dark:border-white/10">
              {headers.map(({ label, width }) => (
                <th
                  key={label}
                  scope="col"
                  className={`${width} px-3.5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45 whitespace-nowrap`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {items.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-sm text-black/45 dark:text-white/45">
                  No {sectionLabel.toLowerCase()} match your search criteria.
                </td>
              </tr>
            ) : items.map((item, index) => {
              const link = getItemLink(item, typeKey);
              const title = getItemTitle(item, typeKey);
              const subtitle = getItemSubtitle(item, typeKey);
              const statusClass = statusBadgeClass(item.status);

              return (
                <tr
                  key={item._id || index}
                  onClick={() => link && onNavigate(link)}
                  className={`group transition-colors ${
                    link ? 'cursor-pointer hover:bg-[#3C83F6]/[0.04] dark:hover:bg-white/[0.04]' : 'hover:bg-black/[0.01] dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* # */}
                  <td className="w-12 min-w-12 px-3.5 py-3.5 text-center text-xs font-semibold tabular-nums text-black/45 dark:text-white/45">
                    {String(index + 1).padStart(3, '0')}
                  </td>

                  {/* Primary Title + Subtitle */}
                  <td className="px-3.5 py-3.5">
                    <div className="max-w-[320px]">
                      <span className="block truncate text-xs sm:text-sm font-semibold text-slate-800 dark:text-white group-hover:text-[#3C83F6] dark:group-hover:text-[#bceaff] transition-colors">
                        {title}
                      </span>
                      {subtitle && (
                        <span className="block truncate text-[11px] text-black/40 dark:text-white/40 mt-0.5">
                          {subtitle}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Dynamic Columns based on entity type */}
                  {typeKey === 'batches' && (
                    <>
                      <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300">
                        <div className="max-w-[160px] truncate" title={item.college || (item.allColleges ? 'All Colleges' : 'Unassigned')}>
                          {item.college || (item.allColleges ? 'All Colleges' : 'Unassigned')}
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.startDate ? new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </>
                  )}

                  {typeKey === 'courses' && (
                    <>
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                          {item.level || 'Beginner'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.courseType || item.deliveryType || 'Self-Paced'}
                      </td>
                      <td className="px-3.5 py-3.5 text-center text-slate-700 dark:text-slate-200 font-semibold whitespace-nowrap">
                        {Array.isArray(item.topicIds) ? item.topicIds.length : (item.numTopics || 0)}
                      </td>
                    </>
                  )}

                  {typeKey === 'track-templates' && (
                    <>
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                          {item.trackType || 'General'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </>
                  )}

                  {typeKey === 'roadmaps' && (
                    <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  )}

                  {typeKey === 'projects' && (
                    <>
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                          {item.category || 'Standard'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-center text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.duration_days ? `${item.duration_days} Days` : '—'}
                      </td>
                    </>
                  )}

                  {typeKey === 'certificates' && (
                    <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300">
                      <div className="max-w-[260px] truncate" title={item.description || 'Certificate template'}>
                        {item.description || '—'}
                      </div>
                    </td>
                  )}

                  {/* Status Badge */}
                  <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusClass}`}>
                      {item.status || 'Active'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3.5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {link && (
                        <button
                          type="button"
                          onClick={() => onNavigate(link)}
                          title="View Details"
                          className="p-1 rounded-lg text-black/40 hover:text-[#3C83F6] dark:text-white/40 dark:hover:text-[#7fb1ff] hover:bg-black/5 dark:hover:bg-white/5 transition-colors inline-block"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDetach(item)}
                        title="Detach from Program"
                        className="p-1 rounded-lg text-black/40 hover:text-rose-600 dark:text-white/40 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors inline-block"
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
};


const ReportActivity = ({ label, activity, tone }) => (
  <div className="flex items-center justify-between gap-2 text-[10px] leading-tight">
    <span className={`font-bold ${tone}`}>{label}</span>
    <span className={`text-right ${activity?.attempted ? 'text-slate-700 dark:text-slate-200' : 'text-black/35 dark:text-white/35'}`}>
      {activity?.attempted ? `${activity.status} · ${activity.result}` : 'N/A'}
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
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[3300px] w-full text-left">
            <caption className="sr-only">Day-wise program reports for enrolled students</caption>
            <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
              <tr className="border-b border-black/10 dark:border-white/10">
                <th scope="col" className="sticky left-0 z-20 w-12 min-w-12 px-2.5 py-3 bg-[#f9fbfd] dark:bg-[#12244a] text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">#</th>
                <th scope="col" className="sticky left-12 z-20 w-44 min-w-44 px-2.5 py-3 bg-[#f9fbfd] dark:bg-[#12244a] text-[10px] font-bold uppercase tracking-[0.12em] text-black/45 dark:text-white/45">Student</th>
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
                    <td className="sticky left-0 z-10 w-12 min-w-12 px-2.5 py-3.5 bg-white/95 dark:bg-[#0f1f43]/95 text-xs font-semibold tabular-nums text-black/45 dark:text-white/45">
                      {String(index + 1).padStart(3, '0')}
                    </td>
                    <td className="sticky left-12 z-10 w-44 min-w-44 px-2.5 py-3.5 bg-white/95 dark:bg-[#0f1f43]/95">
                      <button
                        type="button"
                        onClick={() => onOpenStudent(student)}
                        className="text-left group/student"
                      >
                        <span className="block max-w-[150px] truncate text-sm font-bold text-slate-800 dark:text-white group-hover/student:text-[#3C83F6] dark:group-hover/student:text-[#bceaff] transition-colors">
                          {student.name || student.email || 'Unnamed Student'}
                        </span>
                        <span className="block max-w-[150px] truncate text-[11px] text-black/40 dark:text-white/40 mt-0.5">
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

const ProgramAnalyticsPanel = ({ program, readinessLeads = [], readinessLoading = false }) => {
  const stats = program?.programStats || {};
  const enrolledStudents = Array.isArray(program?.studentIds) ? program.studentIds : [];
  const metrics = [
    { label: 'Total Enrolled', value: stats.totalEnrolled ?? enrolledStudents.length },
    { label: 'Current Enrolled', value: stats.currentEnrolled ?? 0 },
    { label: 'Active Today', value: stats.activeToday ?? 0 },
    { label: 'Completed', value: stats.completed ?? 0 },
    { label: 'Accuracy', value: stats.accuracy === null || stats.accuracy === undefined ? '—' : `${stats.accuracy}%` },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] px-4 py-3">
            <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{metric.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">{metric.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] px-4 py-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Program performance</h3>
        <p className="mt-1 text-xs text-black/45 dark:text-white/45">
          Analytics are calculated from the learners enrolled in this program and their day-wise activity.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/10 bg-white/80 dark:border-white/10 dark:bg-[#0f1f43]">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3 dark:border-white/5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Readiness leads</h3>
            <p className="mt-1 text-xs text-black/45 dark:text-white/45">Learners who started Day 0 before enrolling in this program.</p>
          </div>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300">{readinessLeads.length}</span>
        </div>
        {readinessLoading ? (
          <div className="px-4 py-6 text-center text-xs text-black/45 dark:text-white/45">Loading readiness leads…</div>
        ) : readinessLeads.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-black/45 dark:text-white/45">No readiness leads yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left">
              <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
                <tr className="border-b border-black/10 dark:border-white/10">
                  {['Learner', 'Role', 'Companies', 'Status', 'Score'].map((label) => (
                    <th key={label} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readinessLeads.map((lead) => {
                  const user = lead.userId || {};
                  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.email || 'Learner';
                  return (
                    <tr key={lead._id} className="border-b border-black/5 last:border-b-0 dark:border-white/5">
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white">
                        {name}<span className="mt-0.5 block text-[11px] font-normal text-black/40 dark:text-white/40">{user.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{lead.targetRole || user.targetRole || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{(lead.targetCompanies || user.targetCompanies || []).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">{lead.status}</td>
                      <td className="px-4 py-3 text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{lead.accuracy === null || lead.accuracy === undefined ? '—' : `${Math.round(Number(lead.accuracy))}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const performanceClassificationClass = (classification) => {
  if (classification === 'Strong') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (classification === 'Average') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (classification === 'Weak') return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300';
};

const formatPerformanceAccuracy = (value) => (
  value === null || value === undefined ? '—' : `${Math.round(Number(value))}%`
);

const ProgramPerformancePanel = ({ performance, loading, error }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] px-4 py-8 text-center text-sm text-black/45 dark:text-white/45">
        Generating performance report from student attempts…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 px-4 py-4 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  const stats = performance?.stats || {};
  const students = performance?.students || [];
  const topics = performance?.topics || [];
  const studentNames = new Map(students.map((student) => [String(student.studentId), student.name || student.email || 'Unnamed Student']));
  const classifications = stats.classificationCounts || {};
  const metrics = [
    { label: 'Questions Attempted', value: stats.questionsAttempted ?? 0 },
    { label: 'Correct Answers', value: stats.correctAnswers ?? 0 },
    { label: 'Accuracy', value: formatPerformanceAccuracy(stats.accuracy) },
    { label: 'Weak Topics', value: classifications.Weak ?? 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Performance profile</h3>
          <p className="mt-1 text-xs text-black/45 dark:text-white/45">
            Generated from Daily Task, Daily Challenge, and dynamic program assignment attempts. Topic summaries feed the revision engine.
          </p>
        </div>
        {performance?.generatedAt && (
          <span className="text-[10px] font-semibold text-black/40 dark:text-white/40">
            Updated {new Date(performance.generatedAt).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] px-4 py-3">
            <p className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{metric.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">{metric.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left">
            <caption className="sr-only">Program topic performance summaries</caption>
            <thead className="bg-black/[0.03] dark:bg-white/[0.04]">
              <tr className="border-b border-black/10 dark:border-white/10">
                {['Student', 'Day', 'Subject', 'Topic', 'Subtopic', 'Attempted', 'Correct', 'Accuracy', 'Status'].map((label) => (
                  <th key={label} scope="col" className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45 whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-black/45 dark:text-white/45">
                    No completed question attempts have been recorded for this program yet.
                  </td>
                </tr>
              ) : topics.map((topic) => (
                <tr key={`${topic.studentId}-${topic.programDay}-${topic.subject}-${topic.topic}-${topic.subtopic}`} className="border-b border-black/5 dark:border-white/5 last:border-b-0">
                  <td className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                    {studentNames.get(String(topic.studentId)) || 'Unnamed Student'}
                  </td>
                  <td className="px-3 py-3 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">Day {topic.programDay}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{topic.subject}</td>
                  <td className="px-3 py-3 text-xs font-semibold text-slate-800 dark:text-white whitespace-nowrap">{topic.topic}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{topic.subtopic}</td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600 dark:text-slate-300">{topic.questionsAttempted}</td>
                  <td className="px-3 py-3 text-xs tabular-nums text-slate-600 dark:text-slate-300">{topic.correctAnswers}</td>
                  <td className="px-3 py-3 text-xs font-semibold tabular-nums text-slate-800 dark:text-white">{formatPerformanceAccuracy(topic.accuracy)}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${performanceClassificationClass(topic.classification)}`}>
                      {topic.classification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PHASE_TITLES = {
  learning: 'Phase 1: Foundational & Core Learning',
  revision: 'Phase 2: Comprehensive Revision & Deep Dive',
  company_preparation: 'Phase 3: Company Preparation & Industry Focus',
  mock_interview: 'Phase 4: Rigorous Mock Interviews & Evaluations',
  final_assessment: 'Phase 5: Final Assessment & Placement Readiness',
};

const ProgramOverviewPanel = ({ program, onProgramUpdated, onNavigateToTab }) => {
  const [editingOutcomes, setEditingOutcomes] = useState(false);
  const [outcomesText, setOutcomesText] = useState(() => (program?.learningGoals || []).join('\n'));
  const [savingOutcomes, setSavingOutcomes] = useState(false);
  const [outcomesError, setOutcomesError] = useState('');
  const [expandedCourseIds, setExpandedCourseIds] = useState(new Set());

  useEffect(() => {
    setOutcomesText((program?.learningGoals || []).join('\n'));
  }, [program?.learningGoals]);

  const toggleCourseExpand = (courseId) => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const handleSaveOutcomes = async () => {
    try {
      setSavingOutcomes(true);
      setOutcomesError('');
      const goals = outcomesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await adminAPI.updateProgram(program._id, { learningGoals: goals });
      if (res && res.success) {
        setEditingOutcomes(false);
        if (onProgramUpdated) onProgramUpdated();
      } else {
        setOutcomesError(res?.message || 'Failed to save outcomes');
      }
    } catch (err) {
      setOutcomesError(err.message || 'Failed to save outcomes');
    } finally {
      setSavingOutcomes(false);
    }
  };

  const attachedCourses = Array.isArray(program?.courseIds) ? program.courseIds : [];
  const phases = Array.isArray(program?.phases) && program.phases.length > 0
    ? program.phases
    : [
        { phase: 'learning', startDay: 1, endDay: 10 },
        { phase: 'revision', startDay: 11, endDay: 15 },
        { phase: 'company_preparation', startDay: 16, endDay: 20 },
        { phase: 'mock_interview', startDay: 21, endDay: 25 },
        { phase: 'final_assessment', startDay: 26, endDay: 30 },
      ];

  const outcomes = Array.isArray(program?.learningGoals) && program.learningGoals.length > 0
    ? program.learningGoals
    : [
        'Master essential role-specific algorithms and industry software design patterns',
        'Build production-grade projects demonstrating full stack architecture',
        'Ace technical and behavioral rounds through targeted mock assessments',
        'Gain confidence and verified credentials recognized by hiring partners',
      ];

  const pricingDisplay = program?.pricingType === 'Paid'
    ? `₹${Number(program?.programFee || 0).toLocaleString('en-IN')}`
    : 'Free';

  return (
    <div className="space-y-6">
      {/* ── Top Overview Banner: Info Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45 block mb-1">
            Program Type & Duration
          </span>
          <p className="text-base font-bold text-slate-800 dark:text-white">
            {getProgramType(program?.programType)} Program
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {program?.duration || `${program?.durationDays || 30} Days`} · {program?.availability || 'Structured'}
          </p>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45 block mb-1">
            Pricing & Visibility
          </span>
          <p className="text-base font-bold text-slate-800 dark:text-white">
            {pricingDisplay}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visibility: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{program?.visibility || 'Public'}</span>
          </p>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45 block mb-1">
            Attached Content
          </span>
          <p className="text-base font-bold text-slate-800 dark:text-white">
            {attachedCourses.length} Course{attachedCourses.length === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            5 Learning Phases · {(program?.learningGoals || []).length} Outcomes
          </p>
        </div>

        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45 block mb-1">
              Live Learner Preview
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Preview the User-side Program Detail page live.
            </p>
          </div>
          <a
            href={`/learn/programs/${program?._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3C83F6]/10 dark:bg-[#bceaff]/15 text-[#3C83F6] dark:text-[#bceaff] text-xs font-bold hover:bg-[#3C83F6]/20 transition-colors"
          >
            <FiEye className="w-3.5 h-3.5" />
            Open Live Detail Page
          </a>
        </div>
      </div>

      {/* Description & Target Roles/Skills */}
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Program Description</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {program?.description || 'No description provided for this program.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-black/5 dark:border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45 block mb-1.5">
              Target Roles
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(program?.targetRoles || []).length > 0 ? (
                program.targetRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-[#bceaff]/15 dark:text-[#bceaff]"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">All Engineering Roles</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45 block mb-1.5">
              Skills Covered
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(program?.skillTags || []).length > 0 ? (
                program.skillTags.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">General Technical Skills</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/45 dark:text-white/45 block mb-1.5">
              Target Companies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(program?.targetCompanies || []).length > 0 ? (
                program.targetCompanies.map((comp) => (
                  <span
                    key={comp}
                    className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                  >
                    {comp}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Tier 1 & Top Tech Companies</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 1: Attached Courses & Curriculum (Controls User Tab 1) ───── */}
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiBookOpen className="w-4 h-4 text-[#3C83F6]" />
              Attached Courses & Curriculum (Controls User Tab 1: Curriculum)
            </h3>
            <p className="text-xs text-black/45 dark:text-white/45 mt-0.5">
              Courses attached to this program control what learners see under &ldquo;What You&apos;ll Learn&rdquo;. Clicking any course reveals its topics.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('courses')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3C83F6]/30 bg-[#3C83F6]/10 text-[#3C83F6] dark:text-[#bceaff] text-xs font-bold hover:bg-[#3C83F6]/20 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Manage Attached Courses
          </button>
        </div>

        {attachedCourses.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-black/15 dark:border-white/15">
            <FiBookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No courses attached yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Attach courses to power the user-side Curriculum tab.</p>
            <button
              onClick={() => onNavigateToTab('courses')}
              className="px-3.5 py-1.5 rounded-lg bg-[#3C83F6] text-white text-xs font-bold hover:bg-[#2f73e0] transition-colors"
            >
              Attach Courses Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {attachedCourses.map((course, idx) => {
              const cId = course?._id || course;
              const isExpanded = expandedCourseIds.has(cId);
              const topics = Array.isArray(course?.topicIds) ? course.topicIds : [];

              return (
                <div
                  key={cId}
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCourseExpand(cId)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-[#3C83F6]/10 text-[#3C83F6] dark:text-[#bceaff] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {course?.title || course?.name || 'Untitled Course'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {topics.length} Curriculum Topics · {course?.level || 'All Levels'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      {isExpanded ? 'Hide Topics' : 'View Topics'}
                      <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-black/5 dark:border-white/5 bg-white/40 dark:bg-black/20">
                      {topics.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No individual topics listed for this course.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {topics.map((topic, topicIdx) => (
                            <div
                              key={topic?._id || topicIdx}
                              className="flex items-center gap-2 p-2 rounded-lg border border-black/5 dark:border-white/5 bg-white/70 dark:bg-[#0f1f43]/70 text-xs text-slate-700 dark:text-slate-200"
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {topicIdx + 1}
                              </span>
                              <span className="truncate">{topic?.title || topic?.name || topic}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Program Schedule (Controls User Tab 2: Schedule) ─────── */}
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-emerald-500" />
              Learning Schedule Phases (Controls User Tab 2: Schedule)
            </h3>
            <p className="text-xs text-black/45 dark:text-white/45 mt-0.5">
              These 5 configured learning phases display in a clean single left-aligned column on the User-side Program Detail page.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {phases.map((phase, idx) => {
            const phaseTitle = PHASE_TITLES[phase.phase] || `Phase ${idx + 1}: ${phase.phase}`;
            const dayRange = `Day ${phase.startDay} - Day ${phase.endDay}`;
            const durationDays = Number(phase.endDay) - Number(phase.startDay) + 1;

            return (
              <div
                key={phase.phase || idx}
                className="flex items-start sm:items-center justify-between p-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {phaseTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configured range: {dayRange} ({durationDays} days)
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                  {dayRange}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Program Outcomes (Controls User Tab 3: Outcomes) ─────── */}
      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiTarget className="w-4 h-4 text-indigo-500" />
              Program Outcomes (Controls User Tab 3: Outcomes)
            </h3>
            <p className="text-xs text-black/45 dark:text-white/45 mt-0.5">
              Admin-managed outcomes displayed directly on the User-side Program Detail page.
            </p>
          </div>
          {!editingOutcomes ? (
            <button
              onClick={() => setEditingOutcomes(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              Edit Outcomes
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingOutcomes(false);
                  setOutcomesText((program?.learningGoals || []).join('\n'));
                  setOutcomesError('');
                }}
                disabled={savingOutcomes}
                className="px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOutcomes}
                disabled={savingOutcomes}
                className="px-3.5 py-1.5 rounded-lg bg-[#3C83F6] hover:bg-[#2f73e0] text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {savingOutcomes ? 'Saving...' : 'Save Outcomes'}
              </button>
            </div>
          )}
        </div>

        {outcomesError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 text-xs font-medium">
            {outcomesError}
          </div>
        )}

        {editingOutcomes ? (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enter program outcomes (one outcome per line):
            </label>
            <textarea
              rows={5}
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
              placeholder="Master essential algorithms...&#10;Build full stack production apps...&#10;Ace technical interviews..."
              className="w-full p-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/90 dark:bg-[#0a1737] text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30 font-sans"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outcomes.map((goal, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {goal}
                </p>
              </div>
            ))}
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dropdownOptionClass = isDarkMode ? 'bg-[#0f1f43] text-white' : 'bg-white text-slate-800';

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const requestedSection = searchParams.get('attachType');
    return SECTIONS.some((section) => section.key === requestedSection) ? requestedSection : 'overview';
  });
  const currentSection = useMemo(() => SECTIONS.find((s) => s.key === activeTab) || SECTIONS[0], [activeTab]);
  const [studentsSubTab, setStudentsSubTab] = useState('students');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPeriodFilter, setStudentPeriodFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');
  const [studentAccessFilter, setStudentAccessFilter] = useState('all');
  const [studentPlanFilter, setStudentPlanFilter] = useState('all');
  const [studentSort, setStudentSort] = useState('latest');
  const [sectionSearch, setSectionSearch] = useState('');
  const [sectionStatusFilter, setSectionStatusFilter] = useState('all');
  const [sectionSort, setSectionSort] = useState('default');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState('');
  const [readinessLeads, setReadinessLeads] = useState([]);
  const [readinessLeadsLoading, setReadinessLeadsLoading] = useState(false);

  const [attachModalType, setAttachModalType] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [batches, setBatches] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [individualStartDate, setIndividualStartDate] = useState(getTodayIsoDate);
  const [studentAddMode, setStudentAddMode] = useState('existing');
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    collegeId: '',
    primaryTrack: 'General Track',
    status: 'Active',
  });
  const [studentFormError, setStudentFormError] = useState('');
  const [savingNewStudent, setSavingNewStudent] = useState(false);
  const [attaching, setAttaching] = useState(false);

  const [detachItem, setDetachItem] = useState(null);
  const [detaching, setDetaching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [startDateEdit, setStartDateEdit] = useState(null);
  const [savingStartDate, setSavingStartDate] = useState(false);
  const [startDateError, setStartDateError] = useState('');

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
    if (activeTab !== 'students' || studentsSubTab !== 'reports') return undefined;

    let cancelled = false;
    setPerformanceLoading(true);
    setPerformanceError('');
    adminAPI
      .getProgramPerformance(programId)
      .then((response) => {
        if (cancelled) return;
        if (!response?.performance) {
          setPerformanceError('Performance report data was not returned.');
          return;
        }
        setPerformance(response.performance);
      })
      .catch((err) => {
        if (!cancelled) setPerformanceError(err.message || 'Failed to generate performance report.');
      })
      .finally(() => {
        if (!cancelled) setPerformanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, studentsSubTab, programId]);

  useEffect(() => {
    if (activeTab !== 'analytics') return undefined;
    let cancelled = false;
    setReadinessLeadsLoading(true);
    adminAPI.getProgramReadinessLeads(programId)
      .then((response) => {
        if (!cancelled) setReadinessLeads(response?.leads || []);
      })
      .catch((err) => {
        if (!cancelled) console.error('Error fetching readiness leads:', err);
      })
      .finally(() => {
        if (!cancelled) setReadinessLeadsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTab, programId]);

  const handleBlueprintCountChange = useCallback((count) => {
    setProgram((current) => (current ? { ...current, blueprintCount: count } : current));
  }, []);

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
    const today = startOfDay(now);

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

      if (studentPeriodFilter === 'active') {
        const started = startOfDay(row.started);
        const expires = startOfDay(row.expires);
        const storedStatus = String(row.status || '').trim().toLowerCase();
        const isActiveNow = Boolean(
          started
          && today
          && started <= today
          && (!expires || expires >= today)
          && !['completed', 'expired'].includes(storedStatus)
        );
        if (!isActiveNow) return false;
      }

      if (studentPeriodFilter === 'current') {
        const started = startOfDay(row.started);
        if (!started || started.getFullYear() !== currentYear || started.getMonth() !== currentMonth) return false;
      }

      if (studentStatusFilter !== 'all' && row.status !== studentStatusFilter) return false;
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

  // Reset sectionSearch and filter on tab change
  useEffect(() => {
    setSectionSearch('');
    setSectionStatusFilter('all');
    setSectionSort('default');
  }, [activeTab]);

  const visibleAttachedItems = useMemo(() => {
    if (!program || !currentSection || !currentSection.field) return [];
    const items = Array.isArray(program[currentSection.field]) ? program[currentSection.field] : [];
    const search = sectionSearch.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const title = getItemTitle(item, currentSection.key).toLowerCase();
      const subtitle = getItemSubtitle(item, currentSection.key).toLowerCase();
      if (search && !title.includes(search) && !subtitle.includes(search)) {
        return false;
      }
      if (sectionStatusFilter !== 'all') {
        const itemStatus = String(item.status || 'Active').toLowerCase();
        if (itemStatus !== sectionStatusFilter.toLowerCase()) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (sectionSort === 'name-asc') {
        return getItemTitle(a, currentSection.key).localeCompare(getItemTitle(b, currentSection.key));
      }
      if (sectionSort === 'name-desc') {
        return getItemTitle(b, currentSection.key).localeCompare(getItemTitle(a, currentSection.key));
      }
      if (sectionSort === 'newest') {
        const timeA = new Date(a.createdAt || a.startDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.startDate || 0).getTime();
        return timeB - timeA;
      }
      if (sectionSort === 'oldest') {
        const timeA = new Date(a.createdAt || a.startDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.startDate || 0).getTime();
        return timeA - timeB;
      }
      return 0;
    });
  }, [program, currentSection, sectionSearch, sectionStatusFilter, sectionSort]);

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
    setIndividualStartDate(getTodayIsoDate());
    setAvailableSearch('');
    setStudentAddMode('existing');
    setStudentFormError('');
    setNewStudentForm({ name: '', email: '', collegeId: '', primaryTrack: 'General Track', status: 'Active' });
    fetchAvailableEntities(entityType, '');
    if (entityType === 'students') {
      Promise.all([adminAPI.getBatches(), adminAPI.getColleges()])
        .then(([batchResponse, collegeResponse]) => {
          const batchItems = Array.isArray(batchResponse)
            ? batchResponse
            : (batchResponse?.batches || batchResponse?.items || batchResponse?.data || []);
          const collegeItems = Array.isArray(collegeResponse)
            ? collegeResponse
            : (collegeResponse?.colleges || collegeResponse?.items || collegeResponse?.data || []);
          setBatches(batchItems.map((batch) => ({
            id: batch.id || batch._id,
            name: batch.name || batch.id || 'Untitled Batch',
          })).filter((batch) => batch.id));
          setColleges(collegeItems.map((college) => ({
            id: college.id || college._id,
            name: college.name || 'Untitled College',
          })).filter((college) => college.id));
        })
        .catch((err) => {
          console.error('Error fetching student metadata for program enrollment:', err);
          setBatches([]);
          setColleges([]);
        });
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleConfirmAttach = async () => {
    if (!attachModalType) return;

    if (attachModalType === 'students' && studentAddMode === 'new') {
      if (!newStudentForm.name.trim()) {
        setStudentFormError('Name is required.');
        return;
      }
      if (!newStudentForm.email.trim()) {
        setStudentFormError('Email is required.');
        return;
      }
      if (!newStudentForm.collegeId) {
        setStudentFormError('College is required.');
        return;
      }

      try {
        setSavingNewStudent(true);
        setStudentFormError('');
        await adminAPI.createStudent({
          name: newStudentForm.name.trim(),
          email: newStudentForm.email.trim().toLowerCase(),
          collegeId: newStudentForm.collegeId,
          batchId: selectedBatchId || null,
          programId,
          primaryTrack: newStudentForm.primaryTrack.trim() || 'General Track',
          status: newStudentForm.status,
          ...(selectedBatchId ? {} : { individualStartDate }),
        });
        setAttachModalType(null);
        setToastMessage('Student added to Program successfully.');
        fetchProgramDetail();
      } catch (err) {
        setStudentFormError(err.message || 'Failed to add student.');
      } finally {
        setSavingNewStudent(false);
      }
      return;
    }

    if (selectedIds.length === 0) return;
    try {
      setAttaching(true);
      await adminAPI.attachProgramEntities(
        programId,
        attachModalType,
        selectedIds,
        attachModalType === 'students'
          ? { batchId: selectedBatchId || null, ...(selectedBatchId ? {} : { individualStartDate }) }
          : {}
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

  const handleConfirmDetach = async (options = {}) => {
    if (!detachItem) return;
    try {
      setDetaching(true);
      await adminAPI.detachProgramEntity(programId, detachItem.typeKey, detachItem.item._id, options);
      setDetachItem(null);
      setToastMessage(options.removeEnrollment ? 'Successfully detached student and removed enrollment.' : 'Successfully detached item from Program.');
      fetchProgramDetail();
    } catch (err) {
      console.error('Error detaching entity:', err);
      alert(err.message || 'Failed to detach entity');
    } finally {
      setDetaching(false);
    }
  };

  const handleDeleteStudentEntry = async () => {
    if (!detachItem || detachItem.typeKey !== 'students') return;
    const confirmDelete = window.confirm(`Permanently delete the entire student profile for "${getItemTitle(detachItem.item, 'students')}"? This will delete all submissions and records for this user.`);
    if (!confirmDelete) return;

    try {
      setDetaching(true);
      await adminAPI.deleteStudent(detachItem.item._id);
      setDetachItem(null);
      setToastMessage('Successfully deleted student record entirely.');
      fetchProgramDetail();
    } catch (err) {
      console.error('Error deleting student record:', err);
      alert(err.message || 'Failed to delete student record');
    } finally {
      setDetaching(false);
    }
  };

  const handleEditStartDate = (student) => {
    const enrollment = student?.enrollment || null;
    const batch = findStudentBatch(student, enrollment, program);
    setStartDateError('');
    setStartDateEdit({
      student,
      value: formatDateInputValue(
        enrollment?.individualStartDate
          || student?.scheduleStartDate
          || student?.programStartDate
          || batch?.startDate
          || student?.createdAt
      ),
      batch,
    });
  };

  const handleSaveStartDate = async () => {
    if (!startDateEdit?.student?._id || !startDateEdit.value || startDateEdit.batch) return;
    try {
      setSavingStartDate(true);
      setStartDateError('');
      await adminAPI.updateStudentProgramStartDate(startDateEdit.student._id, programId, startDateEdit.value);
      setStartDateEdit(null);
      setToastMessage('Program start date updated.');
      fetchProgramDetail();
    } catch (err) {
      setStartDateError(err.message || 'Failed to update the Program start date.');
    } finally {
      setSavingStartDate(false);
    }
  };

  const handleCreateNewResource = (section) => {
    const returnUrl = encodeURIComponent(`/programs/${programId}?attachType=${section.key}`);
    navigate(`${section.route}?returnTo=${returnUrl}&programId=${programId}&attachType=${section.key}`);
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

  const CurrentSectionIcon = currentSection.icon;
  const attachedItems = program[currentSection.field] || [];
  const programStats = program.programStats || {};
  const totalEnrolled = Number.isFinite(Number(programStats.totalEnrolled))
    ? Number(programStats.totalEnrolled)
    : attachedItems.length;
  const programPrice = program.pricingType === 'Paid'
    ? `₹${Number(program.programFee || 0).toLocaleString('en-IN')}`
    : 'Free';
  const activeStudentFilterCount = [studentStatusFilter, studentAccessFilter, studentPlanFilter]
    .filter((value) => value !== 'all').length;
  const studentFilterGroups = [
    {
      label: 'Status',
      value: studentStatusFilter,
      onChange: setStudentStatusFilter,
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'Active' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Expired', value: 'Expired' },
      ],
    },
    {
      label: 'Access',
      value: studentAccessFilter,
      onChange: setStudentAccessFilter,
      options: [
        { label: 'All', value: 'all' },
        { label: 'Trial', value: 'Trial' },
        { label: 'Paid', value: 'Paid' },
      ],
    },
    {
      label: 'Plan',
      value: studentPlanFilter,
      onChange: setStudentPlanFilter,
      options: [
        { label: 'All', value: 'all' },
        { label: 'Trial', value: 'trial' },
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
      ],
    },
  ];

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Background Gradient — identical to Programs / Question Bank */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

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

      {startDateEdit && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setStartDateEdit(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0a1737]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#3C83F6] dark:text-[#bceaff]">Edit Program start date</h3>
                <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                  {startDateEdit.student?.name || startDateEdit.student?.email || 'Learner'}
                </p>
              </div>
              <button type="button" onClick={() => setStartDateEdit(null)} className="text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {startDateEdit.batch ? (
              <div className="mt-5 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-3 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                This learner is assigned to {startDateEdit.batch.name || 'a batch'}. The batch controls this Program schedule; remove the batch assignment before choosing an individual date.
              </div>
            ) : (
              <label className="mt-5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Individual start date
                <input
                  type="date"
                  value={startDateEdit.value}
                  onChange={(event) => setStartDateEdit((current) => ({ ...current, value: event.target.value }))}
                  className="mt-2 block w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-[#3C83F6] dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
            )}

            {startDateError && <p className="mt-3 text-xs text-red-600 dark:text-red-300">{startDateError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setStartDateEdit(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5">
                Cancel
              </button>
              <button
                type="button"
                disabled={savingStartDate || Boolean(startDateEdit.batch) || !startDateEdit.value}
                onClick={handleSaveStartDate}
                className="rounded-lg bg-[#3C83F6] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2f73e0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingStartDate ? 'Saving…' : 'Save date'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Attach Existing Modal ───────────────────────────────────────────── */}
      {attachModalType && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setAttachModalType(null)} />
          <div className="relative w-full max-w-2xl rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[#3C83F6] dark:text-[#bceaff]">
                  {attachModalType === 'students' ? 'Add Student' : `Attach Existing ${currentSection.label}`}
                </h3>
                <p className="text-[11px] text-black/45 dark:text-white/45 mt-0.5">
                  {attachModalType === 'students'
                    ? 'Add an existing learner or create a new learner for this program'
                    : 'Select items to attach to this program'}
                </p>
              </div>
              <button
                onClick={() => setAttachModalType(null)}
                className="text-sm text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
              >
                Close
              </button>
            </div>

            {attachModalType === 'students' && (
              <div className="px-5 pt-4 pb-2 shrink-0">
                <div className="inline-flex rounded-lg border border-black/10 dark:border-white/10 p-1 bg-black/[0.03] dark:bg-white/5">
                  {[
                    { key: 'existing', label: 'Existing student' },
                    { key: 'new', label: 'New student' },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => {
                        setStudentAddMode(mode.key);
                        setStudentFormError('');
                        setSelectedIds([]);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${studentAddMode === mode.key
                        ? 'bg-white dark:bg-[#18365f] text-[#3C83F6] dark:text-white shadow-sm'
                        : 'text-black/55 dark:text-white/60'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            {studentAddMode === 'existing' && (
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
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35"
                  />
                </div>
              </div>
            )}

            {attachModalType === 'students' && studentAddMode === 'new' && (
              <div className="px-5 pt-2 pb-3 shrink-0 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-black/50 dark:text-white/50 mb-1.5">Name*</span>
                    <input
                      value={newStudentForm.name}
                      onChange={(event) => setNewStudentForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Student name"
                      className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-black/50 dark:text-white/50 mb-1.5">Email*</span>
                    <input
                      type="email"
                      value={newStudentForm.email}
                      onChange={(event) => setNewStudentForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="student@example.com"
                      className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-black/50 dark:text-white/50 mb-1.5">College*</span>
                    <select
                      value={newStudentForm.collegeId}
                      onChange={(event) => setNewStudentForm((current) => ({ ...current, collegeId: event.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    >
                      <option value="">Select college</option>
                      {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-black/50 dark:text-white/50 mb-1.5">Status</span>
                    <select
                      value={newStudentForm.status}
                      onChange={(event) => setNewStudentForm((current) => ({ ...current, status: event.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </label>
                </div>
                {studentFormError && <p className="text-xs text-red-500">{studentFormError}</p>}
              </div>
            )}

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
                {!selectedBatchId && (
                  <label className="block mt-3">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-black/50 dark:text-white/50 mb-1.5">Individual start date</span>
                    <input
                      type="date"
                      value={individualStartDate}
                      onChange={(event) => setIndividualStartDate(event.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#3C83F6]/30"
                    />
                    <span className="block text-[11px] text-black/40 dark:text-white/45 mt-1">Admin can adjust this date without putting the learner in a batch.</span>
                  </label>
                )}
              </div>
            )}

            {/* Item List */}
            {studentAddMode === 'existing' && (
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
            )}

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/50 dark:bg-[#0a1737]/50">
              <span className="text-xs text-black/45 dark:text-white/45">
                {studentAddMode === 'new' ? 'New student' : `${selectedIds.length} item(s) selected`}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAttachModalType(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-black/10 dark:border-white/15 text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={studentAddMode === 'new' ? savingNewStudent : selectedIds.length === 0 || attaching}
                  onClick={handleConfirmAttach}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#3C83F6] hover:bg-[#2f73e0] text-white transition-colors disabled:opacity-50 shadow-sm"
                >
                  {studentAddMode === 'new'
                    ? (savingNewStudent ? 'Adding...' : 'Add Student')
                    : (attaching ? 'Attaching...' : `Add (${selectedIds.length})`)}
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
          <div className="relative w-full max-w-lg rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              {detachItem.typeKey === 'students' ? 'Remove or Delete Student?' : 'Detach Item?'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Selected item:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {getItemTitle(detachItem.item, detachItem.typeKey)}
              </span>
            </p>

            {detachItem.typeKey === 'students' ? (
              <div className="space-y-3 mb-5">
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold mb-1">Choose how you want to remove this student:</p>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li><strong>Detach &amp; Remove Enrollment:</strong> Unenrolls the student from this program so they no longer see "Enrolled". Their user account remains intact.</li>
                    <li><strong>Delete Entire Student Record:</strong> Permanently deletes this student and all their associated records from the database.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs mb-5">
                This only removes the association — the resource itself won't be deleted.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={detaching}
                onClick={() => setDetachItem(null)}
                className="h-9 px-4 rounded-xl border border-black/10 dark:border-white/15 text-xs font-semibold text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>

              {detachItem.typeKey === 'students' ? (
                <>
                  <button
                    type="button"
                    disabled={detaching}
                    onClick={() => handleConfirmDetach({ removeEnrollment: true })}
                    className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-75 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>{detaching ? 'Processing...' : 'Detach & Remove Enrollment'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={detaching}
                    onClick={handleDeleteStudentEntry}
                    className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>{detaching ? 'Processing...' : 'Delete Entire Record'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={detaching}
                  onClick={() => handleConfirmDetach()}
                  className="h-9 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>{detaching ? 'Detaching...' : 'Detach'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-24 pb-6 px-3 sm:px-5 lg:px-8 overflow-y-auto overflow-x-hidden flex flex-col justify-between`}
      >
        <div className="max-w-[1600px] w-full mx-auto space-y-4">

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

          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h1 className="admin-page-title text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {program.name}
              </h1>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadgeClass(program.status)}`}>
                {program.status}
              </span>
            </div>
            <div className="flex flex-col sm:items-end text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-0.5">
              <div><span className="text-black/40 dark:text-white/40 font-normal">Type: </span>{getProgramType(program.programType)}</div>
              <div><span className="text-black/40 dark:text-white/40 font-normal">Duration: </span>{program.duration || '—'}</div>
              <div><span className="text-black/40 dark:text-white/40 font-normal">Fee: </span>{programPrice}</div>
            </div>
          </div>

          {/* ── Dynamic Metric Cards (Compact) ───────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { label: 'Total Enrolled', count: totalEnrolled, color: 'text-[#3C83F6] dark:text-blue-400' },
              { label: 'Current Enrolled', count: programStats.currentEnrolled ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Active Today', count: programStats.activeToday ?? 0, color: 'text-purple-600 dark:text-purple-400' },
              { label: 'Completed', count: programStats.completed ?? 0, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Accuracy', count: programStats.accuracy === null || programStats.accuracy === undefined ? '—' : `${programStats.accuracy}%`, color: 'text-[#3C83F6] dark:text-blue-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-3 py-2 flex flex-col items-start text-left shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">{label}</p>
                <p className={`text-base sm:text-xl font-semibold tracking-tight mt-0.5 ${color}`}>{count}</p>
              </div>
            ))}
          </div>

          {/* ── Navigation Tabs ──────────────────────────────────────── */}
          <div className="flex border-b border-black/10 dark:border-white/10 gap-1 overflow-x-auto">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const count = sec.key === 'blueprints'
                ? Number(program.blueprintCount || 0)
                : sec.key === 'students'
                  ? totalEnrolled
                  : sec.field
                    ? (program[sec.field] || []).length
                    : null;
              const isActive = activeTab === sec.key;
              return (
                <button
                  key={sec.key}
                  onClick={() => setActiveTab(sec.key)}
                  className={`px-3 py-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-[#3C83F6] text-[#3C83F6] dark:text-[#7fb1ff]'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.label}</span>
                  {count !== null && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#3C83F6]/15 text-[#3C83F6] dark:bg-blue-400/20 dark:text-[#7fb1ff]'
                        : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
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
                  {currentSection.key === 'overview'
                    ? 'Program Overview'
                    : currentSection.key === 'students'
                    ? 'Students'
                    : currentSection.key === 'blueprints'
                    ? 'Blueprints'
                    : currentSection.key === 'analytics'
                    ? 'Analytics'
                    : `Attached ${currentSection.label}`}
                  {currentSection.key !== 'overview' && currentSection.key !== 'analytics' && currentSection.key !== 'blueprints' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#3C83F6]/10 dark:bg-[#bceaff]/15 text-[#3C83F6] dark:text-[#bceaff]">
                      {currentSection.key === 'students' ? visibleStudentItems.length : attachedItems.length}
                    </span>
                  )}
                </h2>
                {currentSection.key !== 'overview' && currentSection.key !== 'students' && currentSection.key !== 'blueprints' && (
                  <p className="text-xs text-black/45 dark:text-white/45 mt-0.5">
                    {currentSection.key === 'analytics'
                      ? 'Program performance overview'
                      : `Manage attached ${currentSection.label.toLowerCase()} or add new resources`}
                  </p>
                )}
                {currentSection.key === 'blueprints' && (
                  <p className="text-xs text-black/45 dark:text-white/45 mt-0.5">
                    Configure dynamic question mixes for this {getProgramType(program.programType)} program.
                  </p>
                )}
              </div>

              {currentSection.key === 'overview' ? null : currentSection.key === 'students' ? (
                <button
                  onClick={() => handleOpenAttachModal('students')}
                  className="h-8 px-3.5 rounded-xl bg-[#3C83F6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2f73e0] transition-colors whitespace-nowrap"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Student
                </button>
              ) : currentSection.key !== 'analytics' && currentSection.key !== 'blueprints' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCreateNewResource(currentSection)}
                    className="h-8 px-3.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                  >
                    <FiExternalLink className="w-3.5 h-3.5" />
                    Create New
                  </button>
                  <button
                    onClick={() => handleOpenAttachModal(currentSection.key)}
                    className="h-8 px-3.5 rounded-xl bg-[#3C83F6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2f73e0] transition-colors whitespace-nowrap"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    Attach Existing
                  </button>
                </div>
              ) : null}
            </div>

            {/* Attached Items */}
            {currentSection.key === 'overview' ? (
              <ProgramOverviewPanel
                program={program}
                onProgramUpdated={fetchProgramDetail}
                onNavigateToTab={(tabKey) => setActiveTab(tabKey)}
              />
            ) : currentSection.key === 'blueprints' ? (
              <ProgramBlueprintsPanel
                programId={programId}
                programType={getProgramType(program.programType)}
                onCountChange={handleBlueprintCountChange}
              />
            ) : currentSection.key === 'analytics' ? (
              <ProgramAnalyticsPanel program={program} readinessLeads={readinessLeads} readinessLoading={readinessLeadsLoading} />
            ) : currentSection.key === 'students' ? (
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

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 w-full">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-0">
                      <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35 dark:text-white/35" />
                      <input
                        type="search"
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        placeholder="Search students..."
                        aria-label="Search students"
                        className="w-full h-8 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-8 pr-3 text-xs text-black/80 dark:text-white placeholder:text-black/35 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {/* Sort Dropdown */}
                    <div className="relative min-w-[155px]">
                      <select
                        value={studentSort}
                        onChange={(event) => setStudentSort(event.target.value)}
                        aria-label="Sort students"
                        className="w-full h-8 px-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option className={dropdownOptionClass} value="latest">Latest Joined</option>
                        <option className={dropdownOptionClass} value="oldest">Oldest Joined</option>
                        <option className={dropdownOptionClass} value="name-asc">Name A–Z</option>
                        <option className={dropdownOptionClass} value="name-desc">Name Z–A</option>
                        <option className={dropdownOptionClass} value="progress-high">Progress Highest</option>
                        <option className={dropdownOptionClass} value="progress-low">Progress Lowest</option>
                      </select>
                    </div>

                    {/* Period Filter Dropdown */}
                    <div className="relative min-w-[125px]">
                      <select
                        value={studentPeriodFilter}
                        onChange={(event) => setStudentPeriodFilter(event.target.value)}
                        aria-label="Student period filter"
                        className="w-full h-8 px-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option className={dropdownOptionClass} value="active">Current Active</option>
                        <option className={dropdownOptionClass} value="current">Current Month</option>
                        <option className={dropdownOptionClass} value="all">All Time</option>
                      </select>
                    </div>

                    {/* Filter Button */}
                    <div className="relative">
                      <button
                        type="button"
                        aria-expanded={filtersOpen}
                        aria-haspopup="true"
                        onClick={() => setFiltersOpen((open) => !open)}
                        className="inline-flex h-8 min-w-[105px] items-center justify-center gap-1.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] px-3 text-xs font-semibold text-slate-800 dark:text-white outline-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <FiFilter className="w-3.5 h-3.5" />
                        Filter
                        {activeStudentFilterCount > 0 && (
                          <span className="inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-[#3C83F6] px-1 text-[10px] font-bold text-white">
                            {activeStudentFilterCount}
                          </span>
                        )}
                      </button>

                      {filtersOpen && (
                        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,360px)] rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] p-3 shadow-2xl">
                          <div className="flex items-center justify-between gap-3 border-b border-black/5 dark:border-white/10 pb-2">
                            <p className="text-xs font-bold text-slate-800 dark:text-white">Filter students</p>
                            <button
                              type="button"
                              onClick={() => {
                                setStudentStatusFilter('all');
                                setStudentAccessFilter('all');
                                setStudentPlanFilter('all');
                              }}
                              className="text-[11px] font-semibold text-[#3C83F6] dark:text-[#bceaff] hover:underline"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="space-y-3 pt-3">
                            {studentFilterGroups.map((group) => (
                              <div key={group.label}>
                                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-black/45 dark:text-white/45">
                                  {group.label}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.options.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      aria-pressed={group.value === option.value}
                                      onClick={() => group.onChange(option.value)}
                                      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                                        group.value === option.value
                                          ? 'border-[#3C83F6] bg-[#3C83F6]/10 text-[#3C83F6] dark:border-[#bceaff] dark:bg-[#bceaff]/10 dark:text-[#bceaff]'
                                          : 'border-black/10 bg-black/[0.02] text-slate-600 hover:bg-black/[0.05] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.08]'
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {studentsSubTab === 'reports' ? (
                  <>
                    <ProgramPerformancePanel
                      performance={performance}
                      loading={performanceLoading}
                      error={performanceError}
                    />
                    <ProgramReportsTable
                      students={visibleStudentItems}
                      program={program}
                      onOpenStudent={setSelectedStudent}
                    />
                  </>
                ) : (
                  <StudentDatabaseTable
                    students={visibleStudentItems}
                    program={program}
                    onOpenStudent={setSelectedStudent}
                    onEditStartDate={handleEditStartDate}
                    onDetach={(student) => setDetachItem({ typeKey: currentSection.key, item: student })}
                  />
                )}
              </>
            ) : attachedItems.length === 0 ? (
              <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl p-16 text-center shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
                <div className="w-14 h-14 rounded-xl bg-[#3C83F6]/10 dark:bg-[#bceaff]/20 text-[#3C83F6] dark:text-[#bceaff] flex items-center justify-center mx-auto mb-4">
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
              <div className="space-y-3">
                {/* Search & Filter Toolbar for attached entities */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 w-full">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-0">
                      <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/35 dark:text-white/35" />
                      <input
                        type="search"
                        value={sectionSearch}
                        onChange={(event) => setSectionSearch(event.target.value)}
                        placeholder={`Search attached ${currentSection.label.toLowerCase()}...`}
                        aria-label={`Search ${currentSection.label.toLowerCase()}`}
                        className="w-full h-8 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-8 pr-3 text-xs text-black/80 dark:text-white placeholder:text-black/35 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    {/* Status Dropdown */}
                    <div className="relative min-w-[125px]">
                      <select
                        value={sectionStatusFilter}
                        onChange={(event) => setSectionStatusFilter(event.target.value)}
                        aria-label="Filter by status"
                        className="w-full h-8 px-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option className={dropdownOptionClass} value="all">All Status</option>
                        <option className={dropdownOptionClass} value="active">Active</option>
                        <option className={dropdownOptionClass} value="draft">Draft</option>
                        <option className={dropdownOptionClass} value="completed">Completed</option>
                        <option className={dropdownOptionClass} value="archived">Archived</option>
                      </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative min-w-[145px]">
                      <select
                        value={sectionSort}
                        onChange={(event) => setSectionSort(event.target.value)}
                        aria-label="Sort items"
                        className="w-full h-8 px-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
                      >
                        <option className={dropdownOptionClass} value="default">Default Order</option>
                        <option className={dropdownOptionClass} value="name-asc">Name A–Z</option>
                        <option className={dropdownOptionClass} value="name-desc">Name Z–A</option>
                        <option className={dropdownOptionClass} value="newest">Newest First</option>
                        <option className={dropdownOptionClass} value="oldest">Oldest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table View */}
                <AttachedEntitiesTable
                  items={visibleAttachedItems}
                  typeKey={currentSection.key}
                  sectionLabel={currentSection.label}
                  onNavigate={navigate}
                  onDetach={(item) => setDetachItem({ typeKey: currentSection.key, item })}
                  getItemTitle={getItemTitle}
                  getItemSubtitle={getItemSubtitle}
                  getItemLink={getItemLink}
                  statusBadgeClass={statusBadgeClass}
                />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
