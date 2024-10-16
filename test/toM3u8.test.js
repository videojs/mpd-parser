import {
  toM3u8,
  generateSidxKey,
  addMediaSequenceValues,
  flattenMediaGroupPlaylists
} from '../src/toM3u8';
import QUnit from 'qunit';

QUnit.module('toM3u8');

QUnit.test('playlists', function(assert) {
  const dashPlaylists = [{
    attributes: {
      id: '1',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      id: '2',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      frameRate: 30,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    }
  }, {
    attributes: {
      sourceDuration: 100,
      id: '2',
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    }
  }];

  const expected = {
    allowCache: true,
    discontinuityStarts: [],
    timelineStarts: [{ start: 0, timeline: 0 }],
    duration: 100,
    endList: true,
    mediaGroups: {
      AUDIO: {
        audio: {
          main: {
            autoselect: true,
            default: true,
            language: '',
            playlists: [{
              attributes: {
                BANDWIDTH: 20000,
                CODECS: 'foo;bar',
                NAME: '1',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              endList: true,
              resolvedUri: '',
              segments: [],
              timeline: 0,
              uri: '',
              targetDuration: 0
            }, {
              attributes: {
                BANDWIDTH: 10000,
                CODECS: 'foo;bar',
                NAME: '2',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              endList: true,
              resolvedUri: '',
              segments: [],
              timeline: 0,
              uri: '',
              targetDuration: 0

            }],
            uri: ''
          }
        }
      },
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {
        subs: {
          text: {
            autoselect: false,
            default: false,
            language: 'und',
            playlists: [{
              attributes: {
                BANDWIDTH: 20000,
                NAME: '1',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              targetDuration: 100,
              endList: true,
              resolvedUri: 'https://www.example.com/vtt',
              segments: [{
                duration: 100,
                resolvedUri: 'https://www.example.com/vtt',
                timeline: 0,
                uri: 'https://www.example.com/vtt',
                number: 0
              }],
              timeline: 0,
              uri: ''
            }, {
              attributes: {
                BANDWIDTH: 10000,
                NAME: '2',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              targetDuration: 100,
              endList: true,
              resolvedUri: 'https://www.example.com/vtt',
              segments: [{
                duration: 100,
                resolvedUri: 'https://www.example.com/vtt',
                timeline: 0,
                uri: 'https://www.example.com/vtt',
                number: 0
              }],
              timeline: 0,
              uri: ''
            }],
            uri: ''
          }
        }
      },
      VIDEO: {}
    },
    playlists: [{
      attributes: {
        AUDIO: 'audio',
        SUBTITLES: 'subs',
        BANDWIDTH: 10000,
        CODECS: 'foo;bar',
        NAME: '1',
        ['FRAME-RATE']: 30,
        ['PROGRAM-ID']: 1,
        RESOLUTION: {
          height: 600,
          width: 800
        }
      },
      endList: true,
      mediaSequence: 0,
      discontinuitySequence: 0,
      discontinuityStarts: [],
      timelineStarts: [{ start: 0, timeline: 0 }],
      targetDuration: 0,
      resolvedUri: '',
      segments: [],
      timeline: 0,
      uri: ''
    }],
    segments: [],
    uri: ''
  };

  assert.deepEqual(toM3u8({ dashPlaylists }), expected);
});

QUnit.test('playlists with content steering and resolvable URLs', function(assert) {
  const contentSteering = {
    defaultServiceLocation: 'beta',
    proxyServerURL: 'http://127.0.0.1:3455/steer',
    queryBeforeStart: false,
    serverURL: 'https://example.com/app/url'
  };

  const dashPlaylists = [
    {
      attributes: {
        bandwidth: 5000000,
        baseUrl: 'https://cdn1.example.com/video',
        clientOffset: 0,
        codecs: 'avc1.64001e',
        duration: 0,
        height: 404,
        id: 'test',
        mimeType: 'video/mp4',
        periodStart: 0,
        role: {
          value: 'main'
        },
        serviceLocation: 'alpha',
        sourceDuration: 0,
        type: 'dyanmic',
        width: 720
      },
      segments: [
        {
          duration: 0,
          map: {
            resolvedUri: 'https://cdn1.example.com/video',
            uri: ''
          },
          number: 1,
          presentationTime: 0,
          resolvedUri: 'https://cdn1.example.com/video',
          timeline: 0,
          uri: ''
        }
      ]
    },
    {
      attributes: {
        bandwidth: 5000000,
        baseUrl: 'https://cdn2.example.com/video',
        clientOffset: 0,
        codecs: 'avc1.64001e',
        duration: 0,
        height: 404,
        id: 'test',
        mimeType: 'video/mp4',
        periodStart: 0,
        role: {
          value: 'main'
        },
        serviceLocation: 'beta',
        sourceDuration: 0,
        type: 'dyanmic',
        width: 720
      },
      segments: [
        {
          duration: 0,
          map: {
            resolvedUri: 'https://cdn2.example.com/video',
            uri: ''
          },
          number: 1,
          presentationTime: 0,
          resolvedUri: 'https://cdn2.example.com/video',
          timeline: 0,
          uri: ''
        }
      ]
    },
    {
      attributes: {
        bandwidth: 256,
        baseUrl: 'https://cdn1.example.com/vtt',
        clientOffset: 0,
        duration: 0,
        id: 'en',
        lang: 'en',
        mimeType: 'text/vtt',
        periodStart: 0,
        role: {},
        serviceLocation: 'alpha',
        sourceDuration: 0,
        type: 'dyanmic'
      },
      segments: [
        {
          duration: 0,
          map: {
            resolvedUri: 'https://cdn1.example.com/vtt',
            uri: ''
          },
          number: 1,
          presentationTime: 0,
          resolvedUri: 'https://cdn1.example.com/vtt',
          timeline: 0,
          uri: ''
        }
      ]
    },
    {
      attributes: {
        bandwidth: 256,
        baseUrl: 'https://cdn2.example.com/vtt',
        clientOffset: 0,
        id: 'en',
        lang: 'en',
        mimeType: 'text/vtt',
        periodStart: 0,
        role: {},
        serviceLocation: 'beta',
        sourceDuration: 0,
        type: 'dyanmic'
      }
    },
    {
      attributes: {
        bandwidth: 256,
        baseUrl: 'https://cdn3.example.com/vtt',
        clientOffset: 0,
        id: 'fr',
        label: 'french',
        lang: 'fr',
        mimeType: 'text/vtt',
        periodStart: 0,
        role: {},
        serviceLocation: 'beta',
        sourceDuration: 0,
        type: 'dyanmic'
      }
    }
  ];

  const expected = {
    allowCache: true,
    contentSteering: {
      defaultServiceLocation: 'beta',
      proxyServerURL: 'http://127.0.0.1:3455/steer',
      queryBeforeStart: false,
      serverURL: 'https://example.com/app/url'
    },
    discontinuityStarts: [],
    duration: 0,
    endList: true,
    mediaGroups: {
      AUDIO: {},
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {
        subs: {
          french: {
            autoselect: false,
            default: false,
            language: 'fr',
            playlists: [
              {
                attributes: {
                  BANDWIDTH: 256,
                  NAME: 'fr',
                  ['PROGRAM-ID']: 1,
                  serviceLocation: 'beta'
                },
                discontinuitySequence: 0,
                discontinuityStarts: [],
                endList: false,
                mediaSequence: 0,
                resolvedUri: 'https://cdn3.example.com/vtt',
                segments: [
                  {
                    duration: 0,
                    number: 0,
                    resolvedUri: 'https://cdn3.example.com/vtt',
                    timeline: 0,
                    uri: 'https://cdn3.example.com/vtt'
                  }
                ],
                targetDuration: 0,
                timeline: 0,
                timelineStarts: [
                  {
                    start: 0,
                    timeline: 0
                  }
                ],
                uri: ''
              }
            ],
            uri: ''
          },
          en: {
            autoselect: false,
            default: false,
            language: 'en',
            playlists: [
              {
                attributes: {
                  BANDWIDTH: 256,
                  NAME: 'en',
                  ['PROGRAM-ID']: 1,
                  serviceLocation: 'alpha'
                },
                discontinuitySequence: 0,
                discontinuityStarts: [],
                endList: false,
                mediaSequence: 0,
                resolvedUri: 'https://cdn1.example.com/vtt',
                segments: [
                  {
                    duration: 0,
                    map: {
                      resolvedUri: 'https://cdn1.example.com/vtt',
                      uri: ''
                    },
                    number: 0,
                    presentationTime: 0,
                    resolvedUri: 'https://cdn1.example.com/vtt',
                    timeline: 0,
                    uri: ''
                  }
                ],
                targetDuration: 0,
                timeline: 0,
                timelineStarts: [
                  {
                    start: 0,
                    timeline: 0
                  }
                ],
                uri: ''
              },
              {
                attributes: {
                  BANDWIDTH: 256,
                  NAME: 'en',
                  ['PROGRAM-ID']: 1,
                  serviceLocation: 'beta'
                },
                discontinuitySequence: 0,
                discontinuityStarts: [],
                endList: false,
                mediaSequence: 0,
                resolvedUri: 'https://cdn2.example.com/vtt',
                segments: [
                  {
                    duration: 0,
                    number: 0,
                    resolvedUri: 'https://cdn2.example.com/vtt',
                    timeline: 0,
                    uri: 'https://cdn2.example.com/vtt'
                  }
                ],
                targetDuration: 0,
                timeline: 0,
                timelineStarts: [
                  {
                    start: 0,
                    timeline: 0
                  }
                ],
                uri: ''
              }
            ],
            uri: ''
          }
        }
      },
      VIDEO: {}
    },
    playlists: [
      {
        attributes: {
          AUDIO: 'audio',
          BANDWIDTH: 5000000,
          CODECS: 'avc1.64001e',
          NAME: 'test',
          ['PROGRAM-ID']: 1,
          RESOLUTION: {
            height: 404,
            width: 720
          },
          SUBTITLES: 'subs',
          serviceLocation: 'alpha'
        },
        discontinuitySequence: 0,
        discontinuityStarts: [],
        endList: false,
        mediaSequence: 0,
        resolvedUri: 'https://cdn1.example.com/video',
        segments: [
          {
            duration: 0,
            map: {
              resolvedUri: 'https://cdn1.example.com/video',
              uri: ''
            },
            number: 0,
            presentationTime: 0,
            resolvedUri: 'https://cdn1.example.com/video',
            timeline: 0,
            uri: ''
          }
        ],
        targetDuration: 0,
        timeline: 0,
        timelineStarts: [
          {
            start: 0,
            timeline: 0
          }
        ],
        uri: ''
      },
      {
        attributes: {
          AUDIO: 'audio',
          BANDWIDTH: 5000000,
          CODECS: 'avc1.64001e',
          NAME: 'test',
          ['PROGRAM-ID']: 1,
          RESOLUTION: {
            height: 404,
            width: 720
          },
          SUBTITLES: 'subs',
          serviceLocation: 'beta'
        },
        discontinuitySequence: 0,
        discontinuityStarts: [],
        endList: false,
        mediaSequence: 0,
        resolvedUri: 'https://cdn2.example.com/video',
        segments: [
          {
            duration: 0,
            map: {
              resolvedUri: 'https://cdn2.example.com/video',
              uri: ''
            },
            number: 0,
            presentationTime: 0,
            resolvedUri: 'https://cdn2.example.com/video',
            timeline: 0,
            uri: ''
          }
        ],
        targetDuration: 0,
        timeline: 0,
        timelineStarts: [
          {
            start: 0,
            timeline: 0
          }
        ],
        uri: ''
      }
    ],
    segments: [],
    timelineStarts: [
      {
        start: 0,
        timeline: 0
      }
    ],
    uri: ''
  };

  assert.deepEqual(toM3u8({ dashPlaylists, contentSteering }), expected);
});

QUnit.test('playlists with content steering', function(assert) {
  const contentSteering = {
    defaultServiceLocation: 'beta',
    proxyServerURL: 'http://127.0.0.1:3455/steer',
    queryBeforeStart: false,
    serverURL: 'https://example.com/app/url'
  };

  const dashPlaylists = [{
    attributes: {
      bandwidth: 5000000,
      baseUrl: 'https://cdn1.example.com/',
      clientOffset: 0,
      codecs: 'avc1.64001e',
      duration: 0,
      height: 404,
      id: 'test',
      mimeType: 'video/mp4',
      periodStart: 0,
      role: {
        value: 'main'
      },
      serviceLocation: 'alpha',
      sourceDuration: 0,
      type: 'dyanmic',
      width: 720
    },
    segments: [
      {
        duration: 0,
        map: {
          resolvedUri: 'https://cdn1.example.com/',
          uri: ''
        },
        number: 1,
        presentationTime: 0,
        resolvedUri: 'https://cdn1.example.com/',
        timeline: 0,
        uri: ''
      }
    ]
  }, {
    attributes: {
      bandwidth: 5000000,
      baseUrl: 'https://cdn2.example.com/',
      clientOffset: 0,
      codecs: 'avc1.64001e',
      duration: 0,
      height: 404,
      id: 'test',
      mimeType: 'video/mp4',
      periodStart: 0,
      role: {
        value: 'main'
      },
      serviceLocation: 'beta',
      sourceDuration: 0,
      type: 'dyanmic',
      width: 720
    },
    segments: [
      {
        duration: 0,
        map: {
          resolvedUri: 'https://cdn2.example.com/',
          uri: ''
        },
        number: 1,
        presentationTime: 0,
        resolvedUri: 'https://cdn2.example.com/',
        timeline: 0,
        uri: ''
      }
    ]
  }, {
    attributes: {
      bandwidth: 256,
      baseUrl: 'https://example.com/en.vtt',
      clientOffset: 0,
      id: 'en',
      lang: 'en',
      mimeType: 'text/vtt',
      periodStart: 0,
      role: {},
      sourceDuration: 0,
      type: 'dyanmic'
    }
  }, {
    attributes: {
      bandwidth: 256,
      baseUrl: 'https://example.com/en.vtt',
      clientOffset: 0,
      id: 'en',
      lang: 'en',
      mimeType: 'text/vtt',
      periodStart: 0,
      role: {},
      sourceDuration: 0,
      type: 'dyanmic'
    }
  }];

  const expected = {
    allowCache: true,
    contentSteering: {
      defaultServiceLocation: 'beta',
      proxyServerURL: 'http://127.0.0.1:3455/steer',
      queryBeforeStart: false,
      serverURL: 'https://example.com/app/url'
    },
    discontinuityStarts: [],
    duration: 0,
    endList: true,
    mediaGroups: {
      AUDIO: {},
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {
        subs: {
          en: {
            autoselect: false,
            default: false,
            language: 'en',
            playlists: [
              {
                attributes: {
                  BANDWIDTH: 256,
                  NAME: 'en',
                  ['PROGRAM-ID']: 1
                },
                discontinuitySequence: 0,
                discontinuityStarts: [],
                endList: false,
                mediaSequence: 0,
                resolvedUri: 'https://example.com/en.vtt',
                segments: [
                  {
                    duration: 0,
                    number: 0,
                    resolvedUri: 'https://example.com/en.vtt',
                    timeline: 0,
                    uri: 'https://example.com/en.vtt'
                  }
                ],
                targetDuration: 0,
                timeline: 0,
                timelineStarts: [
                  {
                    start: 0,
                    timeline: 0
                  },
                  {
                    start: 0,
                    timeline: 0
                  }
                ],
                uri: ''
              }
            ],
            uri: ''
          }
        }
      },
      VIDEO: {}
    },
    playlists: [
      {
        attributes: {
          AUDIO: 'audio',
          BANDWIDTH: 5000000,
          CODECS: 'avc1.64001e',
          NAME: 'test',
          ['PROGRAM-ID']: 1,
          RESOLUTION: {
            height: 404,
            width: 720
          },
          SUBTITLES: 'subs',
          serviceLocation: 'alpha'
        },
        discontinuitySequence: 0,
        discontinuityStarts: [],
        endList: false,
        mediaSequence: 0,
        resolvedUri: 'https://cdn1.example.com/',
        segments: [
          {
            duration: 0,
            map: {
              resolvedUri: 'https://cdn1.example.com/',
              uri: ''
            },
            number: 0,
            presentationTime: 0,
            resolvedUri: 'https://cdn1.example.com/',
            timeline: 0,
            uri: ''
          }
        ],
        targetDuration: 0,
        timeline: 0,
        timelineStarts: [
          {
            start: 0,
            timeline: 0
          }
        ],
        uri: ''
      },
      {
        attributes: {
          AUDIO: 'audio',
          BANDWIDTH: 5000000,
          CODECS: 'avc1.64001e',
          NAME: 'test',
          ['PROGRAM-ID']: 1,
          RESOLUTION: {
            height: 404,
            width: 720
          },
          SUBTITLES: 'subs',
          serviceLocation: 'beta'
        },
        discontinuitySequence: 0,
        discontinuityStarts: [],
        endList: false,
        mediaSequence: 0,
        resolvedUri: 'https://cdn2.example.com/',
        segments: [
          {
            duration: 0,
            map: {
              resolvedUri: 'https://cdn2.example.com/',
              uri: ''
            },
            number: 0,
            presentationTime: 0,
            resolvedUri: 'https://cdn2.example.com/',
            timeline: 0,
            uri: ''
          }
        ],
        targetDuration: 0,
        timeline: 0,
        timelineStarts: [
          {
            start: 0,
            timeline: 0
          }
        ],
        uri: ''
      }
    ],
    segments: [],
    timelineStarts: [
      {
        start: 0,
        timeline: 0
      }
    ],
    uri: ''
  };

  assert.deepEqual(toM3u8({ dashPlaylists, contentSteering }), expected);
});

QUnit.test('playlists with segments', function(assert) {
  const dashPlaylists = [{
    attributes: {
      id: '1',
      codecs: 'foo;bar',
      duration: 2,
      sourceDuration: 100,
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: [{
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 0
    }, {
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 1
    }]
  }, {
    attributes: {
      id: '2',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 2,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: [{
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 0
    }, {
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 1
    }]
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      duration: 2,
      height: 600,
      codecs: 'foo;bar',
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: [{
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 0
    }, {
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 1
    }]
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      duration: 2,
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    },
    segments: [{
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 0
    }, {
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 1
    }]
  }, {
    attributes: {
      sourceDuration: 100,
      duration: 2,
      id: '2',
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    },
    segments: [{
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 0
    }, {
      uri: '',
      timeline: 0,
      duration: 2,
      resolvedUri: '',
      map: {
        uri: '',
        resolvedUri: ''
      },
      number: 1
    }]
  }];

  const expected = {
    allowCache: true,
    discontinuityStarts: [],
    duration: 100,
    endList: true,
    mediaGroups: {
      AUDIO: {
        audio: {
          main: {
            autoselect: true,
            default: true,
            language: '',
            playlists: [{
              attributes: {
                BANDWIDTH: 20000,
                CODECS: 'foo;bar',
                NAME: '1',
                ['PROGRAM-ID']: 1
              },
              targetDuration: 2,
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              endList: true,
              resolvedUri: '',
              segments: [{
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 0
              }, {
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 1
              }],
              timeline: 0,
              timelineStarts: [{ start: 0, timeline: 0 }],
              uri: ''
            }, {
              attributes: {
                BANDWIDTH: 10000,
                CODECS: 'foo;bar',
                NAME: '2',
                ['PROGRAM-ID']: 1
              },
              targetDuration: 2,
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              endList: true,
              resolvedUri: '',
              segments: [{
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 0
              }, {
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 1
              }],
              timeline: 0,
              timelineStarts: [{ start: 0, timeline: 0 }],
              uri: ''
            }],
            uri: ''
          }
        }
      },
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {
        subs: {
          text: {
            autoselect: false,
            default: false,
            language: 'und',
            playlists: [{
              attributes: {
                BANDWIDTH: 20000,
                NAME: '1',
                ['PROGRAM-ID']: 1
              },
              endList: true,
              targetDuration: 2,
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              resolvedUri: 'https://www.example.com/vtt',
              segments: [{
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 0
              }, {
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 1
              }],
              timeline: 0,
              timelineStarts: [{ start: 0, timeline: 0 }],
              uri: ''
            }, {
              attributes: {
                BANDWIDTH: 10000,
                NAME: '2',
                ['PROGRAM-ID']: 1
              },
              endList: true,
              targetDuration: 2,
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              resolvedUri: 'https://www.example.com/vtt',
              segments: [{
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 0
              }, {
                uri: '',
                timeline: 0,
                duration: 2,
                resolvedUri: '',
                map: {
                  uri: '',
                  resolvedUri: ''
                },
                number: 1
              }],
              timeline: 0,
              timelineStarts: [{ start: 0, timeline: 0 }],
              uri: ''
            }],
            uri: ''
          }
        }
      },
      VIDEO: {}
    },
    playlists: [{
      attributes: {
        AUDIO: 'audio',
        SUBTITLES: 'subs',
        BANDWIDTH: 10000,
        CODECS: 'foo;bar',
        NAME: '1',
        ['PROGRAM-ID']: 1,
        RESOLUTION: {
          height: 600,
          width: 800
        }
      },
      endList: true,
      resolvedUri: '',
      mediaSequence: 0,
      discontinuitySequence: 0,
      discontinuityStarts: [],
      targetDuration: 2,
      segments: [{
        uri: '',
        timeline: 0,
        duration: 2,
        resolvedUri: '',
        map: {
          uri: '',
          resolvedUri: ''
        },
        number: 0
      }, {
        uri: '',
        timeline: 0,
        duration: 2,
        resolvedUri: '',
        map: {
          uri: '',
          resolvedUri: ''
        },
        number: 1
      }],
      timeline: 0,
      timelineStarts: [{ start: 0, timeline: 0 }],
      uri: ''
    }],
    segments: [],
    timelineStarts: [{ start: 0, timeline: 0 }],
    uri: ''
  };

  assert.deepEqual(toM3u8({ dashPlaylists }), expected);
});

QUnit.test('playlists with sidx and sidxMapping', function(assert) {
  const dashPlaylists = [{
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: [],
    sidx: {
      byterange: {
        offset: 10,
        length: 10
      },
      uri: 'sidx.mp4',
      resolvedUri: 'http://example.com/sidx.mp4',
      timeline: 0,
      duration: 10
    },
    uri: 'http://example.com/fmp4.mp4'
  }];

  const sidxMapping = {
    'sidx.mp4-10-19': {
      sidx: {
        timescale: 1,
        firstOffset: 0,
        references: [{
          referenceType: 0,
          referencedSize: 5,
          subsegmentDuration: 2
        }]
      }
    }
  };

  const expected = [{
    attributes: {
      AUDIO: 'audio',
      SUBTITLES: 'subs',
      BANDWIDTH: 10000,
      CODECS: 'foo;bar',
      NAME: '1',
      ['PROGRAM-ID']: 1,
      RESOLUTION: {
        height: 600,
        width: 800
      }
    },
    sidx: {
      byterange: {
        offset: 10,
        length: 10
      },
      uri: 'sidx.mp4',
      resolvedUri: 'http://example.com/sidx.mp4',
      timeline: 0,
      duration: 10
    },
    targetDuration: 0,
    timeline: 0,
    timelineStarts: [{ start: 0, timeline: 0 }],
    uri: '',
    segments: [{
      map: {
        resolvedUri: 'http://example.com/sidx.mp4',
        uri: ''
      },
      byterange: {
        offset: 20,
        length: 5
      },
      uri: 'http://example.com/sidx.mp4',
      resolvedUri: 'http://example.com/sidx.mp4',
      duration: 2,
      number: 0,
      presentationTime: 0,
      timeline: 0
    }],
    endList: true,
    mediaSequence: 0,
    discontinuitySequence: 0,
    discontinuityStarts: [],
    resolvedUri: ''
  }];

  assert.deepEqual(toM3u8({ dashPlaylists, sidxMapping }).playlists, expected);
});

QUnit.test('playlists without minimumUpdatePeriod dont assign default value', function(assert) {
  const dashPlaylists = [{
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: [],
    sidx: {
      byterange: {
        offset: 10,
        length: 10
      },
      uri: 'sidx.mp4',
      resolvedUri: 'http://example.com/sidx.mp4',
      duration: 10
    },
    uri: 'http://example.com/fmp4.mp4'
  }];

  assert.equal(toM3u8({ dashPlaylists }).minimumUpdatePeriod, undefined);
});

QUnit.test('playlists with minimumUpdatePeriod = 0', function(assert) {
  const dashPlaylists = [{
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static',
      minimumUpdatePeriod: 0
    },
    segments: [],
    sidx: {
      byterange: {
        offset: 10,
        length: 10
      },
      uri: 'sidx.mp4',
      resolvedUri: 'http://example.com/sidx.mp4',
      duration: 10
    },
    uri: 'http://example.com/fmp4.mp4'
  }];

  assert.equal(toM3u8({ dashPlaylists }).minimumUpdatePeriod, 0);
});

QUnit.test('playlists with integer value for minimumUpdatePeriod', function(assert) {
  const dashPlaylists = [{
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static',
      minimumUpdatePeriod: 2
    },
    segments: [],
    sidx: {
      byterange: {
        offset: 10,
        length: 10
      },
      uri: 'sidx.mp4',
      resolvedUri: 'http://example.com/sidx.mp4',
      duration: 10
    },
    uri: 'http://example.com/fmp4.mp4'
  }];

  assert.equal(
    toM3u8({ dashPlaylists }).minimumUpdatePeriod,
    2000,
    'converts update period to ms'
  );
});

QUnit.test('no playlists', function(assert) {
  assert.deepEqual(toM3u8({ dashPlaylists: [] }), {});
});

QUnit.test('dynamic playlists with suggestedPresentationDelay', function(assert) {
  const dashPlaylists = [{
    attributes: {
      id: '1',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'dynamic',
      suggestedPresentationDelay: 18
    },
    segments: []
  }, {
    attributes: {
      id: '2',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    }
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    }
  }];

  const output = toM3u8({ dashPlaylists });

  assert.ok('suggestedPresentationDelay' in output);
  assert.deepEqual(output.suggestedPresentationDelay, 18);
});

QUnit.test('playlists with label', function(assert) {
  const label = 'English with commentary';
  const dashPlaylists = [{
    attributes: {
      id: '1',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'dynamic',
      label
    },
    segments: []
  }, {
    attributes: {
      id: '2',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      label
    },
    segments: []
  }];
  const output = toM3u8({ dashPlaylists });

  assert.ok(label in output.mediaGroups.AUDIO.audio, 'label exists');
  assert.ok(label in output.mediaGroups.SUBTITLES.subs, 'label exists');

});

QUnit.test('608 captions', function(assert) {
  const dashPlaylists = [{
    attributes: {
      captionServices: [{
        channel: 'CC1',
        language: 'CC1'
      }, {
        channel: 'CC2',
        language: 'CC2'
      }, {
        channel: undefined,
        language: 'English'
      }, {
        channel: 'CC4',
        language: 'eng'
      }],
      id: '1',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'dynamic'
    },
    segments: []
  }, {
    attributes: {
      id: '2',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: []
  }];
  const output = toM3u8({ dashPlaylists });

  const cc = output.mediaGroups['CLOSED-CAPTIONS'].cc;

  Object.keys(cc).forEach((key) => {
    assert.notOk(cc[key].autoselect, 'no autoselect');
    assert.notOk(cc[key].default, 'no default');
  });

  assert.deepEqual(Object.keys(cc), ['CC1', 'CC2', 'English', 'eng'], 'we have 4 channels');
  assert.equal(cc.CC1.instreamId, 'CC1', 'CC1 has an instreamId of CC1');
  assert.equal(cc.CC2.instreamId, 'CC2', 'CC2 has an instreamId of CC1');
  assert.equal(cc.English.instreamId, undefined, 'English captions dont have an instreamId');
  assert.equal(cc.eng.instreamId, 'CC4', 'eng captions have an instreamId of CC4');
});

QUnit.module('generateSidxKey');

QUnit.test('generates correct key', function(assert) {
  const sidxInfo = {
    byterange: {
      offset: 1,
      length: 5
    },
    uri: 'uri'
  };

  assert.strictEqual(
    generateSidxKey(sidxInfo),
    'uri-1-5',
    'the key byterange should have a inclusive end'
  );
});

QUnit.module('addMediaSequenceValues');

QUnit.test('resets media sequence values', function(assert) {
  const playlists = [{
    timeline: 17,
    mediaSequence: 2,
    discontinuitySequence: 3,
    segments: [{
      number: 5,
      presentationTime: 17,
      timeline: 17
    }, {
      number: 6,
      presentationTime: 19,
      timeline: 17
    }, {
      number: 7,
      presentationTime: 21,
      timeline: 21
    }]
  }, {
    timeline: 21,
    mediaSequence: 2,
    discontinuitySequence: 3,
    segments: [{
      number: 1,
      presentationTime: 21,
      timeline: 21
    }]
  }, {
    timeline: 17,
    mediaSequence: 2,
    discontinuitySequence: 2,
    segments: []
  }];
  const timelineStarts = [{
    timeline: 17,
    start: 17
  }, {
    timeline: 21,
    start: 21
  }];

  addMediaSequenceValues(playlists, timelineStarts);

  assert.deepEqual(
    playlists,
    [{
      timeline: 17,
      mediaSequence: 0,
      discontinuitySequence: 0,
      segments: [{
        number: 0,
        presentationTime: 17,
        timeline: 17
      }, {
        number: 1,
        presentationTime: 19,
        timeline: 17
      }, {
        number: 2,
        presentationTime: 21,
        timeline: 21
      }]
    }, {
      timeline: 21,
      mediaSequence: 0,
      discontinuitySequence: 1,
      segments: [{
        number: 0,
        presentationTime: 21,
        timeline: 21
      }]
    }, {
      timeline: 17,
      mediaSequence: 0,
      discontinuitySequence: 0,
      segments: []
    }],
    'updated media sequence values'
  );
});

QUnit.module('flattenMediaGroupPlaylists');

QUnit.test('includes all media group playlists', function(assert) {
  assert.deepEqual(
    flattenMediaGroupPlaylists({
      en: {
        playlists: [
          { attributes: { NAME: 'A' } },
          { attributes: { NAME: 'B' } }
        ]
      },
      es: {
        playlists: [
          { attributes: { NAME: 'C' } },
          { attributes: { NAME: 'D' } }
        ]
      }
    }),
    [
      { attributes: { NAME: 'A' } },
      { attributes: { NAME: 'B' } },
      { attributes: { NAME: 'C' } },
      { attributes: { NAME: 'D' } }
    ],
    'included all media group playlists'
  );
});

QUnit.module('eventStream');

QUnit.test('eventStreams with playlists', function(assert) {
  const dashPlaylists = [{
    attributes: {
      id: '1',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      id: '2',
      codecs: 'foo;bar',
      sourceDuration: 100,
      duration: 0,
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'audio/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: 800,
      height: 600,
      codecs: 'foo;bar',
      duration: 0,
      bandwidth: 10000,
      frameRate: 30,
      periodStart: 0,
      mimeType: 'video/mp4',
      type: 'static'
    },
    segments: []
  }, {
    attributes: {
      sourceDuration: 100,
      id: '1',
      bandwidth: 20000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    }
  }, {
    attributes: {
      sourceDuration: 100,
      id: '2',
      bandwidth: 10000,
      periodStart: 0,
      mimeType: 'text/vtt',
      type: 'static',
      baseUrl: 'https://www.example.com/vtt'
    }
  }];

  const eventStream = [
    {
      end: 1,
      id: 'one',
      messageData: 'foo',
      schemeIdUri: 'urn:foo.bar.2023',
      start: 1,
      value: 'bar'
    },
    {
      end: 2,
      id: 'two',
      messageData: 'bar',
      schemeIdUri: 'urn:foo.bar.2023',
      start: 2,
      value: 'foo'
    },
    {
      end: 3,
      id: 'three',
      messageData: 'foo_bar',
      schemeIdUri: 'urn:foo.bar.2023',
      start: 3,
      value: 'bar_foo'
    }
  ];

  const expected = {
    allowCache: true,
    discontinuityStarts: [],
    timelineStarts: [{ start: 0, timeline: 0 }],
    duration: 100,
    endList: true,
    eventStream: [
      {
        end: 1,
        id: 'one',
        messageData: 'foo',
        schemeIdUri: 'urn:foo.bar.2023',
        start: 1,
        value: 'bar'
      },
      {
        end: 2,
        id: 'two',
        messageData: 'bar',
        schemeIdUri: 'urn:foo.bar.2023',
        start: 2,
        value: 'foo'
      },
      {
        end: 3,
        id: 'three',
        messageData: 'foo_bar',
        schemeIdUri: 'urn:foo.bar.2023',
        start: 3,
        value: 'bar_foo'
      }
    ],
    mediaGroups: {
      AUDIO: {
        audio: {
          main: {
            autoselect: true,
            default: true,
            language: '',
            playlists: [{
              attributes: {
                BANDWIDTH: 20000,
                CODECS: 'foo;bar',
                NAME: '1',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              endList: true,
              resolvedUri: '',
              segments: [],
              timeline: 0,
              uri: '',
              targetDuration: 0
            }, {
              attributes: {
                BANDWIDTH: 10000,
                CODECS: 'foo;bar',
                NAME: '2',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              endList: true,
              resolvedUri: '',
              segments: [],
              timeline: 0,
              uri: '',
              targetDuration: 0

            }],
            uri: ''
          }
        }
      },
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {
        subs: {
          text: {
            autoselect: false,
            default: false,
            language: 'und',
            playlists: [{
              attributes: {
                BANDWIDTH: 20000,
                NAME: '1',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              targetDuration: 100,
              endList: true,
              resolvedUri: 'https://www.example.com/vtt',
              segments: [{
                duration: 100,
                resolvedUri: 'https://www.example.com/vtt',
                timeline: 0,
                uri: 'https://www.example.com/vtt',
                number: 0
              }],
              timeline: 0,
              uri: ''
            }, {
              attributes: {
                BANDWIDTH: 10000,
                NAME: '2',
                ['PROGRAM-ID']: 1
              },
              mediaSequence: 0,
              discontinuitySequence: 0,
              discontinuityStarts: [],
              timelineStarts: [{ start: 0, timeline: 0 }],
              targetDuration: 100,
              endList: true,
              resolvedUri: 'https://www.example.com/vtt',
              segments: [{
                duration: 100,
                resolvedUri: 'https://www.example.com/vtt',
                timeline: 0,
                uri: 'https://www.example.com/vtt',
                number: 0
              }],
              timeline: 0,
              uri: ''
            }],
            uri: ''
          }
        }
      },
      VIDEO: {}
    },
    playlists: [{
      attributes: {
        AUDIO: 'audio',
        SUBTITLES: 'subs',
        BANDWIDTH: 10000,
        CODECS: 'foo;bar',
        NAME: '1',
        ['FRAME-RATE']: 30,
        ['PROGRAM-ID']: 1,
        RESOLUTION: {
          height: 600,
          width: 800
        }
      },
      endList: true,
      mediaSequence: 0,
      discontinuitySequence: 0,
      discontinuityStarts: [],
      timelineStarts: [{ start: 0, timeline: 0 }],
      targetDuration: 0,
      resolvedUri: '',
      segments: [],
      timeline: 0,
      uri: ''
    }],
    segments: [],
    uri: ''
  };

  assert.deepEqual(toM3u8({ dashPlaylists, eventStream }), expected);
});
