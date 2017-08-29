import window from 'global/window';
import { version } from '../package.json';

/**
 *
 * @param {string} manifestString
 *         The content of a DASH manifest
 *
 * @return {Object}
 *         A parsed DASH manifest
 */
export function parse(manifestString) {
  if (manifestString === '') {
    throw new Error('Empty xml');
  }

  const parser = new window.DOMParser();
  let mpd;
  let xml;

  try {
    xml = parser.parseFromString(manifestString, 'application/xml');
  } catch (e) {
    throw new Error('Invalid mpd');
  }

  if (xml && xml.documentElement.tagName === 'MPD') {
    mpd = xml.documentElement;
  }

  if (!mpd || mpd &&
    mpd.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid mpd');
  }

  return {
    fail: 'test'
  };
}

export const VERSION = version;
