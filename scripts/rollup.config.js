const generate = require('videojs-generate-rollup-config');
const istanbul = require('rollup-plugin-istanbul');
const string = require('rollup-plugin-string');

// see https://github.com/videojs/videojs-generate-rollup-config
// for options
const options = {
  input: 'src/index.js',
  plugins(defaults) {
    defaults.test.unshift('string');
    defaults.test.push('istanbul');

  },
  primedPlugins(defaults) {
    defaults.istanbul = istanbul({exclude: ['test/**/*.js']});
    defaults.string = string({include: ['test/manifests/*.mpd']});
  }
};
const config = generate(options);

// Add additonal builds/customization here!

// export the builds to rollup
export default Object.values(config.builds);
