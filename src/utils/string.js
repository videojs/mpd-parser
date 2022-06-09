/**
 * Converts the provided string value that may contain the division operation to the number value.
 *
 * @param {string} value - the provided string value
 *
 * @return {number} the parsed string value
 */
export const parseDivisionValue = (value) => {
  return parseFloat(value.split('/').reduce((prev, current) => prev / current));
};
