import { forEachMediaGroup } from '@videojs/vhs-utils/es/media-groups';
import {
  findIndex,
  findIndexes,
  includes
} from './utils/list';

const SUPPORTED_MEDIA_TYPES = ['AUDIO', 'SUBTITLES'];

/**
 * Finds the playlist with the matching NAME attribute.
 *
 * @param {Array} playlists playlists to search through
 * @param {string} name the NAME attribute to search for
 *
 * @return {Object|null} the matching playlist object, or null
 */
export const findPlaylistWithName = (playlists, name) => {
  for (let i = 0; i < playlists.length; i++) {
    if (playlists[i].attributes.NAME === name) {
      return playlists[i];
    }
  }

  return null;
};

/**
 * Finds the media group playlist with the matching NAME attribute.
 *
 * @param {Object} config options object
 * @param {string} config.playlistName the playlist NAME attribute to search for
 * @param {string} config.type the media group type
 * @param {string} config.group the media group...group
 * @param {string} config.label the media group label
 * @param {Object} config.manifest the main manifest object
 *
 * @return {Object|null} the matching media group playlist object, or null
 */
export const findMediaGroupPlaylistWithName = ({
  playlistName,
  type,
  group,
  label,
  manifest
}) => {
  const typeObject = manifest.mediaGroups[type];
  const properties = typeObject && typeObject[group] && typeObject[group][label];

  if (!properties) {
    return null;
  }

  return properties.playlists.length &&
    findPlaylistWithName(properties.playlists, playlistName);
};

/**
 * Returns any old playlists that are no longer available in the new playlists.
 *
 * @param {Object} config options object
 * @param {Array} config.oldPlaylists the old playlists to search within
 * @param {Array} config.newPlaylists the new playlists to check for
 *
 * @return {Array} any playlists not available in new playlists array
 */
export const getRemovedPlaylists = ({ oldPlaylists, newPlaylists }) => {
  // Playlists NAMEs come from DASH Representation IDs, which are mandatory
  // (see ISO_23009-1-2012 5.3.5.2)
  const oldNameToPlaylistMap = oldPlaylists.reduce((acc, playlist) => {
    acc[playlist.attributes.NAME] = playlist;
    return acc;
  }, {});
  const newNameToPlaylistMap = newPlaylists.reduce((acc, playlist) => {
    acc[playlist.attributes.NAME] = playlist;
    return acc;
  }, {});

  return Object.keys(oldNameToPlaylistMap).reduce((acc, oldPlaylistName) => {
    const oldPlaylist = oldNameToPlaylistMap[oldPlaylistName];
    const matchingNewPlaylist = newNameToPlaylistMap[oldPlaylistName];

    if (!matchingNewPlaylist) {
      acc.push(oldPlaylist);
    }

    return acc;
  }, []);
};

/**
 * Returns any old media group playlists that are no longer available in the new media
 * group playlists.
 *
 * @param {Object} config options object
 * @param {Object} config.oldManifest the old main manifest object
 * @param {Object} config.newManifest the new main manifest object
 *
 * @return {Array} removed media group playlist objects
 */
export const getRemovedMediaGroupPlaylists = ({ oldManifest, newManifest }) => {
  const removedMediaGroupPlaylists = [];

  forEachMediaGroup(oldManifest, SUPPORTED_MEDIA_TYPES, (properties, type, group, label) => {
    const oldPlaylists = properties.playlists || [];

    oldPlaylists.forEach((oldPlaylist) => {
      const newPlaylist = findMediaGroupPlaylistWithName({
        // Playlists NAMEs come from DASH Representation IDs, which are mandatory
        // (see ISO_23009-1-2012 5.3.5.2)
        playlistName: oldPlaylist.attributes.NAME,
        type,
        group,
        label,
        manifest: newManifest
      });

      if (!newPlaylist) {
        removedMediaGroupPlaylists.push({
          type,
          group,
          label,
          playlist: oldPlaylist
        });
      }
    });
  });

  return removedMediaGroupPlaylists;
};

/**
 * Returns any new playlists that do not account for all timelines (where all timelines is
 * the max number of timelines seen across all of the passed in playlists).
 *
 * @param {Array} playlists the playlists to look through
 *
 * @return {Array} any playlists that do not account for all timelines
 */
export const getIncompletePlaylists = (playlists) => {
  const timelines = {};
  const playlistToTimelines = {};

  playlists.forEach((playlist) => {
    if (!playlist.segments) {
      return;
    }

    const playlistTimelines = playlist.segments.reduce((acc, segment) => {
      acc[segment.timeline] = true;
      timelines[segment.timeline] = true;

      return acc;
    }, {});

    // All playlists should have a unique ID sourced from the required attribute
    // Representation@id from the MPD.
    playlistToTimelines[playlist.attributes.NAME] = playlistTimelines;
  }, {});

  const numNewTimelines = Object.keys(timelines).length;

  if (numNewTimelines === 0) {
    return [];
  }

  return playlists.filter((playlist) =>
    Object.keys(playlistToTimelines[playlist.attributes.NAME]).length < numNewTimelines);
};

/**
 * Gets a flattened array of media group playlists.
 *
 * @param {Object} manifest the main manifest object
 *
 * @return {Array} the media group playlists
 */
export const getMediaGroupPlaylists = (manifest) => {
  let mediaGroupPlaylists = [];

  forEachMediaGroup(manifest, SUPPORTED_MEDIA_TYPES, (properties, type, group, label) => {
    mediaGroupPlaylists = mediaGroupPlaylists.concat(properties.playlists || []);
  });

  return mediaGroupPlaylists;
};

/**
 * @typedef {Object} MediaGroupPlaylistIdentificationObject
 * @property {string} type - the media group type
 * @property {string} group - the media group...group
 * @property {string} label - the media group label
 * @property {Object} playlist - the playlist within the group
 */

/**
 * Given a list of playlists and a manifest object, returns an array of objects with all
 * of the necessary media group properties to identify it within a manifest.
 *
 * @param {Object} config options object
 * @param {Array} config.playlists the playlist objects
 * @param {Object} config.manifest the main manifest object
 *
 * @return {MediaGroupPlaylistIdentificationObject[]}
 *         media group playlist identification objects
 */
export const getMediaGroupPlaylistIdentificationObjects = ({ playlists, manifest }) => {
  if (!playlists.length) {
    return [];
  }

  const idObjects = [];

  forEachMediaGroup(manifest, SUPPORTED_MEDIA_TYPES, (properties, type, group, label) => {
    properties.playlists.forEach((playlist) => {
      if (includes(playlists, playlist)) {
        idObjects.push({
          type,
          group,
          label,
          playlist
        });
      }
    });
  });

  return idObjects;
};

/**
 * Goes through the provided segments and updates the appropriate sequence and timeline
 * related attributes.
 *
 * @param {Object} config options object
 * @param {Array} config.segments the segments to update
 * @param {number} config.mediaSequenceStart the mediaSequence number to start with
 * @param {string} config.timelineStart the timeline number to start with
 */
export const repositionSegmentsOnTimeline = ({
  segments,
  mediaSequenceStart,
  timelineStart
}) => {
  let currentMediaSequence = mediaSequenceStart;
  let currentTimeline = timelineStart;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // timelineStart should already account for the first discontinuity
    if (i > 0 && segment.discontinuity) {
      currentTimeline++;
    }
    segment.number = currentMediaSequence;
    segment.timeline = currentTimeline;
    currentMediaSequence++;
  }
};

/**
 * Given a new playlist and an old matching playlist from a prior refresh, updates the new
 * playlist's sequence and timing values (including segments) to ensure that the new
 * playlist reflects its relative position to the old one.
 *
 * @param {Object} oldPlaylist the old playlist to base the updates on
 * @param {Object} newPlaylist the new playlist to update
 */
export const positionPlaylistOnTimeline = (oldPlaylist, newPlaylist) => {
  const oldSegments = oldPlaylist.segments || [];
  const newSegments = newPlaylist.segments || [];
  // At the time of writing, mpd-parser did not add discontinuitySequence. This code
  // allows for it to exist or to not exist, and should handle both appropriately.
  const oldDiscontinuitySequence = oldPlaylist.discontinuitySequence || 0;

  // If the prior playlist had no segments, it's likely either the start of the stream or
  // a break in the stream. Either way, the best approach is to consider the new segments
  // a discontinuous region of the media and to continue as if the new playlist is a
  // continuation of the prior stream.
  if (oldSegments.length === 0) {
    newPlaylist.mediaSequence = oldPlaylist.mediaSequence;
    // The discontinuity sequence should remain the same. Accounting for removed
    // discontinuities occurs on playlist updates where segments are removed.
    newPlaylist.discontinuitySequence = oldDiscontinuitySequence;
    // The timeline should remain the same until a new segment is added.
    newPlaylist.timeline = oldPlaylist.timeline + (newPlaylist.segments.length ? 1 : 0);

    if (newSegments.length > 0) {
      newSegments[0].discontinuity = true;
    }

    repositionSegmentsOnTimeline({
      segments: newSegments,
      mediaSequenceStart: newPlaylist.mediaSequence,
      timelineStart: newPlaylist.timeline
    });

    newPlaylist.discontinuityStarts = findIndexes(newSegments, 'discontinuity');
    return;
  }

  // If there are no new segments then the stream is either reaching an end or a gap.
  // The media sequence should be updated accordingly, but the timeline should remain the
  // same, as it will be updated once segments are added.
  if (newSegments.length === 0) {
    newPlaylist.mediaSequence = oldPlaylist.mediaSequence + oldSegments.length;
    newPlaylist.discontinuitySequence =
      oldDiscontinuitySequence + findIndexes(oldSegments, 'discontinuity').length;
    newPlaylist.timeline = oldSegments.length ?
      oldSegments[oldSegments.length - 1].timeline : oldPlaylist.timeline;
    newPlaylist.discontinuityStarts = [];
    return;
  }

  // From here on both old and new playlist have segments.
  //
  // To update the new playlist, we must position the old and the new together. The
  // simplest approach is to try to match an exact segment and adjust timing values from
  // there. However, this will not always work. It's possible that different periods will
  // reuse the same segment, and it's also possible that refreshes may change certain
  // segment properties (e.g., the URI).
  //
  // Because of these limitations, the best approach for matching segments is by finding
  // a segment with a matching presentation time. These values should not change on
  // refreshes.
  const firstNewSegment = newSegments[0];
  const oldMatchingSegmentIndex = findIndex(oldSegments, (oldSegment) =>
    // allow one 60fps frame as leniency (arbitrarily chosen)
    Math.abs(oldSegment.presentationTime - firstNewSegment.presentationTime) < (1 / 60));
  const lastOldSegment = oldSegments[oldSegments.length - 1];

  // No matching segment from the old playlist means the entire playlist was refreshed. In
  // this case the media sequence should account for this update, and the new segments
  // should be marked as discontinuous from the prior content, since the last prior period
  // was removed.
  if (oldMatchingSegmentIndex < 0) {
    // It's possible that segments were missed on refresh. However, since we don't have any
    // access to these prior segments, continue as if the newest segment is the next media
    // sequence in the stream. At the time of writing, this shouldn't have further
    // ramifications for playback, as it will be marked as discontinuous with the prior
    // segments and should offset based on the last buffered values rather than based on
    // exact DASH manifest values.
    newPlaylist.mediaSequence = oldPlaylist.mediaSequence + oldSegments.length;
    newPlaylist.timeline = lastOldSegment.timeline + 1;
    newPlaylist.discontinuitySequence =
      oldDiscontinuitySequence + findIndexes(oldSegments, 'discontinuity').length;
    firstNewSegment.discontinuity = true;

    repositionSegmentsOnTimeline({
      segments: newSegments,
      mediaSequenceStart: newPlaylist.mediaSequence,
      timelineStart: newPlaylist.timeline
    });

    newPlaylist.discontinuityStarts = findIndexes(newSegments, 'discontinuity');
    return;
  }

  // There's a matching segment. Use it to update new playlist segment sequence values.
  // Note that the matching segment in the new playlist should always be index 0.
  let oldSegmentIndex = oldMatchingSegmentIndex;
  let newSegmentIndex = 0;

  // Check if new manifest is start of a period
  if (oldSegments[oldSegmentIndex].discontinuity) {
    firstNewSegment.discontinuity = true;
  }

  while (oldSegmentIndex < oldSegments.length) {
    const oldSegment = oldSegments[oldSegmentIndex];
    const newSegment = newSegments[newSegmentIndex];

    // It's possible that segments were removed from the end of the manifest. This may or
    // may not be legal, as per the spec, but it is seen in practice. It's possible a
    // situation like this could happen if there are multiple servers providing the
    // manifest and they aren't perfectly in-sync. If the case is encountered, just break
    // from this loop.
    if (!newSegment) {
      break;
    }

    newSegment.number = oldSegment.number;
    newSegment.timeline = oldSegment.timeline;

    oldSegmentIndex++;
    newSegmentIndex++;
  }

  newPlaylist.mediaSequence = firstNewSegment.number;
  newPlaylist.discontinuitySequence = oldDiscontinuitySequence +
    // since only some of the discontinuities were removed from the playlist, only account
    // for those
    findIndexes(oldSegments.slice(0, oldMatchingSegmentIndex), 'discontinuity').length;
  newPlaylist.timeline = firstNewSegment.timeline;
  newPlaylist.discontinuityStarts = findIndexes(newSegments, 'discontinuity');

  if (newSegments.length === 1) {
    return;
  }

  while (newSegmentIndex > 0 && newSegmentIndex < newSegments.length) {
    const priorSegment = newSegments[newSegmentIndex - 1];
    const segment = newSegments[newSegmentIndex];

    segment.number = priorSegment.number + 1;
    segment.timeline = priorSegment.timeline + (segment.discontinuity ? 1 : 0);

    newSegmentIndex++;
  }
};

/**
 * Given new playlists and old playlists from a prior refresh, updates the new playlists's
 * sequence and timing values (including segments) to ensure that the new playlists
 * reflect their relative positions to the old ones.
 *
 * Note that this function assumes that the old matching playlists (based on playlist
 * NAME) exist.
 *
 * @param {Array} oldPlaylists the old playlists to base the updates on
 * @param {Array} newPlaylists the new playlists to update
 */
export const positionPlaylistsOnTimeline = ({ oldPlaylists, newPlaylists }) => {
  newPlaylists.forEach((newPlaylist) => {
    const playlistName = newPlaylist.attributes.NAME;
    const oldPlaylist = findPlaylistWithName(oldPlaylists, playlistName);

    if (!oldPlaylist) {
      return;
    }

    positionPlaylistOnTimeline(oldPlaylist, newPlaylist);
  });
};

/**
 * Given a new manifest and an old manifest from a prior refresh, updates the new media
 * group playlists' sequence and timing values (including segments) to ensure that the new
 * media group playlists reflect their relative positions to the old ones.
 *
 * Note that this function assumes that the old matching media group playlists (based on
 * playlist NAME) exist.
 *
 * @param {Object} oldManifest the old main manifest object
 * @param {Object} newManifest the new main manifest object
 */
export const positionMediaGroupPlaylistsOnTimeline = ({ oldManifest, newManifest }) => {
  forEachMediaGroup(newManifest, SUPPORTED_MEDIA_TYPES, (properties, type, group, label) => {
    const newPlaylists = properties.playlists || [];

    newPlaylists.forEach((newPlaylist) => {
      const oldPlaylist = findMediaGroupPlaylistWithName({
        // Playlists NAMEs come from DASH Representation IDs, which are mandatory
        // (see ISO_23009-1-2012 5.3.5.2)
        playlistName: newPlaylist.attributes.NAME,
        type,
        group,
        label,
        manifest: oldManifest
      });

      if (!oldPlaylist) {
        return;
      }

      positionPlaylistOnTimeline(oldPlaylist, newPlaylist);
    });
  });
};

/**
 * Removes matching media group playlists from the manifest. This function will also
 * remove any labels and groups made empty after removal.
 *
 * @param {Object} manifest - the manifest object
 * @param {Object[]} playlists - the media group playlists to remove
 */
export const removeMediaGroupPlaylists = ({ manifest, playlists }) => {
  getMediaGroupPlaylistIdentificationObjects({ playlists, manifest }).forEach((idObject) => {
    const mediaGroup = manifest.mediaGroups[idObject.type][idObject.group][idObject.label];

    mediaGroup.playlists =
      mediaGroup.playlists.filter((playlist) => playlist !== idObject.playlist);

    if (mediaGroup.playlists.length === 0) {
      delete manifest.mediaGroups[idObject.type][idObject.group][idObject.label];
    }

    if (Object.keys(manifest.mediaGroups[idObject.type][idObject.group]).length === 0) {
      delete manifest.mediaGroups[idObject.type][idObject.group];
    }
  });
};

/**
 * Given an old parsed manifest object and a new parsed manifest object, updates the
 * sequence and timing values within the new manifest to ensure that it lines up with the
 * old.
 *
 * @param {Array} oldManifest the old main manifest object
 * @param {Array} newManifest the new main manifest object
 *
 * @return {Object} the manifest object
 */
export const positionManifestOnTimeline = ({ oldManifest, newManifest }) => {
  const oldPlaylists = oldManifest.playlists;
  const newPlaylists = newManifest.playlists;

  const incompletePlaylists = getIncompletePlaylists(newPlaylists);
  const removedPlaylists = getRemovedPlaylists({ oldPlaylists, newPlaylists });
  // to get added, reverse the sources
  const addedPlaylists = getRemovedPlaylists({
    oldPlaylists: newPlaylists,
    newPlaylists: oldPlaylists
  });

  const newMediaGroupPlaylists = getMediaGroupPlaylists(newManifest);
  const incompleteMediaGroupPlaylists = getIncompletePlaylists(newMediaGroupPlaylists);
  const incompleteMediaGroupPlaylistIdObjects =
    getMediaGroupPlaylistIdentificationObjects({
      playlists: incompleteMediaGroupPlaylists,
      manifest: newManifest
    });
  const removedMediaGroupPlaylists = getRemovedMediaGroupPlaylists({
    oldManifest,
    newManifest
  });
  // to get added, reverse the sources
  const addedMediaGroupPlaylists = getRemovedMediaGroupPlaylists({
    oldManifest: newManifest,
    newManifest: oldManifest
  });

  // TODO: handle (instead of remove) playlists that only exist for specific timelines
  //       (i.e., incomplete)
  //
  // Playlists can be removed from the manifest on period boundaries. For now, we don't
  // have a good way of handling playlists that exist for only part of a stream. Due to
  // that, the best course of action is to not include them. In the future, we may want
  // to have a better way of handling playlists that only represent specific timelines in
  // the stream.
  //
  // If the incomplete playlists are newly added playlists, and on a future refresh will
  // be complete (for instance, if old periods/timelines are removed on future refreshes
  // and the new playlist exists for periods/timelines after a certain point) then it will
  // be available once it is no longer incomplete.
  newManifest.playlists =
    newManifest.playlists.filter((playlist) => !includes(incompletePlaylists, playlist));
  removeMediaGroupPlaylists({
    manifest: newManifest,
    playlists: incompleteMediaGroupPlaylists
  });

  const oldMediaGroupPlaylists = getMediaGroupPlaylists(oldManifest);

  // Only remove newly added playlists if a playlist existed before. This allows for
  // streams to start empty of playlists and add a first one. However, the behavior may
  // break if a stream ever removes all playlists and then starts up again adding new
  // playlists.
  if (oldMediaGroupPlaylists.length > 0 || oldPlaylists.length > 0) {
    // TODO: handle (instead of remove) playlists that are added
    //
    // Right now, if a playlist is added, it is simply removed from the returned manifest
    // object. This keeps the merging logic simple, as if there isn't an old playlist to
    // compare with, then it is harder to position it. However, this can be resolved with
    // matching presentation times in another playlist (or matching presentation time
    // ranges within timelines) and sequencing from there.
    newManifest.playlists =
      newManifest.playlists.filter((playlist) => !includes(addedPlaylists, playlist));
    removeMediaGroupPlaylists({
      manifest: newManifest,
      playlists: addedMediaGroupPlaylists.map((idObject) => idObject.playlist)
    });
  }

  positionPlaylistsOnTimeline({
    oldPlaylists: oldManifest.playlists,
    newPlaylists: newManifest.playlists
  });
  positionMediaGroupPlaylistsOnTimeline({ oldManifest, newManifest });

  newManifest.playlistsToExclude = removedPlaylists.concat(incompletePlaylists);
  newManifest.mediaGroupPlaylistsToExclude =
      removedMediaGroupPlaylists.concat(incompleteMediaGroupPlaylistIdObjects);

  return newManifest;
};
