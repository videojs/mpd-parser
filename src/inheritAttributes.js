import { flatten } from './utils/list';
import { merge } from './utils/object';
import { findChildren, getContent } from './utils/xml';
import { parseAttributes } from './parseAttributes';
import { generateSegments } from './segment/generateSegments';
import resolveUrl from './utils/resolveUrl';
import decodeB64ToUint8Array from './utils/decodeB64ToUint8Array';

const keySystemsMap = {
  'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b': 'org.w3.clearkey',
  'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed': 'com.widevine.alpha',
  'urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95': 'com.microsoft.playready',
  'urn:uuid:f239e769-efa3-4850-9c16-a903c6932efb': 'com.adobe.primetime',
  'urn:mpeg:dash:mp4protection:2011': 'cenc'
};

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
 * Tranforms a series of content protection nodes to
 * an object containing pssh data by key system
 *
 * @param {Node[]} contentProtectionNodes
 *        Content protection nodes
 * @return {Object}
 *        Object containing pssh data by key system
 */
export const generateKeySystemInformation = (contentProtectionNodes) => {
  return contentProtectionNodes.reduce((acc, node) => {
    const attributes = parseAttributes(node);
    const keySystem = keySystemsMap[attributes.schemeIdUri];

    if (keySystem) {
      acc[keySystem] = { attributes };

      const psshNode = findChildren(node, 'cenc:pssh')[0];

      if (psshNode) {
        const pssh = getContent(psshNode);
        const psshBuffer = pssh && decodeB64ToUint8Array(pssh);

        acc[keySystem].pssh = psshBuffer;
      } else if (attributes['cenc:default_KID']) {
        acc.defaultKeyId = attributes['cenc:default_KID'];
      }

    } else {
      console.error(`unknown key system ${attributes.schemeIdUri}`); // eslint-disable-line no-console
    }

    return acc;
  }, {});
};

/**
 * Traverses the mpd xml tree to generate a list of Representation information objects
 * that have inherited attributes from parent nodes
 *
 * @param {Node} mpdEl
 *        The root node of the mpd
 * @param {Object} options
 *        Available options for inheritAttributes
 * @param {string} options.manifestUri
 *        The uri source of the mpd
 * @param {number} options.NOW
 *        Current time per DASH IOP.  Default is current time in ms since epoch
 * @param {number} options.clientOffset
 *        Client time difference from NOW (in milliseconds)
 * @return {Object}
 *         Object representing the parsed MPD tree
 */
export const parseMpdTree = (mpdEl, options = {}) => {
  const {
    manifestUri = '',
    NOW = Date.now(),
    clientOffset = 0
  } = options;

  const mpdAttributes = parseAttributes(mpdEl);
  const mpdBaseUrls = buildBaseUrls([ manifestUri ], findChildren(mpdEl, 'BaseURL'));

  mpdAttributes.sourceDuration = mpdAttributes.mediaPresentationDuration || 0;
  mpdAttributes.NOW = NOW;
  mpdAttributes.clientOffset = clientOffset;

  const periods = {};
  const mpdObj = {
    attributes: mpdAttributes,
    periods
  };

  findChildren(mpdEl, 'Period').forEach((periodEl, periodIndex, periodEls) => {
    const periodBaseUrls = buildBaseUrls(mpdBaseUrls, findChildren(periodEl, 'BaseURL'));
    const periodAttrs = parseAttributes(periodEl);

    if (periodAttrs.duration === undefined) {
      // if we have a next period with a start time, we can figure out the duration
      const nextperiodAttrs = parseAttributes(periodEls[periodIndex + 1]);

      if (nextperiodAttrs && nextperiodAttrs.start) {
        periodAttrs.duration = nextperiodAttrs.start - periodAttrs.start;
        periodAttrs.end = nextperiodAttrs.start;
      }
    }
    periodAttrs.periodDuration = periodAttrs.duration;

    const mergedAttributes = merge(mpdAttributes, periodAttrs);
    const adaptationSets = {};
    const adaptationSetEls = findChildren(periodEl, 'AdaptationSet');
    let nextAdaptationSets;

    // if we have a next period, grab the start numbers so we can figure out
    // the max end number for the current period
    if (periodEls[periodIndex + 1]) {
      nextAdaptationSets = findChildren(periodEls[periodIndex + 1], 'AdaptationSet');
      for (let i = 0; i < adaptationSetEls.length; i++) {
        for (let j = 0; j < nextAdaptationSets.length; j++) {
          if (nextAdaptationSets[j].id === adaptationSetEls[i].id) {
            const segmentTemplate = findChildren(adaptationSetEls[i], 'SegmentTemplate')[0];
            const nextSegmentTemplate = findChildren(nextAdaptationSets[j], 'SegmentTemplate')[0];

            segmentTemplate.setAttribute('endNumber', nextSegmentTemplate.getAttribute('startNumber'));
          }
        }
      }
    }

    const periodObj = {
      mpd: mpdObj,
      index: periodIndex,
      id: periodAttrs.id || periodIndex,
      attributes: mergedAttributes,
      adaptationSets
    };

    adaptationSetEls.forEach((adaptationSetEl, adaptationSetIndex) => {
      const adaptationSetAttributes = parseAttributes(adaptationSetEl);
      const adaptationSetBaseUrls = buildBaseUrls(periodBaseUrls,
        findChildren(adaptationSetEl, 'BaseURL'));
      const segmentTemplate = findChildren(adaptationSetEl, 'SegmentTemplate')[0];
      const startNumber = parseAttributes(segmentTemplate).startNumber;
      const role = findChildren(adaptationSetEl, 'Role')[0];
      const roleAttributes = { role: parseAttributes(role) };
      const supplementalProperties = {};
      const closedCaptions = {};
      const contentProtection = generateKeySystemInformation(
        findChildren(adaptationSetEl, 'ContentProtection'));
      let continuesPeriod;

      findChildren(adaptationSetEl, 'SupplementalProperty').forEach(property => {
        property = parseAttributes(property);
        supplementalProperties[property.schemeIdUri] = property.value;
        if (property.schemeIdUri.match(/urn:mpeg:dash:period[_-]continuity:201\d/)) {
          continuesPeriod = property.value;
        }
      });

      findChildren(adaptationSetEl, 'Accessibility').forEach(element => {
        element = parseAttributes(element);
        if (element.schemeIdUri === 'urn:scte:dash:cc:cea-608:2015') {
          element.value.split(';').forEach(captionDescPair => {
            captionDescPair = captionDescPair.split('=');
            closedCaptions[captionDescPair[0]] = captionDescPair[1];
          });
        }
      });

      let attrs = merge(periodObj.attributes, adaptationSetAttributes,
        roleAttributes, {baseUrls: adaptationSetBaseUrls, startNumber});

      if (Object.keys(contentProtection).length) {
        attrs = merge(attrs, { contentProtection });
      }

      attrs.segmentInfo = getSegmentInformation(adaptationSetEl);

      const representations = {};
      const adaptationSetObj = {
        id: adaptationSetAttributes.id || adaptationSetIndex,
        index: adaptationSetIndex,
        attributes: attrs,
        representations,
        period: periodObj,
        supplementalProperties,
        contentProtection,
        closedCaptions,
        continuesPeriod
      };

      // would this be better as a `reduce`?
      findChildren(adaptationSetEl, 'Representation').forEach((representationEl, representationIndex) => {
        const baseUrlElements = findChildren(representationEl, 'BaseURL');
        const baseUrls = buildBaseUrls(adaptationSetObj.attributes.baseUrls, baseUrlElements);
        const segmentInfo = merge(adaptationSetObj.attributes.segmentInfo,
          getSegmentInformation(representationEl));
        const representationAttributes = merge(adaptationSetObj.attributes,
          parseAttributes(representationEl), {segmentInfo, baseUrl: baseUrls[0]});
        const segments = generateSegments({
          attributes: merge(representationAttributes, {periodId: periodObj.id}),
          segmentInfo
        });

        representations[representationAttributes.id || representationIndex] = {
          id: representationAttributes.id || representationIndex,
          index: representationIndex,
          attributes: representationAttributes,
          adaptationSet: adaptationSetObj,
          segments
        };

      });

      adaptationSets[adaptationSetObj.id] = adaptationSetObj;
    });
    periods[periodObj.id] = periodObj;
  });

  return mpdObj;
};
