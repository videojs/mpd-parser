export const parsedManifest = {
  allowCache: true,
  discontinuityStarts: [],
  duration: 6,
  endList: true,
  mediaGroups: {
    'AUDIO': {},
    'CLOSED-CAPTIONS': {
      cc: {
        eng: {
          autoselect: false,
          default: false,
          instreamId: 'CC1',
          language: 'eng'
        },
        swe: {
          autoselect: false,
          default: false,
          instreamId: 'CC3',
          language: 'swe'
        },
        Hello: {
          autoselect: false,
          default: false,
          instreamId: 'CC4',
          language: 'Hello'
        }
      }
    },
    'SUBTITLES': {},
    'VIDEO': {}
  },
  playlists: [
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 449000,
        'CODECS': 'avc1.420015',
        'FRAME-RATE': 23.976,
        'NAME': '482',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 270,
          width: 482
        },
        'SUBTITLES': 'subs'
      },
      endList: true,
      resolvedUri: 'https://www.example.com/1080p.ts',
      targetDuration: 6,
      mediaSequence: 0,
      timelineStarts: [{ start: 0, timeline: 0 }],
      discontinuitySequence: 0,
      discontinuityStarts: [],
      segments: [
        {
          duration: 6,
          timeline: 0,
          number: 0,
          presentationTime: 0,
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
  timelineStarts: [{ start: 0, timeline: 0 }],
  uri: ''
};
