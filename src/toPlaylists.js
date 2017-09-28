import { range } from './utils/list';
import { getAttributes, shallowMerge } from './utils/object';
import resolveUrl from './resolveUrl';

export const segmentsFromTemplate = (attributes) => {
  const startNumber = parseInt(attributes.startNumber, 10);
  const duration = parseInt(attributes.duration, 10);
  const timescale = parseInt(attributes.timescale, 10);

  const initSegment = attributes.initialization
    .replace(/\$RepresentationID\$/gi, attributes.id);

  const segmentDuration = (duration / timescale);
  const segmentCount = Math.round(attributes.sourceDuration / segmentDuration);

  const indexes = range(segmentCount, startNumber);

  return indexes.map(i => {
    // TODO: deal with padding control characters
    // $<token>...$
    const uri = attributes.media.replace(/\$Number\$/gi, i)
      .replace(/\$RepresentationID\$/gi, attributes.id);

    return {
      uri,
      timeline: attributes.periodIndex,
      duration: segmentDuration,
      resolvedUri: resolveUrl(attributes.baseUrl, uri),
      map: {
        uri: initSegment,
        resolvedUri: resolveUrl(attributes.baseUrl, initSegment)
      }
    };
  });
};

// TODO
export const segmentsFromBase = x => [{ uri: '' }];

// TODO
export const segmentsFromList = x => [{ uri: '' }];

export const generateSegments = ({ segmentBase, segmentList, segmentTemplate }, attributes) => {
  if (segmentTemplate) {
    const a = shallowMerge(getAttributes(segmentTemplate), attributes);

    return segmentsFromTemplate(a);
  }

  // TODO
  if (segmentBase) {
    throw new Error('UNSUPPORTED_SEGMENTATION_TYPE');

    // return segmentsFromBase(attributes);
  }

  // TODO
  if (segmentList) {
    throw new Error('UNSUPPORTED_SEGMENTATION_TYPE');

    // return segmentsFromList(attributes);
  }
};

export const toPlaylists = representations => {
  return representations.map(({ attributes, segmentType }) => {
    const segments = generateSegments(segmentType, attributes);

    return { attributes, segments };
  });
};
