import { flatten } from './utils/list';
import { shallowMerge, getAttributes } from './utils/object';
import { parseDuration } from './utils/time';
import { findChildren, getContent } from './utils/xml';
import resolveUrl from './resolveUrl';
import errors from './errors';

export const rep = mpdAttributes => (period, periodIndex) => {
  const adaptationSets = findChildren(period, 'AdaptationSet');

  const representationsByAdaptationSet = adaptationSets.map(adaptationSet => {
    const adaptationSetAttributes = getAttributes(adaptationSet);

    const role = findChildren(adaptationSet, 'Role')[0];
    const roleAttributes = { role: getAttributes(role) };

    const attrs = shallowMerge({ periodIndex },
                              mpdAttributes,
                              adaptationSetAttributes,
                              roleAttributes);

    const segmentTemplate = findChildren(adaptationSet, 'SegmentTemplate')[0];
    const segmentTimeline =
      segmentTemplate && findChildren(segmentTemplate, 'SegmentTimeline')[0];
    const segmentList = findChildren(adaptationSet, 'SegmentList')[0];
    const segmentBase = findChildren(adaptationSet, 'SegmentBase')[0];

    const segmentInfo = {
      template: segmentTemplate && getAttributes(segmentTemplate),
      timeline: segmentTimeline &&
                       findChildren(segmentTimeline, 'S').map(s => getAttributes(s)),
      list: segmentList && getAttributes(segmentList),
      base: segmentBase && getAttributes(segmentBase)
    };

    const representations = findChildren(adaptationSet, 'Representation');

    const inherit = representation => {
      // vtt tracks may use single file in BaseURL
      const baseUrlElement = findChildren(representation, 'BaseURL')[0];
      const baseUrl = baseUrlElement ? getContent(baseUrlElement) : '';
      const attributes = shallowMerge(attrs,
                                      getAttributes(representation),
                                      { url: baseUrl });

      return { attributes, segmentInfo };
    };

    return representations.map(inherit);
  });

  return flatten(representationsByAdaptationSet);
};

export const representationsByPeriod = (periods, mpdAttributes) => {
  return periods.map(rep(mpdAttributes));
};

export const inheritAttributes = (mpd, manifestUri = '') => {
  const periods = findChildren(mpd, 'Period');

  if (!periods.length ||
      periods.length &&
      periods.length !== 1) {
    // TODO add support for multiperiod
    throw new Error(errors.INVALID_NUMBER_OF_PERIOD);
  }

  const mpdAttributes = getAttributes(mpd);
  const baseUrlElement = findChildren(mpd, 'BaseURL')[0];
  const baseUrl = baseUrlElement ? getContent(baseUrlElement) : '';

  mpdAttributes.baseUrl = resolveUrl(manifestUri, baseUrl);
  mpdAttributes.sourceDuration = mpdAttributes.mediaPresentationDuration ?
    parseDuration(mpdAttributes.mediaPresentationDuration) : 0;

  return flatten(representationsByPeriod(periods, mpdAttributes));
};

