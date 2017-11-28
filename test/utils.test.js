import { shallowMerge, getAttributes } from '../src/utils/object';
import { parseDuration } from '../src/utils/time';
import { flatten, range, from } from '../src/utils/list';
import document from 'global/document';
import QUnit from 'qunit';

QUnit.module('utils');

QUnit.module('shallowMerge');
QUnit.test('empty', function(assert) {
  assert.deepEqual(shallowMerge({}, { a: 1 }), { a: 1 });
  assert.deepEqual(shallowMerge({ a: 1 }, { a: 1 }), { a: 1 });
  assert.deepEqual(shallowMerge({ a: 1 }, {}), { a: 1 });
});

QUnit.test('append', function(assert) {
  assert.deepEqual(shallowMerge({ a: 1 }, { b: 3 }), { a: 1, b: 3 });
});

QUnit.test('overwrite', function(assert) {
  assert.deepEqual(shallowMerge({ a: 1 }, { a: 2 }), { a: 2 });
});

QUnit.test('empty', function(assert) {
  assert.deepEqual(shallowMerge({}, {}), {});
  assert.deepEqual(shallowMerge({}, 1), {});
  assert.deepEqual(shallowMerge(1, {}), {});
});

QUnit.module('flatten');
QUnit.test('empty', function(assert) {
  assert.deepEqual(flatten([]), []);
});

QUnit.test('one item', function(assert) {
  assert.deepEqual(flatten([[1]]), [1]);
});

QUnit.test('multiple items', function(assert) {
  assert.deepEqual(flatten([[1], [2], [3]]), [1, 2, 3]);
});

QUnit.test('multiple multiple items', function(assert) {
  assert.deepEqual(flatten([[1], [2, 3], [4]]), [1, 2, 3, 4]);
});

QUnit.test('nested nests', function(assert) {
  assert.deepEqual(flatten([[1], [[2]]]), [1, [2]]);
});

QUnit.test('not a list of lists', function(assert) {
  assert.deepEqual(flatten([1, 2]), [1, 2]);
  assert.deepEqual(flatten([[1], 2]), [1, 2]);
});

QUnit.module('getAttributes');
QUnit.test('simple', function(assert) {
  const el = document.createElement('el');

  el.setAttribute('foo', 1);

  assert.deepEqual(getAttributes(el), { foo: '1' });
});

QUnit.test('empty', function(assert) {
  const el = document.createElement('el');

  assert.deepEqual(getAttributes(el), {});
});

QUnit.module('parseDuration');
QUnit.test('full date', function(assert) {
  assert.deepEqual(parseDuration('P10Y10M10DT10H10M10.1S'), 342180610.1);
});

QUnit.test('time only', function(assert) {
  assert.deepEqual(parseDuration('PT10H10M10.1S'), 36610.1);
});

QUnit.test('empty', function(assert) {
  assert.deepEqual(parseDuration(''), 0);
});

QUnit.test('invalid', function(assert) {
  assert.deepEqual(parseDuration('foo'), 0);
});

QUnit.module('range');
QUnit.test('default start number of 0', function(assert) {
  assert.deepEqual(range(3), [0, 1, 2]);
});

QUnit.test('start number', function(assert) {
  assert.deepEqual(range(3, 1), [1, 2, 3]);
});

QUnit.test('count of 0', function(assert) {
  assert.deepEqual(range(0), []);
});

QUnit.test('negative count', function(assert) {
  assert.deepEqual(range(-1), []);
});

QUnit.module('from');
QUnit.test('simple array', function(assert) {
  assert.deepEqual(from([1]), [1]);
});

QUnit.test('empty array', function(assert) {
  assert.deepEqual(from([]), []);
});

QUnit.test('non-array', function(assert) {
  assert.deepEqual(from(1), []);
});

QUnit.test('array-like', function(assert) {
  var fixture = document.createElement('div');
  fixture.innerHTML = '<div></div><div></div>';

  assert.ok(from(fixture.getElementsByTagName('div')).map);
});
