export const PROJECT_DEMO_STORAGE_KEY = 'techlearn-project-demo-state-v1';

export const projectDemoProject = {
  title: 'Smart Seat Allocation',
  description:
    'Build a full-stack seat allocation workflow with preferences, eligibility, allocation rules, dashboards, and review tracking.',
  totalDays: 15,
  completionBonus: 25,
  streak: 6,
  baseXpBeforeToday: 285,
  completedTasksBeforeToday: 13,
  totalProjectTasks: 45,
  certificateStatus: 'Not Eligible Yet',
};

export const projectDemoNotes = {
  overview:
    'Students are building a smart seat allocation system that lets admins collect preferences, apply allocation rules, and review seat assignments in one place.',
  objectives: ['Understand project-based delivery', 'Build clean feature slices', 'Practice daily commits and reviews'],
  deliverables: ['Authentication flow', 'Student dashboard', 'Admin assignment workflow', 'Submission tracking'],
  techStack: ['React', 'Node.js', 'Express', 'MongoDB'],
  folderStructure: ['client/src/pages', 'client/src/components', 'server/models', 'server/routes'],
  apis: ['POST /auth/login', 'GET /projects/current', 'PATCH /projects/tasks/:taskId'],
  businessRules: ['One active project per batch', 'XP is awarded once per task', 'Day bonus unlocks after all tasks are complete'],
};

export const projectDemoDays = [
  {
    day: 1,
    title: 'Project Setup & Repository',
    fileName: 'day-01.md',
    markdown: `
# Project Setup & Repository

Set up the Smart Seat Allocation repository and prepare the project structure that every later feature will build on.

## Goals

- Create the frontend and backend folders.
- Add shared naming conventions for routes, models, and services.
- Commit the initial setup so the project has a clean baseline.

## Checklist

- Initialize the client app.
- Initialize the server app.
- Create the first README notes for local setup.
`,
    tasks: [],
  },
  {
    day: 2,
    title: 'Seat Matrix Planning',
    fileName: 'day-02.md',
    markdown: `
# Seat Matrix Planning

Define how seats, students, and allocation preferences will be represented before writing feature code.

## Goals

- List the fields required for seats.
- Identify student preference inputs.
- Sketch the first allocation flow.
`,
    tasks: [],
  },
  {
    day: 3,
    title: 'Preference Form State',
    fileName: 'day-03.md',
    markdown: `
# Preference Form State

Build the form state needed to collect student preferences for the allocation flow.

## Goals

- Capture student choices.
- Validate required inputs.
- Prepare the request payload shape.
`,
    tasks: [],
  },
  {
    day: 4,
    title: 'Allocation Rules Design',
    fileName: 'day-04.md',
    markdown: `
# Allocation Rules Design

Document the rules that decide how students are mapped to available seats.

## Goals

- Define eligibility checks.
- Decide tie-break behavior.
- Prepare service-layer function names.
`,
    tasks: [],
  },
  {
    day: 5,
    title: 'Service Layer & GitHub Commit',
    fileName: 'day-05.md',
    markdown: `
# Service Layer & GitHub Commit

Today focuses on wiring the first backend workflow for Smart Seat Allocation. Build the authentication surface that later project APIs can rely on.

## Today's Learning

The project needs a secure student and admin entry point before allocation data can be saved. Create the login API, issue a JWT after successful validation, and connect the dashboard shell to the authenticated request flow.

## Implementation Notes

- Keep the login API small and predictable.
- Return clear error messages for invalid credentials.
- Store only the token and required user metadata on the client.
- Commit after the API and dashboard integration are both working.

## Expected Outcome

By the end of the day, a student should be able to sign in, land on the dashboard, and make authenticated API calls without a page reload.
`,
    tasks: [
      { id: 'create-login-api', title: 'Create Login API', xp: 10, completed: false, xpAwarded: false },
      { id: 'implement-jwt', title: 'Implement JWT', xp: 15, completed: true, xpAwarded: true },
      { id: 'build-dashboard', title: 'Build Dashboard', xp: 15, completed: false, xpAwarded: false },
      { id: 'integrate-apis', title: 'Integrate APIs', xp: 10, completed: false, xpAwarded: false },
    ],
  },
  {
    day: 6,
    title: 'Allocation API Integration',
    fileName: 'day-06.md',
    markdown: `
# Allocation API Integration

Use the authenticated request flow to connect the first allocation endpoints.

## Today's Learning

Students should understand how the client requests allocation data and how the server responds with a clean, dashboard-ready shape.

## Expected Outcome

The dashboard can request allocation status and render the latest project progress.
`,
    tasks: [
      { id: 'create-allocation-route', title: 'Create Allocation Route', xp: 15, completed: false, xpAwarded: false },
      { id: 'connect-project-service', title: 'Connect Project Service', xp: 15, completed: false, xpAwarded: false },
      { id: 'render-allocation-status', title: 'Render Allocation Status', xp: 10, completed: false, xpAwarded: false },
    ],
  },
  {
    day: 7,
    title: 'Review Dashboard Wiring',
    fileName: 'day-07.md',
    markdown: `
# Review Dashboard Wiring

Prepare the review dashboard so students can inspect progress and revisit earlier learning notes.

## Today's Learning

Focus on readable progress indicators, locked future days, and clear revision access for previous notes.
`,
    tasks: [
      { id: 'build-review-card', title: 'Build Review Card', xp: 10, completed: false, xpAwarded: false },
      { id: 'lock-future-days', title: 'Lock Future Days', xp: 10, completed: false, xpAwarded: false },
      { id: 'polish-progress-ui', title: 'Polish Progress UI', xp: 10, completed: false, xpAwarded: false },
    ],
  },
];

export const createInitialProjectDemoState = () => ({
  currentDay: 5,
  bonusAwardedDays: [],
  days: projectDemoDays.map((day) => ({
    ...day,
    tasks: day.tasks.map((task) => ({ ...task })),
  })),
});
