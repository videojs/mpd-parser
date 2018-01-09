import { range } from './utils/list';
import resolveUrl from './resolveUrl';

const identifierPattern = /\$([A-z]*)(?:(%0)([0-9]+)d)?\$/g;

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

export const constructTemplateUrl = (url, values) =>
  url.replace(identifierPattern, identifierReplacement(values));

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
