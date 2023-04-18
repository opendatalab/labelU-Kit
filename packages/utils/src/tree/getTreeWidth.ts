import type { TreeType } from './bfsEach';
import { bfsEach } from './bfsEach';

/**
 * 获取树的宽度
 * @param treeNodes
 * @returns
 */
export function getTreeWidth<TreeNode>(treeNodes: TreeType<TreeNode>[]) {
  if (!Array.isArray(treeNodes)) {
    return 0;
  }

  let width = treeNodes.length;

  bfsEach(treeNodes, (node) => {
    if (node.children && node.children.length > 1) {
      width += node.children.length - 1;
    }
  });

  return width;
}
