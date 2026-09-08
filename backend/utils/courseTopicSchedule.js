/**
 * Return the stable program day for a course topic.
 *
 * Topic.index is the persisted day/order assigned by the admin curriculum
 * tools. The fallback keeps older records without a usable index readable,
 * while preventing a missing topic from renumbering every later day.
 */
export const getTopicDayNumber = (topic, fallbackIndex = 0) => {
  const persistedDay = Number(topic?.dayNumber ?? topic?.day ?? topic?.index);
  if (Number.isInteger(persistedDay) && persistedDay > 0) return persistedDay;
  return fallbackIndex + 1;
};
