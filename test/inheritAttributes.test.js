import { inheritAttributes } from '../src/inheritAttributes';
import { stringToMpdXml } from '../src/stringToMpdXml';
import QUnit from 'qunit';

QUnit.module('inheritAttributes');

QUnit.test('needs at least one Period', function(assert) {
  assert.throws(() => inheritAttributes(stringToMpdXml('<MPD></MPD>')));
});
