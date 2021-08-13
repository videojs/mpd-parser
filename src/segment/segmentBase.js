import errors from '../errors';
import urlTypeConverter from './urlType';
import { parseByDuration } from './durationTimeParser';

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
    initialization = {},
    sourceDuration,
    indexRange = '',
    duration,
    periodStart
  } = attributes;

  // base url is required for SegmentBase to work, per spec (Section 5.3.9.2.1)
  if (!baseUrl) {
    throw new Error(errors.NO_BASE_URL);
  }

  const initSegment = urlTypeConverter({
    baseUrl,
    source: initialization.sourceURL,
    range: initialization.range
  });

  const segment = urlTypeConverter({ baseUrl, source: baseUrl, indexRange });

  segment.map = initSegment;

  // If there is a duration, use it, otherwise use the given duration of the source
  // (since SegmentBase is only for one total segment)
  if (duration) {
    const segmentTimeInfo = parseByDuration(attributes);

    if (segmentTimeInfo.length) {
      segment.duration = segmentTimeInfo[0].duration;
      segment.timeline = segmentTimeInfo[0].timeline;
    }
  } else if (sourceDuration) {
    segment.duration = sourceDuration;
    segment.timeline = 0;
  }

  // Since there's only one segment in the period, the segment's presentation time is
  // the same as the period start.
  segment.presentationTime = periodStart;
  segment.number = 0;

  return [segment];
};

/**
 * Given a playlist, a sidx box, and a baseUrl, update the segment list of the playlist
 * according to the sidx information given.
 *
 * playlist.sidx has metadadata about the sidx where-as the sidx param
 * is the parsed sidx box itself.
 *
 * @param {Object} playlist the playlist to update the sidx information for
 * @param {Object} sidx the parsed sidx box
 * @return {Object} the playlist object with the updated sidx information
 */
export const addSidxSegmentsToPlaylist = (playlist, sidx, baseUrl) => {
  // Retain init segment information
  const initSegment = playlist.sidx.map ? playlist.sidx.map : null;
  // Retain source duration from initial main manifest parsing
  const sourceDuration = playlist.sidx.duration;
  // Retain source timeline
  const timeline = playlist.timeline || 0;
  const sidxByteRange = playlist.sidx.byterange;
  const sidxEnd = sidxByteRange.offset + sidxByteRange.length;
  // Retain timescale of the parsed sidx
  const timescale = sidx.timescale;
  // referenceType 1 refers to other sidx boxes
  const mediaReferences = sidx.references.filter(r => r.referenceType !== 1);
  const segments = [];
  const type = playlist.endList ? 'static' : 'dynamic';
  // Right now we don't support multiperiod sidx, so we can assume the presentation time
  // starts at 0. In the future, when multiperiod sidx is handled, the presentation time
  // will need to account for each period start.
  let presentationTime = 0;

  // firstOffset is the offset from the end of the sidx box
  let startIndex = sidxEnd + sidx.firstOffset;

  for (let i = 0; i < mediaReferences.length; i++) {
    const reference = sidx.references[i];
    // size of the referenced (sub)segment
    const size = reference.referencedSize;
    // duration of the referenced (sub)segment, in  the  timescale
    // this will be converted to seconds when generating segments
    const duration = reference.subsegmentDuration;
    // should be an inclusive range
    const endIndex = startIndex + size - 1;
    const indexRange = `${startIndex}-${endIndex}`;

    const attributes = {
      baseUrl,
      timescale,
      timeline,
      // this is used in parseByDuration
      periodIndex: timeline,
      // Technically the presentationTime isn't the period start, but is instead the
      // current presentation time for each segment that is added. The segmentsFromBase
      // function expects period start, so it's renamed to match.
      periodStart: presentationTime,
      duration,
      sourceDuration,
      indexRange,
      type
    };

    const segment = segmentsFromBase(attributes)[0];

    if (initSegment) {
      segment.map = initSegment;
    }

    segments.push(segment);
    startIndex += size;
    presentationTime += duration / timescale;
  }

  playlist.segments = segments;

  return playlist;
};
