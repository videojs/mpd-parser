import { toM3u8 } from '../src/toM3u8';
import QUnit from 'qunit';

QUnit.module('toM3u8');

QUnit.test('no playlists', function(assert) {
  assert.deepEqual(toM3u8([]), {});
});
