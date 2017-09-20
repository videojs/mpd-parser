import { toM3u8 } from '../src/toM3u8';
import QUnit from 'qunit';

QUnit.module('toM3u8');

QUnit.test('playlists', function(assert) {
  const input = [{
    attributes: {
      sourceDuration: 100,
      id: '1',
      width: '800',
      height: '600',
      codecs: 'foo;bar',
      bandwidth: '10000',
      periodIndex: 1,
      mimeType: 'video/mp4'
    },
    segments: []
  }];

  const expected = {
    allowCache: true,
    discontinuityStarts: [],
    segments: [],
    mediaGroups: {
      AUDIO: {
        main: {
          default: {
            default: true,
            playlists: []
          }
        }
      },
      VIDEO: {},
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {
        playlists: []
      }
    },
    uri: '',
    duration: 100,
    playlists: [{
      attributes: {
        BANDWIDTH: 10000,
        CODECS: 'foo;bar',
        NAME: '1',
        ['PROGRAM-ID']: 1,
        RESOLUTION: {
          height: 600,
          width: 800
        }
      },
      resolvedUri: '',
      segments: [],
      timeline: 1,
      uri: ''
    }]
  };

  assert.deepEqual(toM3u8(input), expected);
});

QUnit.test('no playlists', function(assert) {
  assert.deepEqual(toM3u8([]), {});
});
