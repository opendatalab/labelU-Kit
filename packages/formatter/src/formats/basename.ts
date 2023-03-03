/**
 * 从路径提取basename如文件名
 */
export const basename = {
  type: 'basename',
  name: '文件名提取',
  desc: '文件名提取',
  format: (value: string): string => {
    if (!value) {
      return value;
    }
    const paths = value.split(/[\\/]/);
    const lastPath = paths[paths.length - 1];
    const dotIndex = lastPath.lastIndexOf('.');

    return dotIndex > -1 ? lastPath.substring(0, dotIndex) : lastPath;
  },
};

export type Basename = typeof basename;
