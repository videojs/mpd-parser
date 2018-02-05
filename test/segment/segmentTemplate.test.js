import QUnit from 'qunit';
import {
  constructTemplateUrl,
  parseTemplateInfo,
  segmentsFromTemplate
} from '../../src/segment/segmentTemplate';

QUnit.module('segmentTemplate - constructTemplateUrl');

QUnit.test('does not change url with no identifiers', function(assert) {
  const url = 'path/to/segment.mp4';

  assert.equal(constructTemplateUrl(url, {}), url, 'no change');
});

QUnit.test('replaces each identifier individually', function(assert) {
  const values = {
    RepresentationID: 'Rep1',
    Bandwidth: 1000,
    Number: 2,
    Time: 2000
  };

  const cases = [
    {
      url: '/$RepresentationID$/segment.mp4',
      expected: '/Rep1/segment.mp4'
    },
    {
      url: '/$Bandwidth$/segment.mp4',
      expected: '/1000/segment.mp4'
    },
    {
      url: '/$Number$/segment.mp4',
      expected: '/2/segment.mp4'
    },
    {
      url: '/$Time$/segment.mp4',
      expected: '/2000/segment.mp4'
    },
    {
      url: '/$$/segment.mp4',
      expected: '/$/segment.mp4'
    }
  ];

  cases.forEach(test => {
    assert.equal(
      constructTemplateUrl(test.url, values), test.expected, `constructs ${test.url}`);
  });
});

QUnit.test('replaces multiple identifiers in url', function(assert) {
  assert.equal(
    constructTemplateUrl(
      '$$$Time$$$$$/$RepresentationID$/$Bandwidth$/$Number$-$Time$-segment-$Number$.mp4',
      {
        RepresentationID: 'Rep1',
        Bandwidth: 1000,
        Number: 2,
        Time: 2000
      }),
    '$2000$$/Rep1/1000/2-2000-segment-2.mp4',
    'correctly replaces multiple identifiers in single url');
});

QUnit.test('does not replace unknown identifiers', function(assert) {
  assert.equal(
    constructTemplateUrl(
      '/$UNKNOWN$/$RepresentationID$/$UNKOWN2$/$Number$.mp4',
      {
        RepresentationID: 'Rep1',
        Number: 1
      }),
    '/$UNKNOWN$/Rep1/$UNKOWN2$/1.mp4',
    'ignores unknown identifiers');
});

QUnit.test('honors padding format tag', function(assert) {
  assert.equal(
    constructTemplateUrl(
      '/$Number%03d$/segment.mp4',
      { Number: 7 }),
    '/007/segment.mp4',
    'correctly adds padding when format tag present');
});

QUnit.test('does not add padding when value is longer than width', function(assert) {
  assert.equal(
    constructTemplateUrl(
      '/$Bandwidth%06d$/segment.mp4',
      { Bandwidth: 999999999 }),
    '/999999999/segment.mp4',
    'no padding when value longer than format width');
});

QUnit.test('does not use padding format tag for $RepresentationID$', function(assert) {
  assert.equal(
    constructTemplateUrl(
      '/$RepresentationID%09d$/$Number%03d$/segment.mp4',
      { RepresentationID: 'Rep1', Number: 7 }),
    '/Rep1/007/segment.mp4',
    'ignores format tag for $RepresentationID$');
});

QUnit.module('segmentTemplate - parseTemplateInfo');

QUnit.test('one media segment when no @duration attribute or SegmentTimeline element',
function(assert) {
  const attributes = {
    startNumber: '3',
    timescale: '1000',
    sourceDuration: 42,
    periodIndex: 1
  };

  assert.deepEqual(
    parseTemplateInfo(attributes, void 0),
    [ { number: 3, duration: 42, time: 0, timeline: 1 }],
    'creates segment list of one media segment when no @duration attribute or timeline');
});

QUnit.test('uses @duration attribute when present', function(assert) {
  const attributes = {
    startNumber: '0',
    timescale: '1000',
    sourceDuration: 16,
    duration: '6000',
    periodIndex: 1
  };

  assert.deepEqual(
    parseTemplateInfo(attributes, []),
    [
      {
        number: 0,
        duration: 6,
        timeline: 1,
        time: 0
      },
      {
        number: 1,
        duration: 6,
        timeline: 1,
        time: 6000
      },
      {
        number: 2,
        duration: 4,
        timeline: 1,
        time: 12000
      }
    ],
    'correctly parses segment durations and start times with @duration attribute');
});

QUnit.test('parseByDuration allows non zero startNumber', function(assert) {
  const attributes = {
    startNumber: '101',
    timescale: '1000',
    sourceDuration: 16,
    duration: '6000',
    periodIndex: 1
  };

  assert.deepEqual(
    parseTemplateInfo(attributes, []),
    [
      {
        number: 101,
        duration: 6,
        timeline: 1,
        time: 0
      },
      {
        number: 102,
        duration: 6,
        timeline: 1,
        time: 6000
      },
      {
        number: 103,
        duration: 4,
        timeline: 1,
        time: 12000
      }
    ],
    'allows non zero startNumber');
});

QUnit.test('parseByDuration defaults 1 for startNumber and timescale', function(assert) {
  const attributes = {
    sourceDuration: 11,
    duration: '4',
    periodIndex: 1
  };

  assert.deepEqual(
    parseTemplateInfo(attributes, []),
    [
      {
        number: 1,
        duration: 4,
        timeline: 1,
        time: 0
      },
      {
        number: 2,
        duration: 4,
        timeline: 1,
        time: 4
      },
      {
        number: 3,
        duration: 3,
        timeline: 1,
        time: 8
      }
    ],
    'uses default startNumber and timescale value of 1');
});

QUnit.test('uses SegmentTimeline info when no @duration attribute', function(assert) {
  const attributes = {
    startNumber: '0',
    sourceDuration: 16,
    timescale: '1000',
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      t: '0',
      d: '6000'
    },
    {
      d: '2000'
    },
    {
      d: '3000'
    },
    {
      d: '5000'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 0,
        duration: 6,
        time: 0,
        timeline: 1
      },
      {
        number: 1,
        duration: 2,
        time: 6000,
        timeline: 1
      },
      {
        number: 2,
        duration: 3,
        time: 8000,
        timeline: 1
      },
      {
        number: 3,
        duration: 5,
        time: 11000,
        timeline: 1
      }
    ],
    'correctly calculates segment durations and start times with SegmentTimeline');
});

QUnit.test('parseByTimeline allows non zero startNumber', function(assert) {
  const attributes = {
    startNumber: '101',
    sourceDuration: 16,
    timescale: '1000',
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      t: '0',
      d: '6000'
    },
    {
      d: '2000'
    },
    {
      d: '3000'
    },
    {
      d: '5000'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 101,
        duration: 6,
        time: 0,
        timeline: 1
      },
      {
        number: 102,
        duration: 2,
        time: 6000,
        timeline: 1
      },
      {
        number: 103,
        duration: 3,
        time: 8000,
        timeline: 1
      },
      {
        number: 104,
        duration: 5,
        time: 11000,
        timeline: 1
      }
    ],
    'allows non zero startNumber');
});

QUnit.test('parseByTimeline defaults 1 for startNumber and timescale', function(assert) {
  const attributes = {
    sourceDuration: 11,
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      t: '0',
      d: '4'
    },
    {
      d: '2'
    },
    {
      d: '3'
    },
    {
      d: '2'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 1,
        duration: 4,
        time: 0,
        timeline: 1
      },
      {
        number: 2,
        duration: 2,
        time: 4,
        timeline: 1
      },
      {
        number: 3,
        duration: 3,
        time: 6,
        timeline: 1
      },
      {
        number: 4,
        duration: 2,
        time: 9,
        timeline: 1
      }
    ],
    'defaults to 1 for startNumber and timescale');
});

QUnit.test('defaults SegmentTimeline.S@t to 0 for first segment', function(assert) {
  const attributes = {
    startNumber: '0',
    sourceDuration: 16,
    timescale: '1000',
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      d: '6000'
    },
    {
      d: '2000'
    },
    {
      d: '3000'
    },
    {
      d: '5000'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 0,
        duration: 6,
        time: 0,
        timeline: 1
      },
      {
        number: 1,
        duration: 2,
        time: 6000,
        timeline: 1
      },
      {
        number: 2,
        duration: 3,
        time: 8000,
        timeline: 1
      },
      {
        number: 3,
        duration: 5,
        time: 11000,
        timeline: 1
      }
    ],
    'uses default value of 0');
});

QUnit.test('allows non zero starting SegmentTimeline.S@t value', function(assert) {
  const attributes = {
    startNumber: '0',
    sourceDuration: 16,
    timescale: '1000',
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      t: '42000',
      d: '6000'
    },
    {
      d: '2000'
    },
    {
      d: '3000'
    },
    {
      d: '5000'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 0,
        duration: 6,
        time: 42000,
        timeline: 1
      },
      {
        number: 1,
        duration: 2,
        time: 48000,
        timeline: 1
      },
      {
        number: 2,
        duration: 3,
        time: 50000,
        timeline: 1
      },
      {
        number: 3,
        duration: 5,
        time: 53000,
        timeline: 1
      }
    ],
    'allows non zero SegmentTimeline.S@t start value');
});

QUnit.test('honors @r repeat attribute for SegmentTimeline.S', function(assert) {
  const attributes = {
    startNumber: '0',
    sourceDuration: 16,
    timescale: '1000',
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      t: '0',
      d: '6000'
    },
    {
      d: '1000',
      r: '3'
    },
    {
      d: '5000'
    },
    {
      d: '1000'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 0,
        duration: 6,
        time: 0,
        timeline: 1
      },
      {
        number: 1,
        duration: 1,
        time: 6000,
        timeline: 1
      },
      {
        number: 2,
        duration: 1,
        time: 7000,
        timeline: 1
      },
      {
        number: 3,
        duration: 1,
        time: 8000,
        timeline: 1
      },
      {
        number: 4,
        duration: 1,
        time: 9000,
        timeline: 1
      },
      {
        number: 5,
        duration: 5,
        time: 10000,
        timeline: 1
      },
      {
        number: 6,
        duration: 1,
        time: 15000,
        timeline: 1
      }
    ],
    'correctly uses @r repeat attribute');
});

QUnit.test('correctly handles negative @r repeat value', function(assert) {
  const attributes = {
    startNumber: '0',
    sourceDuration: 16,
    timescale: '1000',
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      t: '0',
      d: '6000'
    },
    {
      d: '1000',
      r: '-1'
    },
    {
      t: '10000',
      d: '5000'
    },
    {
      d: '1000'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 0,
        duration: 6,
        time: 0,
        timeline: 1
      },
      {
        number: 1,
        duration: 1,
        time: 6000,
        timeline: 1
      },
      {
        number: 2,
        duration: 1,
        time: 7000,
        timeline: 1
      },
      {
        number: 3,
        duration: 1,
        time: 8000,
        timeline: 1
      },
      {
        number: 4,
        duration: 1,
        time: 9000,
        timeline: 1
      },
      {
        number: 5,
        duration: 5,
        time: 10000,
        timeline: 1
      },
      {
        number: 6,
        duration: 1,
        time: 15000,
        timeline: 1
      }
    ],
    'correctly uses negative @r repeat attribute');
});

QUnit.test('correctly handles negative @r repeat value for last S', function(assert) {
  const attributes = {
    startNumber: '0',
    sourceDuration: 15,
    timescale: '1000',
    periodIndex: 1
  };
  const segmentTimeline = [
    {
      t: '0',
      d: '6000'
    },
    {
      d: '3000',
      r: '-1'
    }
  ];

  assert.deepEqual(
    parseTemplateInfo(attributes, segmentTimeline),
    [
      {
        number: 0,
        duration: 6,
        time: 0,
        timeline: 1
      },
      {
        number: 1,
        duration: 3,
        time: 6000,
        timeline: 1
      },
      {
        number: 2,
        duration: 3,
        time: 9000,
        timeline: 1
      },
      {
        number: 3,
        duration: 3,
        time: 12000,
        timeline: 1
      }
    ],
    'correctly uses negative @r repeat attribute for last S');
});

QUnit.skip('detects discontinuity when @t time is greater than expected start time',
function(assert) {

});

QUnit.module('segmentTemplate - segmentsFromTemplate');

QUnit.test('constructs simple segment list and resolves uris', function(assert) {
  const attributes = {
    startNumber: '0',
    duration: '6000',
    sourceDuration: 16,
    timescale: '1000',
    bandwidth: '100',
    id: 'Rep1',
    initialization: {
      sourceURL: '$RepresentationID$/$Bandwidth$/init.mp4'
    },
    media: '$RepresentationID$/$Bandwidth$/$Number%03d$-$Time%05d$.mp4',
    periodIndex: 1,
    baseUrl: 'https://example.com/'
  };
  const segments = [
    {
      duration: 6,
      map: {
        resolvedUri: 'https://example.com/Rep1/100/init.mp4',
        uri: 'Rep1/100/init.mp4'
      },
      resolvedUri: 'https://example.com/Rep1/100/000-00000.mp4',
      timeline: 1,
      uri: 'Rep1/100/000-00000.mp4'
    },
    {
      duration: 6,
      map: {
        resolvedUri: 'https://example.com/Rep1/100/init.mp4',
        uri: 'Rep1/100/init.mp4'
      },
      resolvedUri: 'https://example.com/Rep1/100/001-06000.mp4',
      timeline: 1,
      uri: 'Rep1/100/001-06000.mp4'
    },
    {
      duration: 4,
      map: {
        resolvedUri: 'https://example.com/Rep1/100/init.mp4',
        uri: 'Rep1/100/init.mp4'
      },
      resolvedUri: 'https://example.com/Rep1/100/002-12000.mp4',
      timeline: 1,
      uri: 'Rep1/100/002-12000.mp4'
    }
  ];

  assert.deepEqual(segmentsFromTemplate(attributes, void 0), segments,
    'creates segments from template');
});

QUnit.test('constructs simple segment list and with <Initialization> node', function(assert) {
  const attributes = {
    startNumber: '0',
    duration: '6000',
    sourceDuration: 16,
    timescale: '1000',
    bandwidth: '100',
    id: 'Rep1',
    initialization: {
      sourceURL: 'init.mp4',
      range: '121-125'
    },
    media: '$RepresentationID$/$Bandwidth$/$Number%03d$-$Time%05d$.mp4',
    periodIndex: 1,
    baseUrl: 'https://example.com/'
  };
  const segments = [
    {
      duration: 6,
      map: {
        resolvedUri: 'https://example.com/init.mp4',
        uri: 'init.mp4',
        byterange: {
          length: 4,
          offset: 121
        }
      },
      resolvedUri: 'https://example.com/Rep1/100/000-00000.mp4',
      timeline: 1,
      uri: 'Rep1/100/000-00000.mp4'
    },
    {
      duration: 6,
      map: {
        resolvedUri: 'https://example.com/init.mp4',
        uri: 'init.mp4',
        byterange: {
          length: 4,
          offset: 121
        }
      },
      resolvedUri: 'https://example.com/Rep1/100/001-06000.mp4',
      timeline: 1,
      uri: 'Rep1/100/001-06000.mp4'
    },
    {
      duration: 4,
      map: {
        resolvedUri: 'https://example.com/init.mp4',
        uri: 'init.mp4',
        byterange: {
          length: 4,
          offset: 121
        }
      },
      resolvedUri: 'https://example.com/Rep1/100/002-12000.mp4',
      timeline: 1,
      uri: 'Rep1/100/002-12000.mp4'
    }
  ];

  assert.deepEqual(segmentsFromTemplate(attributes, void 0), segments,
    'creates segments from template');
});
