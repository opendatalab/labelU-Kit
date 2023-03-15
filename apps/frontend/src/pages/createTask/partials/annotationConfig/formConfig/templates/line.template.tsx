import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { RuleRender } from 'antd/es/form';

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
            addonAfter: <ArrowDownOutlined />,
            label: undefined,
            initialValue: 2,
            min: 0,
            placeholder: '最小闭合点个数',
            dependencies: ['upperLimitPointNum'],
            rules: [
              {
                required: true,
                message: '最小闭合点个数不能为空',
              },
              (({ getFieldValue }) => ({
                // @ts-ignore
                validator({ fullField }, value: number) {
                  const maxNum = getFieldValue(
                    fullField.replace('lowerLimitPointNum', 'upperLimitPointNum').split('.'),
                  );
                  if (value > maxNum) {
                    return Promise.reject(new Error('最小闭合点数不可大于最大闭合点数'));
                  }

                  return Promise.resolve();
                },
              })) as RuleRender,
            ],
          },
          {
            field: 'upperLimitPointNum',
            key: 'upperLimitPointNum',
            type: 'number',
            addonAfter: <ArrowUpOutlined />,
            label: undefined,
            initialValue: 100,
            min: 0,
            placeholder: '最大闭合点个数',
            rules: [
              {
                required: true,
                message: '最大闭合点个数不能为空',
              },
              (({ getFieldValue }) => ({
                // @ts-ignore
                validator({ fullField }, value: number) {
                  const minNum = getFieldValue(
                    fullField.replace('upperLimitPointNum', 'lowerLimitPointNum').split('.'),
                  );
                  if (value < minNum) {
                    return Promise.reject(new Error('最大闭合点数不可小于最小闭合点数'));
                  }

                  return Promise.resolve();
                },
              })) as RuleRender,
            ],
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
