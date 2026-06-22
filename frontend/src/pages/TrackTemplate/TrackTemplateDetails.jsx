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
  FiChevronDown,
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

const difficultyPillClass = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-[#16a34a] text-white';
  if (difficulty === 'Medium') return 'bg-[#dbe7ff] text-[#3c83f6]';
  return 'bg-[#fee2e2] text-[#b91c1c]';
};

const statusPillClass = (status) =>
  status === 'Active'
    ? 'bg-[#16a34a] text-white'
    : 'bg-[#dbe7ff] text-[#3c83f6]';

const formatDateLabel = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

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
    taskType: 'Coding',
    batchId: '',
    xpValue: '',
    status: 'Published',
  });

  const [allCategories, setAllCategories] = useState([]);

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
  const { hasMcq, hasCoding } = useMemo(() => {
    const categories = track?.category
      ? track.category.split(',').map((c) => c.trim().toLowerCase())
      : [];
    
    let mcq = false;
    let coding = false;

    categories.forEach((catName) => {
      const dbCat = allCategories.find(
        (c) => c.title && c.title.toLowerCase() === catName
      );
      if (dbCat) {
        if (dbCat.categoryType === 'MCQ') mcq = true;
        if (dbCat.categoryType === 'Coding') coding = true;
      }
    });

    const fallbackMcq = categories.includes('mcq') || categories.includes('aptitude') || categories.includes('core cs');
    const fallbackCoding = categories.includes('coding') || categories.includes('debugging');

    return { hasMcq: mcq || fallbackMcq, hasCoding: coding || fallbackCoding };
  }, [track?.category, allCategories]);

  const defaultTaskType = useMemo(() => {
    if (hasMcq && !hasCoding) {
      return 'MCQ';
    }
    return 'Coding';
  }, [hasMcq, hasCoding]);

  const categorySlug = track ? categorySlugMap[track.category] : null;

  const filteredQuestions = useMemo(() => {
    if (!addDayForm.taskType) return availableQuestions;

    const taskTypeLower = addDayForm.taskType.toLowerCase();
    const isTaskTypeCoding = ['coding', 'sql', 'debugging'].includes(taskTypeLower);
    const isTaskTypeMcq = ['mcq', 'aptitude', 'core cs'].includes(taskTypeLower);

    return availableQuestions.filter((question) => {
      const qCatName = question.track ? question.track.toLowerCase() : '';
      const dbCat = allCategories.find(
        (c) => c.title && c.title.toLowerCase() === qCatName
      );

      if (dbCat) {
        if (isTaskTypeCoding) return dbCat.categoryType === 'Coding';
        if (isTaskTypeMcq) return dbCat.categoryType === 'MCQ';
      }

      // Fallback matching if category is not found in database list
      if (isTaskTypeCoding) {
        return ['coding', 'debugging'].includes(qCatName) || !['mcq', 'aptitude', 'core cs'].includes(qCatName);
      }
      if (isTaskTypeMcq) {
        return ['mcq', 'aptitude', 'core cs'].includes(qCatName);
      }

      return true;
    });
  }, [availableQuestions, addDayForm.taskType, allCategories]);

  const dayWiseQuestions = filteredQuestions;
  const Icon = iconMap[track?.iconKey] || FiCode;
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const remoteAssigned = trackDetail?.assignedQuestions;
    setAssignedQuestions(preferRemoteData(remoteAssigned, availableQuestions));
    const nextDay = String(Math.max(0, ...(trackDetail?.dayAssignments || []).map((d) => Number(d.dayNumber))) + 1);
    setAddDayForm({
      dayNumber: nextDay,
      questionId: '',
      taskType: defaultTaskType,
      batchId: trackDetail?.batchId || '',
      xpValue: '',
      status: 'Published',
    });
  }, [availableQuestions, trackDetail, defaultTaskType]);

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
      taskType: defaultTaskType,
      batchId: track?.batchId || '',
      xpValue: '',
      status: 'Published',
    });
    setIsAddDayModalOpen(true);
  };

  const closeAddDayModal = () => {
    setIsAddDayModalOpen(false);
    setAddDayForm({
      dayNumber: '',
      questionId: '',
      taskType: defaultTaskType,
      batchId: '',
      xpValue: '',
      status: 'Published',
    });
  };

  const assignQuestionToDay = async () => {
    if (!addDayForm.questionId) return;
    try {
      const payload = {
        dayNumber: Number(addDayForm.dayNumber),
        questionId: addDayForm.questionId,
        ...(track.trackType === 'Daily Task' ? {
          taskType: addDayForm.taskType,
          batchId: addDayForm.batchId || track.batchId,
          xpValue: Number(addDayForm.xpValue || 0),
          status: addDayForm.status,
        } : {}),
      };
      await adminAPI.assignTrackTemplateDay(templateId, payload);
      // Reload template detail
      const remoteTemplate = await adminAPI.getTrackTemplate(templateId);
      setTrackDetail(preferRemoteData(remoteTemplate, null));
      closeAddDayModal();
    } catch (err) {
      console.error("Failed to assign question to day:", err);
    }
  };

  const removeAssignedQuestion = async (dayNumber) => {
    try {
      await adminAPI.removeTrackTemplateDay(templateId, dayNumber);
      const remoteTemplate = await adminAPI.getTrackTemplate(templateId);
      setTrackDetail(preferRemoteData(remoteTemplate, null));
    } catch (err) {
      console.error("Failed to remove assigned question:", err);
    }
  };

  const removeTaskFromDay = async (dayNumber, questionId) => {
    try {
      await adminAPI.removeTrackTemplateDay(templateId, dayNumber, questionId);
      const remoteTemplate = await adminAPI.getTrackTemplate(templateId);
      setTrackDetail(preferRemoteData(remoteTemplate, null));
    } catch (err) {
      console.error("Failed to remove task from day:", err);
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

          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-[#edf3f9] dark:bg-[#0f274f] shadow-2xl p-4 md:p-5">
            <button
              onClick={closeAddDayModal}
              className="absolute right-3.5 top-3.5 text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white"
              aria-label="Close assign question modal"
            >
              <FiX className="w-5 h-5" />
            </button>

            <h2 className="text-lg md:text-xl font-semibold text-[#1a2335] dark:text-white">Assign Question to Day</h2>

            <div className="mt-4 space-y-3.5">
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

              {track?.trackType === 'Daily Task' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1a2335] dark:text-white">Task Type</label>
                    <div className="relative mt-1.5">
                      <select
                        value={addDayForm.taskType}
                        onChange={(e) => setAddDayForm((prev) => ({ ...prev, taskType: e.target.value, questionId: '' }))}
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
                    <label className="block text-sm font-medium text-[#1a2335] dark:text-white">XP Value</label>
                    <input
                      type="number"
                      min="0"
                      value={addDayForm.xpValue}
                      onChange={(e) => setAddDayForm((prev) => ({ ...prev, xpValue: e.target.value }))}
                      placeholder="0"
                      className="mt-1.5 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3.5 text-sm text-[#1a2335] dark:text-white outline-none"
                    />
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
                  Question (from {track.category})
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={addDayForm.questionId}
                    onChange={(e) => setAddDayForm((prev) => ({ ...prev, questionId: e.target.value }))}
                    className="appearance-none w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3.5 pr-10 text-sm text-[#1a2335] dark:text-white"
                  >
                    <option value="">Select a question</option>
                    {dayWiseQuestions.map((question) => (
                      <option key={question.id} value={question.id}>
                        {(question.tags || []).join(', ') || 'No tag'} - {question.title}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/55 dark:text-white/60" />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={closeAddDayModal}
                  className="h-9 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-[#edf1f6] dark:bg-[#18365f] text-[#1a2335] dark:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={assignQuestionToDay}
                  className="h-9 px-4 rounded-xl bg-[#3c83f6] hover:bg-[#2563eb] text-white text-sm font-semibold"
                >
                  Assign Question
                </button>
              </div>
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

            <div className="pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-16 h-16 rounded-xl bg-[#d7e2ff] dark:bg-[#1d3768] flex items-center justify-center shadow-sm">
                  <Icon className="w-8 h-8 text-[#2563eb] dark:text-blue-300" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-[1.8rem] font-bold tracking-tight text-[#0b1b38] dark:text-white">{track.name}</h2>
                  <p className="mt-0.5 text-sm md:text-base text-[#5d748f] dark:text-slate-300">
                    {track.description} 
                    <span className="mx-2">·</span>
                    {track.totalDays} days
                  </p>
                  <p className="mt-1 text-xs md:text-sm text-[#5d748f] dark:text-slate-300">
                    {formatDateLabel(track.startDate)} - {formatDateLabel(track.endDate)}
                    <span className="mx-2">·</span>
                    Batch: {track.assignedBatch || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto md:ml-auto">
                <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${statusPillClass(track.status)}`}>
                  {track.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 px-4 py-3">
                <p className="text-sm text-[#5f7491] dark:text-slate-300">Total Days</p>
                <p className="mt-1 text-3xl font-bold text-[#0b1b38] dark:text-white">{track.totalDays}</p>
              </div>
              <div className="rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 px-4 py-3">
                <p className="text-sm text-[#5f7491] dark:text-slate-300">Questions Assigned</p>
                <p className="mt-1 text-3xl font-bold text-[#0b1b38] dark:text-white">{trackDetail?.questionsAssigned ?? track.questionsAssigned ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 px-4 py-3">
                <p className="text-sm text-[#5f7491] dark:text-slate-300">Assigned Batch</p>
                <p className="mt-1 text-2xl font-bold text-[#0b1b38] dark:text-white truncate">{track.assignedBatch || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xl font-bold text-[#0b1b38] dark:text-white">Day-wise Questions</h3>
            </div>

            <div className="space-y-2.5">
              {track?.trackType === 'Daily Task' ? (
                (trackDetail?.dayAssignments || []).map((day) => (
                  <article key={`day-${day.dayNumber}`} className="rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-[#dfe8f6] dark:bg-[#1c3f76] text-[#3c83f6] dark:text-blue-300 text-xs font-semibold">
                        Day {day.dayNumber}
                      </span>
                      <button
                        onClick={() => openAddTaskModal(day.dayNumber)}
                        className="h-7 px-3 rounded-lg bg-[#3c83f6] hover:bg-[#2563eb] text-white text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        Add Task
                      </button>
                    </div>
                    <div className="space-y-2 pl-3">
                      {day.tasks && day.tasks.length > 0 ? (
                        day.tasks.map((t, idx) => (
                          <div key={`${t.questionId}-${idx}`} className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-2 text-xs">
                            <span className="text-[#0b1b38] dark:text-white font-medium">
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
                            <button
                              onClick={() => removeTaskFromDay(day.dayNumber, t.questionId)}
                              className="text-red-500 hover:text-red-700 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No tasks assigned yet.</p>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                (trackDetail?.dayAssignments || []).map((day) => (
                  <article key={`day-${day.dayNumber}`} className="group rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-[#dfe8f6] dark:bg-[#1c3f76] text-[#3c83f6] dark:text-blue-300 text-xs font-semibold">
                        Day {day.dayNumber}
                      </span>
                      {day.questionId ? (
                        <div className="min-w-0">
                          <h4 className="text-base font-semibold text-[#0b1b38] dark:text-white truncate">{day.questionTitle}</h4>
                          <p className="mt-0.5 text-xs text-[#5f7591] dark:text-slate-300 truncate">{day.track} · {day.difficulty}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No question assigned yet.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {day.questionId ? (
                        <>
                          <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(day.difficulty)}`}>
                            {day.difficulty}
                          </span>
                          <button
                            onClick={() => removeAssignedQuestion(day.dayNumber)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label={`Remove question on day ${day.dayNumber}`}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
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

