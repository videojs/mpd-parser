const formatVideoPlaylist = ({ attributes, segments}) => {
  return {
    attributes: {
      NAME: attributes.id,
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

const formatAudioPlaylist = ({ attributes, segments}) => {
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

// TODO
const formatVttPlaylist = playlist => playlist;

export const toM3u8 = dashPlaylists => {
  if (!dashPlaylists.length) {
    return {};
  }

  // grab all master attributes
  const { sourceDuration: duration } = dashPlaylists[0].attributes;

  const videoOnly = ({attributes}) =>
    attributes.mimeType === 'video/mp4' || attributes.contentType === 'video';
  const audioOnly = ({attributes}) =>
    attributes.mimeType === 'audio/mp4' || attributes.contentType === 'audio';
  const vttOnly = ({attributes}) =>
    attributes.mimeType === 'text/vtt' || attributes.contentType === 'text';

  const videoPlaylists = dashPlaylists.filter(videoOnly).map(formatVideoPlaylist);
  const audioPlaylists = dashPlaylists.filter(audioOnly).map(formatAudioPlaylist);

  // TODO
  const vttPlaylists = dashPlaylists.filter(vttOnly).map(formatVttPlaylist);

  return {
    allowCache: true,
    discontinuityStarts: [],
    segments: [],
    mediaGroups: {
      AUDIO: {
        main: {
          default: {
            default: true,
            playlists: audioPlaylists
          }
        }
      },
      VIDEO: {},
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {
        // TODO
        playlists: vttPlaylists
      }
    },
    uri: '',
    duration,
    playlists: videoPlaylists
  };
};
