import type { partial } from 'filesize';
import { filesize as fileSizeUtil } from 'filesize';

import { isNil } from '@/utils';

/**
 * 格式化文件大小
 * 格式化参数请查阅filesize：https://github.com/avoidwork/filesize.js#optional-settings
 */
export const fileSize = {
  type: 'fileSize',
  name: '文件大小',
  desc: '格式化文件大小',
  format: (value: number | string, opt: Parameters<typeof partial>[0] = {}): ReturnType<typeof fileSizeUtil> => {
    if (isNil(value)) {
      return '';
    }

    const option = {
      base: 2,
      standard: 'jedec',
      ...opt,
    } as Parameters<typeof partial>[0];

    return fileSizeUtil(+value, option);
  },
};

export type FileSizeFormatter = typeof fileSize;
