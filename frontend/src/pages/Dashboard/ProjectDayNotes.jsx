import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Lock } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import MarkdownContent from '../Learn/MarkdownContent';
import { useProjectDemoState } from '../../hooks/useProjectDemoState';
import { getStudentActiveProject, getStudentProjectDayNotes, toggleStudentProjectTask } from '../../api/project';
import pixelStarImg from '../../assets/pixel-star.png';

const getDayProgress = (day) => {
  const total = day?.tasks?.length || 0;
  const completed = day?.tasks?.filter((task) => task.completed).length || 0;
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    complete: total > 0 && completed === total,
  };
};

const normalizeHeadingText = (value = '') =>
  String(value)
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const removeDuplicateDayHeading = (markdown = '', dayTitle = '') => {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const firstContentIndex = lines.findIndex((line) => line.trim());

  if (firstContentIndex === -1) return '';

  const firstLine = lines[firstContentIndex].trim();
  const headingMatch = firstLine.match(/^#{1,6}\s+(.+)$/);

  if (!headingMatch) return markdown;

  const markdownTitle = normalizeHeadingText(headingMatch[1]);
  const selectedTitle = normalizeHeadingText(dayTitle);

  if (markdownTitle === selectedTitle) {
    lines.splice(firstContentIndex, 1);
    return lines.join('\n').trim();
  }

  return markdown;
};

export default function ProjectDayNotes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDemoRoute = location.pathname.startsWith('/demo');

  // Real API states
  const [realLoading, setRealLoading] = useState(!isDemoRoute);
  const [realError, setRealError] = useState('');
  const [realProject, setRealProject] = useState(null);
  const [realDayNotes, setRealDayNotes] = useState(null);
  const [advancementModal, setAdvancementModal] = useState({ isOpen: false, completedDay: 1, nextDay: 2 });

  // Demo state (reads from local storage)
  const {
    projectState,
    dashboardData,
    currentDayData,
    projectXpEarned,
    projectOverallProgress,
    completeTask,
  } = useProjectDemoState();

  const fetchRealProject = async (requestedDayNum) => {
    try {
      const proj = await getStudentActiveProject();
      if (!proj || !proj.success || !proj.hasActiveProject) {
        setRealError('No active project assignment found.');
        setRealLoading(false);
        return;
      }
      setRealProject(proj);

      // Resolve day
      const activeDay = proj.assignment.current_day;
      const targetDayNum = requestedDayNum || activeDay;

      if (targetDayNum > activeDay) {
        setRealDayNotes({
          day: targetDayNum,
          title: `Day ${targetDayNum}`,
          notes_markdown: '',
          tasks: [],
          isLocked: true
        });
        setRealLoading(false);
        return;
      }

      const notesRes = await getStudentProjectDayNotes(targetDayNum);
      if (notesRes && notesRes.success) {
        setRealDayNotes({
          day: targetDayNum,
          title: notesRes.title,
          notes_markdown: notesRes.notes_markdown || '',
          tasks: notesRes.tasks || [],
          isLocked: false
        });
      } else {
        setRealError(notesRes.message || 'Failed to load day notes.');
      }
    } catch (err) {
      console.error('Real Project Fetch Error:', err);
      setRealError('Failed to connect to server.');
    } finally {
      setRealLoading(false);
    }
  };

  const handleRealTaskToggle = async (taskId) => {
    try {
      const currentDayBefore = realDayNotes?.day || 1;
      const res = await toggleStudentProjectTask(taskId);
      if (res && res.success) {
        if (res.dayAdvanced) {
          setAdvancementModal({ isOpen: true, completedDay: currentDayBefore, nextDay: res.currentDay });
        }
        await fetchRealProject(realDayNotes.day);
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  useEffect(() => {
    if (!isDemoRoute) {
      const requestedDay = Number(searchParams.get('day'));
      setRealLoading(true);
      fetchRealProject(requestedDay);
    }
  }, [searchParams, isDemoRoute]);

  const requestedDay = Number(searchParams.get('day'));
  const selectedDayNumber = Number.isFinite(requestedDay) && requestedDay > 0
    ? requestedDay
    : (isDemoRoute ? dashboardData.project.currentDay : (realProject?.assignment?.current_day || 1));

  // Resolve final variables
  const currentDay = isDemoRoute ? dashboardData.project.currentDay : (realProject?.assignment?.current_day || 1);
  const projectTitle = isDemoRoute ? dashboardData.project.title : (realProject?.project?.title || '');
  const xpEarnedValue = isDemoRoute ? projectXpEarned : (realProject?.projectXpEarned || 0);
  const overallProgressValue = isDemoRoute ? projectOverallProgress : (realProject?.projectOverallProgress || 0);

  const selectedDay = isDemoRoute
    ? (projectState.days.find((day) => day.day === selectedDayNumber) || currentDayData)
    : {
        day: realDayNotes?.day || selectedDayNumber,
        title: realDayNotes?.title || `Day ${selectedDayNumber}`,
        notes_markdown: realDayNotes?.notes_markdown || '',
        tasks: realDayNotes?.tasks || []
      };

  const isFutureDay = isDemoRoute
    ? (selectedDay.day > dashboardData.project.currentDay)
    : (realDayNotes?.isLocked || false);

  const selectedProgress = isDemoRoute
    ? getDayProgress(selectedDay)
    : {
        completed: realDayNotes?.tasks?.filter(t => t.completed).length || 0,
        total: realDayNotes?.tasks?.length || 0,
        percent: realDayNotes?.tasks?.length > 0 ? Math.round((realDayNotes.tasks.filter(t => t.completed).length / realDayNotes.tasks.length) * 100) : 0,
        complete: realDayNotes?.tasks?.length > 0 && realDayNotes.tasks.every(t => t.completed)
      };

  const selectedMarkdown = isDemoRoute
    ? removeDuplicateDayHeading(selectedDay.markdown, selectedDay.title)
    : removeDuplicateDayHeading(realDayNotes?.notes_markdown || '', realDayNotes?.title || '');

  const sidebarDays = isDemoRoute
    ? projectState.days.map((day) => ({
        day: day.day,
        title: day.title,
        locked: day.day > dashboardData.project.currentDay,
        active: day.day === selectedDay.day
      }))
    : (realProject?.dayNotes || []).map((day) => ({
        day: day.day,
        title: day.title,
        locked: day.isLocked,
        active: day.day === selectedDay.day
      }));

  const openDay = (dayNumber) => {
    if (dayNumber > currentDay) return;
    setSearchParams(dayNumber === currentDay ? {} : { day: String(dayNumber) });
  };

  const handleTaskClick = (dayNumber, taskId) => {
    if (isDemoRoute) {
      completeTask(dayNumber, taskId);
    } else {
      handleRealTaskToggle(taskId);
    }
  };

  const backPath = isDemoRoute ? '/demo' : '/dashboard';

  if (!isDemoRoute && realLoading) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="flex flex-col items-center justify-center py-40">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading lesson materials...</p>
        </div>
      </UserSidebarLayout>
    );
  }

  if (!isDemoRoute && realError) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="text-center py-20 text-[#00113b] dark:text-white">
          <p className="text-red-500 font-semibold text-sm">{realError}</p>
          <button
            type="button"
            onClick={() => {
              const reqDay = Number(searchParams.get('day'));
              setRealLoading(true);
              fetchRealProject(reqDay);
            }}
            className="mt-4 bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-bold hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </UserSidebarLayout>
    );
  }

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-6 text-[#00113b]">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#00113b] transition hover:text-[#001b5c] dark:text-[#8fd9ff] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70 md:p-7 text-left">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="font-press-start text-[8px] uppercase tracking-widest text-[#00113b] dark:text-[#8fd9ff]">
                Today's Learning
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-[#00113b] dark:text-white md:text-3xl">
                {projectTitle}
              </h1>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left sm:min-w-[420px]">
              {[
                { label: 'Current Day', value: currentDay },
                { label: 'Project XP', value: xpEarnedValue.toLocaleString() },
                { label: 'Progress', value: `${overallProgressValue}%` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-black/5 bg-white/35 px-3 py-3 dark:border-white/10 dark:bg-white/5"
                >
                  <p className="font-press-start text-[7px] uppercase leading-relaxed text-[#00113b] dark:text-[#81bde6]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#00113b] dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70 md:p-7 text-left">
            {isFutureDay ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-[#00113b]/30 text-[#00113b] dark:border-[#8fd9ff]/30 dark:text-[#8fd9ff]">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-[#00113b] dark:text-white">Future day locked</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#00113b] dark:text-[#81bde6]">
                  Complete the current day's tasks to unlock this markdown note.
                </p>
              </div>
            ) : (
              <div className="project-day-markdown">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#00113b]/10 pb-4 dark:border-white/10">
                  <div>
                    <h2 className="text-xl font-semibold text-[#00113b] dark:text-white">
                      {selectedDay.title}
                    </h2>
                  </div>
                  {selectedDay.day < currentDay && selectedProgress.complete ? (
                    <span className="rounded-md border border-[#00113b]/10 bg-white/35 px-3 py-1.5 text-xs font-semibold text-[#00113b] dark:border-white/10 dark:bg-white/5 dark:text-[#8fd9ff]">
                      Completed
                    </span>
                  ) : null}
                </div>
                <MarkdownContent compact>{selectedMarkdown}</MarkdownContent>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70 text-left">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-press-start text-[9px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff]">
                    Today's Tasks
                  </h2>
                  <p className="mt-2 text-xs font-medium text-[#00113b] dark:text-[#81bde6]">
                    {selectedProgress.completed}/{selectedProgress.total || 0} complete
                  </p>
                </div>
                <span className="font-press-start text-[8px] text-[#00113b] dark:text-[#8fd9ff]">
                  {selectedProgress.percent}%
                </span>
              </div>

              <div className="mt-5 space-y-2">
                {selectedDay.tasks && selectedDay.tasks.length > 0 ? (
                  selectedDay.tasks.map((task) => {
                    const isLocked = selectedDay.day > currentDay;

                    return (
                      <button
                        key={task.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => handleTaskClick(selectedDay.day, task.id)}
                        className="group flex w-full items-center gap-3 rounded-sm border border-slate-400/60 bg-transparent px-3 py-3 text-left transition-all duration-300 hover:border-[#00113b] hover:shadow-[0_0_8px_rgba(0,17,59,0.22)] disabled:cursor-not-allowed disabled:opacity-55 dark:border-slate-600/60"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 transition-all duration-300 ${
                            task.completed
                              ? 'border-[#00113b] bg-[#00113b] text-white shadow-[0_0_6px_rgba(0,17,59,0.45)]'
                              : 'border-slate-400 bg-transparent group-hover:border-[#00113b] dark:border-slate-600'
                          }`}
                        >
                          {task.completed ? (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span
                          className="flex-1 text-sm font-medium leading-5 text-[#00113b] dark:text-white truncate"
                        >
                          {task.title}
                        </span>
                        <span className="rounded-md border border-[#7c6be3]/20 bg-white/30 px-2 py-1 font-press-start text-[8px] leading-none text-lavender dark:border-[#d6c7ff]/20 dark:bg-white/5">
                          +{task.xp} XP
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-[#00113b]/20 px-4 py-8 text-center text-sm text-[#00113b] dark:border-[#8fd9ff]/20 dark:text-[#81bde6]">
                    No tasks configured for this day.
                  </div>
                )}
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between font-press-start text-[8px] text-[#00113b] dark:text-[#81bde6]">
                  <span>Task Progress</span>
                  <span>{selectedProgress.percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full border border-black/5 bg-black/10 shadow-inner dark:border-white/10 dark:bg-black/50">
                  <div
                    className="h-full rounded-full bg-[#00113b] shadow-[0_0_6px_rgba(0,17,59,0.45)] transition-all duration-500"
                    style={{ width: `${selectedProgress.percent}%` }}
                  />
                </div>
              </div>

              {selectedDay.day < currentDay && selectedProgress.complete ? (
                <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-[#00113b] dark:text-emerald-200">
                  Day complete. Day {currentDay} is unlocked.
                </p>
              ) : null}
            </section>

            <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70 text-left">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-press-start text-[9px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff]">
                  Project Notes
                </h2>
                <span className="text-xs font-semibold text-[#00113b] dark:text-[#81bde6]">
                  Future locked
                </span>
              </div>
              <div className="space-y-2">
                {sidebarDays.map((day) => {
                  const locked = day.locked;
                  const active = day.active;

                  return (
                    <button
                      key={day.day}
                      type="button"
                      disabled={locked}
                      onClick={() => openDay(day.day)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition ${
                        active
                          ? 'border-[#00113b]/45 bg-white/55 shadow-sm dark:border-[#8fd9ff]/40 dark:bg-white/10'
                          : 'border-black/5 bg-white/20 hover:bg-white/40 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10'
                      } ${locked ? 'cursor-not-allowed opacity-55' : 'hover:-translate-y-0.5'}`}
                    >
                      <span>
                        <span className="block font-press-start text-[8px] uppercase text-[#00113b] dark:text-[#8fd9ff]">
                          Day {day.day}
                        </span>
                        <span className="mt-1 block text-sm font-medium text-[#00113b] dark:text-white">
                          {day.title}
                        </span>
                      </span>
                      {locked ? (
                        <Lock className="h-4 w-4 text-[#00113b] dark:text-[#8fd9ff]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#00113b] dark:text-[#8fd9ff]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Day Advancement Modal */}
      {advancementModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-sans">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0a1128] border-2 border-[#3C83F6]/50 rounded-2xl p-6 md:p-8 shadow-2xl text-center border-b-8">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#3C83F6] text-white p-3 rounded-full border-4 border-white dark:border-[#0a1128] shadow-lg">
              <img
                src={pixelStarImg}
                alt="Level Up"
                className="w-10 h-10 object-contain pixel-icon"
              />
            </div>
            
            <div className="mt-6 space-y-4">
              <h3 className="font-pixel-header text-[10px] tracking-wider text-[#3C83F6] dark:text-[#8fd9ff] uppercase">
                DAY COMPLETE!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Awesome effort! You have successfully completed all the tasks for <span className="font-semibold text-slate-800 dark:text-white font-sans">Day {advancementModal.completedDay}</span> of the project.
              </p>
              
              <div className="bg-[#3C83F6]/10 dark:bg-white/5 py-4 px-6 rounded-xl border border-[#3C83F6]/20 dark:border-white/10 flex items-center justify-center gap-3">
                <div className="text-right">
                  <span className="block text-[8px] font-press-start uppercase text-slate-400 dark:text-slate-500">PREVIOUS</span>
                  <span className="font-pixel-header text-[9px] text-slate-500 dark:text-slate-400">DAY {advancementModal.completedDay}</span>
                </div>
                <div className="font-bold text-slate-400">→</div>
                <div className="text-left">
                  <span className="block text-[8px] font-press-start uppercase text-[#3C83F6] dark:text-[#8fd9ff]">UNLOCKED</span>
                  <span className="font-pixel-header text-[9px] text-[#3C83F6] dark:text-white">DAY {advancementModal.nextDay}</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 italic font-sans">
                New lesson notes and tasks have been unlocked for you.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setAdvancementModal({ isOpen: false, completedDay: 1, nextDay: 2 });
                  setSearchParams({ day: String(advancementModal.nextDay) });
                }}
                className="px-6 py-2.5 bg-[#3C83F6] text-white hover:bg-blue-600 font-press-start text-[9px] rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
              >
                UNLEASH DAY {advancementModal.nextDay}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserSidebarLayout>
  );
}
