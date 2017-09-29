export const range = (count, start = 0) => count <= 0 ? [] : Array(count).fill().map((_, i) => i + start);

export const flatten = lists => lists.reduce((x, y) => x.concat(y), []);
