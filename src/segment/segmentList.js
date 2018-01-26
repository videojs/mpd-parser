import resolveUrl from '../utils/resolveUrl';
import { parseByDuration, parseByTimeline } from './timeParser';
import errors from '../errors';

/**
 * Converts a <SegmentUrl> (of type URLType from the DASH spec 5.3.9.2 Table 14)
 * to an object that matches the output of a segment in videojs/mpd-parser
 *
 * @param {Object} attributes
 *   Object containing all inherited attributes from parent elements with attribute
 *   names as keys
 * @param {Object} segmentUrl
 *   <SegmentURL> node to translate into a segment object
 * @return {Object} translated segment object
 */
const SegmentURLToSegmentObject = (attributes, segmentUrl) => {
  const initUri = attributes.initialization || '';

  const segment = {
    map: {
      uri: initUri,
      resolvedUri: resolveUrl(attributes.baseUrl || '', initUri)
    },
    resolvedUri: resolveUrl(attributes.baseUrl || '', segmentUrl.media),
    uri: segmentUrl.media
  };

  // Follows byte-range-spec per RFC2616
  // @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.1
  if (segmentUrl.mediaRange) {
    const ranges = segmentUrl.mediaRange.split('-');
    const startRange = parseInt(ranges[0], 10);
    const endRange = parseInt(ranges[1], 10);

    segment.byterange = {
      length: endRange - startRange,
      offset: startRange
    };
  }

  return segment;
};

/**
 * Generates a list of segments using information provided by the SegmentList element
 * SegmentList (DASH SPEC Section 5.3.9.3.2) contains a set of <SegmentURL> nodes.  Each
 * node should be translated into segment.
 *
 * @param {Object} attributes
 *   Object containing all inherited attributes from parent elements with attribute
 *   names as keys
 * @param {Object[]|undefined} segmentTimeline
 *        List of objects representing the attributes of each S element contained within
 *        the SegmentTimeline element
 * @return {Object.<Array>} list of segments
 */
export const segmentsFromList = (attributes, segmentTimeline) => {
  const {
    timescale = 1,
    duration,
    segmentUrls = [],
    periodIndex = 0,
    startNumber = 1
  } = attributes;

  // Per spec (5.3.9.2.1) no way to determine segment duration OR
  // if both SegmentTimeline and @duration are defined, it is outside of spec.
  if ((!duration && !segmentTimeline) ||
      duration && segmentTimeline) {
    throw new Error(errors.SEGMENT_TIME_UNSPECIFIED);
  }

  const parsedTimescale = parseInt(timescale, 10);
  const start = parseInt(startNumber, 10);
  const segmentUrlMap = segmentUrls.map(segmentUrlObject =>
    SegmentURLToSegmentObject(attributes, segmentUrlObject));
  let segmentTimeInfo;

  if (duration) {
    const parsedDuration = parseInt(duration, 10);

    segmentTimeInfo = parseByDuration(start,
      periodIndex,
      parsedTimescale,
      parsedDuration,
      attributes.sourceDuration);
  }

  if (segmentTimeline) {
    segmentTimeInfo = parseByTimeline(start,
      periodIndex,
      parsedTimescale,
      segmentTimeline,
      attributes.sourceDuration);
  }

  const segments = segmentTimeInfo.map((segmentTime, index) => {
    if (segmentUrlMap[index]) {
      const segment = segmentUrlMap[index];

      segment.timeline = segmentTime.timeline;
      segment.duration = segmentTime.duration;
      return segment;
    }
    // Since we're mapping we should get rid of any blank segments (in case
    // the given SegmentTimeline is handling for more elements than we have
    // SegmentURLs for).
  }).filter(segment => segment);

  return segments;
};
