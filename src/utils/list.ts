export function addKeys<T extends object>(
  arr: T[],
  getKey: (item: T) => string,
): (T & { key: string })[] {
  return arr.map((item) => ({ ...item, key: getKey(item) }));
}
