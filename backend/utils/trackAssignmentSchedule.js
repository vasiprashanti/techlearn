export const getTrackAssignmentDate = (batch, trackType) => {
  const getBaseDate = () => {
    if (trackType === "Daily Task") {
      return batch.assignedDailyTaskTrackAt || batch.assignedTrackTemplateAt || batch.startDate;
    }

    if (trackType === "Daily Challenge") {
      return batch.assignedDailyChallengeTrackAt || batch.assignedTrackTemplateAt || batch.startDate;
    }

    return batch.assignedTrackTemplateAt || batch.startDate;
  };

  const baseDate = getBaseDate();
  if (batch.startDate && new Date(baseDate) < new Date(batch.startDate)) {
    return batch.startDate;
  }
  return baseDate;
};
