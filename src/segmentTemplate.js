import { range } from './utils/list';
import resolveUrl from './resolveUrl';

const identifierPattern = /\$([A-z]*)(?:(%0)([0-9]+)d)?\$/g;

/**
 * Returns a function to be used as a callback for String.prototype.replace to replace
 * template identifiers
 *
 * @param {Obect} values
 *        Object containing values that shall be used to replace known identifiers
 * @param {number} values.RepresentationID
 *        Value of the Representation@id attribute
 * @param {number} values.Number
 *        Number of the corresponding segment
 * @param {number} values.Bandwidth
 *        Value of the Representation@bandwidth attribute.
 * @param {number} values.Time
 *        Timestamp value of the corresponding segment
 * @return {(match: string, identifier: string, format: string, width: string) => string}
 *         Callback to be used with String.prototype.replace to replace identifiers
 */
export const identifierReplacement = (values) => (match, identifier, format, width) => {
  if (match === '$$') {
    // escape sequence
    return '$';
  }

  if (typeof values[identifier] === 'undefined') {
    return match;
  }

  const value = '' + values[identifier];

  if (identifier === 'RepresentationID') {
    // Format tag shall not be present with RepresentationID
    return value;
  }

  if (!format) {
    width = 1;
  } else {
    width = parseInt(width, 10);
  }

  if (value.length >= width) {
    return value;
  }

  return `${(new Array(width - value.length + 1)).join('0')}${value}`;
};

/**
 * Constructs a segment url from a template string
 *
 * @param {string} url
 *        Template string to construct url from
 * @param {Obect} values
 *        Object containing values that shall be used to replace known identifiers
 * @param {number} values.RepresentationID
 *        Value of the Representation@id attribute
 * @param {number} values.Number
 *        Number of the corresponding segment
 * @param {number} values.Bandwidth
 *        Value of the Representation@bandwidth attribute.
 * @param {number} values.Time
 *        Timestamp value of the corresponding segment
 * @return {string}
 *         Segment url with identifiers replaced
 */
export const constructTemplateUrl = (url, values) =>
  url.replace(identifierPattern, identifierReplacement(values));

/**
 * Uses information provided by SegmentTemplate@duration attribute to determine segment
 * timing and duration
 *
 * @param {number} start
 *        The start number for the first segment of this period
 * @param {number} timeline
 *        The timeline (period index) for the first segment of this period
 * @param {number} timescale
 *        The timescale for the timestamps contained within the media content
 * @param {number} duration
 *        Duration of each segment
 * @param {number} sourceDuration
 *        Duration of the entire Media Presentation
 * @return {{number: number, duration: number, time: number, timeline: number}[]}
 *         List of Objects with segment timing and duration info
 */
export const parseByDuration = (start, timeline, timescale, duration, sourceDuration) => {
  const count = Math.ceil(sourceDuration / (duration / timescale));

  return range(start, start + count).map((number, index) => {
    const segment = { number, duration: duration / timescale, timeline };

    if (index === count - 1) {
      // final segment may be less than duration
      segment.duration = sourceDuration - (segment.duration * index);
    }

    segment.time = (segment.number - start) * duration;

    return segment;
  });
};

/**
 * Uses information provided by SegmentTemplate.SegmentTimeline to determine segment
 * timing and duration
 *
 * @param {number} start
 *        The start number for the first segment of this period
 * @param {number} timeline
 *        The timeline (period index) for the first segment of this period
 * @param {number} timescale
 *        The timescale for the timestamps contained within the media content
 * @param {Object[]} segmentTimeline
 *        List of objects representing the attributes of each S element contained within
 * @param {number} sourceDuration
 *        Duration of the entire Media Presentation
 * @return {{number: number, duration: number, time: number, timeline: number}[]}
 *         List of Objects with segment timing and duration info
 */
export const parseByTimeline =
(start, timeline, timescale, segmentTimeline, sourceDuration) => {
  const segments = [];
  let time = -1;

  for (let sIndex = 0; sIndex < segmentTimeline.length; sIndex++) {
    const S = segmentTimeline[sIndex];
    const duration = parseInt(S.d, 10);
    const repeat = parseInt(S.r || 0, 10);
    const segmentTime = parseInt(S.t || 0, 10);

    if (time < 0) {
      // first segment
      time = segmentTime;
    }

    if (segmentTime && segmentTime > time) {
      // discontinuity

      // TODO: How to handle this type of discontinuity
      // timeline++ here would treat it like HLS discontuity and content would
      // get appended without gap
      // E.G.
      //  <S t="0" d="1" />
      //  <S d="1" />
      //  <S d="1" />
      //  <S t="5" d="1" />
      // would have $Time$ values of [0, 1, 2, 5]
      // should this be appened at time positions [0, 1, 2, 3],(#EXT-X-DISCONTINUITY)
      // or [0, 1, 2, gap, gap, 5]? (#EXT-X-GAP)
      // does the value of sourceDuration consider this when calculating arbitrary
      // negative @r repeat value?
      // E.G. Same elements as above with this added at the end
      //  <S d="1" r="-1" />
      //  with a sourceDuration of 10
      // Would the 2 gaps be included in the time duration calculations resulting in
      // 8 segments with $Time$ values of [0, 1, 2, 5, 6, 7, 8, 9] or 10 segments
      // with $Time$ values of [0, 1, 2, 5, 6, 7, 8, 9, 10, 11] ?

      time = segmentTime;
    }

    let count;

    if (repeat < 0) {
      const nextS = sIndex + 1;

      if (nextS === segmentTimeline.length) {
        // last segment
        // TODO: This may be incorrect depending on conclusion of TODO above
        count = ((sourceDuration * timescale) - time) / duration;
      } else {
        count = (parseInt(segmentTimeline[nextS].t, 10) - time) / duration;
      }
    } else {
      count = repeat + 1;
    }

    const end = start + segments.length + count;
    let number = start + segments.length;

    while (number < end) {
      segments.push({ number, duration: duration / timescale, time, timeline });
      time += duration;
      number++;
    }
  }

  return segments;
};

/**
 * Generates a list of objects containing timing and duration information about each
 * segment needed to generate segment uris and the complete segment object
 *
 * @param {Object} attributes
 *        Object containing all inherited attributes from parent elements with attribute
 *        names as keys
 * @param {Object[]|undefined} segmentTimeline
 *        List of objects representing the attributes of each S element contained within
 *        the SegmentTimeline element
 * @return {{number: number, duration: number, time: number, timeline: number}[]}
 *         List of Objects with segment timing and duration info
 */
export const parseTemplateInfo = (attributes, segmentTimeline) => {
  const start = parseInt(attributes.startNumber || 1, 10);
  const timescale = parseInt(attributes.timescale || 1, 10);

  if (!attributes.duration && !segmentTimeline) {
    // if neither @duration or SegmentTimeline are present, then there shall be exactly
    // one media segment
    return [{
      number: start,
      duration: attributes.sourceDuration,
      time: 0,
      timeline: attributes.periodIndex
    }];
  }

  if (attributes.duration) {
    return parseByDuration(start,
                           attributes.periodIndex,
                           timescale,
                           parseInt(attributes.duration, 10),
                           attributes.sourceDuration);
  }

  return parseByTimeline(start,
                         attributes.periodIndex,
                         timescale,
                         segmentTimeline,
                         attributes.sourceDuration);

};

/**
 * Generates a list of segments using information provided by the SegmentTemplate element
 *
 * @param {Object} attributes
 *        Object containing all inherited attributes from parent elements with attribute
 *        names as keys
 * @param {Object[]|undefined} segmentTimeline
 *        List of objects representing the attributes of each S element contained within
 *        the SegmentTimeline element
 * @return {Object[]}
 *         List of segment objects
 */
export const segmentsFromTemplate = (attributes, segmentTimeline) => {
  const templateValues = {
    RepresentationID: attributes.id,
    Bandwidth: parseInt(attributes.bandwidth || 0, 10)
  };
  const mapUri = constructTemplateUrl(attributes.initialization || '', templateValues);
  const segments = parseTemplateInfo(attributes, segmentTimeline);

  return segments.map(segment => {
    templateValues.Number = segment.number;
    templateValues.Time = segment.time;

    const uri = constructTemplateUrl(attributes.media || '', templateValues);

    return {
      uri,
      timeline: segment.timeline,
      duration: segment.duration,
      resolvedUri: resolveUrl(attributes.baseUrl || '', uri),
      map: {
        uri: mapUri,
        resolvedUri: resolveUrl(attributes.baseUrl || '', mapUri)
      }
    };
  });
};
