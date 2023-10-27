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
        addStringText: '新建',
        disabledStringOptions: ['order'],
        showAddTag: false,
        initialValue: [
          {
            key: '标签-1',
            value: 'label-1',
            required: true,
            type: 'string',
            maxLength: 1000,
            stringType: 'text',
            defaultValue: '',
          },
        ],
      },
    ],
  },
] as FancyItemIdentifier[];
