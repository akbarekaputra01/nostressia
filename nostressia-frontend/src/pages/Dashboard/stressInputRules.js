export const MAX_DAILY_ACTIVITY_HOURS = 24;

const toNumberOrZero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateDailyActivityHours = ({
  studyHours,
  extracurricularHours,
  sleepHours,
  socialHours,
  physicalHours,
}) =>
  toNumberOrZero(studyHours) +
  toNumberOrZero(extracurricularHours) +
  toNumberOrZero(sleepHours) +
  toNumberOrZero(socialHours) +
  toNumberOrZero(physicalHours);

export const isWithinDailyActivityLimit = (hours) =>
  hours <= MAX_DAILY_ACTIVITY_HOURS;

