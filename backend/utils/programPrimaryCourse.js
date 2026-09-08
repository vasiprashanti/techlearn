const getId = (value) => value?._id || value?.id || value || null;

const getIds = (values = []) => (Array.isArray(values) ? values : [])
  .map(getId)
  .filter(Boolean)
  .map(String);

/**
 * Resolve the stable Placement Learning course for a Program.
 *
 * `primaryCourseId` is authoritative when it still belongs to the Program.
 * Older Programs fall back to their first course for compatibility; callers
 * that persist or project a legacy Program should retain that resolved value
 * so later course reordering cannot change the learner's notes course.
 */
export const resolveProgramPrimaryCourseId = (program) => {
  const courseIds = getIds(program?.courseIds);
  const explicitId = getId(program?.primaryCourseId);
  if (explicitId && courseIds.includes(String(explicitId))) return explicitId;
  return courseIds[0] || null;
};

export const isProgramPrimaryCourseMappingValid = (program) => {
  const explicitId = getId(program?.primaryCourseId);
  if (!explicitId) return false;
  return getIds(program?.courseIds).includes(String(explicitId));
};
