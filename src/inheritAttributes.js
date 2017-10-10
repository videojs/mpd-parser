import { flatten } from './utils/list';
import { shallowMerge, getAttributes } from './utils/object';
import { parseDuration } from './utils/time';
import resolveUrl from './resolveUrl';
import errors from './errors';

export const rep = mpdAttributes => (period, periodIndex) => {
  const adaptationSets = Array.from(period.getElementsByTagName('AdaptationSet'));

  const representationsByAdaptationSet = adaptationSets.map(adaptationSet => {
    const adaptationSetAttributes = getAttributes(adaptationSet);

    const role = adaptationSet.getElementsByTagName('Role')[0];
    const roleAttributes = { role: getAttributes(role) };

    const attrs = shallowMerge({ periodIndex }, mpdAttributes, adaptationSetAttributes, roleAttributes);

    const segmentTemplate = adaptationSet.getElementsByTagName('SegmentTemplate')[0];
    const segmentList = adaptationSet.getElementsByTagName('SegmentList')[0];
    const segmentBase = adaptationSet.getElementsByTagName('SegmentBase')[0];

    const segmentType = {
      segmentTemplate: segmentTemplate && getAttributes(segmentTemplate),
      segmentList: segmentList && getAttributes(segmentList),
      segmentBase: segmentBase && getAttributes(segmentBase)
    };

    const representations = Array.from(adaptationSet.getElementsByTagName('Representation'));

    const inherit = representation => {
      // vtt tracks may use single file in BaseURL
      let baseUrl = representation.getElementsByTagName('BaseURL')[0];

      baseUrl = baseUrl && baseUrl.innerHTML || '';
      const attributes = shallowMerge(attrs, getAttributes(representation), { url: baseUrl });

      return { attributes, segmentType };
    };

    return representations.map(inherit);
  });

  return flatten(representationsByAdaptationSet);
};

export const representationsByPeriod = (periods, mpdAttributes) => {
  return periods.map(rep(mpdAttributes));
};

export const inheritAttributes = (mpd, manifestUri = '') => {
  const periods = Array.from(mpd.getElementsByTagName('Period'));

  if (!periods.length ||
      periods.length &&
      periods.length !== 1) {
    // TODO add support for multiperiod
    throw new Error(errors.INVALID_NUMBER_OF_PERIOD);
  }

  const mpdAttributes = getAttributes(mpd);
  const BaseUrl = mpd.getElementsByTagName('BaseURL');

  const baseUrl = BaseUrl && BaseUrl.length ? BaseUrl[0].innerHTML : '';

  mpdAttributes.baseUrl = resolveUrl(manifestUri, baseUrl);
  mpdAttributes.sourceDuration = mpdAttributes.mediaPresentationDuration ?
    parseDuration(mpdAttributes.mediaPresentationDuration) : 0;

  return flatten(representationsByPeriod(periods, mpdAttributes));
};

