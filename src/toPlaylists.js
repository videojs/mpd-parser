import { merge } from './utils/object';
import { segmentsFromTemplate } from './segment/segmentTemplate';
import { segmentsFromList } from './segment/segmentList';
import { segmentsFromBase } from './segment/segmentBase';

export const generateSegments = ({ attributes, segmentInfo }) => {
  let segmentAttributes;
  let segmentsFn;

  if (segmentInfo.template) {
    segmentsFn = segmentsFromTemplate;
    segmentAttributes = merge(attributes, segmentInfo.template);
    // TODO: Decide if SegmentList be chosen ahead of SegmentBase.
    //
    // Judging by the specification (see the 2012 specification, section 5.3.9.2),
    // SegmentBase seems to only be used as the strategy if there's no SegmentTemplate or
    // SegmentList. However, the historical ordering here will use SegmentBase as the
    // strategy before SegmentList. This ordering should be reconsidered.
  } else if (segmentInfo.base) {
    segmentsFn = segmentsFromBase;
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

  const segments = segmentsFn(segmentAttributes, segmentInfo.segmentTimeline);

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

  // This is a sidx box without actual segment information
  if (segmentInfo.base && segmentAttributes.indexRange) {
    segmentsInfo.sidx = segments[0];
    segmentsInfo.segments = [];
  }

  return segmentsInfo;
};

export const toPlaylists = (representations) => representations.map(generateSegments);
