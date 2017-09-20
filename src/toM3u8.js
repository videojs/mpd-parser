export const formatAudioPlaylist = ({ attributes, segments }) => {
  return {
    attributes: {
      NAME: attributes.id,
      BANDWIDTH: parseInt(attributes.bandwidth, 10),
      CODECS: attributes.codecs,
      ['PROGRAM-ID']: 1
    },
    uri: '',
    timeline: attributes.periodIndex,
    resolvedUri: '',
    segments
  };
};

export const formatVttPlaylist = ({ attributes, segments }) => {
  return {
    attributes: {
      NAME: attributes.id,
      BANDWIDTH: parseInt(attributes.bandwidth, 10),
      CODECS: attributes.codecs,
      ['PROGRAM-ID']: 1
    },
    uri: '',
    timeline: attributes.periodIndex,
    resolvedUri: '',
    segments
  };
};

const organizeAudioPlaylists = playlists => {
  return playlists.reduce((a, playlist) => {
    const label = playlist.attributes.lang || 'main';

    // skip if we already have the highest quality audio for a language
    if (a[label] &&
      a[label].playlists[0].attributes.BANDWIDTH >
      playlist.attributes.bandwidth) {
      return a;
    }

    a[label] = {
      language: playlist.attributes.lang || 'unknown',
      autoselect: true,
      default: !!playlist.role && playlist.role.value === 'main',
      playlists: [formatAudioPlaylist(playlist)],
      uri: ''
    };

    return a;
  }, {});
};

const organizeVttPlaylists = playlists => {
  return playlists.reduce((a, playlist) => {
    const label = playlist.attributes.lang || 'text';

    // skip if we already have subtitles
    if (a[label]) {
      return a;
    }

    a[label] = {
      language: label,
      default: false,
      autoselect: false,
      playlists: [formatVttPlaylist(playlist)],
      uri: ''
    };

    return a;
  }, {});
};

export const formatVideoPlaylist = ({ attributes, segments }) => {
  return {
    attributes: {
      NAME: attributes.id,
      AUDIO: 'audio',
      RESOLUTION: {
        width: parseInt(attributes.width, 10),
        height: parseInt(attributes.height, 10)
      },
      CODECS: attributes.codecs,
      BANDWIDTH: parseInt(attributes.bandwidth, 10),
      ['PROGRAM-ID']: 1
    },
    uri: '',
    timeline: attributes.periodIndex,
    resolvedUri: '',
    segments
  };
};

export const toM3u8 = dashPlaylists => {
  if (!dashPlaylists.length) {
    return {};
  }

  // grab all master attributes
  const {
    sourceDuration: duration
  } = dashPlaylists[0].attributes;

  const videoOnly = ({
      attributes
    }) =>
    attributes.mimeType === 'video/mp4' || attributes.contentType === 'video';
  const audioOnly = ({
      attributes
    }) =>
    attributes.mimeType === 'audio/mp4' || attributes.contentType === 'audio';
  const vttOnly = ({
      attributes
    }) =>
    attributes.mimeType === 'text/vtt' || attributes.contentType === 'text';

  const videoPlaylists = dashPlaylists.filter(videoOnly).map(formatVideoPlaylist);
  const audioPlaylists = dashPlaylists.filter(audioOnly);
  const vttPlaylists = dashPlaylists.filter(vttOnly);

  const master = {
    allowCache: true,
    discontinuityStarts: [],
    segments: [],
    mediaGroups: {
      AUDIO: {},
      VIDEO: {},
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {}
    },
    uri: '',
    duration,
    playlists: videoPlaylists
  };

  if (audioPlaylists) {
    master.mediaGroups.AUDIO.audio = organizeAudioPlaylists(audioPlaylists)
  }

  if (audioPlaylists) {
    master.mediaGroups.SUBTITLES.subs = organizeVttPlaylists(vttPlaylists)
  }

  return master;
};
