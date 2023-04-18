import { deepCopy } from '../deepCopy';

export function toTree(
  entry: Record<string, any>[],
  {
    idField = 'code',
    parentField = 'parent',
    childrenField = 'children',
    rootFilter,
  }: { idField?: string; parentField?: string; childrenField?: string; rootFilter?: (node: any) => boolean } = {},
) {
  if (!Array.isArray(entry)) {
    console.warn('toTree input must be an array');
    return [];
  }

  const result: Record<string, any>[] = deepCopy(entry);
  const map = new Map();
  result.forEach((item) => {
    map.set(item[idField], item);
  });

  result.forEach((item) => {
    const parent = map.get(item[parentField]);

    if (parent) {
      if (!parent[childrenField]) {
        parent[childrenField] = [];
      }

      item[parentField] = parent;
      parent[childrenField].push(item);
    }
  });

  return result.filter((item) => {
    if (rootFilter) {
      return rootFilter(item);
    }

    return !item[parentField];
  });
}
