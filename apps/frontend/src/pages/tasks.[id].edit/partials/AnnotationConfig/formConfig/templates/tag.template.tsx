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
        field: 'textConfigurable',
        key: 'textConfigurable',
        type: 'boolean',
        hidden: true,
        initialValue: false,
      },
      {
        type: 'category-attribute',
        key: 'field',
        field: 'attributes',
        label: '',
        addTagText: '新建',
        showAddString: false,
        initialValue: [
          {
            key: '标签-1',
            value: 'tag-label-1',
            required: true,
            type: 'enum',
            options: [
              {
                key: '标签-1-1',
                value: 'tag-label-1-1',
              },
            ],
          },
        ],
      },
    ],
  },
] as FancyItemIdentifier[];
