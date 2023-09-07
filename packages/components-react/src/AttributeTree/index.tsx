import type { InnerAttribute } from '@label-u/interface';
import type { CollapseProps } from 'rc-collapse';
import Collapse from 'rc-collapse';
import { useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import type { FormProps } from 'rc-field-form';
import { useForm, Field } from 'rc-field-form';

import { AttributeFormItem, FormWithValidation } from '../AttributeForm';
import { EllipsisText } from '../EllipsisText';

function uid() {
  return Math.random().toString(36).slice(2);
}

const prefixCls = 'rc-collapse';

const commonCss = css`
  width: 0;
  height: 0;
  font-size: 0;
  line-height: 0;
`;

const rightCss = (width: number, height: number, color: string) => css`
  border-top: ${width}px solid transparent;
  border-bottom: ${width}px solid transparent;
  border-left: ${height}px solid ${color};
`;

const bottomCss = (width: number, height: number, color: string) => css`
  border-left: ${width}px solid transparent;
  border-right: ${width}px solid transparent;
  border-top: ${height}px solid ${color};
`;

// @ts-ignore
export const CollapseWrapper: React.ForwardRefExoticComponent<CollapseProps> = styled(Collapse)`
  --text-color: #666;
  --border-style: 1px solid #d9d9d9;
  border-radius: 3px;
  font-size: 14px;

  .${prefixCls}-item {
    &:first-child {
      border-top: none;
    }

    .${prefixCls}-header {
      display: flex;
      align-items: center;
      line-height: 22px;
      padding: 4px 16px;
      color: #666;
      cursor: pointer;

      &:hover {
        background-color: #f3f3f3;
      }

      .arrow {
        ${commonCss}
        ${rightCss(5, 6, '#666')};
        display: inline-block;
        content: ' ';

        vertical-align: middle;
        margin-right: 8px;
      }

      .${prefixCls}-extra {
        margin: 0 16px 0 auto;
      }
    }
    .${prefixCls}-header-collapsible-only {
      cursor: default;
      .${prefixCls}-header-text {
        cursor: pointer;
      }
      .${prefixCls}-expand-icon {
        cursor: pointer;
      }
    }
    .${prefixCls}-icon-collapsible-only {
      cursor: default;
      .${prefixCls}-expand-icon {
        cursor: pointer;
      }
    }

    .${prefixCls}-header-text {
      flex-grow: 1;
    }
  }

  .${prefixCls}-item-disabled .${prefixCls}-header {
    cursor: not-allowed;
    color: #999;
    background-color: #f3f3f3;
  }

  .${prefixCls}-content {
    overflow: hidden;
    color: var(--text-color);
    background-color: #fff;

    .${prefixCls}-box {
      margin-top: 16px;
      margin-bottom: 16px;
    }

    &-hidden {
      display: none;
    }
  }

  .${prefixCls}-item:last-child {
    .${prefixCls}-content {
      border-radius: 0 0 3px 3px;
    }
  }

  .${prefixCls}-item-active {
    .${prefixCls}-header {
      .arrow {
        position: relative;
        top: 2px;

        ${bottomCss(5, 6, '#666')}

        margin-right: 6px;
      }
    }
  }
`;

export const AttributeTreeWrapper = styled.div``;

const AttributeFormWrapper = styled(AttributeFormItem)`
  padding: 0.5rem 1rem;
  margin-bottom: 0;
`;

export interface AttributeDataItem {
  type?: string;
  attributes?: Record<string, string | string[]>;
}

export interface AttributeTreeProps {
  data?: AttributeDataItem[];
  config?: InnerAttribute[];
  onChange?: FormProps['onValuesChange'];
  className?: string;
}

export function AttributeTree({ data, config, onChange, className }: AttributeTreeProps) {
  const [tagForm] = useForm();
  const [textForm] = useForm();
  const attributeMapping = useMemo(() => {
    const mapping: Record<string, InnerAttribute> = {};

    if (config) {
      config.reduce((acc, cur) => {
        acc[cur.value] = cur;
        return acc;
      }, mapping);
    }

    return mapping;
  }, [config]);

  const tagConfig = useMemo(() => config?.filter((item) => item.type !== 'string'), [config]);
  const textConfig = useMemo(() => config?.filter((item) => item.type === 'string'), [config]);
  const tagDefaultActiveKeys = useMemo(() => tagConfig?.map((item) => item.value), [tagConfig]);
  const textDefaultActiveKeys = useMemo(() => textConfig?.map((item) => item.value), [textConfig]);
  const tagData = useMemo(() => {
    let _tagData = data?.filter((item) => item.type === 'tag');

    if (!_tagData?.length) {
      _tagData = tagConfig?.map(
        (item) =>
          ({
            id: uid(),
            type: 'tag',
            value: {
              [item.value]: [],
            },
          } as AttributeDataItem),
      );
    }

    return {
      tag: _tagData,
    };
  }, [tagConfig, data]);

  const textData = useMemo(() => {
    let _textData = data?.filter((item) => item.type === 'text');

    if (!_textData?.length) {
      _textData = textConfig?.map(
        (item) =>
          ({
            id: uid(),
            type: 'text',
            value: {
              [item.value]: '',
            },
          } as AttributeDataItem),
      );
    }

    return {
      text: _textData,
    };
  }, [textConfig, data]);

  const tagFormItems = useMemo(() => {
    return (
      tagConfig?.map((item, index) => {
        const attributeConfigItem = attributeMapping[item.value];
        return {
          key: item.value,
          label: (
            <EllipsisText maxWidth={220} title={attributeConfigItem.key}>
              <div>{attributeConfigItem.key}</div>
            </EllipsisText>
          ),
          forceRender: true,
          children: (
            <div>
              <Field name={['tag', index, 'id']}>
                <input style={{ display: 'none' }} />
              </Field>
              <Field name={['tag', index, 'type']}>
                <input style={{ display: 'none' }} />
              </Field>
              <AttributeFormWrapper
                {...attributeConfigItem}
                key={attributeConfigItem.value}
                name={['tag', index, 'value', attributeConfigItem.value]}
              />
            </div>
          ),
        };
      }) ?? []
    );
  }, [attributeMapping, tagConfig]);

  const textFormItems = useMemo(() => {
    return (
      textConfig?.map((item, index) => {
        const attributeConfigItem = attributeMapping[item.value];
        return {
          key: item.value,
          label: (
            <EllipsisText maxWidth={220} title={attributeConfigItem.key}>
              <div>{attributeConfigItem.key}</div>
            </EllipsisText>
          ),
          forceRender: true,
          children: (
            <div>
              <Field name={['text', index, 'id']}>
                <input style={{ display: 'none' }} />
              </Field>
              <Field name={['text', index, 'type']}>
                <input style={{ display: 'none' }} />
              </Field>
              <AttributeFormWrapper
                {...attributeConfigItem}
                key={attributeConfigItem.value}
                name={['text', index, 'value', attributeConfigItem.value]}
              />
            </div>
          ),
        };
      }) ?? []
    );
  }, [attributeMapping, textConfig]);

  // 切换样本时，需要更新表单数据
  useEffect(() => {
    tagForm.setFieldsValue(tagData);
    textForm.setFieldsValue(textData);
  }, [tagData, tagForm, textData, textForm]);

  const handleOnChange = (_name: string) =>
    ((_changedValues, values) => {
      onChange?.(_changedValues[_name], values[_name]);
    }) as FormProps['onValuesChange'];

  return (
    <AttributeTreeWrapper className={className}>
      <FormWithValidation form={tagForm} onValuesChange={handleOnChange('tag')} initialValues={tagData}>
        <CollapseWrapper items={tagFormItems} defaultActiveKey={tagDefaultActiveKeys} />
      </FormWithValidation>
      <FormWithValidation form={textForm} onValuesChange={handleOnChange('text')} initialValues={textData}>
        <CollapseWrapper items={textFormItems} defaultActiveKey={textDefaultActiveKeys} />
      </FormWithValidation>
    </AttributeTreeWrapper>
  );
}
