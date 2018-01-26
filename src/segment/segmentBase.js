import resolveUrl from '../utils/resolveUrl';
import errors from '../errors';
import { parseByDuration } from './timeParser';

/**
 * Translates SegmentBase into a set of segments.
 * (DASH SPEC Section 5.3.9.3.2) contains a set of <SegmentURL> nodes.  Each
 * node should be translated into segment.
 *
 * @param {Object} attributes
 *   Object containing all inherited attributes from parent elements with attribute
 *   names as keys
 * @return {Object.<Array>} list of segments
 */
export const segmentsFromBase = (attributes) => {
  const {
    baseUrl,
    initialization = '',
    sourceDuration,
    timescale = 1,
    startNumber = 1,
    periodIndex = 0,
    duration
  } = attributes;

  // base url is required for SegmentBase to work, per spec (Section 5.3.9.2.1)
  if (!baseUrl) {
    throw new Error(errors.NO_BASE_URL);
  }

  const segment = {
    map: {
      uri: initialization,
      resolvedUri: resolveUrl(attributes.baseUrl || '', initialization)
    },
    resolvedUri: resolveUrl(attributes.baseUrl || '', ''),
    uri: attributes.baseUrl
  };
  const parsedTimescale = parseInt(timescale, 10);

  // If there is a duration, use it, otherwise use the given duration of the source
  // (since SegmentBase is only for one total segment)
  if (duration) {
    const parsedDuration = parseInt(duration, 10);
    const start = parseInt(startNumber, 10);
    const segmentTimeInfo = parseByDuration(start,
      periodIndex,
      parsedTimescale,
      parsedDuration,
      sourceDuration);

    if (segmentTimeInfo.length >= 1) {
      segment.duration = segmentTimeInfo[0].duration;
      segment.timeline = segmentTimeInfo[0].timeline;
    }
  } else if (sourceDuration) {
    segment.duration = (sourceDuration / parsedTimescale);
    segment.timeline = 0;
  }

  return [segment];
};
