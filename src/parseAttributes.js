import { from } from './utils/list';
import { parseDuration, parseDate } from './utils/time';

// TODO: maybe order these in some way that makes it easy to find
export const parsers = {
  /**
   *
   */
  mediaPresentationDuration(value) {
    return parseDuration(value);
  },
  /**
   *
   */
  availabilityStartTime(value) {
    return parseDate(value) / 1000;
  },
  /**
   *
   */
  minimumUpdatePeriod(value) {
    return parseDuration(value);
  },
  /**
   *
   */
  timeShiftBufferDepth(value) {
    return parseDuration(value);
  },
  /**
   *
   */
  start(value) {
    return parseDuration(value);
  },
  /**
   *
   */
  width(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  height(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  bandwidth(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  startNumber(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  timescale(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  duration(value) {
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue)) {
      return parseDuration(value);
    }

    return parsedValue;
  },
  /**
   *
   */
  d(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  t(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  r(value) {
    return parseInt(value, 10);
  },
  /**
   *
   */
  DEFAULT(value) {
    return value;
  }
};

export const parseAttributes = (el) => {
  if (!(el && el.attributes)) {
    return {};
  }

  return from(el.attributes)
    .reduce((a, e) => {
      const parseFn = parsers[e.name] || parsers.DEFAULT;

      a[e.name] = parseFn(e.value);

      return a;
    }, {});
};
