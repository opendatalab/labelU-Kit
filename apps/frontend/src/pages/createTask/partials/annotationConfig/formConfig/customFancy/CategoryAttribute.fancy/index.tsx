import type { ButtonProps } from 'antd';
import { Button, Form, Input, Tag, Tooltip, Tree } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { filter, isEqual, map, omit, set, size, update } from 'lodash/fp';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Icon, { CloseCircleFilled, PlusOutlined, StarFilled, SwapOutlined } from '@ant-design/icons';

import { ReactComponent as TreeSwitcherIcon } from '@/assets/svg/tree-switcher.svg';
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';

import type { FancyInputProps } from '../../FancyInput/types';
import { listOmitWithId, listWrapWithId, wrapWithId } from '../utils';

export interface CategoryAttributeItem {
  key: string;
  value: string;
  isMultiple: boolean;
  isDefault: boolean;
  options?: CategoryAttributeOption[];
}

type CategoryAttributeOption = Omit<CategoryAttributeItem, 'options'>;

type CategoryAttributeStateOption = Omit<CategoryAttributeStateItem, 'options'>;

interface CategoryAttributeStateItem extends CategoryAttributeOption {
  id: string;
  options?: CategoryAttributeStateOption[];
}

export interface FancyCategoryAttributeProps extends FancyInputProps {
  value: CategoryAttributeItem[];
  defaultValue: CategoryAttributeItem[];
  onChange: (value: CategoryAttributeItem[]) => void;
}

// ====================== style ======================
const StyledTree = styled<React.FC<TreeProps>>(Tree)`
  .ant-tree-switcher {
    /* height: 1.5rem; */
  }
  .ant-tree-treenode {
    padding-left: 0.6rem;
    position: relative;
    padding-bottom: 0;
    margin-bottom: 0.5rem;
  }
  .ant-tree-node-content-wrapper {
    &:hover {
      background-color: transparent;
    }

    cursor: default;
  }

  .category {
    display: flex;
    align-items: baseline;
  }

  .option {
    display: flex;
    align-items: baseline;
  }

  .sn {
    position: absolute;
    top: 0.3rem;
    left: -2rem;
  }

  .icon {
    font-size: 2rem !important;
  }

  .ant-form-item {
    margin-bottom: 0;
    margin-right: 0.5rem;
  }

  .add-option {
    padding-left: 0;
  }

  .remove {
    cursor: pointer;
    font-size: 1rem;
    color: var(--color-text-tertiary);

    &:hover {
      color: var(--color-error);
    }
  }

  .multiple-switcher {
    cursor: pointer;
  }
`;

const StyledStar = styled<React.FC<ButtonProps & { active: boolean }>>(Button)`
  color: ${(props) => (props.active ? 'var(--color-primary)' : 'var(--color-text-tertiary)')};
  margin-right: 0.5rem;

  &:hover .star-icon,
  &:active .star-icon {
    color: ${(props) => (props.active ? 'var(--color-primary)' : 'var(--color-text-tertiary)')};
  }
`;
// ======================= end =======================

const nestedWithoutId = map((item: CategoryAttributeStateItem) => {
  if (Array.isArray(item.options)) {
    return {
      ...omit(['id'])(item),
      options: listOmitWithId(item.options),
    };
  }

  return omit(['id'])(item);
});

const nestedWithId = map((item: CategoryAttributeItem) => {
  if (Array.isArray(item.options)) {
    return {
      ...wrapWithId(item),
      options: listWrapWithId(item.options),
    };
  }

  return wrapWithId(item);
});

export function FancyCategoryAttribute({ defaultValue = [], value, fullField, onChange }: FancyCategoryAttributeProps) {
  const defaultValueWithId = useMemo(() => {
    return nestedWithId(defaultValue);
  }, [defaultValue]);
  const [stateValue, setValue] = useState<CategoryAttributeStateItem[]>(defaultValueWithId);
  const categoryMapping = useRef<Record<string, CategoryAttributeStateItem>>({});
  const optionMapping = useRef<Record<string, CategoryAttributeStateOption>>({});

  const handleOnChange = useCallback(
    (fieldPath: string) => (changedValue: string | React.ChangeEvent<HTMLInputElement>) => {
      const targetValue = typeof changedValue === 'string' ? changedValue : changedValue.target.value;
      const newValue = set(fieldPath)(targetValue)(stateValue);

      setValue(newValue);
    },
    [stateValue],
  );

  const handleAddCategory = useCallback(() => {
    const newAttribute = wrapWithId({
      key: `分类-${size(stateValue) + 1}`,
      value: `label-${size(stateValue) + 1}`,
      options: [],
    });
    const newValue = [...stateValue, newAttribute];

    setValue(newValue);
    onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
  }, [onChange, stateValue]);

  const handleRemoveAttribute = useCallback(
    (category: CategoryAttributeStateItem) => () => {
      const newValue = stateValue.filter((item) => item.id !== category.id);

      setValue(newValue);
      onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
    },
    [onChange, stateValue],
  );

  const handleAddOption = useCallback(
    (cateIndex: number) => () => {
      const currentOptionSize = size(stateValue[cateIndex].options);
      const newOption = wrapWithId({
        key: `选项-${cateIndex + 1}-${currentOptionSize + 1}`,
        value: `option-${cateIndex + 1}-${currentOptionSize + 1}`,
      });
      const newValue = update(`[${cateIndex}]`)((cate) => {
        return {
          ...cate,
          options: [...cate.options, newOption],
        };
      })(stateValue);

      setValue(newValue);
      onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
    },
    [onChange, stateValue],
  );

  const handleRemoveOption = useCallback(
    (cateIndex: number, option: CategoryAttributeStateItem) => () => {
      const newValue = update(`[${cateIndex}].options`)(
        filter((item: CategoryAttributeStateOption) => item.id !== option.id),
      )(stateValue);

      setValue(newValue);
      onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
    },
    [onChange, stateValue],
  );

  const handleToggleDefault = useCallback(
    (cateIndex: number, optionIndex: number) => () => {
      const newValue = update(`[${cateIndex}].options[${optionIndex}].isDefault`)((isDefault: boolean) => {
        return !isDefault;
      })(stateValue);

      setValue(newValue);
      onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
    },
    [onChange, stateValue],
  );

  const handleToggleMultiple = useCallback(
    (cateIndex: number) => () => {
      const newValue = update(`[${cateIndex}].isMultiple`)((isMultiple: boolean) => {
        return !isMultiple;
      })(stateValue);

      setValue(newValue);
      onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
    },
    [onChange, stateValue],
  );

  useEffect(() => {
    categoryMapping.current = {};
    optionMapping.current = {};

    for (const item of stateValue) {
      if (item.options) {
        for (const option of item.options) {
          optionMapping.current[`${item.value}-${option.value}`] = option;
        }
      }

      categoryMapping.current[item.value] = item;
    }
  }, [stateValue]);

  // 给所有选项加上 id
  useEffect(() => {
    const stateValueWithoutId = nestedWithoutId(stateValue);

    if (!Array.isArray(value) || isEqual(value)(stateValueWithoutId)) {
      return;
    }

    setValue(
      value.map((item) => {
        if (!categoryMapping.current[item.value]) {
          return {
            ...wrapWithId(item),
            options: map((option: CategoryAttributeOption) => {
              if (!optionMapping.current[`${item.value}-${option.value}`]) {
                return wrapWithId(option);
              }

              return {
                ...option,
                id: optionMapping.current[`${item.value}-${option.value}`].id,
              };
            })(item.options),
          };
        }

        return {
          ...item,
          id: categoryMapping.current[item.value].id,
        };
      }),
    );
  }, [stateValue, value]);

  const makeTreeData = useCallback(
    (input: CategoryAttributeStateItem[], path: NamePath, preIndex?: number): DataNode[] => {
      if (!Array.isArray(input)) {
        // eslint-disable-next-line no-console
        console.warn('makeTreeData: input is not an array');
        return [];
      }

      return input.map((item, index) => {
        if (Array.isArray(item.options)) {
          return {
            title: (
              <div className="category">
                <div className="sn">{index + 1}</div>
                <Form.Item name={[...path, index, 'key']} rules={[{ required: true, message: 'key不可为空' }]}>
                  <Input defaultValue={item.key} onChange={handleOnChange(`[${index}].key`)} />
                </Form.Item>
                <Form.Item name={[...path, index, 'value']} rules={[{ required: true, message: 'value不可为空' }]}>
                  <Input defaultValue={item.value} onChange={handleOnChange(`[${index}].value`)} />
                </Form.Item>
                <Tooltip title={item.isMultiple ? '切换单选' : '切换多选'}>
                  <Tag className="multiple-switcher" onClick={handleToggleMultiple(index)}>
                    {item.isMultiple ? '多选' : '单选'} <SwapOutlined />
                  </Tag>
                </Tooltip>
                <Tooltip title="删除">
                  <Icon className="remove" component={DeleteIcon} onClick={handleRemoveAttribute(item)} />
                </Tooltip>
              </div>
            ),
            key: item.id,
            children: [
              // @ts-ignore
              ...makeTreeData(item.options, [...path, index, 'options'], index),
              {
                key: `${item.id}-add`,
                title: (
                  <Button className="add-option" icon={<PlusOutlined />} type="link" onClick={handleAddOption(index)}>
                    新建选项
                  </Button>
                ),
              },
            ],
          };
        }

        return {
          title: (
            <div className="option">
              <Form.Item name={[...path, index, 'key']} rules={[{ required: true, message: '选项key不可为空' }]}>
                <Input defaultValue={item.key} onChange={handleOnChange(`[${preIndex}]options[${index}].key`)} />
              </Form.Item>
              <Form.Item name={[...path, index, 'value']} rules={[{ required: true, message: '选项value不可为空' }]}>
                <Input defaultValue={item.value} onChange={handleOnChange(`[${preIndex}]options[${index}].value`)} />
              </Form.Item>
              <StyledStar
                active={item.isDefault}
                icon={<StarFilled className="star-icon" />}
                size="small"
                type="text"
                onClick={handleToggleDefault(preIndex!, index)}
              />
              <Tooltip title="删除">
                <div className="remove-wrapper">
                  <CloseCircleFilled className="remove" onClick={handleRemoveOption(preIndex!, item)} />
                </div>
              </Tooltip>
            </div>
          ),
          key: item.id,
        };
      });
    },
    [
      handleAddOption,
      handleOnChange,
      handleRemoveAttribute,
      handleRemoveOption,
      handleToggleDefault,
      handleToggleMultiple,
    ],
  );

  const treeData = useMemo(() => makeTreeData(stateValue, fullField), [fullField, makeTreeData, stateValue]);

  return (
    <div>
      <StyledTree
        treeData={treeData}
        selectable={false}
        blockNode
        switcherIcon={<Icon className="icon" component={TreeSwitcherIcon} />}
      />
      <Button className="add" icon={<PlusOutlined />} type="primary" ghost onClick={handleAddCategory}>
        新建分类属性
      </Button>
    </div>
  );
}
