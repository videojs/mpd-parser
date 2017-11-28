import { from } from './list';

export const shallowMerge = (...objects) => {
  return objects.reduce((x, y) => {
    return Object.keys(y)
      .reduce((o, key) => {
        o[key] = y[key];

        return o;
      }, x);
  }, {});
};

export const getAttributes = el => {
  if (!(el && el.attributes)) {
    return {};
  }

  return from(el.attributes)
    .reduce((a, e) => {
      a[e.name] = e.value;

      return a;
    }, {});
};
