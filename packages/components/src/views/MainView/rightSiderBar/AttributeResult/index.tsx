import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type { SelectProps } from 'antd';
import { Empty, Checkbox, Radio, Button, Collapse, Form, Input, Popconfirm, Select } from 'antd';
import classNames from 'classnames';
import { isEmpty, find, sortBy, cloneDeep, map, update, every, compact, size } from 'lodash-es';
import Icon, { EditFilled, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import styled, { css } from 'styled-components';
import type { FormInstance, Rule } from 'antd/es/form';
import type { AnnotationResult, Attribute, AttributeOption, InnerAttributeType, StringType } from '@label-u/annotation';

import emptyAttributeImg from '@/assets/common/emptyAttribute.png';
import DraggableModel from '@/components/dragModal';
import MemoToolIcon from '@/components/ToolIcon';
import ViewContext from '@/view.context';
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';

import { toolList } from '../../toolHeader/ToolOperation';
import { labelTool } from '../../toolHeader/headerOption';
import { expandIconFuc } from '../TagSidebar';
const { Panel } = Collapse;

const AttributeResultWrapper = styled.div<{
  visible?: boolean;
  active?: boolean;
}>`
  ${({ visible }) => css`
    display: ${visible ? 'flex' : 'none'};
  `};
  flex-direction: column;
  height: 100%;

  .attribute-content {
    flex: 1;
    overflow-y: auto;
  }

  .attribute-header {
    display: flex;
    justify-content: space-between;
  }

  .attribute-item {
    --active-color: #f7f7f7;
    cursor: pointer;
    display: flex;
    height: 2rem;
    line-height: 2rem;
    padding: 0 1rem 0 2rem;
    align-items: center;
    justify-content: space-between;
    &:hover,
    &.active {
      background-color: var(--active-color);
    }
    ${({ active }) => css`
      background-color: ${active ? 'var(--active-color)' : 'transparent'};
    `};
  }

  .attribute-left,
  .attribute-right {
    display: flex;
    align-items: center;
  }

  .attribute-order {
    min-width: 1.25rem;
  }

  .action-icon {
    opacity: 0;
    color: var(--color-text-secondary);
    margin-left: 0.5rem;

    &:hover {
      color: var(--color-primary);
    }
  }

  .attribute-item:hover .action-icon,
  .attribute-header:hover .action-icon {
    opacity: 1;
  }

  .hidden .action-icon__eye {
    opacity: 1;
  }

  .clear {
    margin: auto;
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
  }
`;

const StyledForm = styled(Form)`
  .attribute__checkbox-group {
    flex-wrap: wrap;
  }

  .ant-checkbox-wrapper + .ant-checkbox-wrapper {
    margin-inline-start: 0;
  }

  .ant-checkbox-wrapper {
    margin-right: 0.25rem;
  }
`;

interface AttributeResultProps {
  type: InnerAttributeType[keyof InnerAttributeType];
  options?: AttributeOption[];
  label: string;
  value: string;
  required?: boolean;
  regexp?: string;
  maxLength?: number;
  defaultValue?: string | boolean;
  stringType?: StringType[keyof StringType];
}

function AttributeFormItem({
  type,
  options,
  label,
  value,
  defaultValue,
  required,
  regexp,
  maxLength,
  stringType,
}: AttributeResultProps) {
  let finalDefaultValue: string[] | string | boolean | undefined = defaultValue;
  const finalOptions = useMemo(() => {
    return map(options, (item) => {
      return {
        label: item.key,
        value: item.value,
      };
    });
  }, [options]);

  const rules: Rule[] = [];

  let child = null;

  if (type === 'enum') {
    if (isEmpty(options)) {
      child = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    } else {
      child = <Radio.Group options={finalOptions} />;
      finalDefaultValue = compact(
        map(options, (item) => {
          if (item.isDefault) {
            return item.value;
          }
        }),
      );
    }
  }

  if (type === 'array') {
    if (isEmpty(options)) {
      child = <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    } else {
      child = <Checkbox.Group className="attribute__checkbox-group" options={finalOptions} />;
      finalDefaultValue = compact(
        map(options, (item) => {
          if (item.isDefault) {
            return item.value;
          }
        }),
      );
    }
  }

  if (type === 'string') {
    child = (
      <Input.TextArea onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()} maxLength={maxLength} showCount />
    );

    if (required) {
      rules.push({ required: true, message: `${label}为不可为空` });
    }

    if (stringType === 'number') {
      rules.push({ pattern: /^\d+$/, message: `${label}必须为数字` });
    }

    if (stringType === 'english') {
      rules.push({ pattern: /^[a-zA-Z]+$/, message: `${label}必须为英文` });
    }

    if (stringType === 'regexp' && regexp) {
      rules.push({ pattern: new RegExp(regexp), message: `${label}格式不正确（格式为：${regexp}）` });
    }

    if (stringType === 'order') {
      child = <Input disabled />;
    }
  }

  return (
    <Form.Item key={value} label={label} initialValue={finalDefaultValue} name={['attributes', value]} rules={rules}>
      {child}
    </Form.Item>
  );
}

const ResultAttributeForm = forwardRef((props, ref) => {
  const [form] = Form.useForm();
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute>();
  const { selectedResult, allAttributesMap, currentToolName } = useContext(ViewContext);

  const resultAttributeOptions = useMemo(() => {
    return Array.from(selectedAttribute?.attributes ?? []);
  }, [selectedAttribute?.attributes]);

  const attributeOptions = useMemo(() => {
    const options: SelectProps['options'] = [];

    if (!selectedResult) {
      return options;
    }

    allAttributesMap?.get(selectedResult.toolName)?.forEach((item) => {
      options.push({
        label: item.key,
        value: item.value,
      });
    });

    return options;
  }, [allAttributesMap, selectedResult]);

  const handleAttributeChange = useCallback(
    (changedValues) => {
      if ('attribute' in changedValues) {
        const attribute = allAttributesMap?.get(currentToolName)?.get(changedValues.attribute);
        setSelectedAttribute(attribute);
      }
    },
    [allAttributesMap, currentToolName],
  );

  useImperativeHandle(ref, () => form);

  useEffect(() => {
    form.resetFields();

    if (selectedResult) {
      form.setFieldsValue(cloneDeep(selectedResult));
      const attribute = allAttributesMap?.get(selectedResult.toolName)?.get(selectedResult.attribute!);
      setSelectedAttribute(attribute);
    }
  }, [allAttributesMap, form, selectedResult]);

  return (
    <StyledForm form={form} layout="vertical" autoComplete="off" onValuesChange={handleAttributeChange}>
      <Form.Item
        label="标签"
        name="attribute"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select
          optionLabelProp="label"
          options={attributeOptions}
          style={{
            width: '100%',
          }}
        />
      </Form.Item>
      {size(resultAttributeOptions) > 0 && <h3>属性</h3>}
      {map(resultAttributeOptions, (attributeOptionItem) => (
        <AttributeFormItem {...attributeOptionItem} label={attributeOptionItem.key} key={attributeOptionItem.value} />
      ))}
    </StyledForm>
  );
});

const AttributeResult = () => {
  const {
    result,
    setResult,
    allAttributesMap,
    setToolName,
    selectedResult,
    setSelectedResult,
    syncResultToEngine,
    graphicResult,
    annotationEngine,
  } = useContext(ViewContext);

  const dragModalRef = useRef<any>();

  // 以下为新代码

  const resultWithToolName = useMemo(() => {
    const _result = [];

    for (const item of graphicResult) {
      if (isEmpty(item?.result)) {
        continue;
      }

      for (const resultItem of item.result) {
        _result.push({
          ...resultItem,
          toolName: item.toolName,
          color: allAttributesMap?.get(item.toolName)?.get(resultItem.attribute!)?.color,
          icon: find(toolList, { toolName: item.toolName })?.Icon,
        });
      }
    }

    return sortBy(_result, 'order');
  }, [allAttributesMap, graphicResult]);

  const attributeResults = useMemo(() => {
    const resultAttributeMapping = new Map();

    for (const item of resultWithToolName) {
      if (!resultAttributeMapping.has(item.attribute)) {
        resultAttributeMapping.set(item.attribute, []);
      }

      resultAttributeMapping?.get(item.attribute)?.push(item);
    }

    return resultAttributeMapping;
  }, [resultWithToolName]);

  const defaultActiveKey = useMemo(() => {
    return Array.from(attributeResults.keys());
  }, [attributeResults]);

  // 选中标注
  const handleResultItemSelect = (resultItem: any) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setToolName(resultItem.toolName);
    setSelectedResult(resultItem);
  };

  // 删除单个标注
  const handleResultItemDelete = (attribute: any) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const newResult = cloneDeep(result);

    update(newResult, [attribute.toolName, 'result'], (results: any) => {
      return results.filter((item: any) => item.id !== attribute.id);
    });

    setResult(newResult);
    setTimeout(syncResultToEngine);
  };

  // 批量删除标注
  const handleResultsDelete = (attributes: any) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const newResult = cloneDeep(result);

    for (const attribute of attributes) {
      update(newResult, [attribute.toolName, 'result'], (results: any) => {
        return results.filter((item: any) => item.id !== attribute.id);
      });
    }

    setResult(newResult);
    setTimeout(syncResultToEngine);
  };

  // 切换单个标注的显示隐藏
  const handleResultItemVisible = (attribute: any) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const newResult = cloneDeep(result);

    update(newResult, [attribute.toolName, 'result'], (results: any) => {
      return results.map((item: any) => {
        if (item.id === attribute.id) {
          item.isVisible = !item.isVisible;
        }

        return item;
      });
    });

    if (attribute.id === selectedResult?.id && attribute.isVisible) {
      setSelectedResult(null);
    }

    setResult(newResult);
    setTimeout(syncResultToEngine);
  };

  // 切换批量标注的显示隐藏
  const handleResultsVisible = (attributes: any, visible: boolean) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const newResult = cloneDeep(result);

    for (const attribute of attributes) {
      update(newResult, [attribute.toolName, 'result'], (results: any) => {
        return results.map((item: any) => {
          if (item.id === attribute.id) {
            item.isVisible = visible;
          }

          return item;
        });
      });
    }

    if (find(attributes, { id: selectedResult?.id }) && visible) {
      setSelectedResult(null);
    }

    setResult(newResult);
    setTimeout(syncResultToEngine);
  };

  const handleEdit = useCallback(
    (resultItem: any) => (e: React.MouseEvent) => {
      setSelectedResult(resultItem);
      dragModalRef.current?.switchModal(true);
      dragModalRef.current.setPosition({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [setSelectedResult],
  );

  const formRef = useRef<FormInstance>(null);
  const handleModalClose = useCallback(() => {
    if (!formRef.current) {
      return Promise.resolve();
    }

    return formRef.current
      .validateFields()
      .then((values) => {
        const newResult = cloneDeep(result);

        update(newResult, [selectedResult!.toolName, 'result'], (results: any) => {
          return results.map((item: any) => {
            if (item.id === selectedResult!.id) {
              return {
                ...item,
                ...values,
              };
            }

            return item;
          });
        });

        setSelectedResult({
          ...selectedResult,
          ...values,
        });
        setResult(newResult);

        // 属性设置完后需要将结果同步到标注引擎中
        syncResultToEngine();

        return Promise.resolve();
      })
      .catch(() => {
        return Promise.reject();
      });
  }, [result, selectedResult, setResult, setSelectedResult, syncResultToEngine]);

  // 删除标注结果
  const clearAllResult = () => {
    const newResult = cloneDeep(result);
    for (const tool of labelTool) {
      const tmpResult = newResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        newResult[tool].result = [];
      }
    }

    setResult(newResult);
    syncResultToEngine();
  };

  // 绘制结束后，显示标注属性编辑
  useEffect(() => {
    if (!annotationEngine) {
      return;
    }

    const handleOpenAttributeEditAfterDraw = (resultCreated: AnnotationResult, e: MouseEvent) => {
      // 如果标注属性有值，则显示标注属性编辑
      if (size(allAttributesMap?.get(annotationEngine.toolName)?.get(resultCreated.attribute!)?.attributes) > 0) {
        dragModalRef.current?.switchModal(true);
        dragModalRef.current.setPosition({
          x: e.clientX + 350,
          y: e.clientY - 100,
        });
      }

      setTimeout(() => {
        setSelectedResult({
          ...resultCreated,
          toolName: annotationEngine.toolName,
        });
      }, 100);
    };

    const handleSetAttribute = (e: CustomEvent) => {
      const { result: resultCreated, e: event } = e.detail;

      handleOpenAttributeEditAfterDraw(resultCreated, event);
    };

    document.addEventListener('set-attribute', handleSetAttribute as EventListener);
    annotationEngine?.toolInstance?.on?.('drawEnd', handleOpenAttributeEditAfterDraw);

    return () => {
      annotationEngine?.toolInstance?.off?.('drawEnd', handleOpenAttributeEditAfterDraw);
      document.removeEventListener('set-attribute', handleSetAttribute as EventListener);
    };
  }, [allAttributesMap, annotationEngine, setSelectedResult]);

  return (
    <>
      {attributeResults.size === 0 && (
        <div className="containerBox">
          <img className="emptyAttributeImg" src={emptyAttributeImg} />
        </div>
      )}
      <AttributeResultWrapper visible={attributeResults.size > 0}>
        <div className="attribute-content">
          <DraggableModel
            beforeClose={handleModalClose}
            title="详细信息"
            ref={dragModalRef}
            width={333}
            okText="确认"
            cancelText="取消"
          >
            <ResultAttributeForm ref={formRef} />
          </DraggableModel>
          <Collapse className="attribute-panel" defaultActiveKey={defaultActiveKey} expandIcon={expandIconFuc}>
            {Array.from(attributeResults).map(([attributeValue, results]) => {
              const isAllVisible = every(results, (resultItem) => resultItem.isVisible);

              return (
                <Panel
                  key={attributeValue}
                  header={
                    <div
                      className={classNames('attribute-header', {
                        hidden: !isAllVisible,
                      })}
                    >
                      <div className="attribute-left">
                        {allAttributesMap.get(results[0].toolName)?.get(attributeValue)?.key ?? attributeValue}
                      </div>
                      <div className="attribute-right">
                        {isAllVisible ? (
                          <EyeOutlined
                            className="action-icon action-icon__eye"
                            onClick={handleResultsVisible(results, false)}
                          />
                        ) : (
                          <EyeInvisibleOutlined
                            className="action-icon action-icon__eye"
                            onClick={handleResultsVisible(results, true)}
                          />
                        )}
                        <Icon component={DeleteIcon} className="action-icon" onClick={handleResultsDelete(results)} />
                      </div>
                    </div>
                  }
                >
                  {map(results, (resultItem) => (
                    <div
                      key={resultItem.id}
                      className={classNames('attribute-item', {
                        active: selectedResult?.id === resultItem.id,
                        hidden: !resultItem.isVisible,
                      })}
                      onClick={handleResultItemSelect(resultItem)}
                    >
                      <div className="attribute-left">
                        <span className="attribute-order">{resultItem.order}.</span>
                        <MemoToolIcon icon={resultItem.icon} style={{ color: resultItem.color, width: 20 }} />
                        <div className="attribute-name">
                          {allAttributesMap.get(resultItem.toolName)?.get(resultItem.attribute)?.key ?? ''}
                        </div>
                      </div>
                      <div className="attribute-right">
                        <EditFilled onClick={handleEdit(resultItem)} className="action-icon" />
                        {resultItem.isVisible ? (
                          <EyeOutlined
                            className="action-icon action-icon__eye"
                            onClick={handleResultItemVisible(resultItem)}
                          />
                        ) : (
                          <EyeInvisibleOutlined
                            className="action-icon action-icon__eye"
                            onClick={handleResultItemVisible(resultItem)}
                          />
                        )}
                        <Icon
                          component={DeleteIcon}
                          className="action-icon"
                          onClick={handleResultItemDelete(resultItem)}
                        />
                      </div>
                    </div>
                  ))}
                </Panel>
              );
            })}
          </Collapse>
        </div>
        <Popconfirm title="确认清空标注？" okText="确认" cancelText="取消" onConfirm={clearAllResult}>
          <Button className="clear" type="link" icon={<Icon component={DeleteIcon} />}>
            清空
          </Button>
        </Popconfirm>
      </AttributeResultWrapper>
    </>
  );
};

export default AttributeResult;
