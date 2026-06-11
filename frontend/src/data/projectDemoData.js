export const PROJECT_DEMO_STORAGE_KEY = 'techlearn-project-demo-state-v2';

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
    title: 'HTML Fundamentals',
    fileName: 'day-01.md',
    markdown: `
# HTML Fundamentals

HTML gives a webpage its structure. In Smart Seat Allocation, the first screen needs headings, forms, labels, buttons, and clean sections before styling or logic is added.

## Today's Learning

Think of HTML as the page skeleton. It tells the browser what content exists and what each piece means.

## Basic Page Example

~~~html
<main>
  <h1>Smart Seat Allocation</h1>
  <p>Collect student preferences and show allocation progress.</p>

  <form>
    <label for="studentName">Student Name</label>
    <input id="studentName" type="text" placeholder="Enter name" />

    <button type="submit">Save Preference</button>
  </form>
</main>
~~~

[Run Code](/compiler)

## Mini Task

- Create the first HTML layout for the allocation page.
- Add one heading, one paragraph, one form input, and one button.
- Keep every input connected to a clear label.
`,
    tasks: [
      { id: 'create-html-shell', title: 'Create HTML Shell', xp: 10, completed: true, xpAwarded: true },
      { id: 'add-form-labels', title: 'Add Form Labels', xp: 10, completed: true, xpAwarded: true },
      { id: 'run-html-example', title: 'Run HTML Example', xp: 10, completed: true, xpAwarded: true },
    ],
  },
  {
    day: 2,
    title: 'CSS Fundamentals',
    fileName: 'day-02.md',
    markdown: `
# CSS Fundamentals

CSS controls how the Smart Seat Allocation page looks. Once the HTML structure exists, CSS gives it spacing, color, borders, layout, and responsive behavior.

## Today's Learning

Use CSS to make the allocation form easier to scan and use. A clean project card should separate the title, description, form area, and action button.

## Styling Example

~~~css
.allocation-card {
  max-width: 520px;
  padding: 24px;
  border: 1px solid #001862;
  border-radius: 12px;
}

.allocation-card button {
  background: #001862;
  color: white;
  padding: 10px 16px;
}
~~~

[Run Code](/compiler)

## Mini Task

- Style the allocation card.
- Add comfortable spacing between form fields.
- Make the submit button visually clear.
`,
    tasks: [
      { id: 'style-card', title: 'Style Allocation Card', xp: 10, completed: true, xpAwarded: true },
      { id: 'space-form-fields', title: 'Space Form Fields', xp: 10, completed: true, xpAwarded: true },
      { id: 'run-css-example', title: 'Run CSS Example', xp: 10, completed: true, xpAwarded: true },
    ],
  },
  {
    day: 3,
    title: 'JavaScript Fundamentals',
    fileName: 'day-03.md',
    markdown: `
# JavaScript Fundamentals

JavaScript adds behavior to the project. It can read form values, update task progress, validate input, and refresh the UI without a page reload.

## Today's Learning

For Smart Seat Allocation, JavaScript can keep track of selected preferences and calculate how much of the day's work is complete.

## Progress Example

~~~js
const tasks = [
  { title: 'Create form', completed: true },
  { title: 'Validate preference', completed: false },
  { title: 'Save selection', completed: false },
];

const completed = tasks.filter((task) => task.completed).length;
const progress = Math.round((completed / tasks.length) * 100);

console.log(progress + '% complete');
~~~

[Run Code](/compiler)

## Mini Task

- Create an array of project tasks.
- Mark one task as completed.
- Calculate the current progress percentage.
`,
    tasks: [
      { id: 'create-task-array', title: 'Create Task Array', xp: 10, completed: true, xpAwarded: true },
      { id: 'calculate-progress', title: 'Calculate Progress', xp: 10, completed: true, xpAwarded: true },
      { id: 'run-js-example', title: 'Run JS Example', xp: 10, completed: true, xpAwarded: true },
    ],
  },
  {
    day: 4,
    title: 'React Fundamentals',
    fileName: 'day-04.md',
    markdown: `
# React Fundamentals

React helps split the dashboard into reusable UI pieces. The project hero, daily tasks, notes list, and stats can each become small components.

## Today's Learning

React components receive data through props and render the current state of the project. That makes it easier to swap mock data for backend data later.

## Component Example

~~~jsx
function ProjectNoteCard({ day, title }) {
  return (
    <article>
      <p>Day {day}</p>
      <h3>{title}</h3>
    </article>
  );
}
~~~

## Mini Task

- Create a note card component.
- Pass day number and topic title as props.
- Render the card inside a project notes list.
`,
    tasks: [
      { id: 'build-note-card', title: 'Build Note Card', xp: 10, completed: true, xpAwarded: true },
      { id: 'pass-note-props', title: 'Pass Note Props', xp: 10, completed: true, xpAwarded: true },
      { id: 'render-note-list', title: 'Render Note List', xp: 10, completed: true, xpAwarded: true },
    ],
  },
  {
    day: 5,
    title: 'Backend Login API',
    fileName: 'day-05.md',
    markdown: `
# Backend Login API

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
    title: 'HTML Notes Review',
    fileName: 'day-07.md',
    markdown: `
# HTML Notes Review

Review the HTML structure from the earlier mock notes and connect it back to the full Smart Seat Allocation flow.

## Today's Learning

Focus on semantic structure, labeled forms, readable sections, and clean project notes that can be rendered from markdown.

## Revision Task

- Revisit the HTML form structure.
- Check that labels and inputs are connected.
- Confirm that the note can be opened from the project dashboard.
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
