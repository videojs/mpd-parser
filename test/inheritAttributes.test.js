import {
  inheritAttributes,
  buildBaseUrls,
  getSegmentInformation
} from '../src/inheritAttributes';
import { stringToMpdXml } from '../src/stringToMpdXml';
import errors from '../src/errors';
import QUnit from 'qunit';
import { toPlaylists } from '../src/toPlaylists';

QUnit.module('buildBaseUrls');

QUnit.test('returns reference urls when no BaseURL nodes', function(assert) {
  const reference = ['https://example.com/', 'https://foo.com/'];

  assert.deepEqual(buildBaseUrls(reference, []), reference, 'returns reference urls');
});

QUnit.test('single reference url with single BaseURL node', function(assert) {
  const reference = ['https://example.com'];
  const node = [{ textContent: 'bar/' }];
  const expected = ['https://example.com/bar/'];

  assert.deepEqual(buildBaseUrls(reference, node), expected, 'builds base url');
});

QUnit.test('multiple reference urls with single BaseURL node', function(assert) {
  const reference = ['https://example.com/', 'https://foo.com/'];
  const node = [{ textContent: 'bar/' }];
  const expected = ['https://example.com/bar/', 'https://foo.com/bar/'];

  assert.deepEqual(buildBaseUrls(reference, node), expected,
    'base url for each reference url');
});

QUnit.test('multiple BaseURL nodes with single reference url', function(assert) {
  const reference = ['https://example.com/'];
  const nodes = [{ textContent: 'bar/' }, { textContent: 'baz/' }];
  const expected = ['https://example.com/bar/', 'https://example.com/baz/'];

  assert.deepEqual(buildBaseUrls(reference, nodes), expected, 'base url for each node');
});

QUnit.test('multiple reference urls with multiple BaseURL nodes', function(assert) {
  const reference = ['https://example.com/', 'https://foo.com/', 'http://example.com'];
  const nodes =
    [{ textContent: 'bar/' }, { textContent: 'baz/' }, { textContent: 'buzz/' }];
  const expected = [
    'https://example.com/bar/',
    'https://example.com/baz/',
    'https://example.com/buzz/',
    'https://foo.com/bar/',
    'https://foo.com/baz/',
    'https://foo.com/buzz/',
    'http://example.com/bar/',
    'http://example.com/baz/',
    'http://example.com/buzz/'
  ];

  assert.deepEqual(buildBaseUrls(reference, nodes), expected, 'creates all base urls');
});

QUnit.test('absolute BaseURL overwrites reference', function(assert) {
  const reference = ['https://example.com'];
  const node = [{ textContent: 'https://foo.com/bar/' }];
  const expected = ['https://foo.com/bar/'];

  assert.deepEqual(buildBaseUrls(reference, node), expected,
    'absolute url overwrites reference');
});

QUnit.module('getSegmentInformation');

QUnit.test('undefined Segment information when no Segment nodes', function(assert) {
  const adaptationSet = { childNodes: [] };
  const expected = {
    template: void 0,
    timeline: void 0,
    list: void 0,
    base: void 0
  };

  assert.deepEqual(getSegmentInformation(adaptationSet), expected,
    'undefined segment info');
});

QUnit.test('gets SegmentTemplate attributes', function(assert) {
  const adaptationSet = {
    childNodes: [{
      tagName: 'SegmentTemplate',
      attributes: [{ name: 'media', value: 'video.mp4' }],
      childNodes: []
    }]
  };
  const expected = {
    template: { media: 'video.mp4' },
    timeline: void 0,
    list: void 0,
    base: void 0
  };

  assert.deepEqual(getSegmentInformation(adaptationSet), expected,
    'SegmentTemplate info');
});

QUnit.test('gets SegmentList attributes', function(assert) {
  const adaptationSet = {
    childNodes: [{
      tagName: 'SegmentList',
      attributes: [{ name: 'duration', value: '10' }],
      childNodes: []
    }]
  };
  const expected = {
    template: void 0,
    timeline: void 0,
    list: {
      duration: '10',
      segmentUrls: [],
      initialization: {}
    },
    base: void 0
  };

  assert.deepEqual(getSegmentInformation(adaptationSet), expected,
    'SegmentList info');
});

QUnit.test('gets SegmentBase attributes', function(assert) {
  const adaptationSet = {
    childNodes: [{
      tagName: 'SegmentBase',
      attributes: [{ name: 'duration', value: '10' }],
      childNodes: []
    }]
  };
  const expected = {
    template: void 0,
    timeline: void 0,
    list: void 0,
    base: { duration: '10', initialization: {} }
  };

  assert.deepEqual(getSegmentInformation(adaptationSet), expected,
    'SegmentBase info');
});

QUnit.test('gets SegmentTemplate and SegmentTimeline attributes', function(assert) {
  const adaptationSet = {
    childNodes: [{
      tagName: 'SegmentTemplate',
      attributes: [{ name: 'media', value: 'video.mp4' }],
      childNodes: [{
        tagName: 'SegmentTimeline',
        childNodes: [{
          tagName: 'S',
          attributes: [{ name: 'd', value: '10' }]
        }, {
          tagName: 'S',
          attributes: [{ name: 'd', value: '5' }]
        }, {
          tagName: 'S',
          attributes: [{ name: 'd', value: '7' }]
        }]
      }]
    }]
  };
  const expected = {
    template: { media: 'video.mp4' },
    timeline: [{ d: '10' }, { d: '5' }, { d: '7' }],
    list: void 0,
    base: void 0
  };

  assert.deepEqual(getSegmentInformation(adaptationSet), expected,
    'SegmentTemplate and SegmentTimeline info');
});

QUnit.module('inheritAttributes');

QUnit.test('needs at least one Period', function(assert) {
  assert.throws(() => inheritAttributes(stringToMpdXml('<MPD></MPD>')),
    new RegExp(errors.INVALID_NUMBER_OF_PERIOD));
});

QUnit.test('end to end - basic', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <Period>
        <AdaptationSet mimeType="video/mp4" >
          <Role value="main"></Role>
          <SegmentTemplate></SegmentTemplate>
          <Representation
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <SegmentTemplate></SegmentTemplate>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <Representation bandwidth="256" id="en">
            <BaseURL>https://example.com/en.vtt</BaseURL>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
  ));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: {},
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 2);
  assert.deepEqual(actual, expected);
});

QUnit.test('end to end - inherits BaseURL from all levels', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <Period>
        <BaseURL>foo/</BaseURL>
        <AdaptationSet mimeType="video/mp4" >
          <BaseURL>bar/</BaseURL>
          <Role value="main"></Role>
          <SegmentTemplate></SegmentTemplate>
          <Representation
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <BaseURL>buzz/</BaseURL>
            <SegmentTemplate></SegmentTemplate>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <Representation bandwidth="256" id="en">
            <BaseURL>https://example.com/en.vtt</BaseURL>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
  ));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/foo/bar/buzz/',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: {},
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 2);
  assert.deepEqual(actual, expected);
});

QUnit.test('end to end - alternate BaseURLs', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <BaseURL>https://www.test.com/base/</BaseURL>
      <Period>
        <AdaptationSet mimeType="video/mp4" >
          <BaseURL>segments/</BaseURL>
          <BaseURL>media/</BaseURL>
          <Role value="main"></Role>
          <SegmentTemplate></SegmentTemplate>
          <Representation
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <SegmentTemplate></SegmentTemplate>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <Representation bandwidth="256" id="en">
            <BaseURL>https://example.com/en.vtt</BaseURL>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
  ));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/segments/',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: {},
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/media/',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: {},
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.test.com/base/segments/',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: {},
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.test.com/base/media/',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: {},
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 6);
  assert.deepEqual(actual, expected);
});

QUnit.test(' End to End test for representation', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <Period>
        <AdaptationSet mimeType="video/mp4" >
          <Role value="main"></Role>
          <SegmentBase indexRangeExact="true" indexRange="820-2087">
              <Initialization range="0-987"/>
          </SegmentBase>

          <Representation
            mimeType="video/mp6"
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <SegmentBase>
              <Initialization range="0-567"/>
            </SegmentBase>
          </Representation>
          <Representation
            height="545">
            <SegmentBase></SegmentBase>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <SegmentTemplate></SegmentTemplate>
          <Representation bandwidth="256" id="en">
            <BaseURL>https://example.com/en.vtt</BaseURL>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
  ));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp6',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: {
        indexRange: '820-2087',
        indexRangeExact: 'true',
        initialization: {
          range: '0-567'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      baseUrl: 'https://www.example.com/base/',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      height: '545',
      role: {
        value: 'main'
      },
      sourceDuration: 30
    },
    segmentInfo: {
      base: {
        indexRange: '820-2087',
        indexRangeExact: 'true',
        initialization: {
          range: '0-987'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 3);
  assert.deepEqual(actual, expected);
});

// Testing for support of segment tags in period element

QUnit.test(' End to End test for period', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <Period duration="PT0H4M40.414S">
        <SegmentBase indexRangeExact="false" indexRange="9999">
           <Initialization range="0-1111"/>
        </SegmentBase>
        <AdaptationSet mimeType="video/mp4" >
          <Role value="main"></Role>
          <SegmentBase indexRangeExact="true">
          </SegmentBase>
          <Representation
            mimeType="video/mp6"
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <SegmentBase>
            </SegmentBase>
          </Representation>
          <Representation
            height="545">
            <SegmentBase indexRangeExact="false">
            </SegmentBase>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <SegmentTemplate></SegmentTemplate>
          <Representation bandwidth="256" id="en">
            <BaseURL>https://example.com/en.vtt</BaseURL>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
  ));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/',
      duration: 'PT0H4M40.414S',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp6',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: {
        indexRange: '9999',
        indexRangeExact: 'true',
        initialization: {
          range: '0-1111'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      baseUrl: 'https://www.example.com/base/',
      mediaPresentationDuration: 'PT30S',
      duration: 'PT0H4M40.414S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      height: '545',
      role: {
        value: 'main'
      },
      sourceDuration: 30
    },
    segmentInfo: {
      base: {
        indexRange: '9999',
        indexRangeExact: 'false',
        initialization: {
          range: '0-1111'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      duration: 'PT0H4M40.414S',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 3);
  assert.deepEqual(actual, expected);
});

// Test for only periodAdaptationSetInfo

QUnit.test(' End to End test for returning period info', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <Period duration="PT0H4M40.414S">
        <SegmentBase indexRangeExact="false" indexRange="9999">
           <Initialization range="0-1111"/>
        </SegmentBase>
        <AdaptationSet mimeType="video/mp4" >
          <Role value="main"></Role>
          <SegmentBase indexRangeExact="true">
          </SegmentBase>
          <Representation
            mimeType="video/mp6"
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <SegmentBase>
            </SegmentBase>
          </Representation>
          <Representation
            height="545">
            <SegmentBase indexRangeExact="false">
            </SegmentBase>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <SegmentBase></SegmentBase>
          <Representation bandwidth="256" id="en">
            <BaseURL>https://example.com/en.vtt</BaseURL>
            <SegmentBase></SegmentBase>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
  ));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/',
      duration: 'PT0H4M40.414S',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp6',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: {
        indexRange: '9999',
        indexRangeExact: 'true',
        initialization: {
          range: '0-1111'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      baseUrl: 'https://www.example.com/base/',
      mediaPresentationDuration: 'PT30S',
      duration: 'PT0H4M40.414S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      height: '545',
      role: {
        value: 'main'
      },
      sourceDuration: 30
    },
    segmentInfo: {
      base: {
        indexRange: '9999',
        indexRangeExact: 'false',
        initialization: {
          range: '0-1111'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      duration: 'PT0H4M40.414S',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: {
        indexRange: '9999',
        indexRangeExact: 'false',
        initialization: {
          range: '0-1111'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 3);
  assert.deepEqual(actual, expected);
});

// testing for returning adaptation set information

QUnit.test(' End to End test for returning adaptation set info', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <Period duration="PT0H4M40.414S">
        <AdaptationSet mimeType="video/mp4" >
          <Role value="main"></Role>
          <SegmentBase indexRange="1212" indexRangeExact="true">
           <Initialization range="0-8888" />
          </SegmentBase>
          <Representation
            mimeType="video/mp6"
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <SegmentBase></SegmentBase>
          </Representation>
          <Representation
            height="545">
            <SegmentBase indexRangeExact="false">
            </SegmentBase>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <Representation bandwidth="256" id="en">
            <BaseURL>https://example.com/en.vtt</BaseURL>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
  ));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/',
      duration: 'PT0H4M40.414S',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp6',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: {
        indexRange: '1212',
        indexRangeExact: 'true',
        initialization: {
          range: '0-8888'

        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      baseUrl: 'https://www.example.com/base/',
      mediaPresentationDuration: 'PT30S',
      duration: 'PT0H4M40.414S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      height: '545',
      role: {
        value: 'main'
      },
      sourceDuration: 30
    },
    segmentInfo: {
      base: {
        indexRange: '1212',
        indexRangeExact: 'false',
        initialization: {
          range: '0-8888'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      duration: 'PT0H4M40.414S',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 3);
  assert.deepEqual(actual, expected);
});

// Atmost one segment at each levels

QUnit.only(' Test for checking atmost one segment at each level', function(assert) {
  const actual = toPlaylists(inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base/</BaseURL>
      <Period duration="PT0H4M40.414S">
        <AdaptationSet mimeType="video/mp4" >
          <Role value="main"></Role>
          <SegmentTemplate duration="95232" initialization="$RepresentationID$/es/init.m4f" media="$RepresentationID$/es/$Number$.m4f" startNumber="0" timescale="48000">
          </SegmentTemplate>
          <SegmentList timescale="90000">
            <RepresentationIndex sourceURL="representation-index-high"/>
            <SegmentTimeline>
              <S t="0" r="9" d="5400000"/>
            </SegmentTimeline>
            <SegmentURL media="high/segment-1.ts"/>
            <SegmentURL media="high/segment-2.ts"/>
            <SegmentURL media="high/segment-3.ts"/>
            <SegmentURL media="high/segment-4.ts"/>
            <SegmentURL media="high/segment-5.ts"/>
            <SegmentURL media="high/segment-6.ts"/>
            <SegmentURL media="high/segment-7.ts"/>
            <SegmentURL media="high/segment-8.ts"/>
            <SegmentURL media="high/segment-9.ts"/>
            <SegmentURL media="high/segment-10.ts"/>
          </SegmentList>
          <Representation
            mimeType="video/mp6"
            bandwidth="5000000"
            codecs="avc1.64001e"
            height="404"
            id="test"
            width="720">
            <SegmentBase></SegmentBase>
          </Representation>
          <Representation
            height="545">
            <SegmentBase></SegmentBase>
          </Representation>
        </AdaptationSet>
        <AdaptationSet mimeType="text/vtt" lang="en">
          <Representation bandwidth="256" id="en">
            <SegmentBase></SegmentBase>
          </Representation>
        </AdaptationSet>
      </Period>
    </MPD>
  `
 )));

  const expected = [{
    attributes: {
      bandwidth: '5000000',
      baseUrl: 'https://www.example.com/base/',
      duration: 'PT0H4M40.414S',
      codecs: 'avc1.64001e',
      height: '404',
      id: 'test',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'video/mp6',
      periodIndex: 0,
      role: {
        value: 'main'
      },
      sourceDuration: 30,
      width: '720'
    },
    segmentInfo: {
      base: {
        indexRange: '1212',
        indexRangeExact: 'true',
        initialization: {
          range: '0-8888'

        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      baseUrl: 'https://www.example.com/base/',
      mediaPresentationDuration: 'PT30S',
      duration: 'PT0H4M40.414S',
      mimeType: 'video/mp4',
      periodIndex: 0,
      height: '545',
      role: {
        value: 'main'
      },
      sourceDuration: 30
    },
    segmentInfo: {
      base: {
        indexRange: '1212',
        indexRangeExact: 'false',
        initialization: {
          range: '0-8888'
        }
      },
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }, {
    attributes: {
      bandwidth: '256',
      baseUrl: 'https://example.com/en.vtt',
      duration: 'PT0H4M40.414S',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30
    },
    segmentInfo: {
      base: undefined,
      list: undefined,
      template: undefined,
      timeline: undefined
    }
  }];

  assert.equal(actual.length, 3);
  assert.deepEqual(actual, expected);
});
