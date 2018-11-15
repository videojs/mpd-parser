import { range } from '../utils/list';

/**
 * Functions for calculating the range of available segments in static and dynamic
 * manifests.
 */
export const segmentRange = {
  /**
   * Returns the entire range of available segments for a static MPD
   *
   * @param {Object} attributes
   *        Inheritied MPD attributes
   * @return {{ start: number, end: number }}
   *         The start and end numbers for available segments
   */
  static(attributes) {
    const {
      duration,
      timescale = 1,
      startNumber = 1,
      sourceDuration,
      periodDuration
    } = attributes;

    const timeRange = typeof periodDuration === 'undefined' ?
      sourceDuration : periodDuration;

    return {
      start: startNumber,
      end: Math.ceil(timeRange / (duration / timescale)) + startNumber
    };
  },

  /**
   * Returns the current live window range of available segments for a dynamic MPD
   *
   * @param {Object} attributes
   *        Inheritied MPD attributes
   * @return {{ start: number, end: number }}
   *         The start and end numbers for available segments
   */
  dynamic(attributes) {
    const {
      NOW,
      clientOffset,
      availabilityStartTime,
      timescale = 1,
      duration,
      periodDuration,
      start = 0,
      timeShiftBufferDepth = Infinity,
      startNumber = 1,
      endNumber,
      minBufferTime = duration
    } = attributes;
    const now = (NOW + clientOffset) / 1000;
    const periodStartWC = availabilityStartTime + start;

    if (periodStartWC > now) {
      // period too far in the future
      return;
    }
    const startTime = Math.max(0, now - start - availabilityStartTime - timeShiftBufferDepth);
    let startIndex = Math.ceil(startTime / (duration / timescale)) + startNumber;

    startIndex = Math.max(startIndex, startNumber);

    const safeLivePoint = now - start - availabilityStartTime - minBufferTime;
    let endTime = safeLivePoint;

    if (periodDuration && (periodDuration + start + availabilityStartTime) < now) {
      endTime = periodDuration;
    }

    let endIndex = Math.floor(endTime / (duration / timescale)) + startNumber;

    // I'm not sure if this is needed
    const fractionalTime = endTime - ((endIndex - startNumber) * (duration / timescale));

    if (endTime === periodDuration && fractionalTime >= (1 / 90000)) {
      // incrementing for fractional time
      endIndex++;
    }
    if (endIndex > endNumber) {
      // calculated ending index exceeds what it should be
      endIndex = endNumber;
    }
    if (endIndex < startNumber) {
      // period too far in the future
      return;
    }
    if (startIndex > endNumber) {
      // period too far in the past
      return;
    }
    return {
      start: startIndex,
      end: endIndex
    };
  }
};

/**
 * Maps a range of numbers to objects with information needed to build the corresponding
 * segment list
 *
 * @name toSegmentsCallback
 * @function
 * @param {number} number
 *        Number of the segment
 * @param {number} index
 *        Index of the number in the range list
 * @return {{ number: Number, duration: Number, timeline: Number, time: Number }}
 *         Object with segment timing and duration info
 */

/**
 * Returns a callback for Array.prototype.map for mapping a range of numbers to
 * information needed to build the segment list.
 *
 * @param {Object} attributes
 *        Inherited MPD attributes
 * @return {toSegmentsCallback}
 *         Callback map function
 */
export const toSegments = (attributes) => (number, index) => {
  const {
    duration,
    timescale = 1
  } = attributes;

  return {
    number,
    duration: duration / timescale,
    time: index * duration
  };
};

/**
 * Returns a list of objects containing segment timing and duration info used for
 * building the list of segments. This uses the @duration attribute specified
 * in the MPD manifest to derive the range of segments.
 *
 * @param {Object} attributes
 *        Inherited MPD attributes
 * @return {{number: number, duration: number, time: number, timeline: number}[]}
 *         List of Objects with segment timing and duration info
 */
export const parseByDuration = (attributes) => {
  const {
    type = 'static',
    duration,
    timescale = 1,
    sourceDuration,
    periodDuration
  } = attributes;

  const nums = segmentRange[type](attributes);

  if (!nums) {
    return [];
  }

  const { start, end } = nums;
  const segments = range(start, end).map(toSegments(attributes));

  if (type === 'static') {
    const index = segments.length - 1;

    // final segment may be less than full segment duration
    segments[index].duration = (sourceDuration || periodDuration) -
      (duration / timescale * index);
  }

  return segments;
};
