import { merge } from './utils/object';
import { segmentsFromTemplate } from './segment/segmentTemplate';
import { segmentsFromList } from './segment/segmentList';
import { segmentsFromBase } from './segment/segmentBase';

export const generateSegments = (segmentInfo, attributes) => {
  if (segmentInfo.template) {
    return segmentsFromTemplate(
      merge(attributes, segmentInfo.template),
      segmentInfo.timeline
    );
  }
  if (segmentInfo.base) {
    return segmentsFromBase(merge(attributes, segmentInfo.base));
  }
  if (segmentInfo.list) {
    return segmentsFromList(
      merge(attributes, segmentInfo.list), segmentInfo.timeline
    );
  }
};

export const toPlaylists = (representations) => {
  return representations.map(({ attributes, segmentInfo }) => {
    const segments = generateSegments(segmentInfo, attributes);

    return { attributes, segments };
  });
};
