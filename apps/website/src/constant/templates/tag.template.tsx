export default [
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
];
