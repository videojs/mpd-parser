import { merge } from './utils/object';
import { segmentsFromTemplate } from './segment/segmentTemplate';
import { segmentsFromList } from './segment/segmentList';
import {
  segmentsFromBase,
  sidxFromBase
} from './segment/segmentBase';

export const generateSegments = ({ attributes, segmentInfo }) => {
  let segmentAttributes;
  let segmentsFn;
  let sidxFn;

  if (segmentInfo.template) {
    segmentsFn = segmentsFromTemplate;
    segmentAttributes = merge(attributes, segmentInfo.template);
  } else if (segmentInfo.base) {
    segmentsFn = segmentsFromBase;
    sidxFn = sidxFromBase;
    segmentAttributes = merge(attributes, segmentInfo.base);
  } else if (segmentInfo.list) {
    segmentsFn = segmentsFromList;
    segmentAttributes = merge(attributes, segmentInfo.list);
  }

  const segmentsInfo = {
    attributes
  };

  if (!segmentsFn) {
    return segmentsInfo;
  }

  const segments = segmentsFn(segmentAttributes, segmentInfo.timeline);
  let sidx;

  if (sidxFn) {
    sidx = sidxFn(segmentAttributes);
  }

  // The @duration attribute will be used to determin the playlist's targetDuration which
  // must be in seconds. Since we've generated the segment list, we no longer need
  // @duration to be in @timescale units, so we can convert it here.
  if (segmentAttributes.duration) {
    const { duration, timescale = 1 } = segmentAttributes;

    segmentAttributes.duration = duration / timescale;
  } else if (segments.length) {
    // if there is no @duration attribute, use the largest segment duration as
    // as target duration
    segmentAttributes.duration = segments.reduce((max, segment) => {
      return Math.max(max, Math.ceil(segment.duration));
    }, 0);
  } else {
    segmentAttributes.duration = 0;
  }

  segmentsInfo.attributes = segmentAttributes;
  segmentsInfo.segments = segments;

  if (sidx) {
    segmentsInfo.sidx = sidx;
  }

  return segmentsInfo;
};

export const toPlaylists = (representations) => representations.map(generateSegments);
