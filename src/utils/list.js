export const range = (count, start = 0) => count <= 0 ? [] : Array(count).fill().map((_, i) => i + start);

export const flatten = lists => lists.reduce((x, y) => x.concat(y), []);

export const from = list => {
  if (!list.length) {
    return [];
  }

  const result = [];

  for (let i = 0; i < list.length; i++) {
    result.push(list[i]);
  }

  return result;
};
