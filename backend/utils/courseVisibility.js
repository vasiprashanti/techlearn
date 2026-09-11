// Keep old QA/seed records available to administrators for cleanup while
// preventing placeholder content from appearing in the learner catalog.
const NON_PUBLIC_COURSE_NAME = /^(?:(?:test|demo|sample|placeholder)(?:[\s_-]+|$)|phase[\s_-]*(?:2|two)\b)/i;

/**
 * Return the Mongo conditions that make a course discoverable in the public
 * catalog. Courses linked from an active Public + Free Program are public
 * content even when an older batch assignment left a stale batch reference
 * on the Course document.
 */
export const buildPublicCourseConditions = (publicFreeProgramCourseIds = []) => {
  const courseIds = (Array.isArray(publicFreeProgramCourseIds) ? publicFreeProgramCourseIds : [])
    .filter(Boolean);

  return [
    { assignedBatchIds: { $size: 0 } },
    { assignedBatchIds: { $exists: false } },
    ...(courseIds.length ? [{ _id: { $in: courseIds } }] : []),
  ];
};

export const buildPublicFreeProgramQuery = () => ({
  status: "Active",
  visibility: "Public",
  $or: [
    { pricingType: "Free" },
    // Older public/free programs may not have been backfilled with the new
    // pricingType field but still carry their legacy access tier.
    {
      pricingType: { $exists: false },
      accessTier: { $in: ["Free", "Both"] },
    },
  ],
});

export const hasPublicFreeProgramLink = (linkedPrograms = []) => linkedPrograms.some(
  (program) => program?.visibility === "Public" && (
    program?.pricingType === "Free"
    || (!program?.pricingType && ["Free", "Both"].includes(program?.accessTier))
  )
);

export const isUserVisibleCourse = (course) => {
  const title = String(course?.title || "").trim();
  if (!title || NON_PUBLIC_COURSE_NAME.test(title)) return false;

  const hasTopics = (Number(course?.numTopics) > 0) || (Array.isArray(course?.topicIds) && course.topicIds.length > 0);
  return hasTopics;
};

export default isUserVisibleCourse;
