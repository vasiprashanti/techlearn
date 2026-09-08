export const getTrackAssignmentDate = (batch, trackType, individualStartDate) => {
  if (batch) {
    if (batch.startDate) {
      return new Date(batch.startDate);
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

    const baseDate = getBaseDate();
    if (baseDate) return new Date(baseDate);
  }

  if (individualStartDate) {
    const d = new Date(individualStartDate);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return new Date();
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

const toPositiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const getCalendarDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
};

/**
 * Return the effective number of calendar days for a daily track.
 *
 * TrackTemplate.totalDays is useful metadata, but it is not safe as the only
 * bound: imported templates can retain totalDays=1 while containing a
 * multi-day assignment, and Program/batch schedules are the real entitlement
 * bounds. A known Program or batch duration therefore wins over the legacy
 * template value. The old template fields remain a fallback for standalone
 * legacy tracks.
 */
export const getTrackScheduleDays = ({
  batch,
  trackTemplate,
  programDurationDays = null,
} = {}) => {
  const programDays = toPositiveInteger(programDurationDays);
  const batchDays = batch?.startDate && batch?.expiryDate
    ? getCalendarDaysBetween(batch.startDate, batch.expiryDate)
    : null;
  const assignmentDays = (trackTemplate?.dayAssignments || [])
    .map((assignment) => toPositiveInteger(assignment?.dayNumber))
    .filter(Boolean);
  const highestAssignmentDay = assignmentDays.length ? Math.max(...assignmentDays) : null;
  const templateDays = toPositiveInteger(trackTemplate?.totalDays);

  const entitlementBounds = [programDays, batchDays].filter(Boolean);
  if (entitlementBounds.length) return Math.min(...entitlementBounds);
  return highestAssignmentDay || templateDays || 1;
};

export const calculateCurrentDayNumber = (
  batch,
  trackTemplate,
  trackType,
  individualStartDate,
  { programDurationDays = null, now = new Date() } = {},
) => {
  const trackAssignmentDate = getTrackAssignmentDate(batch, trackType, individualStartDate);
  const currentTime = new Date(now);

  let currentDay = 0;
  const maxDays = getTrackScheduleDays({ batch, trackTemplate, programDurationDays });
  
  for (let d = 1; d <= maxDays; d++) {
    const dayDate = new Date(trackAssignmentDate.getTime() + (d - 1) * 24 * 60 * 60 * 1000);
    
    let releaseTime = batch?.releaseTime || "00:00";
    if (trackTemplate) {
      const dayAssignment = (trackTemplate.dayAssignments || []).find(
        (da) => Number(da.dayNumber) === Number(d)
      );
      if (dayAssignment && dayAssignment.releaseTimeOverride) {
        releaseTime = dayAssignment.releaseTimeOverride;
      } else if (trackTemplate.defaultReleaseTime) {
        releaseTime = trackTemplate.defaultReleaseTime;
      }
    }
    
    const releaseStart = combineDateAndTime(dayDate, releaseTime);
    if (currentTime >= releaseStart) {
      currentDay = d;
    } else {
      break;
    }
  }
  
  return Math.max(1, currentDay);
};


