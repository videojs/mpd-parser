import { shallowMerge } from './utils/object';
import { segmentsFromTemplate } from './segment/segmentTemplate';
import { segmentsFromList } from './segment/segmentList';
import { segmentsFromBase } from './segment/segmentBase';

export const generateSegments = (segmentInfo, attributes) => {
  if (segmentInfo.template) {
    return segmentsFromTemplate(
      shallowMerge(segmentInfo.template, attributes),
      segmentInfo.timeline
    );
  }

  if (segmentInfo.base) {
    return segmentsFromBase(shallowMerge(segmentInfo.base, attributes));
  }

  if (segmentInfo.list) {
    return segmentsFromList(
      shallowMerge(segmentInfo.list, attributes), segmentInfo.timeline
    );
  }
};

export const toPlaylists = representations => {
  return representations.map(({ attributes, segmentInfo }) => {
    const segments = generateSegments(segmentInfo, attributes);

    return { attributes, segments };
  });
};
