// Keep old QA/seed records available to administrators for cleanup while
// preventing placeholder content from appearing in the learner catalog.
const NON_PUBLIC_COURSE_NAME = /^(?:(?:test|demo|sample|placeholder)(?:[\s_-]+|$)|phase[\s_-]*(?:2|two)\b)/i;

export const isUserVisibleCourse = (course) => {
  const title = String(course?.title || "").trim();
  return Boolean(title) && !NON_PUBLIC_COURSE_NAME.test(title);
};

export default isUserVisibleCourse;
