import { shallowMerge } from './utils/object';
import errors from './errors';
import { segmentsFromTemplate } from './segmentTemplate';
import { segmentsFromList } from './segmentList';
import { segmentsFromBase } from './segmentBase';

export const generateSegments = (segmentInfo, attributes) => {
  if (segmentInfo.template) {
    return segmentsFromTemplate(
      shallowMerge(segmentInfo.template, attributes),
      segmentInfo.timeline
    );
  }

  // TODO
  if (segmentInfo.base) {
    return segmentsFromBase(shallowMerge(segmentInfo.base, attributes));
  }

  if (segmentInfo.list) {
    return segmentsFromList(
      shallowMerge(segmentInfo.list, attributes)
    );
  }
};

export const toPlaylists = representations => {
  return representations.map(({ attributes, segmentInfo }) => {
    const segments = generateSegments(segmentInfo, attributes);

    return { attributes, segments };
  });
};
