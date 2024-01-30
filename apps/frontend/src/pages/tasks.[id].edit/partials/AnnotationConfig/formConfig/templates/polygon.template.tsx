import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { RuleRender } from 'antd/es/form';

import type { FancyItemIdentifier } from '@/components/FancyInput/types';
import FancyInput from '@/components/FancyInput';

export default [
  {
    field: 'tool',
    key: 'tool',
    type: 'string',
    hidden: true,
    initialValue: 'polygonTool',
  },
  {
    key: 'config',
    field: 'config',
    type: 'group',
    children: [
      {
        field: 'attributeConfigurable',
        key: 'attributeConfigurable',
        type: 'boolean',
        hidden: true,
        initialValue: true,
      },
      {
        field: 'lineColor',
        key: 'lineColor',
        type: 'enum',
        label: '线条是否为多色',
        hidden: true,
        initialValue: 0,
      },
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
        renderFormItem({ antProps, ...props }, form, fullField) {
          const lineType = form.getFieldValue([...(fullField as any[]).slice(0, -1), 'lineType']);

          if (lineType === 1) {
            return null;
          }

          return <FancyInput {...props} {...antProps} />;
        },
      },
      {
        field: 'attributes',
        key: 'attributes',
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
    ],
  },
] as FancyItemIdentifier[];
