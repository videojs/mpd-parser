import { parse, VERSION } from '../src';
import QUnit from 'qunit';

QUnit.dump.maxDepth = Infinity;

// manifests
import vttCodecsTemplate from './manifests/vtt_codecs.mpd';
import maatVttSegmentTemplate from './manifests/maat_vtt_segmentTemplate.mpd';
import segmentBaseTemplate from './manifests/segmentBase.mpd';
import segmentListTemplate from './manifests/segmentList.mpd';
import locationTemplate from './manifests/location.mpd';
import locationsTemplate from './manifests/locations.mpd';
import multiperiod from './manifests/multiperiod.mpd';
import multiperiodDynamic from './manifests/multiperiod-dynamic.mpd';
import {
  parsedManifest as maatVttSegmentTemplateManifest
} from './manifests/maat_vtt_segmentTemplate.js';
import {
  parsedManifest as segmentBaseManifest
} from './manifests/segmentBase.js';
import {
  parsedManifest as segmentListManifest
} from './manifests/segmentList.js';
import {
  parsedManifest as multiperiodManifest
} from './manifests/multiperiod.js';
import {
  parsedManifest as multiperiodDynamicManifest
} from './manifests/multiperiod-dynamic.js';
import {
  parsedManifest as locationManifest
} from './manifests/location.js';
import {
  parsedManifest as locationsManifest
} from './manifests/locations.js';

import {
  parsedManifest as vttCodecsManifest
} from './manifests/vtt_codecs.js';

QUnit.module('mpd-parser');

QUnit.test('has VERSION', function(assert) {
  assert.ok(VERSION);
});

QUnit.test('has parse', function(assert) {
  assert.ok(parse);
});

[{
  name: 'maat_vtt_segmentTemplate',
  input: maatVttSegmentTemplate,
  expected: maatVttSegmentTemplateManifest
}, {
  name: 'segmentBase',
  input: segmentBaseTemplate,
  expected: segmentBaseManifest
}, {
  name: 'segmentList',
  input: segmentListTemplate,
  expected: segmentListManifest
}, {
  name: 'multiperiod',
  input: multiperiod,
  expected: multiperiodManifest
}, {
  name: 'multiperiod_dynamic',
  input: multiperiodDynamic,
  expected: multiperiodDynamicManifest
}, {
  name: 'location',
  input: locationTemplate,
  expected: locationManifest
}, {
  name: 'locations',
  input: locationsTemplate,
  expected: locationsManifest
}, {
  name: 'vtt_codecs',
  input: vttCodecsTemplate,
  expected: vttCodecsManifest
}].forEach(({ name, input, expected }) => {
  QUnit.test(`${name} test manifest`, function(assert) {
    const actual = parse(input);

    assert.deepEqual(actual, expected);
  });
});
