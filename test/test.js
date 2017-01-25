var assert = require('assert');
var mpdParser = require('../mpd-parser');

describe('MPD-Parser', function() {
  describe('f', function() {
    it('should split initial value', function() {
      assert.deepEqual(mpdParser.f('foo'), ['f','o','o']);
    });
  });
});

