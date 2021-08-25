# mpd-parser

[![Build Status](https://travis-ci.org/videojs/mpd-parser.svg?branch=master)](https://travis-ci.org/videojs/mpd-parser)
[![Greenkeeper badge](https://badges.greenkeeper.io/videojs/mpd-parser.svg)](https://greenkeeper.io/)
[![Slack Status](http://slack.videojs.com/badge.svg)](http://slack.videojs.com)

[![NPM](https://nodei.co/npm/mpd-parser.png?downloads=true&downloadRank=true)](https://nodei.co/npm/mpd-parser/)

mpd parser

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Usage](#usage)
  - [Parsed Output](#parsed-output)
- [Including the Parser](#including-the-parser)
  - [`<script>` Tag](#script-tag)
  - [Browserify](#browserify)
  - [RequireJS/AMD](#requirejsamd)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
## Installation

```sh
npm install --save mpd-parser
```

## Usage

```js
// get your manifest in whatever way works best
// for example, by reading the file from the filesystem in node
// or using fetch in a browser like so:

const manifestUri = 'https://example.com/dash.xml';
const res = await fetch(manifestUri);
const manifest = await res.text();

const { manifest: parsedManifest } = mpdParser.parse(manifest, { manifestUri });
```

If dealing with a live stream, then on subsequent calls to parse, the last parsed manifest
object should be provided as an option to `parse` using the `lastMpd` option:

```js
const parsedManifest = mpdParser.parse(manifest, { manifestUri, lastMpd });
```

### Parsed Output

The parser ouputs a parsed manifest as a plain javascript object with the following structure:

```js
Manifest {
  allowCache: boolean,
  endList: boolean,
  mediaSequence: number,
  discontinuitySequence: number,
  playlistType: string,
  playlists: [
    {
      attributes: {},
      Manifest
    }
  ],
  playlistToExclude: [],
  mediaGroupPlaylistsToExclude: []
  mediaGroups: {
    AUDIO: {
      'GROUP-ID': {
        default: boolean,
        autoselect: boolean,
        language: string,
        uri: string,
        instreamId: string,
        characteristics: string,
        forced: boolean
      }
    },
    VIDEO: {},
    'CLOSED-CAPTIONS': {},
    SUBTITLES: {}
  },
  dateTimeString: string,
  dateTimeObject: Date,
  targetDuration: number,
  totalDuration: number,
  discontinuityStarts: [number],
  segments: [
    {
      byterange: {
        length: number,
        offset: number
      },
      duration: number,
      attributes: {},
      discontinuity: number,
      uri: string,
      timeline: number,
      key: {
        method: string,
        uri: string,
        iv: string
      },
      map: {
        uri: string,
        byterange: {
          length: number,
          offset: number
        }
      },
      'cue-out': string,
      'cue-out-cont': string,
      'cue-in': string
    }
  ]
}
```

For live DASH playlists where a `lastMpd` object was provided, the returned manifest object
may contain `playlistsToExclude` and `mediaGroupPlaylistsToExclude`. These are arrays
containing playlists that were found in the `lastMpd` (if provided) but could not be
matched in the latest MPD. To continue playback uninterrupted, they should be excluded by
the playback engine.

## Including the Parser

To include mpd-parser on your website or web application, use any of the following methods.

### `<script>` Tag

This is the simplest case. Get the script in whatever way you prefer and include it on your page.

```html
<script src="//path/to/mpd-parser.min.js"></script>
<script>
  const mpdParser = window['mpd-parser'];
  const parsedManifest = mpdParser.parse(manifest, { manifestUri });
</script>
```

### Browserify

When using with Browserify, install mpd-parser via npm and `require` the parser as you would any other module.

```js
const mpdParser = require('mpd-parser');
const parsedManifest = mpdParser.parse(manifest, { manifestUri });
```

With ES6:
```js
import { parse } from 'mpd-parser';

const parsedManifest = parse(manifest, { manifestUri });
```

### RequireJS/AMD

When using with RequireJS (or another AMD library), get the script in whatever way you prefer and `require` the parser as you normally would:

```js
require(['mpd-parser'], function(mpdParser) {
  const parsedManifest = mpdParser.parse(manifest, { manifestUri });
});
```

## License

Apache-2.0. Copyright (c) Brightcove, Inc
