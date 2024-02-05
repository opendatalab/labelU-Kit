import type { FancyItemIdentifier } from '@/components/FancyInput/types';

export default [
  {
    type: 'number',
    key: 'maxPointAmount',
    field: 'maxPointAmount',
    label: '上限点数',
    initialValue: 100,
    rules: [
      {
        required: true,
        message: '上限点数不能为空',
      },
    ],
  },
  {
    field: 'labels',
    key: 'labels',
    type: 'list-attribute',
    label: '标签配置',
    initialValue: [
      {
        color: '#ff6600',
        key: '标签-1',
        value: 'label-1',
      },
    ],
  },
] as FancyItemIdentifier[];
