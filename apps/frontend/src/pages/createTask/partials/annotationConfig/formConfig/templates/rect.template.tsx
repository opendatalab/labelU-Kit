import type { FancyItemIdentifier } from '@/components/FancyInput/types';

export default [
  {
    field: 'tool',
    key: 'tool',
    type: 'string',
    hidden: true,
    initialValue: 'rectTool',
  },
  {
    key: 'config',
    field: 'config',
    type: 'group',
    children: [
      {
        type: 'group',
        key: 'minSize',
        layout: 'horizontal',
        label: '最小尺寸',
        children: [
          {
            field: 'attributeConfigurable',
            key: 'attributeConfigurable',
            type: 'boolean',
            hidden: true,
            initialValue: true,
          },
          {
            field: 'textCheckType',
            key: 'textCheckType',
            type: 'enum',
            hidden: true,
            initialValue: 0,
          },
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
        field: 'attributes',
        key: 'attributes',
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
    ],
  },
] as FancyItemIdentifier[];
