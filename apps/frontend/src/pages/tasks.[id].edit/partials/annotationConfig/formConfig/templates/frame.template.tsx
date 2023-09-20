import type { FancyItemIdentifier } from '@/components/FancyInput/types';

export default [
  {
    field: 'tool',
    key: 'tool',
    type: 'string',
    hidden: true,
    initialValue: 'videoFrameTool',
  },
  {
    key: 'config',
    field: 'config',
    type: 'group',
    children: [
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
