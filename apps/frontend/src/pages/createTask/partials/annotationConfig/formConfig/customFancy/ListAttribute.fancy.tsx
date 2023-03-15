import { Button, Input } from 'antd';
import { set, isEqual, omit, map, size } from 'lodash/fp';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { v4 as uuid4 } from 'uuid';

export interface AttributeItem {
  color: string;
  key: string;
  value: string;
}

interface AttributeItemInState extends AttributeItem {
  id: string;
}

export interface FancyAttributeListProps {
  value: AttributeItem[];
  defaultValue: AttributeItem[];
  onChange: (value: AttributeItem[]) => void;
}

const wrapWithId = (item: AttributeItem | AttributeItemInState) => ({
  ...item,
  id: (item as AttributeItemInState).id || uuid4(),
});

const attributesOmitWithId: (attributes: AttributeItemInState[]) => AttributeItem[] = map(omit(['id']));
const attributesWrapWithId: (attributes: AttributeItem[]) => AttributeItemInState[] = map(wrapWithId);

// ====================== style ======================

const StyledAttributeItem = styled.div`
  display: flex;
  align-items: center;
`;

const StyledAttributesWrapper = styled.div`
  .add {
    margin-top: 1rem;
  }
`;

// ======================= end =======================

export function FancyAttributeList({ value, onChange, defaultValue = [] }: FancyAttributeListProps) {
  const defaultValueWithId = useMemo(() => {
    return attributesWrapWithId(defaultValue);
  }, [defaultValue]);
  const [stateValue, setValue] = useState<AttributeItemInState[]>(defaultValueWithId);
  const attributeMapping = useRef<Record<string, AttributeItemInState>>({});

  const handleOnChange = useCallback(
    (fieldPath: string) => (changedValue: string | React.ChangeEvent<HTMLInputElement>) => {
      const targetValue = typeof changedValue === 'string' ? changedValue : changedValue.target.value;
      const newValue = set(fieldPath)(targetValue)(stateValue);

      setValue(newValue);
      onChange?.(attributesOmitWithId(newValue));
    },
    [onChange, stateValue],
  );

  const handleAddAttribute = useCallback(() => {
    // TODO: 增加色盘
    const newAttribute = wrapWithId({
      color: '#000000',
      key: `标签-${size(stateValue) + 1}`,
      value: `label-${size(stateValue) + 1}`,
    });
    const newValue = [...stateValue, newAttribute];

    setValue(newValue);
    onChange?.(attributesOmitWithId(newValue));
  }, [onChange, stateValue]);

  const handleRemoveAttribute = useCallback(
    (attribute: AttributeItemInState) => () => {
      const newValue = stateValue.filter((item) => item.id !== attribute.id);

      setValue(newValue);
      onChange?.(attributesOmitWithId(newValue));
    },
    [onChange, stateValue],
  );

  useEffect(() => {
    if (Array.isArray(value) && !isEqual(value)(attributesOmitWithId(stateValue))) {
      const newValues = value.map((item) => {
        if (!attributeMapping.current[item.value]) {
          return wrapWithId(item);
        }

        return {
          ...item,
          id: attributeMapping.current[item.value].id,
        };
      });
      setValue(newValues);
    }
  }, [stateValue, value]);

  useEffect(() => {
    const newMapping = stateValue.reduce((acc, item) => {
      acc[item.value] = item;
      return acc;
    }, {} as Record<string, AttributeItemInState>);

    attributeMapping.current = newMapping;
  }, [stateValue]);

  const attributes = useMemo(
    () =>
      stateValue.map((item, index) => {
        return (
          <StyledAttributeItem key={item.id}>
            <input type="color" value={item.color} onChange={handleOnChange(`[${index}].color`)} />
            <Input placeholder="前端显示（中文）" value={item.key} onChange={handleOnChange(`[${index}].key`)} />
            <Input placeholder="保存结果（英文）" value={item.value} onChange={handleOnChange(`[${index}].value`)} />
            <Button type="link" danger size="small" onClick={handleRemoveAttribute(item)}>
              删除
            </Button>
          </StyledAttributeItem>
        );
      }),
    [handleOnChange, handleRemoveAttribute, stateValue],
  );

  return (
    <StyledAttributesWrapper>
      {attributes}
      <Button className="add" type="primary" onClick={handleAddAttribute}>
        新建
      </Button>
    </StyledAttributesWrapper>
  );
}
