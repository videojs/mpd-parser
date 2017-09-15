export const parseDuration = str => {
  const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
  const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
  const SECONDS_IN_DAY = 24 * 60 * 60;
  const SECONDS_IN_HOUR = 60 * 60;
  const SECONDS_IN_MIN = 60;

  // P10Y10M10DT10H10M10.1S
  const durationRegex =
    /P(?:(\d*)Y)?(?:(\d*)M)?(?:(\d*)D)?(?:T(?:(\d*)H)?(?:(\d*)M)?(?:([\d.]*)S)?)?/;
  const [year, month, day, hour, minute, second] = durationRegex.exec(str).slice(1);

  return (parseFloat(year || 0) * SECONDS_IN_YEAR +
    parseFloat(month || 0) * SECONDS_IN_MONTH +
    parseFloat(day || 0) * SECONDS_IN_DAY +
    parseFloat(hour || 0) * SECONDS_IN_HOUR +
    parseFloat(minute || 0) * SECONDS_IN_MIN +
    parseFloat(second || 0));
};
