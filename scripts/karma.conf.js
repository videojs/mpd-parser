const generate = require('videojs-generate-karma-config');

module.exports = function(config) {
  config = generate(config);

  // any custom stuff here!

  config.plugins.push('karma-coverage');

  config.coverageReporter = {
    reporters: [{
      type: 'text-summary'
    }]
  };
};
