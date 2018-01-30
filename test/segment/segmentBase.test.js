import QUnit from 'qunit';
import {
  segmentsFromBase
} from '../../src/segment/segmentBase';
import errors from '../../src/errors';

QUnit.module('segmentBase - segmentsFromBase');

QUnit.test('sets segment to baseUrl', function(assert) {
  const inputAttributes = {
    baseUrl: 'http://www.example.com/i.fmp4',
    initialization: { sourceURL: 'http://www.example.com/init.fmp4' }
  };

  assert.deepEqual(segmentsFromBase(inputAttributes), [{
    map: {
      resolvedUri: 'http://www.example.com/init.fmp4',
      uri: 'http://www.example.com/init.fmp4'
    },
    resolvedUri: 'http://www.example.com/i.fmp4',
    uri: 'http://www.example.com/i.fmp4'
  }]);
});

QUnit.test('sets duration based on sourceDuration', function(assert) {
  const inputAttributes = {
    baseUrl: 'http://www.example.com/i.fmp4',
    initialization: { sourceURL: 'http://www.example.com/init.fmp4' },
    sourceDuration: 10
  };

  assert.deepEqual(segmentsFromBase(inputAttributes), [{
    duration: 10,
    timeline: 0,
    map: {
      resolvedUri: 'http://www.example.com/init.fmp4',
      uri: 'http://www.example.com/init.fmp4'
    },
    resolvedUri: 'http://www.example.com/i.fmp4',
    uri: 'http://www.example.com/i.fmp4'
  }]);
});

QUnit.test('sets duration based on sourceDuration and @timescale', function(assert) {
  const inputAttributes = {
    baseUrl: 'http://www.example.com/i.fmp4',
    initialization: { sourceURL: 'http://www.example.com/init.fmp4' },
    sourceDuration: 10,
    timescale: 2
  };

  assert.deepEqual(segmentsFromBase(inputAttributes), [{
    duration: 5,
    timeline: 0,
    map: {
      resolvedUri: 'http://www.example.com/init.fmp4',
      uri: 'http://www.example.com/init.fmp4'
    },
    resolvedUri: 'http://www.example.com/i.fmp4',
    uri: 'http://www.example.com/i.fmp4'
  }]);
});

QUnit.test('sets duration based on @duration', function(assert) {
  const inputAttributes = {
    duration: 10,
    sourceDuration: 20,
    baseUrl: 'http://www.example.com/i.fmp4',
    initialization: { sourceURL: 'http://www.example.com/init.fmp4' }
  };

  assert.deepEqual(segmentsFromBase(inputAttributes), [{
    duration: 10,
    timeline: 0,
    map: {
      resolvedUri: 'http://www.example.com/init.fmp4',
      uri: 'http://www.example.com/init.fmp4'
    },
    resolvedUri: 'http://www.example.com/i.fmp4',
    uri: 'http://www.example.com/i.fmp4'
  }]);
});

QUnit.test('sets duration based on @duration and @timescale', function(assert) {
  const inputAttributes = {
    duration: 10,
    sourceDuration: 20,
    timescale: 5,
    baseUrl: 'http://www.example.com/i.fmp4',
    initialization: { sourceURL: 'http://www.example.com/init.fmp4' }
  };

  assert.deepEqual(segmentsFromBase(inputAttributes), [{
    duration: 2,
    timeline: 0,
    map: {
      resolvedUri: 'http://www.example.com/init.fmp4',
      uri: 'http://www.example.com/init.fmp4'
    },
    resolvedUri: 'http://www.example.com/i.fmp4',
    uri: 'http://www.example.com/i.fmp4'
  }]);
});

QUnit.test('translates ranges in <Initialization> node', function(assert) {
  const inputAttributes = {
    duration: 10,
    sourceDuration: 20,
    timescale: 5,
    baseUrl: 'http://www.example.com/i.fmp4',
    initialization: {
      sourceURL: 'http://www.example.com/init.fmp4',
      range: '121-125'
    }
  };

  assert.deepEqual(segmentsFromBase(inputAttributes), [{
    duration: 2,
    timeline: 0,
    map: {
      resolvedUri: 'http://www.example.com/init.fmp4',
      uri: 'http://www.example.com/init.fmp4',
      byterange: {
        length: 4,
        offset: 121
      }
    },
    resolvedUri: 'http://www.example.com/i.fmp4',
    uri: 'http://www.example.com/i.fmp4'
  }]);
});

QUnit.test('errors if no baseUrl exists', function(assert) {
  assert.throws(() => segmentsFromBase({}), new Error(errors.NO_BASE_URL));
});
