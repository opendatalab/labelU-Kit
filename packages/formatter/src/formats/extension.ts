import { isNil } from '@/utils';

/**
 * 格式化文件扩展名
 */
export const extension = {
  type: 'extension',
  name: '文件扩展名',
  desc: '格式化文件扩展名',
  format: (value: string) => {
    if (isNil(value)) {
      return '';
    }

    const paths = value.split(/[\\/]/);
    const filePath = paths[paths.length - 1];
    return filePath.substring(filePath.lastIndexOf('.'));
  },
};

export type Extension = typeof extension;
