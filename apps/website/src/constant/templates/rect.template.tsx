import type { FancyItemIdentifier } from '@/components/FancyInput/types';

export default [
  {
    type: 'group',
    key: 'minSize',
    layout: 'horizontal',
    label: '最小尺寸',
    children: [
      {
        field: 'minWidth',
        key: 'minWidth',
        type: 'number',
        label: undefined,
        initialValue: 1,
        antProps: {
          addonAfter: 'W',
          min: 0,
          placeholder: '最小宽度',
        },
        rules: [
          {
            required: true,
            message: '最小宽度不能为空',
          },
        ],
      },
      {
        field: 'minHeight',
        key: 'minHeight',
        type: 'number',
        label: undefined,
        antProps: {
          addonAfter: 'H',
          min: 0,
          placeholder: '最小高度',
        },
        initialValue: 1,
        rules: [
          {
            required: true,
            message: '最小高度不能为空',
          },
        ],
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
