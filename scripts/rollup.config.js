import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-es';
import pkg from '../package.json';

const date = new Date();

const banner =
`/**
 * ${pkg.name}
 * @version ${pkg.version}
 * @copyright ${date.getFullYear()} ${pkg.author}
 * @license ${pkg.license}
 */`;

const plugins = [
  resolve({ browser: true, main: true, jsnext: true }),
  json(),
  commonjs({ sourceMap: false }),
  babel()
];

export default [
  /**
   * Rollup configuration for packaging the plugin in a module that is consumable
   * as the `src` of a `script` tag or via AMD or similar client-side loading.
   *
   * This module DOES include its dependencies.
   */
  {
    name: 'mpdParser',
    input: 'src/index.js',
    output: {
      file: 'dist/mpd-parser.js',
      format: 'umd'
    },
    legacy: true,
    banner,
    plugins
  }, {
    name: 'mpdParser',
    input: 'src/index.js',
    output: {
      file: 'dist/mpd-parser.min.js',
      format: 'umd'
    },
    legacy: true,
    banner,
    plugins: plugins
      .concat([uglify({output: {comments: 'some'}}, minify)])
  },

  /**
   * Rollup configuration for packaging the plugin in a module that is consumable
   * by either CommonJS (e.g. Node or Browserify) or ECMAScript (e.g. Rollup).
   *
   * These modules DO NOT include their dependencies as we expect those to be
   * handled by the module system.
   */
  {
    name: 'mpdParser',
    input: 'src/index.js',
    legacy: true,
    banner,
    external: ['global/window', 'url-toolkit'],
    plugins: [ json(), babel({exclude: 'node_modules/**'}) ],
    output: [
      {file: 'dist/mpd-parser.cjs.js', format: 'cjs'}
    ]
  }, {
    name: 'mpdParser',
    input: 'src/index.js',
    legacy: true,
    banner,
    external: ['global/window', 'url-toolkit'],
    plugins: [
      json({ preferConst: true }),
      babel({ exclude: 'node_modules/**' })
    ],
    output: [
      {file: 'dist/mpd-parser.es.js', format: 'es'}
    ]
  }
];
