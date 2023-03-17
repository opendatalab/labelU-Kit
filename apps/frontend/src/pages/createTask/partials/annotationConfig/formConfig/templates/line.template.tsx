import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { RuleRender } from 'antd/es/form';

import type { FancyItemIdentifier } from '../FancyInput/types';

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
        initialValue: 0,
        antProps: {
          options: [
            { label: '直线', value: 0 },
            { label: '贝塞尔曲线', value: 1 },
          ],
        },
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
            label: undefined,
            initialValue: 2,
            antProps: {
              addonAfter: <ArrowDownOutlined />,
              min: 0,
              placeholder: '最小闭合点个数',
            },
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
            label: undefined,
            antProps: {
              addonAfter: <ArrowUpOutlined />,
              min: 0,
              placeholder: '最大闭合点个数',
            },
            initialValue: 100,
            rules: [
              {
                required: true,
                message: '最大闭合点个数不能为空',
              },
              ({ getFieldValue }) => ({
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
              }),
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
            color: '#ff6600',
            key: '标签-1',
            value: 'label-1',
          },
        ],
      },
      {
        field: 'categoryList',
        key: 'categoryList',
        type: 'category-attribute',
        label: '分类属性',
        initialValue: [
          {
            key: '标签-1',
            type: 'enum',
            value: 'label-1',
            options: [
              {
                key: '标签-1-1',
                value: 'label-1-1',
              },
              {
                key: '标签-1-2',
                value: 'label-1-2',
              },
            ],
          },
          {
            key: '标签-2',
            value: 'label-2',
            type: 'tuple',
            options: [
              {
                key: '标签-2-1',
                value: 'label-2-1',
              },
            ],
          },
          {
            key: '标签-3',
            value: 'label-3',
            type: 'string',
            maxLength: 100,
            stringType: 'text',
            defaultValue: '',
          },
        ],
      },
    ],
  },
] as FancyItemIdentifier[];
