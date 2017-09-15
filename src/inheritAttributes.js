import { shallowMerge, flatten, getAttributes, parseDuration } from './fns';

export const inheritAttributes = mpd => {
  const BaseUrl = mpd.getElementsByTagName('BaseURL');
  const baseUrl = BaseUrl && BaseUrl.length ? BaseUrl[0].innerHTML : '';

  const mpdAttributes = getAttributes(mpd);

  mpdAttributes.sourceDuration = mpdAttributes.mediaPresentationDuration ?
    parseDuration(mpdAttributes.mediaPresentationDuration) : 0;

  const periods = Array.from(mpd.getElementsByTagName('Period'));

  if (periods.length &&
      periods.length !== 1) {
    // TODO add support for multiperiod
    throw new Error('INVALID_NUMBER_OF_PERIOD');
  }

  const representationsByPeriod = periods.map((period, periodIndex) => {
    const adaptationSets = Array.from(period.getElementsByTagName('AdaptationSet'));

    const representationsByAdaptationSet = adaptationSets.map(adaptationSet => {
      const adaptationSetAttributes = getAttributes(adaptationSet);

      const role = adaptationSet.getElementsByTagName('Representation');
      const roleAttributes = getAttributes(role);

      const attrs = shallowMerge({ baseUrl, periodIndex }, mpdAttributes, adaptationSetAttributes, roleAttributes);

      const segmentType = {
        segmentTemplate: adaptationSet.getElementsByTagName('SegmentTemplate')[0],
        segmentList: adaptationSet.getElementsByTagName('SegmentList')[0],
        segmentBase: adaptationSet.getElementsByTagName('SegmentBase')[0]
      };

      const representations = Array.from(adaptationSet.getElementsByTagName('Representation'));

      const inherit = representation => {
        const attributes = shallowMerge(attrs, getAttributes(representation));

        return { attributes, segmentType };
      };

      return representations.map(inherit);
    });

    return flatten(representationsByAdaptationSet);
  });

  return flatten(representationsByPeriod);
};

