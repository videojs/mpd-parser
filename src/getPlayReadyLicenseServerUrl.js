import window from 'global/window';
import { findChildren, getContent } from './utils/xml';
import decodeB64ToUint8Array from './utils/decodeB64ToUint8Array';

const PLAYREADY_RECORD_TYPES = {
  0x0001: 'RIGHTS_MANAGEMENT',
  0x0002: 'RESERVED',
  0x0003: 'EMBEDDED_LICENSE'
};

/**
 * Converts a raw list of PlayReady Object records
 * into a list of objects
 *
 * @param {Uint16Array} recordData
 *   Records in bytes
 * @param {number} recordCount
 *   Number of expected records
 *
 * @return {Object[]}
 *   A list of records from a PlayReady Object
 */
const parseRecords = (recordData, recordCount) => {
  let head = 0;
  const records = [];

  for (let i = 0; i < recordCount; i++) {
    const recordRaw = recordData.subarray(head);

    const type = recordRaw[0];
    const length = recordRaw[1];
    const offset = 2;
    const charCount = length / 2;
    const end = charCount + offset;

    // subarray end is exclusive
    const rawValue = recordRaw.subarray(offset, end);
    const value = String.fromCharCode.apply(null, rawValue);

    records.push({ type, length, value });

    head = end;
  }

  return records;
};

/**
 * Converts PlayReady Object into a javascript object
 *
 * @param {Uint16Array} bytes
 *   PlayReady Object in bytes
 *
 * @return {Object}
 *   A PlayReady Object as a javascript object
 */
const parsePro = (bytes) => {
  const length = bytes[0] | bytes[1];
  const recordCount = bytes[2];
  const recordData = bytes.subarray(3);
  const records = parseRecords(recordData, recordCount);

  return { length, recordCount, records };
};

/**
 * Retrieves a PlayReady license URL from a node
 *
 * @param {string} nodeContent
 *   Encoded PlayReady Object
 *
 * @return {string}
 *   PlayReady license URL
 */
export default function getPlayReadyLicenseServerUrl(nodeContent) {
  const bytes = decodeB64ToUint8Array(nodeContent);
  const parsedPro = parsePro(new Uint16Array(bytes.buffer));
  const records = parsedPro.records;
  const parser = new window.DOMParser();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (PLAYREADY_RECORD_TYPES[record.type] === 'RIGHTS_MANAGEMENT') {
      const xml = parser.parseFromString(record.value, 'application/xml').documentElement;
      const laurlNode = findChildren(findChildren(xml, 'DATA')[0], 'LA_URL')[0];

      return laurlNode && getContent(laurlNode) || '';
    }
  }

  return '';
}
