export const getTrackAssignmentDate = (batch, trackType) => {
  if (batch.startDate) {
    return batch.startDate;
  }

  const getBaseDate = () => {
    if (trackType === "Daily Task") {
      return batch.assignedDailyTaskTrackAt || batch.assignedTrackTemplateAt;
    }

    if (trackType === "Daily Challenge") {
      return batch.assignedDailyChallengeTrackAt || batch.assignedTrackTemplateAt;
    }

    return batch.assignedTrackTemplateAt;
  };

  return getBaseDate() || new Date();
};
