import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBell,
  FiSearch,
  FiBarChart2,
  FiCode,
  FiDatabase,
  FiGlobe,
  FiPlus,
  FiTerminal,
  FiCpu,
  FiX,
  FiTrash2,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiTag,
} from 'react-icons/fi';
import { PiBrainLight } from 'react-icons/pi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/Loader/Loader3D';
import { adminAPI, preferRemoteData } from '../../services/adminApi';

const iconMap = {
  chart: FiBarChart2,
  code: FiCode,
  cpu: FiCpu,
  database: FiDatabase,
  globe: FiGlobe,
  terminal: FiTerminal,
  brain: PiBrainLight,
};

const categorySlugMap = {
  'Data Structures & Algorithms': 'data-structures-algorithms',
  'Web Development': 'web-development',
  'Python Programming': 'python-programming',
  'Database Management': 'database-management',
  'Machine Learning': 'machine-learning',
};

const slugifyCategory = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const resolveMcqSection = (category) =>
  category?.mcqSection === 'Aptitude'
  || /aptitude/i.test(`${category?.title || ''} ${category?.slug || ''}`)
    ? 'Aptitude'
    : 'Technical';

const difficultyPillClass = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-[#16a34a] text-white';
  if (difficulty === 'Medium') return 'bg-[#dbe7ff] text-[#3c83f6]';
  return 'bg-[#fee2e2] text-[#b91c1c]';
};

const statusPillClass = (status) =>
  status === 'Active'
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

export default function TrackTemplateDetails() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [trackDetail, setTrackDetail] = useState(null);
  const [isTrackLoading, setIsTrackLoading] = useState(!location.state?.track);
  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);
  const [addDayForm, setAddDayForm] = useState({
    dayNumber: '1',
    questionId: '',
    questionIds: [],
    taskType: 'Coding',
    batchId: '',
    status: 'Published',
  });

  const [allCategories, setAllCategories] = useState([]);
  const [expandedDays, setExpandedDays] = useState({});
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideDayNumber, setOverrideDayNumber] = useState(null);
  const [overrideTimeVal, setOverrideTimeVal] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminAPI
      .getQuestionCategories()
      .then((remoteCategories) => {
        if (!cancelled) {
          setAllCategories(preferRemoteData(remoteCategories, []));
        }
      })
      .catch(() => {
        if (!cancelled) setAllCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const track = useMemo(() => {
    if (trackDetail) return trackDetail;
    if (location.state?.track) return location.state.track;
    return null;
  }, [trackDetail, location.state, templateId]);

  // Helper to determine if track has MCQ and/or Coding category elements
  const { hasMcq, hasCoding, hasAptitudeMcq } = useMemo(() => {
    const categories = track?.category
      ? track.category.split(',').map((c) => c.trim().toLowerCase())
      : [];
    
    let mcq = false;
    let coding = false;
    let aptitudeMcq = false;

    categories.forEach((catName) => {
      const dbCat = allCategories.find(
        (c) => (c.title && c.title.toLowerCase() === catName) || c.slug === slugifyCategory(catName)
      );
      if (dbCat) {
        if (dbCat.categoryType === 'MCQ') {
          mcq = true;
          if (resolveMcqSection(dbCat) === 'Aptitude') aptitudeMcq = true;
        }
        if (dbCat.categoryType === 'Coding') coding = true;
      }
    });

    const fallbackMcq = categories.includes('mcq') || categories.includes('aptitude') || categories.includes('core cs');
    const fallbackCoding = categories.includes('coding') || categories.includes('debugging');

    return { hasMcq: mcq || fallbackMcq, hasCoding: coding || fallbackCoding, hasAptitudeMcq: aptitudeMcq || categories.includes('aptitude') };
  }, [track?.category, allCategories]);

  const defaultTaskType = useMemo(() => {
    if (hasMcq && !hasCoding) {
      return hasAptitudeMcq ? 'Aptitude' : 'MCQ';
    }
    return 'Coding';
  }, [hasMcq, hasCoding, hasAptitudeMcq]);

  const categorySlug = useMemo(() => {
    if (!track || !track.category) return null;
    return track.category
      .split(",")
      .map((cat) => {
        const trimmed = cat.trim();
        const dbCat = allCategories.find(
          (candidate) => (candidate.title && candidate.title.toLowerCase() === trimmed.toLowerCase())
            || candidate.slug === slugifyCategory(trimmed)
        );
        return dbCat?.slug || categorySlugMap[trimmed] || slugifyCategory(trimmed);
      })
      .filter(Boolean)
      .join(",");
  }, [track, allCategories]);

  const assignedQuestionIdSet = useMemo(() => {
    const ids = new Set();
    (trackDetail?.dayAssignments || []).forEach((day) => {
      if (day.questionId) ids.add(String(day.questionId));
      (day.tasks || []).forEach((task) => {
        if (task.questionId) ids.add(String(task.questionId));
      });
    });
    return ids;
  }, [trackDetail?.dayAssignments]);

  const filteredQuestions = useMemo(() => {
    if (!addDayForm.taskType) return availableQuestions;

    const taskTypeLower = addDayForm.taskType.toLowerCase();
    const isTaskTypeCoding = ['coding', 'sql', 'debugging'].includes(taskTypeLower);
    const isTaskTypeMcq = ['mcq', 'aptitude', 'core cs'].includes(taskTypeLower);

    return availableQuestions.filter((question) => {
      if (assignedQuestionIdSet.has(String(question.id || question._id))) return false;
      const qCatName = (question.categoryTitle || question.track || '').toLowerCase();
      const dbCat = allCategories.find(
        (c) => (c.title && c.title.toLowerCase() === qCatName) || c.slug === question.categorySlug
     );

      const qCatType = (question.categoryType || dbCat?.categoryType || "").toUpperCase();
      const mcqSection = resolveMcqSection(dbCat || {
        title: question.categoryTitle || question.track,
        slug: question.categorySlug,
      });
      if (isTaskTypeCoding) {
        return qCatType === 'CODING' || ['coding', 'debugging'].includes(qCatName) || (!['mcq', 'aptitude', 'core cs'].includes(qCatName) && qCatType !== 'MCQ');
      }
      if (isTaskTypeMcq) {
        if (!(qCatType === 'MCQ' || ['mcq', 'aptitude', 'core cs'].includes(qCatName))) return false;
        return taskTypeLower === 'aptitude' ? mcqSection === 'Aptitude' : mcqSection === 'Technical';
      }

      return true;
    });
  }, [availableQuestions, addDayForm.taskType, allCategories, assignedQuestionIdSet]);

  const dayWiseQuestions = filteredQuestions;
  const Icon = iconMap[track?.iconKey] || FiCode;
  const isDarkMode = theme === 'dark';
  const currentDayNumber = useMemo(() => {
    const assignedAt = trackDetail?.assignedAt ? new Date(trackDetail.assignedAt) : null;
    if (!assignedAt || Number.isNaN(assignedAt.getTime())) return 1;
    const today = new Date();
    assignedAt.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const elapsedDays = Math.floor((today - assignedAt) / 86400000) + 1;
    return Math.min(Math.max(elapsedDays, 1), Number(trackDetail?.totalDays || track?.totalDays || 1));
  }, [trackDetail?.assignedAt, trackDetail?.totalDays, track?.totalDays]);

  const assignedDateText = useMemo(() => {
    if (!track?.assignedBatch) {
      return 'Schedule starts when assigned';
    }

    const startVal = track.assignedAt || track.batchStartDate;
    if (!startVal) {
      return `Assigned to ${track.assignedBatch}`;
    }

    const startDate = new Date(startVal);
    if (Number.isNaN(startDate.getTime())) {
      return `Assigned to ${track.assignedBatch}`;
    }

    const totalDays = Number(track.totalDays) || 1;
    const endDate = new Date(startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return `Assigned to ${track.assignedBatch} (${formatDate(startDate)} - ${formatDate(endDate)})`;
  }, [track?.assignedBatch, track?.assignedAt, track?.batchStartDate, track?.totalDays]);

  const assignmentKey = (dayNumber, questionId) => `${dayNumber}:${questionId || 'day'}`;
  const parseAssignmentKey = (key) => {
    const [dayNumber, questionId] = String(key).split(':');
    return { dayNumber: Number(dayNumber), questionId: questionId === 'day' ? null : questionId };
  };

  const selectableAssignments = useMemo(() => {
    return (trackDetail?.dayAssignments || []).flatMap((day) => {
      if (track?.trackType === 'Daily Task' || track?.trackType === 'Daily Challenge') {
        const direct = day.questionId
          ? [{ key: assignmentKey(day.dayNumber, day.questionId), dayNumber: day.dayNumber, questionId: day.questionId }]
          : [];
        const taskAssignments = (day.tasks || []).map((task) => ({
          key: assignmentKey(day.dayNumber, task.questionId),
          dayNumber: day.dayNumber,
          questionId: task.questionId,
        }));
        return [...direct, ...taskAssignments];
      }
      return day.questionId
        ? [{ key: assignmentKey(day.dayNumber, day.questionId), dayNumber: day.dayNumber, questionId: null }]
        : [];
    });
  }, [trackDetail?.dayAssignments, track?.trackType]);

  const selectableAssignmentKeys = useMemo(
    () => selectableAssignments.map((assignment) => assignment.key),
    [selectableAssignments]
  );

  const allAssignmentsSelected =
    selectableAssignmentKeys.length > 0 &&
    selectableAssignmentKeys.every((key) => selectedAssignments.includes(key));

  const toggleAssignmentSelection = (key) => {
    setSelectedAssignments((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleAllAssignments = () => {
    setSelectedAssignments((prev) =>
      selectableAssignmentKeys.every((key) => prev.includes(key)) ? [] : selectableAssignmentKeys
    );
  };

  const reloadTrackTemplate = async () => {
    const remoteTemplate = await adminAPI.getTrackTemplate(templateId);
    setTrackDetail(preferRemoteData(remoteTemplate, null));
  };

  useEffect(() => {
    const remoteAssigned = trackDetail?.assignedQuestions;
    setAssignedQuestions(preferRemoteData(remoteAssigned, availableQuestions));
    const nextDay = String(Math.max(0, ...(trackDetail?.dayAssignments || []).map((d) => Number(d.dayNumber))) + 1);
    setAddDayForm({
      dayNumber: nextDay,
      questionId: '',
      questionIds: [],
      taskType: defaultTaskType,
      batchId: trackDetail?.batchId || '',
      status: 'Published',
    });
  }, [availableQuestions, trackDetail, defaultTaskType]);

  useEffect(() => {
    const days = trackDetail?.dayAssignments || [];
    if (!days.length) return;
    setExpandedDays({ [currentDayNumber]: true });
  }, [trackDetail?.id, trackDetail?.dayAssignments, currentDayNumber]);

  useEffect(() => {
    let cancelled = false;
    setIsTrackLoading(!location.state?.track);

    adminAPI
      .getTrackTemplate(templateId)
      .then((remoteTemplate) => {
        if (!cancelled) {
          setTrackDetail(preferRemoteData(remoteTemplate, null));
          setIsTrackLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTrackDetail(null);
          setIsTrackLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  useEffect(() => {
    if (track?.trackType === 'Daily Task') {
      if (trackDetail?.availableQuestions) {
        setAvailableQuestions(trackDetail.availableQuestions);
      }
      return undefined;
    }

    if (!categorySlug) {
      setAvailableQuestions([]);
      return undefined;
    }

    let cancelled = false;

    adminAPI
      .getQuestions({ categorySlug })
      .then((remoteQuestions) => {
        if (!cancelled) {
          setAvailableQuestions(preferRemoteData(remoteQuestions, []));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableQuestions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug, track?.trackType, trackDetail?.availableQuestions]);

  useEffect(() => {
    let cancelled = false;
    adminAPI
      .getBatches()
      .then((remoteBatches) => {
        if (!cancelled) {
          setBatchOptions((Array.isArray(remoteBatches) ? remoteBatches : []).map((batch) => ({
            id: batch.id || batch._id,
            name: batch.name || 'Untitled Batch',
            college: batch.college || '',
          })));
        }
      })
      .catch(() => {
        if (!cancelled) setBatchOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openAddTaskModal = (dayNumber) => {
    setAddDayForm({
      dayNumber: String(dayNumber),
      questionId: '',
      questionIds: [],
      taskType: defaultTaskType,
      batchId: track?.batchId || '',
      status: 'Published',
    });
    setIsAddDayModalOpen(true);
  };

  const closeAddDayModal = () => {
    setIsAddDayModalOpen(false);
    setAddDayForm({
      dayNumber: '',
      questionId: '',
      questionIds: [],
      taskType: defaultTaskType,
      batchId: '',
      status: 'Published',
    });
  };

  const openOverrideModal = (dayNumber, currentOverride) => {
    setOverrideDayNumber(dayNumber);
    setOverrideTimeVal(currentOverride || '');
    setIsOverrideModalOpen(true);
  };

  const closeOverrideModal = () => {
    setIsOverrideModalOpen(false);
    setOverrideDayNumber(null);
    setOverrideTimeVal('');
  };

  const saveOverrideTime = async () => {
    try {
      await adminAPI.updateTrackTemplateDayOverride(templateId, overrideDayNumber, {
        releaseTimeOverride: overrideTimeVal || null,
      });
      await reloadTrackTemplate();
      closeOverrideModal();
    } catch (err) {
      console.error("Failed to save override release time", err);
    }
  };

  const assignQuestionToDay = async () => {
    if (!addDayForm.questionIds.length) return;
    try {
      const payload = {
        dayNumber: Number(addDayForm.dayNumber),
        questionIds: addDayForm.questionIds,
        ...(track.trackType === 'Daily Task' ? {
          taskType: addDayForm.taskType,
          batchId: addDayForm.batchId || track.batchId,
          status: addDayForm.status,
        } : {}),
      };
      await adminAPI.assignTrackTemplateDay(templateId, payload);
      await reloadTrackTemplate();
      closeAddDayModal();
    } catch (err) {
      console.error("Failed to assign question to day:", err);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setAddDayForm((prev) => ({
      ...prev,
      questionIds: prev.questionIds.includes(questionId)
        ? prev.questionIds.filter((id) => id !== questionId)
        : [...prev.questionIds, questionId],
    }));
  };

  const toggleDay = (dayNumber) => {
    setExpandedDays((prev) => ({ ...prev, [dayNumber]: !prev[dayNumber] }));
  };

  const removeAssignedQuestion = async (dayNumber) => {
    try {
      await adminAPI.removeTrackTemplateDay(templateId, dayNumber);
      await reloadTrackTemplate();
    } catch (err) {
      console.error("Failed to remove assigned question:", err);
    }
  };

  const removeTaskFromDay = async (dayNumber, questionId) => {
    try {
      await adminAPI.removeTrackTemplateDay(templateId, dayNumber, questionId);
      await reloadTrackTemplate();
    } catch (err) {
      console.error("Failed to remove task from day:", err);
    }
  };

  const handleBulkDeleteAssignments = async () => {
    if (!selectedAssignments.length) return;
    setIsBulkDeleting(true);
    try {
      for (const key of selectedAssignments) {
        const { dayNumber, questionId } = parseAssignmentKey(key);
        await adminAPI.removeTrackTemplateDay(templateId, dayNumber, questionId);
      }
      await reloadTrackTemplate();
      setSelectedAssignments([]);
      setBulkDeleteConfirm(false);
    } catch (err) {
      console.error("Failed to bulk remove assigned questions:", err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (!mounted) return <LoadingScreen />;

  if (isTrackLoading) return <LoadingScreen />;

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#cbe0ec] dark:bg-[#001233] px-6">
        <div className="max-w-md w-full rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#06183d] p-8 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Template not found</h2>
          <button
            onClick={() => navigate('/track-templates')}
            className="mt-6 inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold text-white bg-[#3c83f6] hover:bg-[#2563eb] transition-colors"
          >
            Back to Track Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {isAddDayModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeAddDayModal} />

          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-[#edf3f9] dark:bg-[#0f274f] shadow-2xl p-4 md:p-5">
            <button
              onClick={closeAddDayModal}
              className="absolute right-3.5 top-3.5 text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white z-10"
              aria-label="Close assign question modal"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg md:text-xl font-semibold text-[#1a2335] dark:text-white shrink-0">Assign Question to Day</h2>

            <div className="mt-4 space-y-3.5 flex-grow overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-medium text-[#1a2335] dark:text-white">Day Number</label>
                <input
                  type="number"
                  min="1"
                  readOnly
                  disabled
                  value={addDayForm.dayNumber}
                  className="mt-1.5 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#cdd5e0] dark:bg-[#0c1c38] px-3.5 text-base text-[#1a2335]/60 dark:text-white/50 cursor-not-allowed outline-none"
                />
              </div>

              {(track?.trackType === 'Daily Task' || track?.trackType === 'Daily Challenge') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1a2335] dark:text-white">Task Type</label>
                    <div className="relative mt-1.5">
                      <select
                        value={addDayForm.taskType}
                        onChange={(e) => setAddDayForm((prev) => ({ ...prev, taskType: e.target.value, questionId: '', questionIds: [] }))}
                        className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3.5 pr-10 text-sm text-[#1a2335] dark:text-white"
                      >
                        {(!hasMcq || hasCoding || (!hasMcq && !hasCoding)) && (
                          <>
                            <option value="Coding">Coding</option>
                            <option value="SQL">SQL</option>
                            <option value="Debugging">Debugging</option>
                          </>
                        )}
                        {(!hasCoding || hasMcq || (!hasMcq && !hasCoding)) && (
                          <>
                            <option value="MCQ">MCQ</option>
                            <option value="Aptitude">Aptitude</option>
                            <option value="Core CS">Core CS</option>
                          </>
                        )}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/55 dark:text-white/60" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a2335] dark:text-white">Assign to Batch</label>
                    <div className="relative mt-1.5">
                      <select
                        value={addDayForm.batchId}
                        onChange={(e) => setAddDayForm((prev) => ({ ...prev, batchId: e.target.value }))}
                        className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3.5 pr-10 text-sm text-[#1a2335] dark:text-white"
                      >
                        <option value={track?.batchId || ''}>Template Batch</option>
                        {batchOptions.map((batch) => (
                          <option key={batch.id} value={batch.id}>{batch.name}</option>
                        ))}
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/55 dark:text-white/60" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a2335] dark:text-white">Publish Status</label>
                    <div className="relative mt-1.5">
                      <select
                        value={addDayForm.status}
                        onChange={(e) => setAddDayForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3.5 pr-10 text-sm text-[#1a2335] dark:text-white"
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/55 dark:text-white/60" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a2335] dark:text-white">
                  Questions from {track.category}
                </label>
                <div className="mt-1.5 max-h-[46vh] overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] p-2 space-y-2">
                  {dayWiseQuestions.length ? dayWiseQuestions.map((question, index) => {
                    const qid = question.qid || `QID-${String(index + 1).padStart(6, '0')}`;
                    const text = question.description || question.title || 'Untitled question';
                    const questionId = question.id || question._id;
                    return (
                      <label key={questionId} className="flex items-start gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addDayForm.questionIds.includes(questionId)}
                          onChange={() => toggleQuestionSelection(questionId)}
                          className="mt-0.5 h-4 w-4 rounded border-black/20 text-[#3c83f6] focus:ring-[#3c83f6]"
                        />
                        <span className="text-sm text-[#1a2335] dark:text-white">
                          <span className="mr-2 font-semibold text-[#3c83f6] dark:text-blue-300">{index + 1}.</span>
                          <span className="font-semibold">{qid}</span>
                          <span className="mx-2 text-black/35 dark:text-white/35">-</span>
                          {text}
                        </span>
                      </label>
                    );
                  }) : (
                    <p className="p-4 text-sm text-slate-500 dark:text-slate-300">No available questions. Already assigned questions are hidden from this list.</p>
                  )}
                </div>
              </div>

            </div>

            <div className="pt-3 flex items-center justify-end gap-2 shrink-0 border-t border-black/5 dark:border-white/5 mt-3">
              <button
                onClick={closeAddDayModal}
                className="h-9 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-[#edf1f6] dark:bg-[#18365f] text-[#1a2335] dark:text-white text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={assignQuestionToDay}
                disabled={!addDayForm.questionIds.length}
                className="h-9 px-4 rounded-xl bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-60 text-white text-sm font-semibold"
              >
                Assign {addDayForm.questionIds.length || ''} Question{addDayForm.questionIds.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeOverrideModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
              Set Release Time Override (Day {overrideDayNumber})
            </h3>
            <div>
              <label className="admin-micro-label text-slate-500 dark:text-white/50 block mb-1">Release Time Override</label>
              <input
                type="time"
                value={overrideTimeVal}
                onChange={(e) => setOverrideTimeVal(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-sm text-[#1a2335] dark:text-white outline-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Leave blank to clear override and use default release time.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeOverrideModal}
                className="h-9 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveOverrideTime}
                className="h-9 px-4 rounded-xl bg-[#3c83f6] hover:bg-[#2563eb] text-white text-sm font-semibold transition-colors"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setBulkDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-red-600 dark:text-red-400">Bulk Delete Questions</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to remove {selectedAssignments.length} selected question{selectedAssignments.length === 1 ? '' : 's'} from this track template?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteAssignments}
                disabled={isBulkDeleting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-28 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden`}
      >
        <div className="max-w-[1600px] mx-auto space-y-5">

          <section className="space-y-3">
            <button
              onClick={() => navigate('/track-templates')}
              className="inline-flex items-center gap-2 text-[#5f7592] dark:text-slate-300 hover:text-[#3c83f6] dark:hover:text-blue-300 text-sm font-medium"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Track Templates
            </button>

            {/* Unified Track Template Overview Card */}
            <div className="bg-white dark:bg-gradient-to-br dark:from-[#0c1836] dark:via-[#0f1f43] dark:to-[#08122a] border border-black/5 dark:border-[#15366f]/60 rounded-2xl p-6 sm:p-7 shadow-lg dark:shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl relative overflow-hidden space-y-6">
              {/* Background Accent Glow */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header Section: Avatar + Name + Type + Status + Categories + Description + Schedule Note */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-black/5 dark:border-white/10 pb-5">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#3C83F6] via-[#4f8ff7] to-[#6366f1] text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 mt-1">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {track.name}
                      </h2>

                      {/* Track Type Badge */}
                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20">
                        {track.trackType || 'Daily Task'}
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        track.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30'
                      }`}>
                        {track.status || 'Active'}
                      </span>
                    </div>

                    {/* Question Categories Added */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-400 flex items-center gap-1">
                        <FiTag className="w-3.5 h-3.5" /> Question Categories:
                      </span>
                      {track.category ? (
                        String(track.category).split(',').map((catName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-500/20"
                          >
                            {catName.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">All Categories</span>
                      )}
                    </div>

                    {/* Description */}
                    {track.description && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl pt-1">
                        {track.description}
                      </p>
                    )}

                    {/* Schedule info text */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20 text-xs font-semibold mt-1">
                      <FiClock className="w-3.5 h-3.5 shrink-0" />
                      <span>Schedule starts when assigned to batch</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Stat Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {/* Total Days */}
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-500/5 dark:bg-[#071330]/70 border border-slate-200/60 dark:border-[#1e3a70]/50 transition-all hover:border-[#3C83F6]/30">
                  <div className="p-3 rounded-xl bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-blue-500/15 dark:text-blue-400 shrink-0">
                    <FiCalendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400/90">Total Days</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">
                      {track.totalDays} <span className="text-xs font-medium text-slate-400">Days</span>
                    </p>
                  </div>
                </div>

                {/* Questions Assigned */}
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-500/5 dark:bg-[#071330]/70 border border-slate-200/60 dark:border-[#1e3a70]/50 transition-all hover:border-[#3C83F6]/30">
                  <div className="p-3 rounded-xl bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-blue-500/15 dark:text-blue-400 shrink-0">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400/90">Questions Assigned</p>
                    <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">
                      {trackDetail?.questionsAssigned ?? track.questionsAssigned ?? 0} <span className="text-xs font-medium text-slate-400">Questions</span>
                    </p>
                  </div>
                </div>

                {/* Default Release Time */}
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-500/5 dark:bg-[#071330]/70 border border-slate-200/60 dark:border-[#1e3a70]/50 transition-all hover:border-[#3C83F6]/30">
                  <div className="p-3 rounded-xl bg-[#3C83F6]/10 text-[#3C83F6] dark:bg-blue-500/15 dark:text-blue-400 shrink-0">
                    <FiClock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400/90">Default Release Time</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 leading-none">
                      {track.releaseTime || trackDetail?.releaseTime || '00:00 AM'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-bold text-[#0b1b38] dark:text-white">Day-wise Questions</h3>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-8 items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={allAssignmentsSelected}
                    disabled={!selectableAssignmentKeys.length}
                    onChange={toggleAllAssignments}
                    className="h-3.5 w-3.5 rounded border-black/20 text-[#3c83f6] focus:ring-[#3c83f6] disabled:opacity-40"
                  />
                  Select All
                </label>
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  disabled={!selectedAssignments.length}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  Bulk Delete {selectedAssignments.length ? `(${selectedAssignments.length})` : ''}
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {track?.trackType === 'Daily Task' || track?.trackType === 'Daily Challenge' ? (
                (trackDetail?.dayAssignments || []).map((day) => (
                  <article key={`day-${day.dayNumber}`} className="rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <button onClick={() => toggleDay(day.dayNumber)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b1b38] dark:text-white">
                        {expandedDays[day.dayNumber] ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                        Day {day.dayNumber} ({(day.tasks?.length || 0) + (day.questionId ? 1 : 0)} Questions)
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openOverrideModal(day.dayNumber, day.releaseTimeOverride)}
                          className="h-7 px-3 rounded-lg border border-[#3c83f6]/20 bg-[#3c83f6]/10 hover:bg-[#3c83f6]/25 text-[#3c83f6] dark:text-white dark:bg-white/10 dark:border-white/20 hover:dark:bg-white/15 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <FiClock className="w-3.5 h-3.5" />
                          {day.releaseTimeOverride ? `Override: ${day.releaseTimeOverride}` : 'Set Override'}
                        </button>
                        <button
                          onClick={() => openAddTaskModal(day.dayNumber)}
                          className="h-7 px-3 rounded-lg bg-[#3c83f6] hover:bg-[#2563eb] text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          Add Question/Task
                        </button>
                      </div>
                    </div>
                    {expandedDays[day.dayNumber] && <div className="space-y-2 pl-3">
                      {day.questionId && (
                        <div className="flex items-start justify-between gap-3 border-t border-black/5 dark:border-white/5 pt-2 text-xs">
                          <label className="flex min-w-0 flex-1 items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedAssignments.includes(assignmentKey(day.dayNumber, day.questionId))}
                              onChange={() => toggleAssignmentSelection(assignmentKey(day.dayNumber, day.questionId))}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-black/20 text-[#3c83f6] focus:ring-[#3c83f6]"
                            />
                            <span className="min-w-0 text-[#0b1b38] dark:text-white font-medium">
                              <span className="mr-2 font-semibold text-slate-400 dark:text-slate-500">1.</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400 mr-2">[DSA/Coding]</span>
                              {day.questionTitle || "Direct Assigned Question"}
                            </span>
                          </label>
                        </div>
                      )}
                      {day.tasks && day.tasks.length > 0 ? (
                        day.tasks.map((t, idx) => {
                          const key = assignmentKey(day.dayNumber, t.questionId);
                          const seq = day.questionId ? idx + 2 : idx + 1;
                          return (
                          <div key={`${t.questionId}-${idx}`} className="flex items-start justify-between gap-3 border-t border-black/5 dark:border-white/5 pt-2 text-xs">
                            <label className="flex min-w-0 flex-1 items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedAssignments.includes(key)}
                                onChange={() => toggleAssignmentSelection(key)}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-black/20 text-[#3c83f6] focus:ring-[#3c83f6]"
                              />
                              <span className="min-w-0 text-[#0b1b38] dark:text-white font-medium">
                              <span className="mr-2 font-semibold text-slate-400 dark:text-slate-500">{seq}.</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400 mr-2">[{t.taskType}]</span>
                              {t.questionTitle}
                              <span className="ml-2 rounded-full bg-[#dfe8f6] px-2 py-0.5 text-[10px] font-bold text-[#3c83f6] dark:bg-white/10 dark:text-blue-300">
                                {Number(t.xpValue || 0)} XP
                              </span>
                              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status === 'Draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'}`}>
                                {t.status || 'Published'}
                              </span>
                              {t.batchName ? (
                                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-white/70">
                                  {t.batchName}
                                </span>
                              ) : null}
                              </span>
                            </label>
                          </div>
                          );
                        })
                      ) : (!day.questionId ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No tasks assigned yet.</p>
                      ) : null)}
                    </div>}
                  </article>
                ))
              ) : (
                (trackDetail?.dayAssignments || []).map((day) => (
                  <article key={`day-${day.dayNumber}`} className="group rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 p-3">
                    <div className="flex items-center justify-between gap-2.5">
                      <button onClick={() => toggleDay(day.dayNumber)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b1b38] dark:text-white">
                        {expandedDays[day.dayNumber] ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                        Day {day.dayNumber} ({day.questionId ? 1 : 0} Questions)
                      </button>

                      {day.questionId ? (
                        <>
                          <input
                            type="checkbox"
                            checked={selectedAssignments.includes(assignmentKey(day.dayNumber, day.questionId))}
                            onChange={() => toggleAssignmentSelection(assignmentKey(day.dayNumber, day.questionId))}
                            className="h-3.5 w-3.5 rounded border-black/20 text-[#3c83f6] focus:ring-[#3c83f6]"
                          />
                          <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(day.difficulty)}`}>
                            {day.difficulty}
                          </span>
                        </>
                      ) : (
                        <button
                          onClick={() => openAddTaskModal(day.dayNumber)}
                          className="h-7 px-3 rounded-lg bg-[#3c83f6] hover:bg-[#2563eb] text-white text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          Assign Question
                        </button>
                      )}
                    </div>
                    {expandedDays[day.dayNumber] && (
                      <div className="mt-3 pl-6">
                        {day.questionId ? (
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-[#0b1b38] dark:text-white truncate">{day.questionTitle}</h4>
                            <p className="mt-0.5 text-xs text-[#5f7591] dark:text-slate-300 truncate">
                              <span className="mr-1 font-semibold text-slate-400 dark:text-slate-500">1.</span>
                              {day.track} · {day.difficulty}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No question assigned yet.</p>
                        )}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

