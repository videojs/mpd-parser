import window from 'global/window';

export const stringToMpdXml = (manifestString) => {
  if (manifestString === '') {
    throw new Error('DASH_EMPTY_MANIFEST');
  }

  const parser = new window.DOMParser();
  const xml = parser.parseFromString(manifestString, 'application/xml');
  const mpd = xml && xml.documentElement.tagName === 'MPD' ?
     xml.documentElement : null;

  if (!mpd || mpd &&
      mpd.getElementsByTagName('parsererror').length > 0) {
    throw new Error('DASH_INVALID_XML');
  }

  return mpd;
};
