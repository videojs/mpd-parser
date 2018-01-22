import { shallowMerge } from './utils/object';
import errors from './errors';
import { segmentsFromTemplate } from './segmentTemplate';
import { segmentsFromList } from './segmentList';

// TODO
export const segmentsFromBase = x => [{ uri: '' }];

// TODO

export const generateSegments = (segmentInfo, attributes) => {
  if (segmentInfo.template) {
    return segmentsFromTemplate(
      shallowMerge(segmentInfo.template, attributes),
      segmentInfo.timeline
    );
  }

  // TODO
  if (segmentInfo.base) {
    throw new Error(errors.UNSUPPORTED_SEGMENTATION_TYPE);

    // return segmentsFromBase(attributes);
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
