import type { TreeType } from './bfsEach';
import { bfsEach } from './bfsEach';

/**
 * 获取树的深度
 * @param treeNodes
 * @returns
 */
export function getTreeDepth<TreeNode>(treeNodes: TreeType<TreeNode>[]) {
  if (!Array.isArray(treeNodes)) {
    return 0;
  }

  let depth = 0;

  bfsEach(treeNodes, (node) => {
    if (node && Array.isArray(node.children) && node.children.length > 0) {
      depth += 1;
    }
  });

  return depth;
}
