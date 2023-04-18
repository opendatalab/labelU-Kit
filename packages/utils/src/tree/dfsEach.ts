import type { TreeType } from './bfsEach';

export interface DFSOption {
  childrenField: string;
}

/**
 * 深度优先遍历树节点
 * @param input 树
 * @param iteratee 回调函数
 * @param option
 * @returns void
 */
export function dfsEach<TreeNode>(
  input: TreeType<TreeNode>[],
  iteratee: (node: TreeType<TreeNode>, path: (string | number)[], input: TreeType<TreeNode>[]) => void,
  option: DFSOption = { childrenField: 'children' },
  path?: (string | number)[],
) {
  if (!Array.isArray(input)) {
    console.warn('dfsEach input must be an array');
    return;
  }

  const { childrenField } = option;

  for (let i = 0; i < input.length; i += 1) {
    iteratee(input[i], [...(path || []), i], input);

    if (Array.isArray(input[i][childrenField]) && input[i][childrenField].length > 0) {
      dfsEach(input[i][childrenField], iteratee, option, [...(path || []), i, childrenField]);
    }
  }
}
