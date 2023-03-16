import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Tooltip, Badge } from 'antd';
import { set, isEqual, size } from 'lodash/fp';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import ColorPalette from '@/classes/ColorPalette';

import type { FancyInputProps } from '../../FancyInput/types';
import AttributeConfiguration from './AttributeConfiguration';
import { listOmitWithId, listWrapWithId, wrapWithId } from '../utils';

const colorPalette = new ColorPalette();

export interface AttributeItem {
  color: string;
  key: string;
  value: string;
}

interface AttributeItemInState extends AttributeItem {
  id: string;
}

export interface FancyAttributeListProps extends FancyInputProps {
  value: AttributeItem[];
  defaultValue: AttributeItem[];
  onChange: (value: AttributeItem[]) => void;
}

// ====================== style ======================

const StyledAttributeItem = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 0.5rem;
`;

const StyledAttributesWrapper = styled.div`
  .ant-form-item {
    margin-bottom: 0;
    margin-right: 0.5rem;
  }

  .sn {
    flex-basis: 1rem;
  }

  .color {
    width: 1.25rem;
    height: 1.4rem;
    border: 0;
    appearance: none;
    background-color: transparent;
    cursor: pointer;

    &::-webkit-color-swatch {
      border-radius: var(--border-radius);
      border: none;
    }
  }

  .add {
    padding-left: 0;
  }

  .add-wrapper {
    display: flex;
    align-items: center;
    margin-right: 0.5rem;

    .ant-badge-count {
      color: var(--text-color);
    }
  }

  .remove-wrapper {
    height: 100%;
  }

  .remove {
    font-size: 1rem;
    color: var(--color-text-tertiary);

    &:hover {
      color: var(--color-error);
    }
  }
`;

// ======================= end =======================

export function FancyAttributeList({ value, onChange, defaultValue = [], fullField }: FancyAttributeListProps) {
  const defaultValueWithId = useMemo(() => {
    return listWrapWithId(defaultValue);
  }, [defaultValue]);
  const [stateValue, setValue] = useState<AttributeItemInState[]>(defaultValueWithId);
  const attributeMapping = useRef<Record<string, AttributeItemInState>>({});

  const handleOnChange = useCallback(
    (fieldPath: string) => (changedValue: string | React.ChangeEvent<HTMLInputElement>) => {
      const targetValue = typeof changedValue === 'string' ? changedValue : changedValue.target.value;
      const newValue = set(fieldPath)(targetValue)(stateValue);

      setValue(newValue);
    },
    [stateValue],
  );

  const handleAddAttribute = useCallback(() => {
    const newAttribute = wrapWithId({
      color: colorPalette.pick(),
      key: `标签-${size(stateValue) + 1}`,
      value: `label-${size(stateValue) + 1}`,
    });
    const newValue = [...stateValue, newAttribute];

    setValue(newValue);
    onChange?.(listOmitWithId(newValue) as AttributeItem[]);
  }, [onChange, stateValue]);

  const handleRemoveAttribute = useCallback(
    (attribute: AttributeItemInState) => () => {
      const newValue = stateValue.filter((item) => item.id !== attribute.id);

      setValue(newValue);
      onChange?.(listOmitWithId(newValue) as AttributeItem[]);
    },
    [onChange, stateValue],
  );

  const [isAttributeConfigurationOpen, setAttributeConfigurationOpen] = useState(false);
  const handleOpenAttributeConfiguration = useCallback(() => {
    setAttributeConfigurationOpen(true);
  }, []);
  const handleCloseAttributeConfiguration = useCallback(() => {
    setAttributeConfigurationOpen(false);
  }, []);

  useEffect(() => {
    if (!Array.isArray(value) || isEqual(value)(listOmitWithId(stateValue))) {
      return;
    }

    setValue(
      value.map((item) => {
        if (!attributeMapping.current[item.value]) {
          return wrapWithId(item);
        }

        return {
          ...item,
          id: attributeMapping.current[item.value].id,
        };
      }),
    );
  }, [stateValue, value]);

  useEffect(() => {
    const newMapping = stateValue.reduce((acc, item) => {
      acc[item.value] = item;
      return acc;
    }, {} as Record<string, AttributeItemInState>);

    attributeMapping.current = newMapping;
  }, [stateValue]);

  const preFields = useMemo(() => {
    if (Array.isArray(fullField)) {
      return fullField;
    }

    return [fullField];
  }, [fullField]);

  const attributes = useMemo(
    () =>
      stateValue.map((item, index) => {
        return (
          <StyledAttributeItem key={item.id}>
            <div className="sn">{index + 1}</div>
            <Form.Item name={[...preFields, index, 'color']} rules={[{ required: true }]}>
              <input type="color" className="color" value={item.color} onChange={handleOnChange(`[${index}].color`)} />
            </Form.Item>
            <Form.Item name={[...preFields, index, 'key']} rules={[{ required: true, message: 'key不可为空' }]}>
              <Input placeholder="前端显示（中文）" value={item.key} onChange={handleOnChange(`[${index}].key`)} />
            </Form.Item>
            <Form.Item name={[...preFields, index, 'value']} rules={[{ required: true, message: 'value不可为空' }]}>
              <Input placeholder="保存结果（英文）" value={item.value} onChange={handleOnChange(`[${index}].value`)} />
            </Form.Item>
            <div className="add-wrapper">
              <Button type="link" onClick={handleOpenAttributeConfiguration}>
                添加属性
              </Button>
              <Badge count={12} color="var(--color-fill-secondary)" />
            </div>
            <Tooltip title="删除">
              <div className="remove-wrapper">
                <CloseCircleFilled className="remove" onClick={handleRemoveAttribute(item)} />
              </div>
            </Tooltip>
          </StyledAttributeItem>
        );
      }),
    [handleOnChange, handleOpenAttributeConfiguration, handleRemoveAttribute, preFields, stateValue],
  );

  return (
    <StyledAttributesWrapper>
      {attributes}
      <Button className="add" icon={<PlusOutlined />} type="link" onClick={handleAddAttribute}>
        新建
      </Button>
      <AttributeConfiguration
        visible={isAttributeConfigurationOpen}
        value={[]}
        onClose={handleCloseAttributeConfiguration}
      />
    </StyledAttributesWrapper>
  );
}
