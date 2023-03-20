import type { FancyItemIdentifier } from '@/components/FancyInput/types';

export default [
  {
    field: 'tool',
    key: 'tool',
    type: 'string',
    hidden: true,
    initialValue: 'pointTool',
  },
  {
    key: 'config',
    field: 'config',
    type: 'group',
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
        type: 'number',
        key: 'upperLimit',
        field: 'upperLimit',
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
