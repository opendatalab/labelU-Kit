import type { FancyItemIdentifier } from '@/components/FancyInput/types';

export default [
  {
    field: 'tool',
    key: 'tool',
    type: 'string',
    hidden: true,
    initialValue: 'tagTool',
  },
  {
    key: 'config',
    field: 'config',
    type: 'group',
    children: [
      {
        type: 'category-attribute',
        key: 'field',
        field: 'tags',
        label: '',
        addTagText: '新建',
        showAddString: false,
        initialValue: [
          {
            key: '标签-1',
            value: 'label-1',
            type: 'enum',
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
