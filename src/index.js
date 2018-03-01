import { version } from '../package.json';
import { toM3u8 } from './toM3u8';
import { toPlaylists } from './toPlaylists';
import { inheritAttributes } from './inheritAttributes';
import { stringToMpdXml } from './stringToMpdXml';
import { parseUTCTimingScheme } from './parseUTCTimingScheme';

export const VERSION = version;

export const parse = (manifestString, options) =>
  toM3u8(toPlaylists(inheritAttributes(stringToMpdXml(manifestString), options)));

export const parseUTCTiming = (manifestString) =>
  parseUTCTimingScheme(stringToMpdXml(manifestString));
