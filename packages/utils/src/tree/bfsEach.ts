export interface TreeType<T> {
  [key: string]: any;
  children?: TreeType<T>[];
}

export interface BFSOption {
  childrenField: string;
}

/**
 * 广度优先遍历树节点
 * @param input 树
 * @param iteratee 回调函数
 * @param option
 * @returns void
 */
export function bfsEach<TreeNode>(
  input: TreeType<TreeNode>[],
  iteratee: (node: TreeType<TreeNode>, i: number, input: TreeType<TreeNode>[]) => void,
  option: BFSOption = { childrenField: 'children' },
) {
  if (!Array.isArray(input)) {
    console.warn('bfsEach input must be an array');
    return;
  }

  const { childrenField } = option;
  const leaf = [];

  for (let i = 0; i < input.length; i += 1) {
    if (Array.isArray(input[i][childrenField]) && input[i][childrenField].length > 0) {
      leaf.push(...input[i][childrenField]);
    }

    iteratee(input[i], i, input);

    if (leaf.length > 0 && i === input.length - 1) {
      bfsEach(leaf, iteratee, option);
    }
  }
}
