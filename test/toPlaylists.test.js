import { toPlaylists } from '../src/toPlaylists';
import QUnit from 'qunit';

QUnit.module('toM3u8');

QUnit.test('no representations', function(assert) {
  assert.deepEqual(toPlaylists([]), []);
});
