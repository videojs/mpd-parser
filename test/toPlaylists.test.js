import {
  toPlaylists,
  segmentsFromTemplate
} from '../src/toPlaylists';
import QUnit from 'qunit';

QUnit.module('toPlaylists');

QUnit.test('no representations', function(assert) {
  assert.deepEqual(toPlaylists([]), []);
});

QUnit.test('simple', function(assert) {
  const attributes = {
    startNumber: '0',
    duration: '2000',
    timescale: '1000',
    id: 'id',
    initialization: 'init.mp4',
    sourceDuration: 6,
    media: '$Number$.mp4',
    periodIndex: '',
    baseUrl: 'https://www.example.com/mpd/'
  };

  const segments = [{
    duration: 2,
    map: {
      resolvedUri: 'https://www.example.com/mpd/init.mp4',
      uri: 'init.mp4'
    },
    resolvedUri: 'https://www.example.com/mpd/0.mp4',
    timeline: '',
    uri: '0.mp4'
  }, {
    duration: 2,
    map: {
      resolvedUri: 'https://www.example.com/mpd/init.mp4',
      uri: 'init.mp4'
    },
    resolvedUri: 'https://www.example.com/mpd/1.mp4',
    timeline: '',
    uri: '1.mp4'
  }, {
    duration: 2,
    map: {
      resolvedUri: 'https://www.example.com/mpd/init.mp4',
      uri: 'init.mp4'
    },
    resolvedUri: 'https://www.example.com/mpd/2.mp4',
    timeline: '',
    uri: '2.mp4'
  }];

  assert.deepEqual(segmentsFromTemplate(attributes), segments);
});

QUnit.test('pretty simple', function(assert) {
  const representations = [{
    attributes: {},
    segmentType: {
      segmentTemplate: true
    }
  }];

  const playlists = [{
    attributes: {},
    segments: []
  }];

  assert.deepEqual(toPlaylists(representations), playlists);
});
