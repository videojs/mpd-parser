import { findChildren } from './utils/xml';
import { getAttributes } from './utils/object';
import errors from './errors';

export const parseUTCTimingScheme = (mpd) => {
  const UTCTimingNode = findChildren(mpd, 'UTCTiming')[0];

  if (!UTCTimingNode) {
    return null;
  }

  const attributes = getAttributes(UTCTimingNode);

  switch(attributes.schemeIdUri) {
    case 'urn:mpeg:dash:utc:http-head:2014':
    case 'urn:mpeg:dash:utc:http-head:2012':
      attributes.method = 'HEAD';
      break;
    case 'urn:mpeg:dash:utc:http-xsdate:2014':
    case 'urn:mpeg:dash:utc:http-iso:2014':
    case 'urn:mpeg:dash:utc:http-xsdate:2012':
    case 'urn:mpeg:dash:utc:http-iso:2012':
      attributes.method = 'GET'
      break;
    case 'urn:mpeg:dash:utc:direct:2014':
    case 'urn:mpeg:dash:utc:direct:2012':
      attributes.method = 'DIRECT';
      attributes.value = Date.parse(attributes.value);
      break;
    case 'urn:mpeg:dash:utc:http-ntp:2014':
    case 'urn:mpeg:dash:utc:ntp:2014':
    case 'urn:mpeg:dash:utc:sntp:2014':
    default:
      throw new Error(error.UNSUPPORTED_UTC_TIMING_SCHEME);
  }

  return attributes;
};
