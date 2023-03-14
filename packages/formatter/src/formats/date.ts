import dayjs from 'dayjs';

export interface IDateFormatterOption {
  style?:
    | 'YYYY-MM-DD HH:mm:ss'
    | 'YYYY-MM-DD'
    | 'HH:mm:ss'
    | 'YYYY-MM-DD HH:mm'
    | 'YYYY-MM-DD HH'
    | 'YYYY-MM-DD'
    | 'YYYY-MM'
    | 'YYYY'
    | 'MM-DD'
    | 'MM-DD HH:mm:ss'
    | 'MM-DD HH:mm'
    | 'MM-DD HH'
    | 'MM-DD'
    | 'MM'
    | 'DD HH:mm:ss'
    | 'DD HH:mm'
    | 'DD HH'
    | 'DD'
    | 'HH:mm:ss'
    | 'HH:mm'
    | 'HH';
}

/**
 * 格式化日期
 * 日期格式化样式，YYYY代表年，MM代表月，DD代表日，HH代表小时，mm代表分，ss代表秒，其他请参考dayjs
 */
export const dateTime = {
  type: 'date',
  name: '日期',
  desc: '格式化日期',
  format: (value: Date | string | number, { style = 'YYYY-MM-DD HH:mm:ss' }: IDateFormatterOption = {}): string => {
    if (!value) {
      return '';
    }

    let finalValue = value;
    const dateLen = `${finalValue}`.length;

    /** 时间戳不完整时末尾需要补齐0 */
    if (typeof finalValue === 'number' && dateLen < 13) {
      for (let i = 0; i < 13 - dateLen; i++) {
        finalValue = `${finalValue}` + '0';
      }
    }

    return dayjs(+finalValue).format(style);
  },
};

export type DateFormatter = typeof dateTime;
