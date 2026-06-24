export const getTrackAssignmentDate = (batch, trackType) => {
  if (trackType === "Daily Task") {
    return batch.assignedDailyTaskTrackAt || batch.assignedTrackTemplateAt || batch.startDate;
  }

  if (trackType === "Daily Challenge") {
    return batch.assignedDailyChallengeTrackAt || batch.assignedTrackTemplateAt || batch.startDate;
  }

  return batch.assignedTrackTemplateAt || batch.startDate;
};
