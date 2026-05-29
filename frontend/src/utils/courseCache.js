const COURSE_DETAILS_CACHE_PREFIX = 'techlearn-course-details-cache-v1';
const COURSE_DETAILS_CACHE_TTL_MS = 30 * 60 * 1000;

export const getCourseDetailsCacheKey = (courseId) => `${COURSE_DETAILS_CACHE_PREFIX}:${courseId}`;

export const readCachedCourseDetails = (courseId) => {
  if (!courseId) return null;

  try {
    const raw = localStorage.getItem(getCourseDetailsCacheKey(courseId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !parsed?.course) return null;
    if (Date.now() - parsed.timestamp > COURSE_DETAILS_CACHE_TTL_MS) return null;

    return parsed.course;
  } catch {
    return null;
  }
};

export const writeCachedCourseDetails = (courseId, course) => {
  if (!courseId || !course) return;

  try {
    localStorage.setItem(
      getCourseDetailsCacheKey(courseId),
      JSON.stringify({
        timestamp: Date.now(),
        course,
      })
    );
  } catch {
    // Cache is only a speed hint.
  }
};
