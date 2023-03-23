import type { TreeType } from './bfsEach';

export interface MapTreeIterateeArg<T> {
  index: number;
  treeNodes: T[];
  depth: number;
  parent: T | null;
  preNode: T | undefined;
}

export interface MapTreeOptions<T> {
  childrenField?: string;
  depth: number;
  parent: TreeType<T> | null;
}

/**
 * 树的map遍历
 * @param treeNodes
 * @param iteratee
 * @returns
 */
export function mapTree<TreeNode>(
  treeNodes: TreeType<TreeNode>[] = [],
  iteratee: (node: TreeType<TreeNode>, iterateeArgs: MapTreeIterateeArg<TreeType<TreeNode>>) => TreeType<any>,
  options?: MapTreeOptions<TreeNode>,
) {
  const { depth = 0, parent = null, childrenField = 'children' } = options || {};
  const newNodes: TreeType<any>[] = [];

  for (let i = 0; i < treeNodes.length; i += 1) {
    const node = iteratee(treeNodes[i], {
      index: i,
      treeNodes,
      depth,
      parent,
      preNode: newNodes[newNodes.length - 1],
    });

    if (Array.isArray(treeNodes[i][childrenField])) {
      node[childrenField] = mapTree(treeNodes[i][childrenField], iteratee, {
        depth: depth + 1,
        parent: node,
        childrenField,
      });
    }

    newNodes.push(node);
  }

  return newNodes;
}
