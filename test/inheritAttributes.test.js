import { inheritAttributes } from '../src/inheritAttributes';
import { stringToMpdXml } from '../src/stringToMpdXml';
import errors from '../src/errors';
import QUnit from 'qunit';

QUnit.module('inheritAttributes');

QUnit.test('needs at least one Period', function(assert) {
  assert.throws(() => inheritAttributes(stringToMpdXml('<MPD></MPD>')),
    new RegExp(errors.INVALID_NUMBER_OF_PERIOD));
});

QUnit.test('end to end', function(assert) {
  const actual = inheritAttributes(stringToMpdXml(
    `
    <MPD mediaPresentationDuration="PT30S" >
      <BaseURL>https://www.example.com/base</BaseURL>
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
      baseUrl: 'https://www.example.com/base',
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
      url: '',
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
      baseUrl: 'https://www.example.com/base',
      id: 'en',
      lang: 'en',
      mediaPresentationDuration: 'PT30S',
      mimeType: 'text/vtt',
      periodIndex: 0,
      role: {},
      sourceDuration: 30,
      url: 'https://example.com/en.vtt'
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
