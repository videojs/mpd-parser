var babel = require('rollup-plugin-babel');
var commonjs = require('rollup-plugin-commonjs');
var json = require('rollup-plugin-json');
var multiEntry = require('rollup-plugin-multi-entry');
var resolve = require('rollup-plugin-node-resolve');
var string = require('rollup-plugin-string');

module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['qunit'],
    browsers: ['ChromeHeadless'],
    client: {
      clearContext: false,
      qunit: {
        showUI: true,
        testTimeout: 5000
      }
    },
    files: [{
      included: false,
      pattern: 'src/**/*.js',
      watched: true
    }, {
      pattern: 'test/**/*.test.js',
      // Make sure to disable Karma’s file watcher
      // because the preprocessor will use its own.
      watched: false
    }],
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity,
    preprocessors: {
      'test/**/*.test.js': ['rollup']
    },

    rollupPreprocessor: {
      name: 'mpdParserTest',
      format: 'iife',
      external: [ 'qunit' ],
      globals: { qunit: 'QUnit' },
      plugins: [
        string({ include: 'test/manifests/*.mpd' }),
        multiEntry({ exports: false }),
        resolve({ browser: true, main: true, jsnext: true }),
        json(),
        commonjs({ sourceMap: false }),
        babel({exclude: 'node_modules/**'})
      ]
    }
  });
};
