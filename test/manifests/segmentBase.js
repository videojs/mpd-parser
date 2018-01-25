export const parsedManifest = {
  allowCache: true,
  discontinuityStarts: [],
  duration: 6,
  endList: true,
  mediaGroups: {
    'AUDIO': {},
    'CLOSED-CAPTIONS': {},
    'SUBTITLES': {},
    'VIDEO': {}
  },
  playlists: [
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 449000,
        'CODECS': 'avc1.420015',
        'NAME': '482',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 270,
          width: 482
        },
        'SUBTITLES': 'subs'
      },
      endList: true,
      resolvedUri: '',
      segments: [
        {
          duration: 6,
          map: {
            uri: '',
            resolvedUri: 'https://www.example.com/1080p.ts'
          },
          resolvedUri: 'https://www.example.com/1080p.ts',
          uri: 'https://www.example.com/1080p.ts'
        }
      ],
      timeline: 0,
      uri: ''
    }
  ],
  segments: [],
  uri: ''
};