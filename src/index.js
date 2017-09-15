import { version } from '../package.json';
import { toM3u8 } from './toM3u8';
import { toPlaylists } from './toPlaylists';
import { inheritAttributes } from './inheritAttributes';
import { stringToMpdXml } from './stringToMpdXml';

export const VERSION = version;

export const parse = s => [
  stringToMpdXml,
  inheritAttributes,
  toPlaylists,
  toM3u8
].reduce((a, fn) => fn(a), s);
