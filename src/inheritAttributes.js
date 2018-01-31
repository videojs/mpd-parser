import { flatten } from './utils/list';
import { shallowMerge, getAttributes } from './utils/object';
import { parseDuration } from './utils/time';
import { findChildren, getContent } from './utils/xml';
import resolveUrl from './utils/resolveUrl';
import errors from './errors';

/**
 * Builds a list of urls that is the product of the reference urls and BaseURL values
 *
 * @param {string[]} referenceUrls
 *        List of reference urls to resolve to
 * @param {Node[]} baseUrlElements
 *        List of BaseURL nodes from the mpd
 * @return {string[]}
 *         List of resolved urls
 */
export const buildBaseUrls = (referenceUrls, baseUrlElements) => {
  if (!baseUrlElements.length) {
    return referenceUrls;
  }

  return flatten(
    referenceUrls.map(
      reference => baseUrlElements.map(
        baseUrlElement => resolveUrl(reference, getContent(baseUrlElement)))));
};

/**
 * Contains all Segment information for its containing AdaptationSet
 *
 * @typedef {Object} SegmentInformation
 * @property {Object|undefined} template
 *           Contains the attributes for the SegmentTemplate node
 * @property {Object[]|undefined} timeline
 *           Contains a list of atrributes for each S node within the SegmentTimeline node
 * @property {Object|undefined} list
 *           Contains the attributes for the SegmentList node
 * @property {Object|undefined} base
 *           Contains the attributes for the SegmentBase node
 */

/**
 * Returns all available Segment information contained within the AdaptationSet node
 *
 * @param {Node} adaptationSet
 *        The AdaptationSet node to get Segment information from
 * @return {SegmentInformation}
 *         The Segment information contained within the provided AdaptationSet
 */
export const getSegmentInformation = (adaptationSet) => {
  const segmentTemplate = findChildren(adaptationSet, 'SegmentTemplate')[0];
  const segmentList = findChildren(adaptationSet, 'SegmentList')[0];
  const segmentUrls = segmentList && findChildren(segmentList, 'SegmentURL')
    .map(s => shallowMerge({ tag: 'SegmentURL' }, getAttributes(s)));
  const segmentBase = findChildren(adaptationSet, 'SegmentBase')[0];
  const segmentTimelineParentNode = segmentList || segmentTemplate;
  const segmentTimeline = segmentTimelineParentNode &&
    findChildren(segmentTimelineParentNode, 'SegmentTimeline')[0];
  const segmentInitializationParentNode = segmentList || segmentBase || segmentTemplate;
  const segmentInitialization = segmentInitializationParentNode &&
    findChildren(segmentInitializationParentNode, 'Initialization')[0];

  // SegmentTemplate is handled slightly differently, since it can have both
  // @initialization and an <Initialization> node.  @initialization can be templated,
  // while the node can have a url and range specified.  If the <SegmentTemplate> has
  // both @initialization and an <Initialization> subelement we opt to override with
  // the node, as this interaction is not defined in the spec.
  const template = segmentTemplate && getAttributes(segmentTemplate);

  if (template && segmentInitialization) {
    template.initialization =
      (segmentInitialization && getAttributes(segmentInitialization));
  } else if (template && template.initialization) {
    // If it is @initialization we convert it to an object since this is the format that
    // later functions will rely on for the initialization segment.  This is only valid
    // for <SegmentTemplate>
    template.initialization = { sourceURL: template.initialization };
  }

  return {
    template,
    timeline: segmentTimeline &&
      findChildren(segmentTimeline, 'S').map(s => getAttributes(s)),
    list: segmentList && shallowMerge(
      getAttributes(segmentList),
      {
        segmentUrls,
        initialization: getAttributes(segmentInitialization)
      }),
    base: segmentBase && shallowMerge(
      getAttributes(segmentBase), {
        initialization: getAttributes(segmentInitialization)
      })
  };
};

/**
 * Contains Segment information and attributes needed to construct a Playlist object
 * from a Representation
 *
 * @typedef {Object} RepresentationInformation
 * @property {SegmentInformation} segmentInfo
 *           Segment information for this Representation
 * @property {Object} attributes
 *           Inherited attributes for this Representation
 */

/**
 * Maps a Representation node to an object containing Segment information and attributes
 *
 * @name inheritBaseUrlsCallback
 * @function
 * @param {Node} representation
 *        Representation node from the mpd
 * @return {RepresentationInformation}
 *         Representation information needed to construct a Playlist object
 */

/**
 * Returns a callback for Array.prototype.map for mapping Representation nodes to
 * Segment information and attributes using inherited BaseURL nodes.
 *
 * @param {Object} adaptationSetAttributes
 *        Contains attributes inherited by the AdaptationSet
 * @param {string[]} adaptationSetBaseUrls
 *        Contains list of resolved base urls inherited by the AdaptationSet
 * @param {SegmentInformation} segmentInfo
 *        Contains Segment information for the AdaptationSet
 * @return {inheritBaseUrlsCallback}
 *         Callback map function
 */
export const inheritBaseUrls =
(adaptationSetAttributes, adaptationSetBaseUrls, segmentInfo) => (representation) => {
  const repBaseUrlElements = findChildren(representation, 'BaseURL');
  const repBaseUrls = buildBaseUrls(adaptationSetBaseUrls, repBaseUrlElements);
  const attributes = shallowMerge(adaptationSetAttributes, getAttributes(representation));

  return repBaseUrls.map(baseUrl => {
    return {
      segmentInfo,
      attributes: shallowMerge(attributes, { baseUrl })
    };
  });
};

/**
 * Maps an AdaptationSet node to a list of Representation information objects
 *
 * @name toRepresentationsCallback
 * @function
 * @param {Node} adaptationSet
 *        AdaptationSet node from the mpd
 * @return {RepresentationInformation[]}
 *         List of objects containing Representaion information
 */

/**
 * Returns a callback for Array.prototype.map for mapping AdaptationSet nodes to a list of
 * Representation information objects
 *
 * @param {Object} periodAttributes
 *        Contains attributes inherited by the Period
 * @param {string[]} periodBaseUrls
 *        Contains list of resolved base urls inherited by the Period
 * @return {toRepresentationsCallback}
 *         Callback map function
 */
export const toRepresentations =
(periodAttributes, periodBaseUrls) => (adaptationSet) => {
  const adaptationSetAttributes = getAttributes(adaptationSet);
  const adaptationSetBaseUrls = buildBaseUrls(periodBaseUrls,
                                              findChildren(adaptationSet, 'BaseURL'));
  const role = findChildren(adaptationSet, 'Role')[0];
  const roleAttributes = { role: getAttributes(role) };
  const attrs = shallowMerge(periodAttributes,
                             adaptationSetAttributes,
                             roleAttributes);
  const segmentInfo = getSegmentInformation(adaptationSet);
  const representations = findChildren(adaptationSet, 'Representation');

  return flatten(
    representations.map(inheritBaseUrls(attrs, adaptationSetBaseUrls, segmentInfo)));
};

/**
 * Maps an Period node to a list of Representation inforamtion objects for all
 * AdaptationSet nodes contained within the Period
 *
 * @name toAdaptationSetsCallback
 * @function
 * @param {Node} period
 *        Period node from the mpd
 * @param {number} periodIndex
 *        Index of the Period within the mpd
 * @return {RepresentationInformation[]}
 *         List of objects containing Representaion information
 */

/**
 * Returns a callback for Array.prototype.map for mapping Period nodes to a list of
 * Representation information objects
 *
 * @param {Object} mpdAttributes
 *        Contains attributes inherited by the mpd
 * @param {string[]} mpdBaseUrls
 *        Contains list of resolved base urls inherited by the mpd
 * @return {toAdaptationSetsCallback}
 *         Callback map function
 */
export const toAdaptationSets = (mpdAttributes, mpdBaseUrls) => (period, periodIndex) => {
  const periodBaseUrls = buildBaseUrls(mpdBaseUrls, findChildren(period, 'BaseURL'));
  const periodAttributes = shallowMerge({ periodIndex }, mpdAttributes);
  const adaptationSets = findChildren(period, 'AdaptationSet');

  return flatten(adaptationSets.map(toRepresentations(periodAttributes, periodBaseUrls)));
};

/**
 * Traverses the mpd xml tree to generate a list of Representation information objects
 * that have inherited attributes from parent nodes
 *
 * @param {Node} mpd
 *        The root node of the mpd
 * @param {string} manifestUri
 *        The uri of the source mpd
 * @return {RepresentationInformation[]}
 *         List of objects containing Representation information
 */
export const inheritAttributes = (mpd, manifestUri = '') => {
  const periods = findChildren(mpd, 'Period');

  if (periods.length !== 1) {
    // TODO add support for multiperiod
    throw new Error(errors.INVALID_NUMBER_OF_PERIOD);
  }

  const mpdAttributes = getAttributes(mpd);
  const mpdBaseUrls = buildBaseUrls([ manifestUri ], findChildren(mpd, 'BaseURL'));

  mpdAttributes.sourceDuration = mpdAttributes.mediaPresentationDuration ?
    parseDuration(mpdAttributes.mediaPresentationDuration) : 0;

  return flatten(periods.map(toAdaptationSets(mpdAttributes, mpdBaseUrls)));
};

