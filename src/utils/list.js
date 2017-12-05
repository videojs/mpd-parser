export const range = (count, start = 0) => {
  const result = [];

  for (let i = 0; i < count; i++) {
    result.push(start);
    start++;
  }

  return result;
};

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
