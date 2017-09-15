import { parse, VERSION } from '../src';
import QUnit from 'qunit';

// manifests
import bbc from './manifests/bbc.mpd';
import { parsedManifest as bbcManifest } from './manifests/bbc.js';
import bbb from './manifests/bbc.mpd';
import { parsedManifest as bbbManifest } from './manifests/bbc.js';
import maatVttSegmentTemplate from './manifests/maat_vtt_segmentTemplate.mpd';
import { parsedManifest as maatVttSegmentTemplateManifest } from './manifests/maat_vtt_segmentTemplate.js';

QUnit.module('mpd-parser');

QUnit.test('has VERSION', function(assert) {
  assert.ok(VERSION);
});

QUnit.test('has parse', function(assert) {
  assert.ok(parse);
});

[{
  name: 'bbb',
  input: bbb,
  expected: bbbManifest
}, {
  name: 'bbc',
  input: bbc,
  expected: bbcManifest
}, {
  name: 'maat_vtt_segmentTemplate',
  input: maatVttSegmentTemplate,
  expected: maatVttSegmentTemplateManifest
}].forEach(({ name, input, expected }) => {
  QUnit.test(`${name} test manifest`, function(assert) {
    assert.deepEqual(parse(input), expected);
  });
});
