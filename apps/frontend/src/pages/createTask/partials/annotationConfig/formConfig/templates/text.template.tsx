import type { FancyItemIdentifier } from '@/components/FancyInput/types';

export default [
  {
    field: 'tool',
    key: 'tool',
    type: 'string',
    hidden: true,
    initialValue: 'textTool',
  },
  {
    key: 'config',
    field: 'config',
    type: 'group',
    children: [
      {
        type: 'category-attribute',
        key: 'field',
        field: 'texts',
        label: '',
        addStringText: '新建',
        showAddTag: false,
        initialValue: [
          {
            key: '标签-1',
            value: 'label-1',
            type: 'string',
            options: [
              {
                key: '标签-1-1',
                value: 'label-1-1',
              },
            ],
          },
        ],
      },
    ],
  },
] as FancyItemIdentifier[];
