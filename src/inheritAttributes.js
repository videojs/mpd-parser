import { flatten } from './utils/list';
import { merge } from './utils/object';
import { findChildren, getContent } from './utils/xml';
import { parseAttributes } from './parseAttributes';
import errors from './errors';
import resolveUrl from '@videojs/vhs-utils/es/resolve-url';
import decodeB64ToUint8Array from '@videojs/vhs-utils/es/decode-b64-to-uint8-array';

const keySystemsMap = {
  'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b': 'org.w3.clearkey',
  'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed': 'com.widevine.alpha',
  'urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95': 'com.microsoft.playready',
  'urn:uuid:f239e769-efa3-4850-9c16-a903c6932efb': 'com.adobe.primetime'
};

/**
 * Builds a list of urls that is the product of the reference urls and BaseURL values
 *
 * @param {Object[]} references
 *        List of objects containing the reference URL as well as its attributes
 * @param {Node[]} baseUrlElements
 *        List of BaseURL nodes from the mpd
 * @return {Object[]}
 *         List of objects with resolved urls and attributes
 */
export const buildBaseUrls = (references, baseUrlElements) => {
  if (!baseUrlElements.length) {
    return references;
  }

  return flatten(references.map(function(reference) {
    return baseUrlElements.map(function(baseUrlElement) {
      const initialBaseUrl = getContent(baseUrlElement);
      const resolvedBaseUrl = resolveUrl(reference.baseUrl, initialBaseUrl);

      const finalBaseUrl = merge(
        parseAttributes(baseUrlElement),
        { baseUrl: resolvedBaseUrl }
      );

      // If the URL is resolved, we want to get the serviceLocation from the reference
      // assuming there is no serviceLocation on the initialBaseUrl
      if (resolvedBaseUrl !== initialBaseUrl && !finalBaseUrl.serviceLocation && reference.serviceLocation) {
        finalBaseUrl.serviceLocation = reference.serviceLocation;
      }

      return finalBaseUrl;
    });
  }));
};

/**
 * Contains all Segment information for its containing AdaptationSet
 *
 * @typedef {Object} SegmentInformation
 * @property {Object|undefined} template
 *           Contains the attributes for the SegmentTemplate node
 * @property {Object[]|undefined} segmentTimeline
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
    segmentTimeline: segmentTimeline &&
      findChildren(segmentTimeline, 'S').map(s => parseAttributes(s)),
    list: segmentList && merge(
      parseAttributes(segmentList),
      {
        segmentUrls,
        initialization: parseAttributes(segmentInitialization)
      }
    ),
    base: segmentBase && merge(parseAttributes(segmentBase), {
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
 * @param {Object[]} adaptationSetBaseUrls
 *        List of objects containing resolved base URLs and attributes
 *        inherited by the AdaptationSet
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
        attributes: merge(attributes, baseUrl)
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
const generateKeySystemInformation = (contentProtectionNodes) => {
  return contentProtectionNodes.reduce((acc, node) => {
    const attributes = parseAttributes(node);

    // Although it could be argued that according to the UUID RFC spec the UUID string (a-f chars) should be generated
    // as a lowercase string it also mentions it should be treated as case-insensitive on input. Since the key system
    // UUIDs in the keySystemsMap are hardcoded as lowercase in the codebase there isn't any reason not to do
    // .toLowerCase() on the input UUID string from the manifest (at least I could not think of one).
    if (attributes.schemeIdUri) {
      attributes.schemeIdUri = attributes.schemeIdUri.toLowerCase();
    }
    const keySystem = keySystemsMap[attributes.schemeIdUri];

    if (keySystem) {
      acc[keySystem] = { attributes };

      const psshNode = findChildren(node, 'cenc:pssh')[0];

      if (psshNode) {
        const pssh = getContent(psshNode);

        acc[keySystem].pssh = pssh && decodeB64ToUint8Array(pssh);
      }
    }

    return acc;
  }, {});
};

// defined in ANSI_SCTE 214-1 2016
export const parseCaptionServiceMetadata = (service) => {
  // 608 captions
  if (service.schemeIdUri === 'urn:scte:dash:cc:cea-608:2015') {
    const values = typeof service.value !== 'string' ? [] : service.value.split(';');

    return values.map((value) => {
      let channel;
      let language;

      // default language to value
      language = value;

      if (/^CC\d=/.test(value)) {
        [channel, language] = value.split('=');
      } else if (/^CC\d$/.test(value)) {
        channel = value;
      }

      return {channel, language};
    });
  } else if (service.schemeIdUri === 'urn:scte:dash:cc:cea-708:2015') {
    const values = typeof service.value !== 'string' ? [] : service.value.split(';');

    return values.map((value) => {
      const flags = {
        // service or channel number 1-63
        'channel': undefined,

        // language is a 3ALPHA per ISO 639.2/B
        // field is required
        'language': undefined,

        // BIT 1/0 or ?
        // default value is 1, meaning 16:9 aspect ratio, 0 is 4:3, ? is unknown
        'aspectRatio': 1,

        // BIT 1/0
        // easy reader flag indicated the text is tailed to the needs of beginning readers
        // default 0, or off
        'easyReader': 0,

        // BIT 1/0
        // If 3d metadata is present (CEA-708.1) then 1
        // default 0
        '3D': 0
      };

      if (/=/.test(value)) {

        const [channel, opts = ''] = value.split('=');

        flags.channel = channel;
        flags.language = value;

        opts.split(',').forEach((opt) => {
          const [name, val] = opt.split(':');

          if (name === 'lang') {
            flags.language = val;

          // er for easyReadery
          } else if (name === 'er') {
            flags.easyReader = Number(val);

          // war for wide aspect ratio
          } else if (name === 'war') {
            flags.aspectRatio = Number(val);

          } else if (name === '3D') {
            flags['3D'] = Number(val);
          }
        });
      } else {
        flags.language = value;
      }

      if (flags.channel) {
        flags.channel = 'SERVICE' + flags.channel;
      }

      return flags;
    });
  }
};

/**
 * A map callback that will parse all event stream data for a collection of periods
 * DASH ISO_IEC_23009 5.10.2.2
 * https://dashif-documents.azurewebsites.net/Events/master/event.html#mpd-event-timing
 *
 * @param {PeriodInformation} period object containing necessary period information
 * @return a collection of parsed eventstream event objects
 */
export const toEventStream = (period) => {
  // get and flatten all EventStreams tags and parse attributes and children
  return flatten(findChildren(period.node, 'EventStream').map((eventStream) => {
    const eventStreamAttributes = parseAttributes(eventStream);
    const schemeIdUri = eventStreamAttributes.schemeIdUri;

    // find all Events per EventStream tag and map to return objects
    return findChildren(eventStream, 'Event').map((event) => {
      const eventAttributes = parseAttributes(event);
      const presentationTime = eventAttributes.presentationTime || 0;
      const timescale = eventStreamAttributes.timescale || 1;
      const duration = eventAttributes.duration || 0;
      const start = (presentationTime / timescale) + period.attributes.start;

      return {
        schemeIdUri,
        value: eventStreamAttributes.value,
        id: eventAttributes.id,
        start,
        end: start + (duration / timescale),
        messageData: getContent(event) || eventAttributes.messageData,
        contentEncoding: eventStreamAttributes.contentEncoding,
        presentationTimeOffset: eventStreamAttributes.presentationTimeOffset || 0
      };
    });
  }));
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
 * @param {Object[]} periodBaseUrls
 *        Contains list of objects with resolved base urls and attributes
 *        inherited by the Period
 * @param {string[]} periodSegmentInfo
 *        Contains Segment Information at the period level
 * @return {toRepresentationsCallback}
 *         Callback map function
 */
export const toRepresentations =
(periodAttributes, periodBaseUrls, periodSegmentInfo) => (adaptationSet) => {
  const adaptationSetAttributes = parseAttributes(adaptationSet);
  const adaptationSetBaseUrls = buildBaseUrls(
    periodBaseUrls,
    findChildren(adaptationSet, 'BaseURL')
  );
  const role = findChildren(adaptationSet, 'Role')[0];
  const roleAttributes = { role: parseAttributes(role) };

  let attrs = merge(
    periodAttributes,
    adaptationSetAttributes,
    roleAttributes
  );

  const accessibility = findChildren(adaptationSet, 'Accessibility')[0];
  const captionServices = parseCaptionServiceMetadata(parseAttributes(accessibility));

  if (captionServices) {
    attrs = merge(attrs, { captionServices });
  }

  const label = findChildren(adaptationSet, 'Label')[0];

  if (label && label.childNodes.length) {
    const labelVal = label.childNodes[0].nodeValue.trim();

    attrs = merge(attrs, { label: labelVal });
  }

  const contentProtection = generateKeySystemInformation(findChildren(adaptationSet, 'ContentProtection'));

  if (Object.keys(contentProtection).length) {
    attrs = merge(attrs, { contentProtection });
  }

  const segmentInfo = getSegmentInformation(adaptationSet);
  const representations = findChildren(adaptationSet, 'Representation');
  const adaptationSetSegmentInfo = merge(periodSegmentInfo, segmentInfo);

  return flatten(representations.map(inheritBaseUrls(attrs, adaptationSetBaseUrls, adaptationSetSegmentInfo)));
};

/**
 * Contains all period information for mapping nodes onto adaptation sets.
 *
 * @typedef {Object} PeriodInformation
 * @property {Node} period.node
 *           Period node from the mpd
 * @property {Object} period.attributes
 *           Parsed period attributes from node plus any added
 */

/**
 * Maps a PeriodInformation object to a list of Representation information objects for all
 * AdaptationSet nodes contained within the Period.
 *
 * @name toAdaptationSetsCallback
 * @function
 * @param {PeriodInformation} period
 *        Period object containing necessary period information
 * @param {number} periodStart
 *        Start time of the Period within the mpd
 * @return {RepresentationInformation[]}
 *         List of objects containing Representaion information
 */

/**
 * Returns a callback for Array.prototype.map for mapping Period nodes to a list of
 * Representation information objects
 *
 * @param {Object} mpdAttributes
 *        Contains attributes inherited by the mpd
  * @param {Object[]} mpdBaseUrls
 *        Contains list of objects with resolved base urls and attributes
 *        inherited by the mpd
 * @return {toAdaptationSetsCallback}
 *         Callback map function
 */
export const toAdaptationSets = (mpdAttributes, mpdBaseUrls) => (period, index) => {
  const periodBaseUrls = buildBaseUrls(mpdBaseUrls, findChildren(period.node, 'BaseURL'));
  const periodAttributes = merge(mpdAttributes, {
    periodStart: period.attributes.start
  });

  if (typeof period.attributes.duration === 'number') {
    periodAttributes.periodDuration = period.attributes.duration;
  }
  const adaptationSets = findChildren(period.node, 'AdaptationSet');
  const periodSegmentInfo = getSegmentInformation(period.node);

  return flatten(adaptationSets.map(toRepresentations(periodAttributes, periodBaseUrls, periodSegmentInfo)));
};

/**
 * Tranforms an array of content steering nodes into an object
 * containing CDN content steering information from the MPD manifest.
 *
 * For more information on the DASH spec for Content Steering parsing, see:
 * https://dashif.org/docs/DASH-IF-CTS-00XX-Content-Steering-Community-Review.pdf
 *
 * @param {Node[]} contentSteeringNodes
 *        Content steering nodes
 * @param {Function} eventHandler
 *        The event handler passed into the parser options to handle warnings
 * @return {Object}
 *        Object containing content steering data
 */
export const generateContentSteeringInformation = (contentSteeringNodes, eventHandler) => {
  // If there are more than one ContentSteering tags, throw an error
  if (contentSteeringNodes.length > 1) {
    eventHandler({ type: 'warn', message: 'The MPD manifest should contain no more than one ContentSteering tag' });
  }

  // Return a null value if there are no ContentSteering tags
  if (!contentSteeringNodes.length) {
    return null;
  }

  const infoFromContentSteeringTag =
    merge({serverURL: getContent(contentSteeringNodes[0])}, parseAttributes(contentSteeringNodes[0]));

  // Converts `queryBeforeStart` to a boolean, as well as setting the default value
  // to `false` if it doesn't exist
  infoFromContentSteeringTag.queryBeforeStart = (infoFromContentSteeringTag.queryBeforeStart === 'true');

  return infoFromContentSteeringTag;
};

/**
 * Gets Period@start property for a given period.
 *
 * @param {Object} options
 *        Options object
 * @param {Object} options.attributes
 *        Period attributes
 * @param {Object} [options.priorPeriodAttributes]
 *        Prior period attributes (if prior period is available)
 * @param {string} options.mpdType
 *        The MPD@type these periods came from
 * @return {number|null}
 *         The period start, or null if it's an early available period or error
 */
export const getPeriodStart = ({ attributes, priorPeriodAttributes, mpdType }) => {
  // Summary of period start time calculation from DASH spec section 5.3.2.1
  //
  // A period's start is the first period's start + time elapsed after playing all
  // prior periods to this one. Periods continue one after the other in time (without
  // gaps) until the end of the presentation.
  //
  // The value of Period@start should be:
  // 1. if Period@start is present: value of Period@start
  // 2. if previous period exists and it has @duration: previous Period@start +
  //    previous Period@duration
  // 3. if this is first period and MPD@type is 'static': 0
  // 4. in all other cases, consider the period an "early available period" (note: not
  //    currently supported)

  // (1)
  if (typeof attributes.start === 'number') {
    return attributes.start;
  }

  // (2)
  if (priorPeriodAttributes &&
      typeof priorPeriodAttributes.start === 'number' &&
      typeof priorPeriodAttributes.duration === 'number') {
    return priorPeriodAttributes.start + priorPeriodAttributes.duration;
  }

  // (3)
  if (!priorPeriodAttributes && mpdType === 'static') {
    return 0;
  }

  // (4)
  // There is currently no logic for calculating the Period@start value if there is
  // no Period@start or prior Period@start and Period@duration available. This is not made
  // explicit by the DASH interop guidelines or the DASH spec, however, since there's
  // nothing about any other resolution strategies, it's implied. Thus, this case should
  // be considered an early available period, or error, and null should suffice for both
  // of those cases.
  return null;
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
    clientOffset = 0,
    // TODO: For now, we are expecting an eventHandler callback function
    // to be passed into the mpd parser as an option.
    // In the future, we should enable stream parsing by using the Stream class from vhs-utils.
    // This will support new features including a standardized event handler.
    // See the m3u8 parser for examples of how stream parsing is currently used for HLS parsing.
    // https://github.com/videojs/vhs-utils/blob/88d6e10c631e57a5af02c5a62bc7376cd456b4f5/src/stream.js#L9
    eventHandler = function() {}
  } = options;
  const periodNodes = findChildren(mpd, 'Period');

  if (!periodNodes.length) {
    throw new Error(errors.INVALID_NUMBER_OF_PERIOD);
  }

  const locations = findChildren(mpd, 'Location');

  const mpdAttributes = parseAttributes(mpd);
  const mpdBaseUrls = buildBaseUrls([{ baseUrl: manifestUri }], findChildren(mpd, 'BaseURL'));
  const contentSteeringNodes = findChildren(mpd, 'ContentSteering');

  // See DASH spec section 5.3.1.2, Semantics of MPD element. Default type to 'static'.
  mpdAttributes.type = mpdAttributes.type || 'static';
  mpdAttributes.sourceDuration = mpdAttributes.mediaPresentationDuration || 0;
  mpdAttributes.NOW = NOW;
  mpdAttributes.clientOffset = clientOffset;

  if (locations.length) {
    mpdAttributes.locations = locations.map(getContent);
  }

  const periods = [];

  // Since toAdaptationSets acts on individual periods right now, the simplest approach to
  // adding properties that require looking at prior periods is to parse attributes and add
  // missing ones before toAdaptationSets is called. If more such properties are added, it
  // may be better to refactor toAdaptationSets.
  periodNodes.forEach((node, index) => {
    const attributes = parseAttributes(node);
    // Use the last modified prior period, as it may contain added information necessary
    // for this period.
    const priorPeriod = periods[index - 1];

    attributes.start = getPeriodStart({
      attributes,
      priorPeriodAttributes: priorPeriod ? priorPeriod.attributes : null,
      mpdType: mpdAttributes.type
    });

    periods.push({
      node,
      attributes
    });
  });

  return {
    locations: mpdAttributes.locations,
    contentSteeringInfo: generateContentSteeringInformation(contentSteeringNodes, eventHandler),
    // TODO: There are occurences where this `representationInfo` array contains undesired
    // duplicates. This generally occurs when there are multiple BaseURL nodes that are
    // direct children of the MPD node. When we attempt to resolve URLs from a combination of the
    // parent BaseURL and a child BaseURL, and the value does not resolve,
    // we end up returning the child BaseURL multiple times.
    // We need to determine a way to remove these duplicates in a safe way.
    // See: https://github.com/videojs/mpd-parser/pull/17#discussion_r162750527
    representationInfo: flatten(periods.map(toAdaptationSets(mpdAttributes, mpdBaseUrls))),
    eventStream: flatten(periods.map(toEventStream))
  };
};
