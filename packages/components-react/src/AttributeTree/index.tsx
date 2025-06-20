import type { InnerAttribute, TagAnnotationEntity, TextAnnotationEntity, TextAttribute } from '@labelu/interface';
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

export const AttributeTreeWrapper = styled.div`
  /* disabled */
  [aria-disabled='true'] {
    pointer-events: none;
    cursor: not-allowed;
  }
`;

const AttributeFormWrapper = styled(AttributeFormItem)`
  padding: 0.5rem 1rem;
  margin-bottom: 0;
`;

export interface AttributeDataItem {
  type?: string;
  attributes?: Record<string, string | string[]>;
}

export interface AttributeTreeProps {
  data?: (TagAnnotationEntity | TextAnnotationEntity)[];
  config?: InnerAttribute[];
  onChange?: FormProps['onValuesChange'];
  className?: string;
  disabled?: boolean;
}

export function AttributeTree({ data, config, onChange, className, disabled }: AttributeTreeProps) {
  const [form] = useForm();
  const attributeMappingByTool = useMemo(() => {
    const mapping: Record<string, Record<string, InnerAttribute>> = {};

    if (config) {
      config.forEach((item) => {
        if (!mapping[item.type as string]) {
          mapping[item.type as string] = {};
        }

        mapping[item.type as string][item.value] = item;
      });
    }

    return mapping;
  }, [config]);

  const tagConfig = useMemo(() => config?.filter((item) => item.type !== 'string'), [config]);
  const textConfig = useMemo(() => config?.filter((item) => item.type === 'string'), [config]);
  const tagDefaultActiveKeys = useMemo(() => tagConfig?.map((item) => item.value), [tagConfig]);
  const textDefaultActiveKeys = useMemo(() => textConfig?.map((item) => item.value), [textConfig]);
  const formData = useMemo(() => {
    const _tagData: Record<string, TagAnnotationEntity> = {};
    const _textData: Record<string, TextAnnotationEntity> = {};

    data?.forEach((item) => {
      if (item.type === 'tag') {
        _tagData[Object.keys(item.value)[0]] = item;
      }

      if (item.type === 'text') {
        _textData[Object.keys(item.value)[0]] = item;
      }
    });

    tagConfig?.forEach((item) => {
      if (!_tagData[item.value]) {
        _tagData[item.value] = {
          id: uid(),
          type: 'tag',
          value: {
            [item.value]: [],
          },
        } as TagAnnotationEntity;
      }
    });

    textConfig?.forEach((item) => {
      if (!_textData[item.value]) {
        _textData[item.value] = {
          id: uid(),
          type: 'text',
          value: {
            [item.value]: '',
          },
        } as TextAnnotationEntity;
      }
    });

    return {
      tag: _tagData,
      text: _textData,
    };
  }, [data, tagConfig, textConfig]);

  const tagFormItems = useMemo(() => {
    return (
      tagConfig?.map((item) => {
        const attributeConfigItem = attributeMappingByTool[item.type as string][item.value];
        return {
          key: item.value,
          label: (
            <EllipsisText maxWidth={220} title={attributeConfigItem.key}>
              <span>
                {item.required && <span style={{ color: 'red' }}>*</span>}
                <span>{attributeConfigItem.key}</span>
              </span>
            </EllipsisText>
          ),
          forceRender: true,
          children: (
            <div>
              <Field name={['tag', item.value, 'id']}>
                <input style={{ display: 'none' }} />
              </Field>
              <Field name={['tag', item.value, 'type']}>
                <input style={{ display: 'none' }} />
              </Field>
              <AttributeFormWrapper
                {...attributeConfigItem}
                disabled={disabled}
                key={attributeConfigItem.value}
                name={['tag', item.value, 'value', attributeConfigItem.value]}
              />
            </div>
          ),
        };
      }) ?? []
    );
  }, [attributeMappingByTool, tagConfig, disabled]);

  const textFormItems = useMemo(() => {
    return (
      (textConfig as TextAttribute[])?.map((item) => {
        const attributeConfigItem = attributeMappingByTool[item.type as string][item.value];

        return {
          key: item.value,
          label: (
            <EllipsisText maxWidth={220} title={attributeConfigItem.key}>
              <span>
                {item.required && <span style={{ color: 'red' }}>*</span>}
                {attributeConfigItem.key}
              </span>
            </EllipsisText>
          ),
          forceRender: true,
          children: (
            <div>
              <Field name={['text', item.value, 'id']}>
                <input style={{ display: 'none' }} />
              </Field>
              <Field name={['text', item.value, 'type']}>
                <input style={{ display: 'none' }} />
              </Field>
              <AttributeFormWrapper
                {...attributeConfigItem}
                disabled={disabled}
                key={attributeConfigItem.value}
                name={['text', item.value, 'value', attributeConfigItem.value]}
              />
            </div>
          ),
        };
      }) ?? []
    );
  }, [attributeMappingByTool, textConfig, disabled]);

  // 切换样本时，需要更新表单数据
  useEffect(() => {
    form.setFieldsValue(formData);
  }, [form, formData]);

  return (
    <AttributeTreeWrapper aria-disabled={disabled} className={className}>
      <FormWithValidation form={form} onValuesChange={disabled ? undefined : onChange} initialValues={formData}>
        <CollapseWrapper items={tagFormItems} defaultActiveKey={tagDefaultActiveKeys} />
        <CollapseWrapper items={textFormItems} defaultActiveKey={textDefaultActiveKeys} />
      </FormWithValidation>
    </AttributeTreeWrapper>
  );
}
