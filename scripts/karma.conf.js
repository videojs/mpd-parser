const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  config = generate(config);

  // any custom stuff here!

  // We only test on ChromeHeadless
  // which means the travis config in this repo is also
  // different
  config.plugins.push('karma-coverage');
  config.browsers = ['ChromeHeadless'];
  config.detectBrowsers.enabled = false;

  config.coverageReporter = {
    reporters: [{
      type: 'text-summary'
    }]
  };
  config.reporters.push('coverage');
};
