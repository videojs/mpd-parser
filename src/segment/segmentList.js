import { range } from '../utils/list';
import resolveUrl from '../utils/resolveUrl';
import { parseByDuration, parseByTimeline } from './timeParser';
import errors from '../errors';

const URLTypeToSegment = (attributes, segmentUrl) => {
  const initUri = attributes.initialization || '';

  const segment = {
    map: {
      uri: initUri,
      resolvedUri: resolveUrl(attributes.baseUrl || '', initUri)
    },
    resolvedUri: resolveUrl(attributes.baseUrl || '', segmentUrl.media),
    uri: segmentUrl.media
  }

  // Follows byte-range-spec per RFC2616
  // @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.1
  if (segmentUrl.mediaRange) {
    const ranges = segmentUrl.mediaRange.split('-');
    const startRange = parseInt(ranges[0]);
    const endRange = parseInt(ranges[1]);

    segment.byterange = {
      length: endRange - startRange,
      offset: startRange
    }
  }

  return segment;
};

export const segmentsFromList = (attributes) => {
  const {
    timescale = 1,
    duration,
    segmentUrls = [],
    segmentTimeline,
    periodIndex = 0,
    startNumber = 1
  } = attributes;

  // Per spec (5.3.9.2.1) if there is more than one segment, but no way
  // to determine segment duration OR if both SegmentTimeline and @duration
  // are defined, it is outside of spec.
  if ((segmentUrls.length > 1 && !duration && !segmentTimeline) ||
      duration && segmentTimeline) {
    throw new Error(errors.SEGMENT_TIME_UNSPECIFIED);
  }

  const parsedTimescale = parseInt(timescale, 10);
  const start = parseInt(startNumber, 10);
  const segmentUrlMap = segmentUrls.map(segmentUrlObject => URLTypeToSegment(attributes, segmentUrlObject));
  let segmentTimeInfo;

  if (duration) {
    const parsedDuration = parseInt(duration, 10);
    const segmentDuration = (parsedDuration / parsedTimescale);

    segmentTimeInfo = parseByDuration(start,
      attributes.periodIndex,
      parsedTimescale,
      parsedDuration,
      attributes.sourceDuration);
  } else if (segmentTimeline) {
    segmentTimeInfo = parseByTimeline(start,
      attributes.periodIndex,
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

    return {};
  });

  return segments;
};