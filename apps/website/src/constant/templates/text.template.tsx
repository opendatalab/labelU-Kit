export default [
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
        value: 'text-label-1',
        required: true,
        type: 'string',
        maxLength: 1000,
        stringType: 'text',
        defaultValue: '',
      },
    ],
  },
];
