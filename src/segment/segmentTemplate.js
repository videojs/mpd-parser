import resolveUrl from '../utils/resolveUrl';
import urlTypeToSegment from './urlType';
import { parseByDuration, parseByTimeline } from './timeParser';

const identifierPattern = /\$([A-z]*)(?:(%0)([0-9]+)d)?\$/g;

/**
 * Replaces template identifiers with corresponding values. To be used as the callback
 * for String.prototype.replace
 *
 * @name replaceCallback
 * @function
 * @param {string} match
 *        Entire match of identifier
 * @param {string} identifier
 *        Name of matched identifier
 * @param {string} format
 *        Format tag string. Its presence indicates that padding is expected
 * @param {string} width
 *        Desired length of the replaced value. Values less than this width shall be left
 *        zero padded
 * @return {string}
 *         Replacement for the matched identifier
 */

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
 * @return {replaceCallback}
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

  const { initialization = { sourceURL: '', range: '' } } = attributes;

  const mapSegment = urlTypeToSegment({
    baseUrl: attributes.baseUrl,
    source: constructTemplateUrl(initialization.sourceURL, templateValues),
    range: initialization.range
  });

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
      map: mapSegment
    };
  });
};
