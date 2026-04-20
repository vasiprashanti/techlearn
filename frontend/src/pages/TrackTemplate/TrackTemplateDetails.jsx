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
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
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
  const [trackDetail, setTrackDetail] = useState(null);
  const [isTrackLoading, setIsTrackLoading] = useState(!location.state?.track);
  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);
  const [addDayForm, setAddDayForm] = useState({
    dayNumber: '1',
    questionId: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const track = useMemo(() => {
    if (trackDetail) return trackDetail;
    if (location.state?.track) return location.state.track;
    return null;
  }, [trackDetail, location.state, templateId]);

  const categorySlug = track ? categorySlugMap[track.category] : null;
  const dayWiseQuestions = availableQuestions;
  const Icon = iconMap[track?.iconKey] || FiCode;
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const remoteAssigned = trackDetail?.assignedQuestions;
    setAssignedQuestions(preferRemoteData(remoteAssigned, dayWiseQuestions));
    setAddDayForm({
      dayNumber: String((preferRemoteData(remoteAssigned, dayWiseQuestions)?.length || 0) + 1),
      questionId: '',
    });
  }, [dayWiseQuestions, trackDetail]);

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
  }, [categorySlug]);

  const openAddDayModal = () => {
    setAddDayForm({
      dayNumber: String((assignedQuestions?.length || 0) + 1),
      questionId: '',
    });
    setIsAddDayModalOpen(true);
  };

  const closeAddDayModal = () => {
    setIsAddDayModalOpen(false);
    setAddDayForm({
      dayNumber: String((assignedQuestions?.length || 0) + 1),
      questionId: '',
    });
  };

  const assignQuestionToDay = () => {
    if (!addDayForm.questionId) return;
    const pickedQuestion = dayWiseQuestions.find((q) => q.id === addDayForm.questionId);
    if (!pickedQuestion) return;

    const requestedDay = Number(addDayForm.dayNumber);
    const targetIndex = Number.isFinite(requestedDay) && requestedDay > 0 ? requestedDay - 1 : assignedQuestions.length;

    setAssignedQuestions((prev) => {
      const next = [...prev];
      if (targetIndex < next.length) {
        next[targetIndex] = pickedQuestion;
      } else {
        next.push(pickedQuestion);
      }
      return next;
    });

    closeAddDayModal();
  };

  const removeAssignedQuestion = (indexToRemove) => {
    setAssignedQuestions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
                  value={addDayForm.dayNumber}
                  onChange={(e) => setAddDayForm((prev) => ({ ...prev, dayNumber: e.target.value }))}
                  className="mt-1.5 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#dbe5f1] dark:bg-[#122b52] px-3.5 text-base text-[#1a2335] dark:text-white"
                />
              </div>

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
                      <option key={question.id} value={question.id}>{question.title}</option>
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

      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden`}
      >
        <div className="max-w-[1600px] mx-auto space-y-5">
          <header className={`sticky top-0 z-40 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-white/90 dark:bg-[#0f274f]/90" : "bg-white/95 dark:bg-[#0f274f]/95"}`}>
            <div className="flex-1" />
            <AdminHeaderControls user={user} logout={logout} />
          </header>

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
                <p className="mt-1 text-3xl font-bold text-[#0b1b38] dark:text-white">{Math.min(track.totalDays, dayWiseQuestions.length)}</p>
              </div>
              <div className="rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 px-4 py-3">
                <p className="text-sm text-[#5f7491] dark:text-slate-300">Assigned Batch</p>
                <p className="mt-1 text-2xl font-bold text-[#0b1b38] dark:text-white truncate">{track.assignedBatch || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xl font-bold text-[#0b1b38] dark:text-white">Day-wise Questions</h3>
              <button onClick={openAddDayModal} className="h-9 px-3.5 rounded-lg bg-[#3c83f6] hover:bg-[#2563eb] text-white text-xs font-semibold inline-flex items-center gap-1.5">
                <FiPlus className="w-3.5 h-3.5" />
                Add Day
              </button>
            </div>

            <div className="space-y-2.5">
              {assignedQuestions.map((question, index) => (
                <article key={`${question.id}-${index}`} className="group rounded-xl bg-white/95 dark:bg-[#0f274f] border border-black/10 dark:border-white/10 p-3 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-6 flex flex-col justify-center gap-[3px]">
                      <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/30" />
                      <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/30" />
                      <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/30" />
                    </div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-[#dfe8f6] dark:bg-[#1c3f76] text-[#3c83f6] dark:text-blue-300 text-xs font-semibold">
                      Day {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold text-[#0b1b38] dark:text-white truncate">{question.title}</h4>
                      <p className="mt-0.5 text-xs text-[#5f7591] dark:text-slate-300 truncate">{question.track} · {question.difficulty}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <button
                      onClick={() => removeAssignedQuestion(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                      aria-label={`Remove day ${index + 1}`}
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

