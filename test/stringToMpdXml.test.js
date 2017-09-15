import { stringToMpdXml } from '../src/stringToMpdXml';
import document from 'global/document';
import QUnit from 'qunit';

QUnit.module('stringToMpdXml');

QUnit.test('simple mpd', function(assert) {
  assert.deepEqual(stringToMpdXml('<MPD></MPD>'), '__TODO__');
});

QUnit.test('invalid xml', function(assert) {
  assert.throws(() => stringToMpdXml('<test'));
});

QUnit.test('invalid manifest', function(assert) {
  assert.throws(() => stringToMpdXml('<test>'));
});

QUnit.test('empty manifest', function(assert) {
  assert.throws(() => stringToMpdXml(''));
});
