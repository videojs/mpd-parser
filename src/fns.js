export const shallowMerge = (...objects) => {
  return objects.reduce((x, y) => {
    return Object.keys(y)
      .reduce((o, key) => {
        o[key] = y[key];

        return o;
      }, x);
  }, {});
};

export const flatten = lists => lists.reduce((x, y) => x.concat(y), []);

export const range = (count, start = 0) => Array(count).fill().map((_, i) => i + start);

// P10Y10M10DT10H10M10.1S
export const parseDuration = str => {
  const durationRegex = /^([-])?P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/;

  const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
  const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
  const SECONDS_IN_DAY = 24 * 60 * 60;
  const SECONDS_IN_HOUR = 60 * 60;
  const SECONDS_IN_MIN = 60;
  const match = durationRegex.exec(str);

  let result = (parseFloat(match[2] || 0) * SECONDS_IN_YEAR +
      parseFloat(match[4] || 0) * SECONDS_IN_MONTH +
      parseFloat(match[6] || 0) * SECONDS_IN_DAY +
      parseFloat(match[8] || 0) * SECONDS_IN_HOUR +
      parseFloat(match[10] || 0) * SECONDS_IN_MIN +
      parseFloat(match[12] || 0));

  if (match[1] !== undefined) {
    result = -result;
  }

  return result;
};

export const getAttributes = el => {
  if (!el.attributes) {
    return {};
  }

  return Array.from(el.attributes)
    .reduce((a, e) => {
      a[e.name] = e.value;

      return a;
    }, {});
};
