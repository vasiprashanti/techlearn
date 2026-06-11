import { ArrowLeft, ChevronRight, Lock } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import MarkdownContent from '../Learn/MarkdownContent';
import { useProjectDemoState } from '../../hooks/useProjectDemoState';

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

export default function ProjectDayNotes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    projectState,
    dashboardData,
    currentDayData,
    projectXpEarned,
    projectOverallProgress,
    completeTask,
  } = useProjectDemoState();

  const requestedDay = Number(searchParams.get('day'));
  const selectedDayNumber = Number.isFinite(requestedDay) && requestedDay > 0
    ? requestedDay
    : dashboardData.project.currentDay;
  const selectedDay =
    projectState.days.find((day) => day.day === selectedDayNumber) || currentDayData;
  const isFutureDay = selectedDay.day > dashboardData.project.currentDay;
  const selectedProgress = getDayProgress(selectedDay);
  const isDemoRoute = location.pathname.startsWith('/demo');
  const backPath = isDemoRoute ? '/demo' : '/dashboard';

  const openDay = (dayNumber) => {
    if (dayNumber > dashboardData.project.currentDay) return;
    setSearchParams(dayNumber === dashboardData.project.currentDay ? {} : { day: String(dayNumber) });
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-6 text-[#00113b]">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#00113b] transition hover:text-[#001b5c] dark:text-[#8fd9ff] dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project Dashboard
        </button>

        <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="font-press-start text-[8px] uppercase tracking-widest text-[#00113b] dark:text-[#8fd9ff]">
                Today's Learning
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-[#00113b] dark:text-white md:text-3xl">
                {dashboardData.project.title}
              </h1>
              <p className="text-sm leading-6 text-[#00113b] dark:text-[#81bde6]">
                Day {selectedDay.day} - {selectedDay.title}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left sm:min-w-[420px]">
              {[
                { label: 'Current Day', value: `Day ${dashboardData.project.currentDay}` },
                { label: 'Project XP', value: projectXpEarned.toLocaleString() },
                { label: 'Progress', value: `${projectOverallProgress}%` },
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
          <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70 md:p-7">
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
                    <p className="font-press-start text-[8px] uppercase tracking-widest text-[#00113b] dark:text-[#8fd9ff]">
                      {selectedDay.fileName}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#00113b] dark:text-white">
                      {selectedDay.title}
                    </h2>
                  </div>
                  {selectedDay.day < dashboardData.project.currentDay && selectedProgress.complete ? (
                    <span className="rounded-md border border-[#00113b]/10 bg-white/35 px-3 py-1.5 text-xs font-semibold text-[#00113b] dark:border-white/10 dark:bg-white/5 dark:text-[#8fd9ff]">
                      Completed
                    </span>
                  ) : null}
                </div>
                <MarkdownContent compact>{selectedDay.markdown}</MarkdownContent>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70">
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
                {selectedDay.tasks.length > 0 ? (
                  selectedDay.tasks.map((task) => {
                    const isLocked = selectedDay.day > dashboardData.project.currentDay;

                    return (
                      <button
                        key={task.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => completeTask(selectedDay.day, task.id)}
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
                          className={`flex-1 text-sm font-medium leading-5 text-[#00113b] dark:text-white ${
                            task.completed ? 'line-through' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="rounded-md border border-[#00113b]/10 bg-white/30 px-2 py-1 text-[10px] font-semibold text-[#00113b] dark:border-white/10 dark:bg-white/5 dark:text-[#8fd9ff]">
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

              {selectedDay.day < dashboardData.project.currentDay && selectedProgress.complete ? (
                <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-[#00113b] dark:text-emerald-200">
                  Day complete. Day {dashboardData.project.currentDay} is unlocked.
                </p>
              ) : null}
            </section>

            <section className="dashboard-surface rounded-xl border border-black/5 bg-white/40 p-5 shadow-sm backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-[#020b23]/70">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-press-start text-[9px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff]">
                  Project Notes
                </h2>
                <span className="text-xs font-semibold text-[#00113b] dark:text-[#81bde6]">
                  Future locked
                </span>
              </div>
              <div className="space-y-2">
                {projectState.days.map((day) => {
                  const locked = day.day > dashboardData.project.currentDay;
                  const active = day.day === selectedDay.day;

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
    </UserSidebarLayout>
  );
}
