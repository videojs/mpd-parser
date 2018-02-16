import { shallowMerge } from './utils/object';
import { segmentsFromTemplate } from './segment/segmentTemplate';
import { segmentsFromList } from './segment/segmentList';
import { segmentsFromBase } from './segment/segmentBase';
// import merge from 'deepmerge';
export const generateSegments = (segmentInfo, attributes) => {
  if (segmentInfo.template) {
    return segmentsFromTemplate(
      shallowMerge(attributes, segmentInfo.template),
      segmentInfo.timeline
    );
  }
  if (segmentInfo.base) {
    return segmentsFromBase(shallowMerge(attributes, segmentInfo.base));
  }
  if (segmentInfo.list) {
    return segmentsFromList(
      shallowMerge(attributes, segmentInfo.list), segmentInfo.timeline
    );
  }
};

export const toPlaylists = (representations) => {
  return representations.map(({ attributes, segmentInfo }) => {
    const segments = generateSegments(segmentInfo, attributes);

    return { attributes, segments };
  });
};
