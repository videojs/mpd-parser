import { shallowMerge } from './utils/object';
import errors from './errors';
import { segmentsFromTemplate } from './segmentTemplate';

// TODO
export const segmentsFromBase = x => [{ uri: '' }];

// TODO
export const segmentsFromList = x => [{ uri: '' }];

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

  // TODO
  if (segmentInfo.list) {
    throw new Error(errors.UNSUPPORTED_SEGMENTATION_TYPE);

    // return segmentsFromList(attributes);
  }
};

export const toPlaylists = representations => {
  return representations.map(({ attributes, segmentInfo }) => {
    const segments = generateSegments(segmentInfo, attributes);

    return { attributes, segments };
  });
};
