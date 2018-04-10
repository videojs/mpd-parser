import { parseAttributes } from './parseAttributes';
import { findChildren, getContent } from './utils/xml';
import getPlayReadyLicenseServerUrl from './getPlayReadyLicenseServerUrl';
import decodeB64ToUint8Array from './utils/decodeB64ToUint8Array';

const keySystemsMap = {
  'urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b': 'org.w3.clearkey',
  'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed': 'com.widevine.alpha',
  'urn:uuid:9a04f079-9840-4286-ab92-e65be0885f95': 'com.microsoft.playready',
  'urn:uuid:f239e769-efa3-4850-9c16-a903c6932efb': 'com.adobe.primetime'
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
export default function generateKeySystemInformation(contentProtectionNodes) {
  return contentProtectionNodes.reduce((acc, node) => {
    const attributes = parseAttributes(node);
    const keySystem = keySystemsMap[attributes.schemeIdUri.toLowerCase()];

    if (keySystem) {
      acc[keySystem] = { attributes };

      const psshNode = findChildren(node, 'cenc:pssh')[0];

      if (psshNode) {
        const pssh = getContent(psshNode);
        const psshBuffer = pssh && decodeB64ToUint8Array(pssh);

        acc[keySystem].pssh = psshBuffer;
      }

      const msproNode = findChildren(node, 'mspr:pro')[0];

      if (keySystem === 'com.microsoft.playready' && msproNode) {
        acc[keySystem].licenseUrl = getPlayReadyLicenseServerUrl(getContent(msproNode));
      }
    }

    return acc;
  }, {});
}
