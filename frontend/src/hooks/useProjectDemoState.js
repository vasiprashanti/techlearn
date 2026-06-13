import { useMemo, useState } from 'react';
import {
  PROJECT_DEMO_STORAGE_KEY,
  createInitialProjectDemoState,
  projectDemoNotes,
  projectDemoProject,
} from '../data/projectDemoData';

const cloneState = (value) => JSON.parse(JSON.stringify(value));

const readProjectDemoState = () => {
  if (typeof window === 'undefined') return createInitialProjectDemoState();

  try {
    const raw = localStorage.getItem(PROJECT_DEMO_STORAGE_KEY);
    if (!raw) return createInitialProjectDemoState();

    const parsed = JSON.parse(raw);
    if (!parsed?.days || !Array.isArray(parsed.days)) return createInitialProjectDemoState();

    return {
      ...createInitialProjectDemoState(),
      ...parsed,
      days: parsed.days,
      bonusAwardedDays: Array.isArray(parsed.bonusAwardedDays) ? parsed.bonusAwardedDays : [],
    };
  } catch {
    return createInitialProjectDemoState();
  }
};

const writeProjectDemoState = (nextState) => {
  try {
    localStorage.setItem(PROJECT_DEMO_STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Demo state persistence is a convenience only.
  }
};

const sumAwardedXp = (days) =>
  days.reduce(
    (total, day) =>
      total +
      day.tasks.reduce(
        (dayTotal, task) => dayTotal + (task.xpAwarded ? Number(task.xp || 0) : 0),
        0
      ),
    0
  );

const countCompletedTasks = (days) =>
  days.reduce((total, day) => total + day.tasks.filter((task) => task.completed).length, 0);

export const useProjectDemoState = () => {
  const [projectState, setProjectState] = useState(readProjectDemoState);

  const saveProjectState = (updater) => {
    setProjectState((current) => {
      const next = typeof updater === 'function' ? updater(cloneState(current)) : updater;
      writeProjectDemoState(next);
      return next;
    });
  };

  const completeTask = (dayNumber, taskId) => {
    saveProjectState((draft) => {
      const day = draft.days.find((item) => item.day === dayNumber);
      if (!day || day.day > draft.currentDay) return draft;

      const task = day.tasks.find((item) => item.id === taskId);
      if (!task) return draft;

      const nextCompleted = !task.completed;
      task.completed = nextCompleted;

      if (nextCompleted && !task.xpAwarded) {
        task.xpAwarded = true;
      }

      const isDayComplete = day.tasks.length > 0 && day.tasks.every((item) => item.completed);

      if (isDayComplete && !draft.bonusAwardedDays.includes(day.day)) {
        draft.bonusAwardedDays.push(day.day);
      }

      if (day.day === draft.currentDay && isDayComplete) {
        const nextDay = draft.days.find((item) => item.day > draft.currentDay);
        if (nextDay) {
          draft.currentDay = nextDay.day;
        }
      }

      return draft;
    });
  };

  const resetProjectDemoState = () => {
    const initialState = createInitialProjectDemoState();
    writeProjectDemoState(initialState);
    setProjectState(initialState);
  };

  const derived = useMemo(() => {
    const currentDayData =
      projectState.days.find((day) => day.day === projectState.currentDay) ||
      projectState.days[0];
    const projectTasks = currentDayData?.tasks || [];
    const projectCompletedToday = projectTasks.filter((task) => task.completed).length;
    const projectTotalToday = projectTasks.length;
    const projectDayProgress =
      projectTotalToday > 0 ? Math.round((projectCompletedToday / projectTotalToday) * 100) : 0;
    const projectDayComplete = projectTotalToday > 0 && projectCompletedToday === projectTotalToday;
    const bonusXp = projectState.bonusAwardedDays.length * projectDemoProject.completionBonus;
    const projectXpEarned = projectDemoProject.baseXpBeforeToday + sumAwardedXp(projectState.days) + bonusXp;
    const projectCompletedTotal = Math.min(
      projectDemoProject.totalProjectTasks,
      projectDemoProject.completedTasksBeforeToday + countCompletedTasks(projectState.days)
    );
    const projectOverallProgress =
      projectDemoProject.totalProjectTasks > 0
        ? Math.round((projectCompletedTotal / projectDemoProject.totalProjectTasks) * 100)
        : 0;
    const dayNotes = projectState.days.map(({ day, title, fileName }) => ({ day, title, fileName }));
    const accessibleProjectNotes = dayNotes.filter((note) => note.day <= projectState.currentDay);
    const lockedProjectNotesCount = dayNotes.filter((note) => note.day > projectState.currentDay).length;

    return {
      currentDayData,
      projectTasks,
      projectCompletedToday,
      projectTotalToday,
      projectDayProgress,
      projectDayComplete,
      projectXpEarned,
      projectCompletedTotal,
      projectOverallProgress,
      accessibleProjectNotes,
      lockedProjectNotesCount,
      dashboardData: {
        project: {
          ...projectDemoProject,
          currentDay: projectState.currentDay,
          daysRemaining: Math.max(projectDemoProject.totalDays - projectState.currentDay, 0),
        },
        todayTasks: projectTasks,
        notes: projectDemoNotes,
        dayNotes,
      },
    };
  }, [projectState]);

  return {
    projectState,
    completeTask,
    resetProjectDemoState,
    ...derived,
  };
};
