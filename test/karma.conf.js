module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['qunit'],
    files: [
      'node_modules/sinon/pkg/sinon.js',
      'test/dist/bundle.js'
    ],
    browsers: ['ChromeHeadless'],
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  });
};
