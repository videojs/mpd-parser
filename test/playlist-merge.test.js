import {
  findPlaylistWithName,
  findMediaGroupPlaylistWithName,
  getRemovedPlaylists,
  getRemovedMediaGroupPlaylists,
  getIncompletePlaylists,
  getMediaGroupPlaylists,
  getMediaGroupPlaylistIdentificationObjects,
  repositionSegmentsOnTimeline,
  positionPlaylistOnTimeline,
  positionPlaylistsOnTimeline,
  positionMediaGroupPlaylistsOnTimeline,
  removeMediaGroupPlaylists,
  positionManifestOnTimeline
} from '../src/playlist-merge';
import QUnit from 'qunit';

QUnit.module('findPlaylistWithName');

QUnit.test('returns nothing when no playlists', function(assert) {
  assert.notOk(findPlaylistWithName([], 'A'), 'nothing when no playlists');
});

QUnit.test('returns nothing when no match', function(assert) {
  const playlists = [
    { attributes: { NAME: 'B' } }
  ];

  assert.notOk(findPlaylistWithName(playlists, 'A'), 'nothing when no match');
});

QUnit.test('returns matching playlist', function(assert) {
  const playlists = [
    { attributes: { NAME: 'A' } },
    { attributes: { NAME: 'B' } },
    { attributes: { NAME: 'C' } }
  ];

  assert.deepEqual(
    findPlaylistWithName(playlists, 'B'),
    playlists[1],
    'returns matching playlist'
  );
});

QUnit.module('findMediaGroupPlaylistWithName');

QUnit.test('returns nothing when no media group playlists', function(assert) {
  const manifest = { mediaGroups: { AUDIO: {} } };

  assert.notOk(
    findMediaGroupPlaylistWithName({
      playlistName: 'A',
      type: 'AUDIO',
      group: 'audio',
      label: 'en',
      manifest
    }),
    'returns nothing when no media group playlists'
  );
});

QUnit.test('returns nothing when no match', function(assert) {
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [ { attributes: { NAME: 'B' } } ]
          }
        }
      }
    }
  };

  assert.notOk(
    findMediaGroupPlaylistWithName({
      playlistName: 'A',
      type: 'AUDIO',
      group: 'audio',
      label: 'en',
      manifest
    }),
    'returns nothing when no media group playlists'
  );
});

QUnit.test('returns matching playlist', function(assert) {
  const playlistB = { attributes: { NAME: 'B' } };
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [
              { attributes: { NAME: 'A' } },
              { attributes: { NAME: 'B' } },
              { attributes: { NAME: 'C' } }
            ]
          },
          fr: {
            playlists: [
              { attributes: { NAME: 'A' } },
              playlistB,
              { attributes: { NAME: 'C' } }
            ]
          }
        }
      }
    }
  };

  assert.deepEqual(
    findMediaGroupPlaylistWithName({
      playlistName: 'B',
      type: 'AUDIO',
      group: 'audio',
      label: 'fr',
      manifest
    }),
    playlistB,
    'returns matching playlist'
  );
});

QUnit.module('getRemovedPlaylists');

QUnit.test('returns nothing when no old playlists', function(assert) {
  const newPlaylistA = { attributes: { NAME: 'A' } };
  const newPlaylistB = { attributes: { NAME: 'B' } };
  const newPlaylists = [newPlaylistA, newPlaylistB];

  assert.deepEqual(
    getRemovedPlaylists({ oldPlaylists: [], newPlaylists }),
    [],
    'nothing when no old playlists'
  );
});

QUnit.test('returns nothing when all playlists are available', function(assert) {
  const oldPlaylistA = { attributes: { NAME: 'A' } };
  const oldPlaylistB = { attributes: { NAME: 'B' } };
  const newPlaylistA = { attributes: { NAME: 'A' } };
  const newPlaylistB = { attributes: { NAME: 'B' } };
  const oldPlaylists = [oldPlaylistA, oldPlaylistB];
  const newPlaylists = [newPlaylistA, newPlaylistB];

  assert.deepEqual(
    getRemovedPlaylists({ oldPlaylists, newPlaylists }),
    [],
    'nothing when all playlists are available'
  );
});

QUnit.test('returns old playlists not available in new playlists', function(assert) {
  const oldPlaylistA = { attributes: { NAME: 'A' } };
  const oldPlaylistB = { attributes: { NAME: 'B' } };
  const oldPlaylistC = { attributes: { NAME: 'C' } };
  const oldPlaylistD = { attributes: { NAME: 'D' } };
  const newPlaylistA = { attributes: { NAME: 'A' } };
  const newPlaylistC = { attributes: { NAME: 'C' } };
  const oldPlaylists = [oldPlaylistA, oldPlaylistB, oldPlaylistC, oldPlaylistD];
  const newPlaylists = [newPlaylistA, newPlaylistC];

  assert.deepEqual(
    getRemovedPlaylists({ oldPlaylists, newPlaylists }),
    [oldPlaylistB, oldPlaylistD],
    'returned old playlists not available in new playlists'
  );
});

QUnit.module('getRemovedMediaGroupPlaylists');

QUnit.test('returns nothing when no old media group playlists', function(assert) {
  const playlistA = { attributes: { NAME: 'A' } };
  const playlistB = { attributes: { NAME: 'B' } };
  const oldManifest = { mediaGroups: { AUDIO: {} } };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [playlistA]
          },
          fr: {
            playlists: [playlistB]
          }
        }
      }
    }
  };

  assert.deepEqual(
    getRemovedMediaGroupPlaylists({ oldManifest, newManifest }),
    [],
    'nothing when no old playlists'
  );
});

QUnit.test('returns nothing when all media group playlists are available', function(assert) {
  const oldPlaylistA = { attributes: { NAME: 'A' } };
  const oldPlaylistB = { attributes: { NAME: 'B' } };
  const newPlaylistA = { attributes: { NAME: 'A' } };
  const newPlaylistB = { attributes: { NAME: 'B' } };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [oldPlaylistA]
          },
          fr: {
            playlists: [oldPlaylistB]
          }
        }
      }
    }
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [newPlaylistA]
          },
          fr: {
            playlists: [newPlaylistB]
          }
        }
      }
    }
  };

  assert.deepEqual(
    getRemovedMediaGroupPlaylists({ oldManifest, newManifest }),
    [],
    'nothing when all playlists are available'
  );
});

QUnit.test('returns old media group playlists not available in new media group playlists', function(assert) {
  const oldPlaylistA = { attributes: { NAME: 'A' } };
  const oldPlaylistB = { attributes: { NAME: 'B' } };
  const oldPlaylistC = { attributes: { NAME: 'C' } };
  const oldPlaylistD = { attributes: { NAME: 'D' } };
  const newPlaylistA = { attributes: { NAME: 'A' } };
  const newPlaylistC = { attributes: { NAME: 'C' } };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [oldPlaylistA, oldPlaylistB]
          },
          fr: {
            playlists: [oldPlaylistC, oldPlaylistD]
          }
        }
      }
    }
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [newPlaylistA]
          },
          fr: {
            playlists: [newPlaylistC]
          }
        }
      }
    }
  };

  assert.deepEqual(
    getRemovedMediaGroupPlaylists({ oldManifest, newManifest }),
    [{
      type: 'AUDIO',
      group: 'audio',
      label: 'en',
      playlist: oldPlaylistB
    }, {
      type: 'AUDIO',
      group: 'audio',
      label: 'fr',
      playlist: oldPlaylistD
    }],
    'returned old playlists not available in new playlists'
  );
});

QUnit.module('getIncompletePlaylists');

QUnit.test('returns nothing when no playlists', function(assert) {
  assert.deepEqual(getIncompletePlaylists([]), [], 'nothing when no playlists');
});

QUnit.test('returns nothing when no incomplete playlists', function(assert) {
  const playlistA = {
    attributes: { NAME: 'A' },
    segments: [{ timeline: 0 }, { timeline: 1 }, { timeline: 2 }]
  };
  const playlistB = {
    attributes: { NAME: 'B' },
    segments: [{ timeline: 0 }, { timeline: 1 }, { timeline: 2 }]
  };
  const playlistC = {
    attributes: { NAME: 'C' },
    segments: [{ timeline: 0 }, { timeline: 1 }, { timeline: 2 }]
  };

  assert.deepEqual(
    getIncompletePlaylists([playlistA, playlistB, playlistC]),
    [],
    'nothing when no incomplete playlists'
  );
});

QUnit.test('returns playlists that don\'t account for all timelines', function(assert) {
  const playlistA = {
    attributes: { NAME: 'A' },
    segments: [{ timeline: 0 }, { timeline: 1 }]
  };
  const playlistB = {
    attributes: { NAME: 'B' },
    segments: [{ timeline: 0 }, { timeline: 1 }, { timeline: 2 }]
  };
  const playlistC = {
    attributes: { NAME: 'C' },
    segments: [{ timeline: 0 }, { timeline: 1 }, { timeline: 2 }]
  };
  const playlistD = {
    attributes: { NAME: 'D' },
    segments: [{ timeline: 0 }, { timeline: 1 }]
  };

  assert.deepEqual(
    getIncompletePlaylists([playlistA, playlistB, playlistC, playlistD]),
    [playlistA, playlistD],
    'returns incomplete playlists'
  );
});

QUnit.module('getMediaGroupPlaylists');

QUnit.test('returns nothing when no media group playlists', function(assert) {
  const manifest = {
    mediaGroups: {
      AUDIO: {}
    }
  };

  assert.deepEqual(
    getMediaGroupPlaylists(manifest),
    [],
    'nothing when no media group playlists'
  );
});

QUnit.test('returns media group playlists', function(assert) {
  const playlistEnA = { attributes: { NAME: 'A' } };
  const playlistEnB = { attributes: { NAME: 'B' } };
  const playlistEnC = { attributes: { NAME: 'C' } };
  const playlistFrA = { attributes: { NAME: 'A' } };
  const playlistFrB = { attributes: { NAME: 'B' } };
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [playlistEnA, playlistEnB, playlistEnC]
          },
          fr: {
            playlists: [playlistFrA, playlistFrB]
          }
        }
      }
    }
  };

  assert.deepEqual(
    getMediaGroupPlaylists(manifest),
    [playlistEnA, playlistEnB, playlistEnC, playlistFrA, playlistFrB],
    'returns media group playlists'
  );
});

QUnit.module('getMediaGroupPlaylistIdentificationObjects');

QUnit.test('returns nothing when no playlists', function(assert) {
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [{ attributes: { NAME: 'A' } }]
          },
          fr: {
            playlists: [{ attributes: { NAME: 'A' } }]
          }
        }
      }
    }
  };

  assert.deepEqual(
    getMediaGroupPlaylistIdentificationObjects({ playlists: [], manifest }),
    [],
    'nothing when no playlists passed in'
  );
});

QUnit.test('returns ID objects for passed playlists', function(assert) {
  const playlistEnA = { attributes: { NAME: 'A' } };
  const playlistEnB = { attributes: { NAME: 'B' } };
  const playlistEnC = { attributes: { NAME: 'C' } };
  const playlistFrA = { attributes: { NAME: 'A' } };
  const playlistFrB = { attributes: { NAME: 'B' } };
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [playlistEnA, playlistEnB, playlistEnC]
          },
          fr: {
            playlists: [playlistFrA, playlistFrB]
          }
        }
      }
    }
  };

  assert.deepEqual(
    getMediaGroupPlaylistIdentificationObjects({
      playlists: [playlistEnB, playlistFrA],
      manifest
    }),
    [{
      type: 'AUDIO',
      group: 'audio',
      label: 'en',
      playlist: playlistEnB
    }, {
      type: 'AUDIO',
      group: 'audio',
      label: 'fr',
      playlist: playlistFrA
    }],
    'returns ID objects for passed playlists'
  );
});

QUnit.module('repositionSegmentsOnTimeline');

QUnit.test('updates segment timelines and mediaSequence numbers', function(assert) {
  const segments = [{
    // first segment discontinuity case, discontinuity should not increment timelineStart
    discontinuity: true,
    number: 0,
    timeline: 0
  }, {
    number: 1,
    timeline: 0
  }, {
    discontinuity: true,
    number: 2,
    timeline: 1
  }, {
    number: 3,
    timeline: 1
  }];

  repositionSegmentsOnTimeline({ segments, mediaSequenceStart: 11, timelineStart: 21 });

  assert.deepEqual(
    segments,
    [
      {
        discontinuity: true,
        number: 11,
        timeline: 21
      },
      {
        number: 12,
        timeline: 21
      },
      {
        discontinuity: true,
        number: 13,
        timeline: 22
      },
      {
        number: 14,
        timeline: 22
      }
    ],
    'updated segment timelines and mediaSequence numbers'
  );
});

QUnit.module('positionPlaylistOnTimeline');

QUnit.test('correctly positions when no old segments', function(assert) {
  const oldPlaylist = {
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 2,
    segments: []
  };
  const newPlaylist = {
    // newly parsed playlists will appear as if starting from 0
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0
    }, {
      number: 1,
      timeline: 0
    }, {
      discontinuity: true,
      number: 2,
      timeline: 1
    }, {
      number: 3,
      timeline: 1
    }]
  };

  positionPlaylistOnTimeline(oldPlaylist, newPlaylist);

  assert.deepEqual(
    newPlaylist,
    {
      mediaSequence: 10,
      discontinuitySequence: 2,
      // timeline jumped because first segment discontinuity added
      timeline: 3,
      // discontinuityStarts added
      discontinuityStarts: [0, 2],
      segments: [{
        // discontinuity is added
        discontinuity: true,
        number: 10,
        timeline: 3
      }, {
        number: 11,
        timeline: 3
      }, {
        discontinuity: true,
        number: 12,
        timeline: 4
      }, {
        number: 13,
        timeline: 4
      }]
    },
    'correctly positioned new playlist when no old segments'
  );
});

QUnit.test('correctly positions when no new segments', function(assert) {
  const oldPlaylist = {
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [0, 2],
    segments: [{
      discontinuity: true,
      number: 10,
      timeline: 3
    }, {
      number: 11,
      timeline: 3
    }, {
      discontinuity: true,
      number: 12,
      timeline: 4
    }, {
      number: 13,
      timeline: 4
    }]
  };
  const newPlaylist = {
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };

  positionPlaylistOnTimeline(oldPlaylist, newPlaylist);

  assert.deepEqual(
    newPlaylist,
    {
      // last segment + 1
      mediaSequence: 14,
      // account for two removed discontinuities
      discontinuitySequence: 4,
      // when segments are added the timeline will jump, but stick with the last seen
      // timeline
      timeline: 4,
      // discontinuityStarts added
      discontinuityStarts: [],
      segments: []
    },
    'correctly positioned new playlist when no new segments'
  );
});

QUnit.test('correctly positions when no old or new segments', function(assert) {
  const oldPlaylist = {
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: []
  };
  const newPlaylist = {
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };

  positionPlaylistOnTimeline(oldPlaylist, newPlaylist);

  assert.deepEqual(
    newPlaylist,
    {
      mediaSequence: 10,
      discontinuitySequence: 2,
      timeline: 3,
      // discontinuityStarts added
      discontinuityStarts: [],
      segments: []
    },
    'correctly positioned new playlist when no old or new segments'
  );
});

QUnit.test('correctly positions for complete refresh', function(assert) {
  const oldPlaylist = {
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [0, 2],
    segments: [{
      discontinuity: true,
      number: 10,
      timeline: 3,
      presentationTime: 100
    }, {
      number: 11,
      timeline: 3,
      presentationTime: 102
    }, {
      discontinuity: true,
      number: 12,
      timeline: 4,
      presentationTime: 104
    }, {
      number: 13,
      timeline: 4,
      presentationTime: 106
    }]
  };
  const newPlaylist = {
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0,
      // This doesn't match any old segments and represents a gap of 2 seconds (the
      // segment with presentationTime of 108 was missed). This helps test that the gap is
      // ignored and this segment continues on as if it were the next to be played in the
      // stream.
      presentationTime: 110
    }, {
      number: 1,
      timeline: 0,
      presentationTime: 112
    }, {
      discontinuity: true,
      number: 2,
      timeline: 1,
      presentationTime: 114
    }]
  };

  positionPlaylistOnTimeline(oldPlaylist, newPlaylist);

  assert.deepEqual(
    newPlaylist,
    {
      // last segment + 1
      mediaSequence: 14,
      // account for two removed discontinuities
      discontinuitySequence: 4,
      // increase the last seen timeline by one since these new segments are considered
      // discontinuous with the prior ones
      timeline: 5,
      // discontinuityStarts added
      discontinuityStarts: [0, 2],
      segments: [{
        discontinuity: true,
        number: 14,
        timeline: 5,
        presentationTime: 110
      }, {
        number: 15,
        timeline: 5,
        presentationTime: 112
      }, {
        discontinuity: true,
        number: 16,
        timeline: 6,
        presentationTime: 114
      }]
    },
    'correctly positioned new playlist when manifest completely refreshed'
  );
});

QUnit.test('correctly positions when matching segment', function(assert) {
  const oldPlaylist = {
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [0, 2],
    segments: [{
      discontinuity: true,
      number: 10,
      timeline: 3,
      presentationTime: 100
    }, {
      number: 11,
      timeline: 3,
      presentationTime: 102
    }, {
      number: 12,
      timeline: 4,
      presentationTime: 104
    }, {
      number: 13,
      timeline: 4,
      presentationTime: 106
    }]
  };
  const newPlaylist = {
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0,
      // matches second to last segment
      presentationTime: 104
    }, {
      number: 1,
      timeline: 0,
      presentationTime: 106
    }, {
      discontinuity: true,
      number: 2,
      timeline: 1,
      presentationTime: 108
    }]
  };

  positionPlaylistOnTimeline(oldPlaylist, newPlaylist);

  assert.deepEqual(
    newPlaylist,
    {
      // matching segment's media sequence
      mediaSequence: 12,
      // account for one removed discontinuity
      discontinuitySequence: 3,
      // matching segment's timeline
      timeline: 4,
      discontinuityStarts: [2],
      segments: [{
        number: 12,
        timeline: 4,
        presentationTime: 104
      }, {
        number: 13,
        timeline: 4,
        presentationTime: 106
      }, {
        discontinuity: true,
        number: 14,
        timeline: 5,
        presentationTime: 108
      }]
    },
    'correctly positioned new playlist by segment match'
  );
});

QUnit.test('handles matching segment with removed segments from end', function(assert) {
  const oldPlaylist = {
    mediaSequence: 12,
    discontinuitySequence: 3,
    timeline: 4,
    discontinuityStarts: [],
    segments: [{
      number: 12,
      timeline: 4,
      presentationTime: 104
    }, {
      number: 13,
      timeline: 4,
      presentationTime: 106
    }, {
      number: 14,
      timeline: 4,
      presentationTime: 108
    }, {
      number: 15,
      timeline: 4,
      presentationTime: 110
    }]
  };
  const newPlaylist = {
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0,
      presentationTime: 104
    }, {
      number: 1,
      timeline: 0,
      presentationTime: 106
    }]
    // two segments missing that were in prior playlist
  };

  positionPlaylistOnTimeline(oldPlaylist, newPlaylist);

  assert.deepEqual(
    newPlaylist,
    {
      mediaSequence: 12,
      discontinuitySequence: 3,
      timeline: 4,
      discontinuityStarts: [],
      segments: [{
        number: 12,
        timeline: 4,
        presentationTime: 104
      }, {
        number: 13,
        timeline: 4,
        presentationTime: 106
      }]
    },
    'correctly positioned new playlist by segment match with removed segments'
  );
});

QUnit.module('positionPlaylistsOnTimeline');

QUnit.test('positions multiple playlists', function(assert) {
  const oldPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    segments: []
  };
  const oldPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  // from empty to one segment
  const newPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 1,
      presentationTime: 102
    }]
  };
  // from one segment to empty
  const newPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const oldPlaylists = [oldPlaylistA, oldPlaylistB];
  const newPlaylists = [newPlaylistA, newPlaylistB];

  positionPlaylistsOnTimeline({ oldPlaylists, newPlaylists });

  assert.deepEqual(
    newPlaylists,
    [
      {
        attributes: { NAME: 'A' },
        mediaSequence: 10,
        discontinuitySequence: 2,
        discontinuityStarts: [0],
        // increased timeline
        timeline: 4,
        segments: [{
          // added discontinuity
          discontinuity: true,
          number: 10,
          timeline: 4,
          presentationTime: 102
        }]
      },
      {
        attributes: { NAME: 'B' },
        // increased mediaSequence to account for segment that fell off
        mediaSequence: 10,
        discontinuitySequence: 2,
        discontinuityStarts: [],
        // same timeline as old
        timeline: 3,
        segments: []
      }
    ],
    'correctly positioned multiple playlists'
  );
});

QUnit.module('positionMediaGroupPlaylistsOnTimeline');

QUnit.test('positions multiple media group playlists', function(assert) {
  const oldPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    segments: []
  };
  const oldPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  const oldPlaylistC = {
    attributes: { NAME: 'C' },
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    segments: []
  };
  const oldPlaylistD = {
    attributes: { NAME: 'D' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  // from empty to one segment
  const newPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 1,
      presentationTime: 102
    }]
  };
  // from one segment to empty
  const newPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  // from empty to one segment
  const newPlaylistC = {
    attributes: { NAME: 'C' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 1,
      presentationTime: 102
    }]
  };
  // from one segment to empty
  const newPlaylistD = {
    attributes: { NAME: 'D' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          // en and es have the same cases, but different playlist names to ensure that
          // all media group labels are checked and updated
          en: {
            playlists: [oldPlaylistA, oldPlaylistB]
          },
          es: {
            playlists: [oldPlaylistC, oldPlaylistD]
          }
        }
      }
    }
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [newPlaylistA, newPlaylistB]
          },
          es: {
            playlists: [newPlaylistC, newPlaylistD]
          }
        }
      }
    }
  };

  positionMediaGroupPlaylistsOnTimeline({ oldManifest, newManifest });

  assert.deepEqual(
    newManifest,
    {
      mediaGroups: {
        AUDIO: {
          audio: {
            en: {
              playlists: [
                {
                  attributes: { NAME: 'A' },
                  mediaSequence: 10,
                  discontinuitySequence: 2,
                  discontinuityStarts: [0],
                  // increased timeline
                  timeline: 4,
                  segments: [{
                    // added discontinuity
                    discontinuity: true,
                    number: 10,
                    timeline: 4,
                    presentationTime: 102
                  }]
                },
                {
                  attributes: { NAME: 'B' },
                  // increased mediaSequence to account for segment that fell off
                  mediaSequence: 10,
                  discontinuitySequence: 2,
                  discontinuityStarts: [],
                  // same timeline as old
                  timeline: 3,
                  segments: []
                }
              ]
            },
            es: {
              playlists: [
                {
                  attributes: { NAME: 'C' },
                  mediaSequence: 10,
                  discontinuitySequence: 2,
                  discontinuityStarts: [0],
                  // increased timeline
                  timeline: 4,
                  segments: [{
                    // added discontinuity
                    discontinuity: true,
                    number: 10,
                    timeline: 4,
                    presentationTime: 102
                  }]
                },
                {
                  attributes: { NAME: 'D' },
                  // increased mediaSequence to account for segment that fell off
                  mediaSequence: 10,
                  discontinuitySequence: 2,
                  discontinuityStarts: [],
                  // same timeline as old
                  timeline: 3,
                  segments: []
                }
              ]
            }
          }
        }
      }
    },
    'correctly positioned multiple media group playlists'
  );
});

QUnit.module('removeMediaGroupPlaylists');

QUnit.test('no change if no playlists', function(assert) {
  const playlist = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [playlist]
          }
        }
      }
    }
  };

  removeMediaGroupPlaylists({ manifest, playlists: [] });

  assert.deepEqual(
    manifest,
    {
      mediaGroups: {
        AUDIO: {
          audio: {
            en: {
              playlists: [playlist]
            }
          }
        }
      }
    },
    'no chage when no playlists'
  );
});

QUnit.test('removes playlists from media group', function(assert) {
  const playlistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const playlistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const playlistC = {
    attributes: { NAME: 'C' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [playlistA, playlistB, playlistC]
          }
        }
      }
    }
  };

  removeMediaGroupPlaylists({ manifest, playlists: [playlistA, playlistC] });

  assert.deepEqual(
    manifest,
    {
      mediaGroups: {
        AUDIO: {
          audio: {
            en: {
              playlists: [playlistB]
            }
          }
        }
      }
    },
    'removed playlists'
  );
});

QUnit.test('removes media group if no playlists after removal', function(assert) {
  const playlistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const playlistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [playlistA, playlistB]
          }
        }
      }
    }
  };

  removeMediaGroupPlaylists({ manifest, playlists: [playlistA, playlistB] });

  assert.deepEqual(
    manifest,
    { mediaGroups: { AUDIO: {} } },
    'removed playlists and group'
  );
});

QUnit.test('leaves other media groups when removing one', function(assert) {
  const playlistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const playlistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const playlistC = {
    attributes: { NAME: 'C' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const manifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [playlistA, playlistB]
          },
          es: {
            playlists: [playlistC]
          }
        }
      }
    }
  };

  removeMediaGroupPlaylists({ manifest, playlists: [playlistA, playlistB] });

  assert.deepEqual(
    manifest,
    {
      mediaGroups: {
        AUDIO: {
          audio: {
            es: {
              playlists: [playlistC]
            }
          }
        }
      }
    },
    'removed playlist and label, left other label alone'
  );
});

QUnit.module('positionManifestOnTimeline');

QUnit.test('returns manifest unchanged if no new playlists', function(assert) {
  const playlist = {
    attributes: { NAME: 'A' },
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    segments: []
  };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: []
          }
        }
      }
    },
    playlists: [playlist]
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: []
          }
        }
      }
    },
    playlists: []
  };

  assert.deepEqual(
    positionManifestOnTimeline({ oldManifest, newManifest }),
    {
      // should exclude the old playlist
      playlistsToExclude: [playlist],
      mediaGroupPlaylistsToExclude: [],
      manifest: {
        mediaGroups: {
          AUDIO: {
            audio: {
              en: {
                playlists: []
              }
            }
          }
        },
        playlists: []
      }
    },
    'returns manifest unchanged if no playlists'
  );
});

QUnit.test('returns manifest unchanged if no old playlists', function(assert) {
  const playlist = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: []
          }
        }
      }
    },
    playlists: []
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: []
          }
        }
      }
    },
    playlists: [playlist]
  };

  assert.deepEqual(
    positionManifestOnTimeline({ oldManifest, newManifest }),
    {
      playlistsToExclude: [],
      mediaGroupPlaylistsToExclude: [],
      manifest: {
        mediaGroups: {
          AUDIO: {
            audio: {
              en: {
                playlists: []
              }
            }
          }
        },
        playlists: [playlist]
      }
    },
    'returns manifest unchanged if no playlists'
  );
});

QUnit.test('returns updated manifest and playlists to exclude', function(assert) {
  const oldPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  const oldPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  const oldPlaylistC = {
    attributes: { NAME: 'C' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  const oldPlaylistD = {
    attributes: { NAME: 'D' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  const oldPlaylistE = {
    attributes: { NAME: 'E' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  const oldPlaylistF = {
    attributes: { NAME: 'F' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  // matches the first segment from prior
  const newPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0,
      presentationTime: 102
    }, {
      discontinuity: true,
      number: 1,
      timeline: 1,
      presentationTime: 104
    }]
  };
  // matches the first segment from prior
  const newPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0,
      presentationTime: 102
    }, {
      discontinuity: true,
      number: 1,
      timeline: 1,
      presentationTime: 104
    }]
  };
  // incomplete playlist (missing second timeline)
  const newPlaylistE = {
    attributes: { NAME: 'E' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0,
      presentationTime: 102
    }]
  };
  // incomplete playlist (missing second timeline)
  const newPlaylistF = {
    attributes: { NAME: 'F' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 0,
      presentationTime: 102
    }]
  };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [oldPlaylistB, oldPlaylistD, oldPlaylistF]
          }
        }
      }
    },
    playlists: [oldPlaylistA, oldPlaylistC, oldPlaylistE]
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            // removed playlist D, playlist F incomplete
            playlists: [newPlaylistB, newPlaylistF]
          }
        }
      }
    },
    // removed playlist C, playlist E incomplete
    playlists: [newPlaylistA, newPlaylistE]
  };

  assert.deepEqual(
    positionManifestOnTimeline({ oldManifest, newManifest }),
    {
      playlistsToExclude: [oldPlaylistC, newPlaylistE],
      mediaGroupPlaylistsToExclude: [{
        group: 'audio',
        label: 'en',
        type: 'AUDIO',
        playlist: oldPlaylistD
      }, {
        group: 'audio',
        label: 'en',
        type: 'AUDIO',
        playlist: newPlaylistF
      }],
      manifest: {
        mediaGroups: {
          AUDIO: {
            audio: {
              en: {
                // no playlists D or F
                playlists: [{
                  attributes: { NAME: 'B' },
                  // increased mediaSequence to account for segment that fell off
                  mediaSequence: 9,
                  discontinuitySequence: 2,
                  discontinuityStarts: [1],
                  // same timeline as old
                  timeline: 3,
                  segments: [{
                    number: 9,
                    timeline: 3,
                    presentationTime: 102
                  }, {
                    discontinuity: true,
                    number: 10,
                    timeline: 4,
                    presentationTime: 104
                  }]
                }]
              }
            }
          }
        },
        // no playlists C or E
        playlists: [{
          attributes: { NAME: 'A' },
          mediaSequence: 9,
          discontinuitySequence: 2,
          discontinuityStarts: [1],
          // increased timeline
          timeline: 3,
          segments: [{
            number: 9,
            timeline: 3,
            presentationTime: 102
          }, {
            discontinuity: true,
            number: 10,
            timeline: 4,
            presentationTime: 104
          }]
        }]
      }
    },
    'returns excluded playlist and updated manifest, removed incomplete playlist'
  );
});

QUnit.test('returns updated audio only manifest and playlists to exclude', function(assert) {
  const oldPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 9,
    discontinuitySequence: 2,
    timeline: 3,
    discontinuityStarts: [],
    segments: [{
      number: 9,
      timeline: 3,
      presentationTime: 102
    }]
  };
  const oldPlaylistC = {
    attributes: { NAME: 'C' },
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    segments: []
  };
  // from one segment to empty
  const newPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: []
  };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [oldPlaylistB, oldPlaylistC]
          }
        }
      }
    },
    playlists: []
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            // removed playlist C
            playlists: [newPlaylistB]
          }
        }
      }
    },
    playlists: []
  };

  assert.deepEqual(
    positionManifestOnTimeline({ oldManifest, newManifest }),
    {
      playlistsToExclude: [],
      mediaGroupPlaylistsToExclude: [{
        group: 'audio',
        label: 'en',
        type: 'AUDIO',
        playlist: oldPlaylistC
      }],
      manifest: {
        mediaGroups: {
          AUDIO: {
            audio: {
              en: {
                playlists: [{
                  attributes: { NAME: 'B' },
                  // increased mediaSequence to account for segment that fell off
                  mediaSequence: 10,
                  discontinuitySequence: 2,
                  discontinuityStarts: [],
                  // same timeline as old
                  timeline: 3,
                  segments: []
                }]
              }
            }
          }
        },
        playlists: []
      }
    },
    'returns excluded playlist and updated audio only manifest'
  );
});

// In the future, there should be logic to handle the addition of playlists, but for now,
// the test exists to ensure nothing breaks before that logic is added.
QUnit.test('exludes playlists not seen before', function(assert) {
  const oldPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    segments: []
  };
  // from empty to two segments
  const newPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 1,
      presentationTime: 102
    }, {
      discontinuity: true,
      number: 1,
      timeline: 2,
      presentationTime: 104
    }]
  };
  // new playlist
  const newPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 1,
      presentationTime: 102
    }, {
      discontinuity: true,
      number: 1,
      timeline: 2,
      presentationTime: 104
    }]
  };
  const oldManifest = {
    mediaGroups: {},
    playlists: [oldPlaylistA]
  };
  const newManifest = {
    mediaGroups: {},
    // added playlist B
    playlists: [newPlaylistA, newPlaylistB]
  };

  assert.deepEqual(
    positionManifestOnTimeline({ oldManifest, newManifest }),
    {
      playlistsToExclude: [],
      mediaGroupPlaylistsToExclude: [],
      manifest: {
        mediaGroups: {},
        // no playlist B
        playlists: [{
          attributes: { NAME: 'A' },
          mediaSequence: 10,
          discontinuitySequence: 2,
          discontinuityStarts: [0, 1],
          // increased timeline
          timeline: 4,
          segments: [{
            // added discontinuity
            discontinuity: true,
            number: 10,
            timeline: 4,
            presentationTime: 102
          }, {
            discontinuity: true,
            number: 11,
            timeline: 5,
            presentationTime: 104
          }]
        }]
      }
    },
    'returns playlist and updated manifest, removed new playlist'
  );
});

// In the future, there should be logic to handle the addition of media group playlists,
// but for now, the test exists to ensure nothing breaks before that logic is added.
QUnit.test('does not include media group playlists not seen before', function(assert) {
  const oldPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 10,
    discontinuitySequence: 2,
    timeline: 3,
    segments: []
  };
  // from empty to two segments
  const newPlaylistA = {
    attributes: { NAME: 'A' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 1,
      presentationTime: 102
    }, {
      discontinuity: true,
      number: 1,
      timeline: 2,
      presentationTime: 104
    }]
  };
  // new playlist
  const newPlaylistB = {
    attributes: { NAME: 'B' },
    mediaSequence: 0,
    discontinuitySequence: 0,
    timeline: 0,
    segments: [{
      number: 0,
      timeline: 1,
      presentationTime: 102
    }, {
      discontinuity: true,
      number: 1,
      timeline: 2,
      presentationTime: 104
    }]
  };
  const oldManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            playlists: [oldPlaylistA]
          }
        }
      }
    },
    playlists: []
  };
  const newManifest = {
    mediaGroups: {
      AUDIO: {
        audio: {
          en: {
            // added playlist B
            playlists: [newPlaylistA, newPlaylistB]
          }
        }
      }
    },
    playlists: []
  };

  assert.deepEqual(
    positionManifestOnTimeline({ oldManifest, newManifest }),
    {
      playlistsToExclude: [],
      mediaGroupPlaylistsToExclude: [],
      manifest: {
        mediaGroups: {
          AUDIO: {
            audio: {
              en: {
                // no playlist B
                playlists: [{
                  attributes: { NAME: 'A' },
                  mediaSequence: 10,
                  discontinuitySequence: 2,
                  discontinuityStarts: [0, 1],
                  // increased timeline
                  timeline: 4,
                  segments: [{
                    // added discontinuity
                    discontinuity: true,
                    number: 10,
                    timeline: 4,
                    presentationTime: 102
                  }, {
                    discontinuity: true,
                    number: 11,
                    timeline: 5,
                    presentationTime: 104
                  }]
                }]
              }
            }
          }
        },
        playlists: []
      }
    },
    'returns updated manifest, removed new media group playlist'
  );
});
