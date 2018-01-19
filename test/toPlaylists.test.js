import {
  toPlaylists
} from '../src/toPlaylists';
import errors from '../src/errors';
import QUnit from 'qunit';

QUnit.module('toPlaylists');

QUnit.test('no representations', function(assert) {
  assert.deepEqual(toPlaylists([]), []);
});

QUnit.test('pretty simple', function(assert) {
  const representations = [{
    attributes: { baseUrl: 'http://example.com/' },
    segmentInfo: {
      template: true
    }
  }];

  const playlists = [{
    attributes: { baseUrl: 'http://example.com/' },
    segments: [{
      uri: '',
      timeline: undefined,
      duration: undefined,
      resolvedUri: 'http://example.com/',
      map: {
        uri: '',
        resolvedUri: 'http://example.com/'
      }
    }]
  }];

  assert.deepEqual(toPlaylists(representations), playlists);
});

QUnit.test('segment base', function(assert) {
  const representations = [{
    attributes: {},
    segmentInfo: {
      base: true
    }
  }];

  assert.throws(() => toPlaylists(representations),
    new RegExp(errors.UNSUPPORTED_SEGMENTATION_TYPE));
});

QUnit.test('segment list', function(assert) {
  const representations = [{
    attributes: {},
    segmentInfo: {
      list: true
    }
  }];

  assert.throws(() => toPlaylists(representations),
    new RegExp(errors.UNSUPPORTED_SEGMENTATION_TYPE));
});
