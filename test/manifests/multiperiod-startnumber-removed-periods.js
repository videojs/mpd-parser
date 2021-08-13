export const parsedManifest = {
  allowCache: true,
  discontinuityStarts: [],
  duration: 0,
  endList: true,
  mediaGroups: {
    'AUDIO': {
      audio: {
        'en (main)': {
          autoselect: true,
          default: true,
          language: 'en',
          playlists: [
            {
              attributes: {
                'BANDWIDTH': 129262,
                'CODECS': 'mp4a.40.5',
                'NAME': 'v0',
                'PROGRAM-ID': 1
              },
              endList: false,
              mediaSequence: 7,
              discontinuitySequence: 2,
              discontinuityStarts: [0],
              resolvedUri: '',
              segments: [
                {
                  discontinuity: true,
                  duration: 1,
                  map: {
                    resolvedUri: 'http://example.com/audio/v0/init.mp4',
                    uri: 'init.mp4'
                  },
                  presentationTime: 111,
                  number: 7,
                  resolvedUri: 'http://example.com/audio/v0/862.m4f',
                  timeline: 3,
                  uri: '862.m4f'
                },
                {
                  duration: 1,
                  map: {
                    resolvedUri: 'http://example.com/audio/v0/init.mp4',
                    uri: 'init.mp4'
                  },
                  presentationTime: 112,
                  number: 8,
                  resolvedUri: 'http://example.com/audio/v0/863.m4f',
                  timeline: 3,
                  uri: '863.m4f'
                },
                {
                  duration: 1,
                  map: {
                    resolvedUri: 'http://example.com/audio/v0/init.mp4',
                    uri: 'init.mp4'
                  },
                  presentationTime: 113,
                  number: 9,
                  resolvedUri: 'http://example.com/audio/v0/864.m4f',
                  timeline: 3,
                  uri: '864.m4f'
                }
              ],
              targetDuration: 1,
              timeline: 3,
              uri: ''
            }
          ],
          uri: ''
        }
      }
    },
    'CLOSED-CAPTIONS': {},
    'SUBTITLES': {},
    'VIDEO': {}
  },
  minimumUpdatePeriod: 2000,
  playlists: [
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 2942295,
        'CODECS': 'avc1.4d001f',
        'NAME': 'D',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 720,
          width: 1280
        },
        'SUBTITLES': 'subs'
      },
      endList: false,
      mediaSequence: 7,
      discontinuitySequence: 2,
      discontinuityStarts: [0],
      resolvedUri: '',
      segments: [
        {
          discontinuity: true,
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/D/D_init.mp4',
            uri: 'D_init.mp4'
          },
          presentationTime: 111,
          number: 7,
          resolvedUri: 'http://example.com/video/D/D862.m4f',
          timeline: 3,
          uri: 'D862.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/D/D_init.mp4',
            uri: 'D_init.mp4'
          },
          presentationTime: 112,
          number: 8,
          resolvedUri: 'http://example.com/video/D/D863.m4f',
          timeline: 3,
          uri: 'D863.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/D/D_init.mp4',
            uri: 'D_init.mp4'
          },
          presentationTime: 113,
          number: 9,
          resolvedUri: 'http://example.com/video/D/D864.m4f',
          timeline: 3,
          uri: 'D864.m4f'
        }
      ],
      targetDuration: 1,
      timeline: 3,
      uri: ''
    },
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 4267536,
        'CODECS': 'avc1.640020',
        'NAME': 'E',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 720,
          width: 1280
        },
        'SUBTITLES': 'subs'
      },
      endList: false,
      mediaSequence: 7,
      discontinuitySequence: 2,
      discontinuityStarts: [0],
      resolvedUri: '',
      segments: [
        {
          discontinuity: true,
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/E/E_init.mp4',
            uri: 'E_init.mp4'
          },
          presentationTime: 111,
          number: 7,
          resolvedUri: 'http://example.com/video/E/E862.m4f',
          timeline: 3,
          uri: 'E862.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/E/E_init.mp4',
            uri: 'E_init.mp4'
          },
          presentationTime: 112,
          number: 8,
          resolvedUri: 'http://example.com/video/E/E863.m4f',
          timeline: 3,
          uri: 'E863.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/E/E_init.mp4',
            uri: 'E_init.mp4'
          },
          presentationTime: 113,
          number: 9,
          resolvedUri: 'http://example.com/video/E/E864.m4f',
          timeline: 3,
          uri: 'E864.m4f'
        }
      ],
      targetDuration: 1,
      timeline: 3,
      uri: ''
    },
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 5256859,
        'CODECS': 'avc1.640020',
        'NAME': 'F',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 720,
          width: 1280
        },
        'SUBTITLES': 'subs'
      },
      endList: false,
      mediaSequence: 7,
      discontinuitySequence: 2,
      discontinuityStarts: [0],
      resolvedUri: '',
      segments: [
        {
          discontinuity: true,
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/F/F_init.mp4',
            uri: 'F_init.mp4'
          },
          presentationTime: 111,
          number: 7,
          resolvedUri: 'http://example.com/video/F/F862.m4f',
          timeline: 3,
          uri: 'F862.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/F/F_init.mp4',
            uri: 'F_init.mp4'
          },
          presentationTime: 112,
          number: 8,
          resolvedUri: 'http://example.com/video/F/F863.m4f',
          timeline: 3,
          uri: 'F863.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/F/F_init.mp4',
            uri: 'F_init.mp4'
          },
          presentationTime: 113,
          number: 9,
          resolvedUri: 'http://example.com/video/F/F864.m4f',
          timeline: 3,
          uri: 'F864.m4f'
        }
      ],
      targetDuration: 1,
      timeline: 3,
      uri: ''
    },
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 240781,
        'CODECS': 'avc1.4d000d',
        'NAME': 'A',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 234,
          width: 416
        },
        'SUBTITLES': 'subs'
      },
      endList: false,
      mediaSequence: 7,
      discontinuitySequence: 2,
      discontinuityStarts: [0],
      resolvedUri: '',
      segments: [
        {
          discontinuity: true,
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/A/A_init.mp4',
            uri: 'A_init.mp4'
          },
          presentationTime: 111,
          number: 7,
          resolvedUri: 'http://example.com/video/A/A862.m4f',
          timeline: 3,
          uri: 'A862.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/A/A_init.mp4',
            uri: 'A_init.mp4'
          },
          presentationTime: 112,
          number: 8,
          resolvedUri: 'http://example.com/video/A/A863.m4f',
          timeline: 3,
          uri: 'A863.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/A/A_init.mp4',
            uri: 'A_init.mp4'
          },
          presentationTime: 113,
          number: 9,
          resolvedUri: 'http://example.com/video/A/A864.m4f',
          timeline: 3,
          uri: 'A864.m4f'
        }
      ],
      targetDuration: 1,
      timeline: 3,
      uri: ''
    },
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 494354,
        'CODECS': 'avc1.4d001e',
        'NAME': 'B',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 360,
          width: 640
        },
        'SUBTITLES': 'subs'
      },
      endList: false,
      mediaSequence: 7,
      discontinuitySequence: 2,
      discontinuityStarts: [0],
      resolvedUri: '',
      segments: [
        {
          discontinuity: true,
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/B/B_init.mp4',
            uri: 'B_init.mp4'
          },
          presentationTime: 111,
          number: 7,
          resolvedUri: 'http://example.com/video/B/B862.m4f',
          timeline: 3,
          uri: 'B862.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/B/B_init.mp4',
            uri: 'B_init.mp4'
          },
          presentationTime: 112,
          number: 8,
          resolvedUri: 'http://example.com/video/B/B863.m4f',
          timeline: 3,
          uri: 'B863.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/B/B_init.mp4',
            uri: 'B_init.mp4'
          },
          presentationTime: 113,
          number: 9,
          resolvedUri: 'http://example.com/video/B/B864.m4f',
          timeline: 3,
          uri: 'B864.m4f'
        }
      ],
      targetDuration: 1,
      timeline: 3,
      uri: ''
    },
    {
      attributes: {
        'AUDIO': 'audio',
        'BANDWIDTH': 1277155,
        'CODECS': 'avc1.4d001f',
        'NAME': 'C',
        'PROGRAM-ID': 1,
        'RESOLUTION': {
          height: 540,
          width: 960
        },
        'SUBTITLES': 'subs'
      },
      endList: false,
      mediaSequence: 7,
      discontinuitySequence: 2,
      discontinuityStarts: [0],
      resolvedUri: '',
      segments: [
        {
          discontinuity: true,
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/C/C_init.mp4',
            uri: 'C_init.mp4'
          },
          presentationTime: 111,
          number: 7,
          resolvedUri: 'http://example.com/video/C/C862.m4f',
          timeline: 3,
          uri: 'C862.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/C/C_init.mp4',
            uri: 'C_init.mp4'
          },
          presentationTime: 112,
          number: 8,
          resolvedUri: 'http://example.com/video/C/C863.m4f',
          timeline: 3,
          uri: 'C863.m4f'
        },
        {
          duration: 1,
          map: {
            resolvedUri: 'http://example.com/video/C/C_init.mp4',
            uri: 'C_init.mp4'
          },
          presentationTime: 113,
          number: 9,
          resolvedUri: 'http://example.com/video/C/C864.m4f',
          timeline: 3,
          uri: 'C864.m4f'
        }
      ],
      targetDuration: 1,
      timeline: 3,
      uri: ''
    }
  ],
  segments: [],
  suggestedPresentationDelay: 6,
  uri: ''
};
