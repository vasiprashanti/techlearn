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

const getISTDateParts = (date) => {
  const d = new Date(date);
  const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    date: istDate.getUTCDate(),
  };
};

export const combineDateAndTime = (date, timeString = "00:00") => {
  const { year, month, date: day } = getISTDateParts(date);
  const [hours, minutes] = String(timeString || "00:00")
    .split(":")
    .map((val) => Number(val || 0));
  const utcTime = Date.UTC(year, month, day, hours, minutes, 0, 0);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
};

export const calculateCurrentDayNumber = (batch, trackTemplate, trackType) => {
  const trackAssignmentDate = getTrackAssignmentDate(batch, trackType);
  const now = new Date();
  
  let currentDay = 0;
  const maxDays = (trackTemplate?.totalDays || 365) + 10;
  
  for (let d = 1; d <= maxDays; d++) {
    const dayDate = new Date(trackAssignmentDate.getTime() + (d - 1) * 24 * 60 * 60 * 1000);
    
    let releaseTime = batch?.releaseTime || "00:00";
    if (trackTemplate) {
      const totalTemplateDays = trackTemplate.totalDays || trackTemplate.dayAssignments?.length || 1;
      const lookupDay = ((d - 1) % totalTemplateDays) + 1;
      const dayAssignment = (trackTemplate.dayAssignments || []).find(
        (da) => Number(da.dayNumber) === Number(lookupDay)
      );
      if (dayAssignment && dayAssignment.releaseTimeOverride) {
        releaseTime = dayAssignment.releaseTimeOverride;
      } else if (trackTemplate.defaultReleaseTime) {
        releaseTime = trackTemplate.defaultReleaseTime;
      }
    }
    
    const releaseStart = combineDateAndTime(dayDate, releaseTime);
    if (now >= releaseStart) {
      currentDay = d;
    } else {
      break;
    }
  }
  
  return currentDay;
};

