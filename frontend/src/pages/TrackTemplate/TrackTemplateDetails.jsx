import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBell,
  FiSearch,
  FiCode,
  FiDatabase,
  FiPlus,
  FiCpu,
  FiX,
  FiChevronDown,
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/Loader/Loader3D';
import { questionBankQuestions } from '../../data/adminQuestionBankData';

const templateSeeds = [
  {
    id: 'trk_dsa_01',
    name: 'DSA Track',
    description: '30-day Data Structures & Algorithms curriculum',
    totalDays: 30,
    questionsAssigned: 4,
    status: 'Active',
    category: 'Data Structures & Algorithms',
    iconKey: 'code',
  },
  {
    id: 'trk_core_01',
    name: 'Core Track',
    description: '20-day Core CS fundamentals',
    totalDays: 20,
    questionsAssigned: 3,
    status: 'Active',
    category: 'Web Development',
    iconKey: 'cpu',
  },
  {
    id: 'trk_sql_01',
    name: 'SQL Track',
    description: '15-day SQL mastery',
    totalDays: 15,
    questionsAssigned: 1,
    status: 'Active',
    category: 'Database Management',
    iconKey: 'database',
  },
];

const iconMap = {
  code: FiCode,
  cpu: FiCpu,
  database: FiDatabase,
};

const categorySlugMap = {
  'Data Structures & Algorithms': 'data-structures-algorithms',
  'Web Development': 'web-development',
  'Python Programming': 'python-programming',
  'Database Management': 'database-management',
  'Machine Learning': 'machine-learning',
};

const difficultyClass = (difficulty) => {
  if (difficulty === 'Easy') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (difficulty === 'Medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
};

const PAGE_TITLE_STYLE = {
  fontSize: 'clamp(1.4rem, 1.3rem + 0.25vw, 1.65rem)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  color: '#3c83f6',
  lineHeight: 1.1,
};

export default function TrackTemplateDetails() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);
  const [addDayForm, setAddDayForm] = useState({
    dayNumber: '1',
    questionId: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const track = useMemo(() => {
    if (location.state?.track) return location.state.track;
    return templateSeeds.find((item) => item.id === templateId) || null;
  }, [location.state, templateId]);

  const categorySlug = track ? categorySlugMap[track.category] : null;
  const dayWiseQuestions = categorySlug ? questionBankQuestions[categorySlug] || [] : [];
  const Icon = iconMap[track?.iconKey] || FiCode;
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setAssignedQuestions(dayWiseQuestions);
    setAddDayForm({
      dayNumber: String((dayWiseQuestions?.length || 0) + 1),
      questionId: '',
    });
  }, [dayWiseQuestions]);

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
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {isAddDayModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeAddDayModal} />

          <div className="relative w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-[#edf3f9] dark:bg-[#0f274f] shadow-2xl p-6 md:p-7">
            <button
              onClick={closeAddDayModal}
              className="absolute right-4 top-4 text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white"
              aria-label="Close assign question modal"
            >
              <FiX className="w-6 h-6" />
            </button>

            <h2 className="text-2xl md:text-3xl font-semibold text-[#1a2335] dark:text-white">Assign Question to Day</h2>

            <div className="mt-8 space-y-7">
              <div>
                <label className="block text-xl font-medium text-[#1a2335] dark:text-white">Day Number</label>
                <input
                  type="number"
                  min="1"
                  value={addDayForm.dayNumber}
                  onChange={(e) => setAddDayForm((prev) => ({ ...prev, dayNumber: e.target.value }))}
                  className="mt-3 w-full h-14 rounded-3xl border border-black/10 dark:border-white/10 bg-[#e6edf5] dark:bg-[#17345f] px-4 text-3xl text-[#1a2335] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xl font-medium text-[#1a2335] dark:text-white">
                  Question (from {track.category})
                </label>
                <div className="relative mt-3">
                  <select
                    value={addDayForm.questionId}
                    onChange={(e) => setAddDayForm((prev) => ({ ...prev, questionId: e.target.value }))}
                    className="appearance-none w-full h-14 rounded-3xl border border-black/10 dark:border-white/10 bg-[#e6edf5] dark:bg-[#17345f] px-4 pr-12 text-2xl text-[#1a2335] dark:text-white"
                  >
                    <option value="">Select a question</option>
                    {dayWiseQuestions.map((question) => (
                      <option key={question.id} value={question.id}>{question.title}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-black/55 dark:text-white/60" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={closeAddDayModal}
                  className="h-14 px-8 rounded-3xl border border-black/10 dark:border-white/10 bg-[#edf1f6] dark:bg-[#18365f] text-[#1a2335] dark:text-white text-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={assignQuestionToDay}
                  className="h-14 px-8 rounded-3xl bg-[#3c83f6] hover:bg-[#2563eb] text-white text-xl font-semibold"
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

      <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden`}>
        <div className="max-w-[1600px] mx-auto space-y-5">
          <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-white/95 dark:bg-white/95 backdrop-blur-xl border-b border-black/5 dark:border-black/5 flex items-center justify-between">
            <h1 className="admin-page-title" style={PAGE_TITLE_STYLE}>Track Templates</h1>

            <div className="flex items-center gap-6">
              <button
                className="relative hidden md:flex items-center w-64 bg-white/20 dark:bg-black/20 border border-black/5 dark:border-white/5 py-2 pl-10 pr-12 rounded-lg backdrop-blur-md hover:bg-white/30 dark:hover:bg-black/30 transition-colors text-left group"
              >
                <FiSearch className="absolute left-3 w-4 h-4 text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors" />
                <span className="text-sm text-black/40 dark:text-white/40 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors">
                  Search...
                </span>
                <div className="absolute right-3 flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </button>

              <button className="relative text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <FiBell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
                >
                  {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                </button>

                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="py-2">
                        <button
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          Profile Settings
                        </button>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
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
                </div>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto md:ml-auto">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-base font-semibold ${track.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
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
                <p className="text-sm text-[#5f7491] dark:text-slate-300">Available in Category</p>
                <p className="mt-1 text-3xl font-bold text-[#0b1b38] dark:text-white">{dayWiseQuestions.length}</p>
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyClass(question.difficulty)}`}>
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
