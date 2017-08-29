import { parse, VERSION } from '../src';
import QUnit from 'qunit';

// manifests
import bbc from './manifests/bbc_test.mpd';
import { parsedManifest } from './manifests/bbc_test.js';

QUnit.module('mpd-parser');

QUnit.test('has VERSION', function(assert) {
  assert.ok(VERSION);
});

QUnit.test('has parse', function(assert) {
  assert.ok(parse);
});

QUnit.module('parse');

QUnit.test('invalid xml', function(assert) {
  assert.throws(() => parse('<test'));
});

QUnit.test('invalid manifest', function(assert) {
  assert.throws(() => parse('<test>'));
});

QUnit.test('empty manifest', function(assert) {
  assert.throws(() => parse(''));
});

QUnit.test('bbc test manifest', function(assert) {
  assert.deepEqual(parse(bbc), parsedManifest);
});
