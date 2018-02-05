import {
  toPlaylists
} from '../src/toPlaylists';
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
    attributes: { baseUrl: 'http://example.com/' },
    segmentInfo: {
      base: true
    }
  }];

  const playlists = [{
    attributes: { baseUrl: 'http://example.com/' },
    segments: [{
      map: {
        resolvedUri: 'http://example.com/',
        uri: ''
      },
      resolvedUri: 'http://example.com/',
      uri: 'http://example.com/'
    }]
  }];

  assert.deepEqual(toPlaylists(representations), playlists);
});

QUnit.test('segment list', function(assert) {
  const representations = [{
    attributes: {
      baseUrl: 'http://example.com/',
      duration: 10,
      sourceDuration: 11
    },
    segmentInfo: {
      list: {
        segmentUrls: [{
          media: '1.fmp4'
        }, {
          media: '2.fmp4'
        }]
      }
    }
  }];

  const playlists = [{
    attributes: {
      baseUrl: 'http://example.com/',
      duration: 10,
      sourceDuration: 11
    },
    segments: [{
      duration: 10,
      map: {
        resolvedUri: 'http://example.com/',
        uri: ''
      },
      resolvedUri: 'http://example.com/1.fmp4',
      timeline: 0,
      uri: '1.fmp4'
    }, {
      duration: 1,
      map: {
        resolvedUri: 'http://example.com/',
        uri: ''
      },
      resolvedUri: 'http://example.com/2.fmp4',
      timeline: 0,
      uri: '2.fmp4'
    }]
  }];

  assert.deepEqual(toPlaylists(representations), playlists);
});
