import { version } from '../package.json';
import { toM3u8, generateSidxKey } from './toM3u8';
import { toPlaylists } from './toPlaylists';
import { inheritAttributes } from './inheritAttributes';
import { stringToMpdXml } from './stringToMpdXml';
import { parseUTCTimingScheme } from './parseUTCTimingScheme';
import { addSidxSegmentsToPlaylist } from './segment/segmentBase.js';

const VERSION = version;

/**
 * @typedef {Object} ParsedResult
 * @property {Object} manifest - the parsed manifest object
 * @property {Array} playlistsToExclude
 *                   For live content, any playlists which are no longer included in the
 *                   latest manifest refresh.
 * @property {MediaGroupPlaylistIdentificationObject[]} mediaGroupPlaylistsToExclude
 *                   For live content, any media group playlists which are no longer
 *                   included in the latest manifest refresh.
 */

/*
 * Given a DASH manifest string and options, parses the DASH manifest into a manifest
 * object.
 *
 * For live DASH manifests, if `lastMpd` is provided in options, then the newly parsed
 * DASH manifest will have its media and discontinuity sequence values updated to reflect
 * its position relative to the prior manifest.
 *
 * @param {string} manifestString - the DASH manifest as a string
 * @param {options} [options] - any options
 *
 * @return {ParsedResult} the manifest object and any playlists to exclude
 */
const parse = (manifestString, options = {}) => {
  const parsedManifestInfo = inheritAttributes(stringToMpdXml(manifestString), options);
  const playlists = toPlaylists(parsedManifestInfo.representationInfo);

  return toM3u8({
    dashPlaylists: playlists,
    locations: parsedManifestInfo.locations,
    sidxMapping: options.sidxMapping,
    lastMpd: options.lastMpd
  });
};

/**
 * Parses the manifest for a UTCTiming node, returning the nodes attributes if found
 *
 * @param {string} manifestString
 *        XML string of the MPD manifest
 * @return {Object|null}
 *         Attributes of UTCTiming node specified in the manifest. Null if none found
 */
const parseUTCTiming = (manifestString) =>
  parseUTCTimingScheme(stringToMpdXml(manifestString));

export {
  VERSION,
  parse,
  parseUTCTiming,
  stringToMpdXml,
  inheritAttributes,
  toPlaylists,
  toM3u8,
  addSidxSegmentsToPlaylist,
  generateSidxKey
};
