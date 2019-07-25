import { version } from '../package.json';
import { toM3u8 as _toM3u8} from './toM3u8';
import { toPlaylists as _toPlaylists} from './toPlaylists';
import { inheritAttributes as _inheritAttributes} from './inheritAttributes';
import { stringToMpdXml as _stringToMpdXml} from './stringToMpdXml';
import { parseUTCTimingScheme } from './parseUTCTimingScheme';

export const VERSION = version;

export const parse = (manifestString, options = {}) =>
  _toM3u8(_toPlaylists(_inheritAttributes(_stringToMpdXml(manifestString), options)), options.sidxMapping);

/**
 * Parses the manifest for a UTCTiming node, returning the nodes attributes if found
 *
 * @param {string} manifestString
 *        XML string of the MPD manifest
 * @return {Object|null}
 *         Attributes of UTCTiming node specified in the manifest. Null if none found
 */
export const parseUTCTiming = (manifestString) =>
  parseUTCTimingScheme(_stringToMpdXml(manifestString));

export const stringToMpdXml = _stringToMpdXml;
export const inheritAttributes = _inheritAttributes;
export const toPlaylists = _toPlaylists;
export const toM3u8 = _toM3u8;
