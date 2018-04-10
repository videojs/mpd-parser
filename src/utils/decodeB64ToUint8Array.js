import window from 'global/window';

/**
 * Tranforms b64 encoded text into a Uint8Array
 *
 * @param {string} b64Text
 *        b64 encoded text
 * @return {Uint8Array}
 *        A Uint8Array
 */
export default function decodeB64ToUint8Array(b64Text) {
  const decodedString = window.atob(b64Text);
  const array = new Uint8Array(decodedString.length);

  for (let i = 0; i < decodedString.length; i++) {
    array[i] = decodedString.charCodeAt(i);
  }
  return array;
}
