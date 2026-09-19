export function addKeys<T extends object>(arr: T[]): (T & { key: string })[] {
  return arr.map((item, index) => ({ ...item, key: index.toString() }));
}
