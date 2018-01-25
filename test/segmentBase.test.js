import QUnit from 'qunit';
import {
  segmentsFromBase
} from '../src/segment/segmentBase';
import errors from '../src/errors';


QUnit.module('segmentBase - segmentsFromBase');

QUnit.test('sets segment to baseUrl', function(assert) {
  const inputAttributes = {
    baseUrl: 'http://www.example.com/i.fmp4',
    initialization: 'http://www.example.com/init.fmp4'
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

QUnit.test('errors if no baseUrl exists', function(assert) {
  assert.throws(() => segmentsFromBase({}), new Error(errors.NO_BASE_URL));
});
