import resolveUrl from './resolveUrl';
export const segmentsFromBase = (attributes) => {
  const {
    timescale = 1,
    duration,
    periodIndex = 0,
    startNumber = 1,
    baseUrl = '',
    initialization = ''
  } = attributes;
  const parsedTimescale = parseInt(timescale, 10);
  const start = parseInt(startNumber, 10);

  const segment = {
    map: {
      uri: initialization,
      resolvedUri: resolveUrl(attributes.baseUrl || '', initialization)
    },
    resolvedUri: resolveUrl(attributes.baseUrl || '', initialization),
    uri: attributes.baseUrl
  };

  console.log(segment.map);

  return [segment];
};