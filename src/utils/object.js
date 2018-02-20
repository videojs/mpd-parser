import { from } from './list';

export const merge = (...objects) => {

  const isObject = (obj) => {
    return obj && typeof obj === 'object';
  };

  return objects.reduce((x, y) => {

    Object.keys(y).forEach(key => {

      if (Array.isArray(x[key]) && Array.isArray(y[key])) {
        x[key] = x[key].concat(y[key]);
      } else if (isObject(x[key]) && isObject(y[key])) {
        x[key] = merge(x[key], y[key]);
      } else {
        x[key] = y[key];
      }
    });
    return x;
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
