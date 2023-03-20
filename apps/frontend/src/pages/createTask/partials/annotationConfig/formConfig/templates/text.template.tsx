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
        field: 'textCheckType',
        key: 'textCheckType',
        type: 'enum',
        hidden: true,
        initialValue: 0,
      },
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
            maxLength: 1000,
            stringType: 'text',
            required: false,
            defaultValue: '',
          },
        ],
      },
    ],
  },
] as FancyItemIdentifier[];
