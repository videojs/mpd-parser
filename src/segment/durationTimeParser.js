import { range } from '../utils/list';

/**
 *
 */
export const segmentRange = {
  /**
   *
   */
  static(attributes) {
    const {
      duration,
      timescale = 1,
      sourceDuration,
      startNumber = 1
    } = attributes;

    return {
      start: startNumber,
      end: startNumber + Math.ceil(sourceDuration / (duration / timescale))
    };
  },
  /**
   *
   */
  dynamic(attributes) {
    const {
      NOW,
      clientOffset,
      availabilityStartTime,
      timescale = 1,
      duration,
      start = 0,
      startNumber = 1,
      minimumUpdatePeriod = 0,
      timeShiftBufferDepth = Infinity
    } = attributes;
    const now = (NOW + clientOffset) / 1000;
    const periodStartWC = availabilityStartTime + start;
    const periodEndWC = now + minimumUpdatePeriod;
    const periodDuration = periodEndWC - periodStartWC;
    const segmentCount = Math.ceil(periodDuration * timescale / duration);
    const availableStart =
      Math.floor((now - periodStartWC - timeShiftBufferDepth) * timescale / duration);
    const availableEnd = Math.floor((now - periodStartWC) * timescale / duration);

    return {
      start: Math.max(startNumber, availableStart),
      end: Math.min(startNumber + segmentCount, availableEnd)
    };
  }
};

/**
 *
 */
export const toSegments = (attributes) => (number, index) => {
  const {
    duration,
    timescale = 1,
    periodIndex
  } = attributes;

  return {
    number,
    duration: duration / timescale,
    timeline: periodIndex,
    time: index * duration
  };
};

/**
 *
 */
export const parseByDuration = (attributes) => {
  const {
    type = 'static',
    duration,
    timescale = 1,
    sourceDuration
  } = attributes;

  const { start, end } = segmentRange[type](attributes);
  const segments = range(start, end).map(toSegments(attributes));

  if (type === 'static') {
    const index = segments.length - 1;

    // final segment may be less than full segment duration
    segments[index].duration = sourceDuration - (duration / timescale * index);
  }

  return segments;
};
