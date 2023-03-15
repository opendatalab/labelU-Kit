export default [
  {
    field: 'tool',
    key: 'tool',
    type: 'string',
    hidden: true,
    initialValue: 'lineTool',
  },
  {
    key: 'config',
    field: 'config',
    type: 'group',
    children: [
      {
        field: 'lineType',
        key: 'lineType',
        type: 'enum',
        label: '线条类型',
        options: [
          { label: '直线', value: 0 },
          { label: '贝塞尔曲线', value: 1 },
        ],
      },
      {
        type: 'group',
        key: 'pointNum',
        layout: 'horizontal',
        label: '闭合点数',
        children: [
          {
            field: 'lowerLimitPointNum',
            key: 'lowerLimitPointNum',
            type: 'number',
            suffix: '↓',
            label: undefined,
            initialValue: 2,
            placeholder: '最小闭合点个数',
          },
          {
            field: 'upperLimitPointNum',
            key: 'upperLimitPointNum',
            type: 'number',
            suffix: '↑',
            label: undefined,
            initialValue: 100,
            placeholder: '最大闭合点个数',
          },
        ],
      },
      {
        field: 'edgeAdsorption',
        key: 'edgeAdsorption',
        type: 'boolean',
        label: '边缘吸附',
        initialValue: false,
      },
      {
        field: 'attributeList',
        key: 'attributeList',
        type: 'list-attribute',
        label: '标签配置',
        initialValue: [
          {
            key: '标签-1',
            value: 'label-1',
          },
        ],
      },
    ],
  },
];
