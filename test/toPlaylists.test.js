import { toPlaylists } from '../src/toPlaylists';
import QUnit from 'qunit';

QUnit.module('toPlaylists');

QUnit.test('no representations', function(assert) {
  assert.deepEqual(toPlaylists([]), []);
});
