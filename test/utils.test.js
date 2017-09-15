import { shallowMerge, getAttributes } from '../src/utils/object';
import { parseDuration } from '../src/utils/time';
import { flatten, range } from '../src/utils/list';
import document from 'global/document';
import QUnit from 'qunit';

QUnit.module('utils');

QUnit.module('shallowMerge');
QUnit.test('append', function(assert) {
  assert.deepEqual(shallowMerge({ a: 1 }, { b: 3}), { a: 1, b: 3 });
});

QUnit.test('overwrite', function(assert) {
  assert.deepEqual(shallowMerge({ a: 1 }, { a: 2 }), { a: 2 });
});

QUnit.module('flatten');
QUnit.test('', function(assert) {
  assert.deepEqual(flatten([[1], [2]]), [1, 2]);
});

QUnit.module('getAttributes');
QUnit.test('', function(assert) {
  const el = document.createElement('el');

  el.setAttribute('foo', 1);

  assert.deepEqual(getAttributes(el), { foo: '1' });
});

QUnit.module('parseDuration');
QUnit.test('', function(assert) {
  assert.deepEqual(parseDuration('P10Y10M10DT10H10M10.1S'), 342180610.1);
});

QUnit.module('range');
QUnit.test('default start number of 0', function(assert) {
  assert.deepEqual(range(3), [0, 1, 2]);
});

QUnit.test('start number', function(assert) {
  assert.deepEqual(range(3, 1), [1, 2, 3]);
});
