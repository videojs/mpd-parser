import resolveUrl from '../utils/resolveUrl';
import errors from '../errors';

export const segmentsFromBase = (attributes) => {
  const {
    baseUrl,
    initialization = '',
    sourceDuration
  } = attributes;
  const parsedTimescale = parseInt(timescale, 10);
  const start = parseInt(startNumber, 10);

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

  if (sourceDuration) {
    segment.duration = sourceDuration;
  }

  return [segment];
};