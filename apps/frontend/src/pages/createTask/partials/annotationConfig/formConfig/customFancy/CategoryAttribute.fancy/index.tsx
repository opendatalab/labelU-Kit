import type { AffixProps, ButtonProps } from 'antd';
import { Switch, Affix, Select, InputNumber, Button, Form, Input, Tag, Tooltip, Tree } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import type { DataNode, TreeProps } from 'antd/es/tree';
import { filter, isEqual, map, omit, set, size, update } from 'lodash/fp';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Icon, { CloseCircleFilled, PlusOutlined, StarFilled, SwapOutlined } from '@ant-design/icons';

import { ReactComponent as TreeSwitcherIcon } from '@/assets/svg/tree-switcher.svg';
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';
import type { FancyInputProps } from '@/components/FancyInput/types';

import { duplicatedValueValidator, listOmitWithId, listWrapWithId, wrapWithId } from '../utils';

export enum CategoryType {
  Enum = 'enum',
  Tuple = 'tuple',
  String = 'string',
}

export enum StringType {
  Text = 'text',
  Number = 'number',
  Serial = 'serial',
  Regexp = 'regexp',
  English = 'english',
}

export interface CategoryAttributeItem {
  key: string;
  value: string;
  /** enum 为单选；tuple为多选；string为文本描述 */
  type: keyof typeof CategoryType;
  stringType?: keyof typeof StringType;
  /** 以下是属性分类才有的字段 */
  isDefault?: boolean;
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
  defaultValue?: CategoryAttributeItem[];
  onChange?: (value: CategoryAttributeItem[]) => void;
  className?: string;
  style?: React.CSSProperties;
  affixProps?: AffixProps;
  addTagText?: string;
  addStringText?: string;
  showAddTag?: boolean;
  showAddString?: boolean;
}

export interface FancyCategoryAttributeRef {
  addCategory: (cateType: CategoryType) => () => void;
  removeCategory: (category: CategoryAttributeStateItem) => () => void;
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

  .category .ant-form-item,
  .option .ant-form-item {
    margin-bottom: 0;
    flex-grow: 1;
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

  .text-form-wrapper {
    .ant-form-item {
      margin-bottom: 0.5rem;
    }
    .ant-form-item-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .ant-form-item-control {
      min-height: auto;
      width: 100%;
    }
  }

  .should-align-center {
    display: flex;
    align-items: center;
  }
`;

export const StyledFancyAttributeWrapper = styled.div`
  .buttons {
    background-color: #fff;
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

const tagTitleMapping: Record<CategoryType, string> = {
  [CategoryType.Enum]: '单选',
  [CategoryType.Tuple]: '多选',
  [CategoryType.String]: '文本',
};

const tooltipTitleMapping: Record<CategoryType, string> = {
  [CategoryType.Enum]: '切换多选',
  [CategoryType.Tuple]: '切换单选',
  [CategoryType.String]: '文本描述',
};

const stringTypeOptions = [
  { label: '任意字符', value: StringType.Text },
  { label: '序号', value: StringType.Serial },
  { label: '仅数字', value: StringType.Number },
  { label: '仅英文', value: StringType.English },
  { label: '自定义格式', value: StringType.Regexp },
];

export const FancyCategoryAttribute = forwardRef<FancyCategoryAttributeRef, FancyCategoryAttributeProps>(
  function ForwardRefFancyCategoryAttribute(
    {
      defaultValue = [],
      value,
      fullField,
      onChange,
      className,
      style,
      affixProps,
      addTagText = '新建分类属性',
      addStringText = '新建文本分类',
      showAddTag = true,
      showAddString = true,
    },
    ref,
  ) {
    const defaultValueWithId = useMemo(() => {
      return nestedWithId(defaultValue);
    }, [defaultValue]);
    const [stateValue, setValue] = useState<CategoryAttributeStateItem[]>(defaultValueWithId);
    const categoryMapping = useRef<Record<string, CategoryAttributeStateItem>>({});
    const optionMapping = useRef<Record<string, CategoryAttributeStateOption>>({});

    const handleOnChange = useCallback(
      (fieldPath: string) =>
        (
          changedValue: string | number | boolean | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null,
        ) => {
          const targetValue = ['string', 'number', 'boolean'].includes(typeof changedValue)
            ? changedValue
            : changedValue === null
            ? ''
            : (changedValue as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>).target.value;
          const newValue = set(fieldPath)(targetValue)(stateValue);

          setValue(newValue);
        },
      [stateValue],
    );

    const handleAddAttribute = useCallback(
      (cateType: CategoryType) => () => {
        const newAttribute =
          cateType === CategoryType.Enum
            ? wrapWithId({
                key: `分类-${size(stateValue) + 1}`,
                value: `label-${size(stateValue) + 1}`,
                type: cateType,
                options: [],
              })
            : wrapWithId({
                key: `分类-${size(stateValue) + 1}`,
                value: `label-${size(stateValue) + 1}`,
                type: cateType,
                maxLength: 1000,
                stringType: StringType.Text,
                defaultValue: '',
                regexp: '',
              });
        const newValue = [...stateValue, newAttribute];

        setValue(newValue);
        onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
      },
      [onChange, stateValue],
    );

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

        // isMultiple true，可以有多个默认值
        if ((newValue[cateIndex].type as CategoryType) === CategoryType.Enum) {
          for (let i = 0; i < size(stateValue[cateIndex].options); i++) {
            if (i !== optionIndex) {
              newValue[cateIndex].options[i].isDefault = false;
            }
          }
        }

        setValue(newValue);
        onChange?.(nestedWithoutId(newValue) as CategoryAttributeItem[]);
      },
      [onChange, stateValue],
    );

    const handleToggleMultiple = useCallback(
      (cateIndex: number) => () => {
        let newValue = update(`[${cateIndex}].type`)((itemType: CategoryType) => {
          return itemType === CategoryType.Enum ? CategoryType.Tuple : CategoryType.Enum;
        })(stateValue) as CategoryAttributeStateItem[];

        // 如果 isMultiple 由 true 变为 false，需要把所有 isDefault 为 true 的选项都变为 false
        if ((newValue[cateIndex].type as CategoryType) === CategoryType.Enum) {
          for (let i = 0; i < size(newValue[cateIndex].options); i++) {
            newValue = set(`[${cateIndex}].options[${i}].isDefault`)(false)(newValue);
          }
        }

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

    // 暴露添加函数
    useImperativeHandle(
      ref,
      () => ({
        addCategory: handleAddAttribute,
        removeCategory: handleRemoveAttribute,
      }),
      [handleAddAttribute, handleRemoveAttribute],
    );

    // 给所有选项加上 id
    useEffect(() => {
      const stateValueWithoutId = nestedWithoutId(stateValue);

      if (!Array.isArray(value) || isEqual(value)(stateValueWithoutId)) {
        return;
      }

      setValue(
        value.map((item) => {
          if (!categoryMapping.current[item.value]) {
            if (!item.options) {
              return wrapWithId(item);
            }

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
          const itemType = item.type as CategoryType;
          const otherValueFields: NamePath[] = [];

          input.forEach((_, inputIndex) => {
            if (inputIndex !== index) {
              otherValueFields.push([...path, inputIndex, 'value']);
            }
          });

          if (Array.isArray(item.options) && [CategoryType.Enum, CategoryType.Tuple].includes(itemType)) {
            return {
              title: (
                <div className="category">
                  <div className="sn">{index + 1}</div>
                  <Form.Item name={[...path, index, 'key']} rules={[{ required: true, message: 'key不可为空' }]}>
                    <Input onChange={handleOnChange(`[${index}].key`)} />
                  </Form.Item>
                  <Form.Item
                    name={[...path, index, 'value']}
                    dependencies={otherValueFields}
                    // @ts-ignore
                    rules={[{ required: true, message: 'value不可为空' }, duplicatedValueValidator(path, index)]}
                  >
                    <Input onChange={handleOnChange(`[${index}].value`)} />
                  </Form.Item>
                  <div className="should-align-center">
                    <Tooltip title={tooltipTitleMapping[itemType]}>
                      <Tag className="multiple-switcher" onClick={handleToggleMultiple(index)}>
                        {tagTitleMapping[itemType]} <SwapOutlined />
                      </Tag>
                    </Tooltip>
                    <Tooltip title="删除">
                      <Icon className="remove" component={DeleteIcon} onClick={handleRemoveAttribute(item)} />
                    </Tooltip>
                  </div>
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
          } else if (itemType === CategoryType.String) {
            return {
              title: (
                <div className="category">
                  <div className="sn">{index + 1}</div>
                  <Form.Item name={[...path, index, 'key']} rules={[{ required: true, message: 'key不可为空' }]}>
                    <Input onChange={handleOnChange(`[${index}].key`)} />
                  </Form.Item>
                  <Form.Item
                    name={[...path, index, 'value']}
                    dependencies={otherValueFields}
                    // @ts-ignore
                    rules={[{ required: true, message: 'value不可为空' }, duplicatedValueValidator(path, index)]}
                  >
                    <Input onChange={handleOnChange(`[${index}].value`)} />
                  </Form.Item>
                  <div className="should-align-center">
                    <Tag>{tagTitleMapping[itemType]}</Tag>
                    <Tooltip title="删除">
                      <Icon className="remove" component={DeleteIcon} onClick={handleRemoveAttribute(item)} />
                    </Tooltip>
                  </div>
                </div>
              ),
              key: item.id,
              children: [
                {
                  key: `${item.id}-string`,
                  title: (
                    <div className="text-form-wrapper">
                      {/* @ts-ignore */}
                      <Form.Item name={[...path, index, 'maxLength']} label="最大字数">
                        <InputNumber
                          style={{ width: '71.5%' }}
                          min={1}
                          onChange={handleOnChange(`[${index}].maxLength`)}
                        />
                      </Form.Item>
                      <Form.Item name={[...path, index, 'stringType']} label="字符类型">
                        <Select
                          style={{ width: '71.5%' }}
                          options={stringTypeOptions}
                          onChange={handleOnChange(`[${index}].stringType`)}
                        />
                      </Form.Item>
                      <Form.Item name={[...path, index, 'required']} label="是否必填">
                        <Switch onChange={handleOnChange(`[${index}].required`)} />
                      </Form.Item>
                      {(item.stringType as StringType) === StringType.Regexp && (
                        <Form.Item name={[...path, index, 'regexp']} label="自定义格式（正则表达式）">
                          <Input.TextArea style={{ width: '71.5%' }} onChange={handleOnChange(`[${index}].regexp`)} />
                        </Form.Item>
                      )}
                      <Form.Item name={[...path, index, 'defaultValue']} label="默认值">
                        <Input.TextArea
                          style={{ width: '71.5%' }}
                          onChange={handleOnChange(`[${index}].defaultValue`)}
                        />
                      </Form.Item>
                    </div>
                  ),
                },
              ],
            };
          }

          return {
            title: (
              <div className="option">
                <Form.Item name={[...path, index, 'key']} rules={[{ required: true, message: '选项key不可为空' }]}>
                  <Input onChange={handleOnChange(`[${preIndex}]options[${index}].key`)} />
                </Form.Item>
                <Form.Item name={[...path, index, 'value']} rules={[{ required: true, message: '选项value不可为空' }]}>
                  <Input onChange={handleOnChange(`[${preIndex}]options[${index}].value`)} />
                </Form.Item>
                <StyledStar
                  active={Boolean(item.isDefault)}
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
    const buttons = (
      <div className="buttons">
        {showAddTag && (
          <Button
            className="add"
            icon={<PlusOutlined />}
            type="primary"
            ghost
            onClick={handleAddAttribute(CategoryType.Enum)}
          >
            {addTagText}
          </Button>
        )}
        {showAddString && (
          <Button
            className="add"
            icon={<PlusOutlined />}
            type="primary"
            ghost
            onClick={handleAddAttribute(CategoryType.String)}
          >
            {addStringText}
          </Button>
        )}
      </div>
    );

    return (
      <StyledFancyAttributeWrapper className={className} style={style}>
        <StyledTree
          treeData={treeData}
          selectable={false}
          blockNode
          switcherIcon={<Icon className="icon" component={TreeSwitcherIcon} />}
        />
        {affixProps ? <Affix {...affixProps}>{buttons}</Affix> : buttons}
      </StyledFancyAttributeWrapper>
    );
  },
);
