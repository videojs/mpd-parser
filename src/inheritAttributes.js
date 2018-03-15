import { flatten } from './utils/list';
import { merge } from './utils/object';
import { findChildren, getContent } from './utils/xml';
import { parseAttributes } from './parseAttributes';
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
    .map(s => merge({ tag: 'SegmentURL' }, parseAttributes(s)));
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
  const template = segmentTemplate && parseAttributes(segmentTemplate);

  if (template && segmentInitialization) {
    template.initialization =
      (segmentInitialization && parseAttributes(segmentInitialization));
  } else if (template && template.initialization) {
    // If it is @initialization we convert it to an object since this is the format that
    // later functions will rely on for the initialization segment.  This is only valid
    // for <SegmentTemplate>
    template.initialization = { sourceURL: template.initialization };
  }

  const segmentInfo = {
    template,
    timeline: segmentTimeline &&
      findChildren(segmentTimeline, 'S').map(s => parseAttributes(s)),
    list: segmentList && merge(
      parseAttributes(segmentList),
      {
        segmentUrls,
        initialization: parseAttributes(segmentInitialization)
      }),
    base: segmentBase && merge(
      parseAttributes(segmentBase), {
        initialization: parseAttributes(segmentInitialization)
      })
  };

  Object.keys(segmentInfo).forEach(key => {
    if (!segmentInfo[key]) {
      delete segmentInfo[key];
    }
  });

  return segmentInfo;
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
 * @param {SegmentInformation} adaptationSetSegmentInfo
 *        Contains Segment information for the AdaptationSet
 * @return {inheritBaseUrlsCallback}
 *         Callback map function
 */
export const inheritBaseUrls =
(adaptationSetAttributes, adaptationSetBaseUrls, adaptationSetSegmentInfo) =>
(representation) => {
  const repBaseUrlElements = findChildren(representation, 'BaseURL');
  const repBaseUrls = buildBaseUrls(adaptationSetBaseUrls, repBaseUrlElements);
  const attributes = merge(adaptationSetAttributes, parseAttributes(representation));
  const representationSegmentInfo = getSegmentInformation(representation);

  return repBaseUrls.map(baseUrl => {
    return {
      segmentInfo: merge(adaptationSetSegmentInfo, representationSegmentInfo),
      attributes: merge(attributes, { baseUrl })
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
 * @param {string[]} periodSegmentInfo
 *        Contains Segment Information at the period level
 * @return {toRepresentationsCallback}
 *         Callback map function
 */
export const toRepresentations =
(periodAttributes, periodBaseUrls, periodSegmentInfo) => (adaptationSet) => {
  const adaptationSetAttributes = parseAttributes(adaptationSet);
  const adaptationSetBaseUrls = buildBaseUrls(periodBaseUrls,
                                              findChildren(adaptationSet, 'BaseURL'));
  const role = findChildren(adaptationSet, 'Role')[0];
  const roleAttributes = { role: parseAttributes(role) };
  const attrs = merge(periodAttributes,
                      adaptationSetAttributes,
                      roleAttributes);
  const segmentInfo = getSegmentInformation(adaptationSet);
  const representations = findChildren(adaptationSet, 'Representation');
  const adaptationSetSegmentInfo = merge(periodSegmentInfo, segmentInfo);

  return flatten(representations.map(
    inheritBaseUrls(attrs, adaptationSetBaseUrls, adaptationSetSegmentInfo)));
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
  const periodAtt = parseAttributes(period);
  const periodAttributes = merge(mpdAttributes, periodAtt, { periodIndex });
  const adaptationSets = findChildren(period, 'AdaptationSet');
  const periodSegmentInfo = getSegmentInformation(period);

  return flatten(adaptationSets.map(
    toRepresentations(periodAttributes, periodBaseUrls, periodSegmentInfo)));
};

/**
 * Traverses the mpd xml tree to generate a list of Representation information objects
 * that have inherited attributes from parent nodes
 *
 * @param {Node} mpd
 *        The root node of the mpd
 * @param {Object} options
 *        Available options for inheritAttributes
 * @param {string} options.manifestUri
 *        The uri source of the mpd
 * @param {number} options.NOW
 *        Current time per DASH IOP.  Default is current time in ms since epoch
 * @param {number} options.clientOffset
 *        Client time difference from NOW (in milliseconds)
 * @return {RepresentationInformation[]}
 *         List of objects containing Representation information
 */
export const inheritAttributes = (mpd, options = {}) => {
  const {
    manifestUri = '',
    NOW = Date.now(),
    clientOffset = 0
  } = options;
  const periods = findChildren(mpd, 'Period');

  if (periods.length !== 1) {
    // TODO add support for multiperiod
    throw new Error(errors.INVALID_NUMBER_OF_PERIOD);
  }

  const mpdAttributes = parseAttributes(mpd);
  const mpdBaseUrls = buildBaseUrls([ manifestUri ], findChildren(mpd, 'BaseURL'));

  mpdAttributes.sourceDuration = mpdAttributes.mediaPresentationDuration || 0;
  mpdAttributes.NOW = NOW;
  mpdAttributes.clientOffset = clientOffset;

  return flatten(periods.map(toAdaptationSets(mpdAttributes, mpdBaseUrls)));
};
