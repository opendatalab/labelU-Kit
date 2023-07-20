import type { EToolName } from '@label-u/annotation';
import { BasicToolOperation } from '@label-u/annotation';
import { useContext, useMemo, useCallback, useEffect, useState } from 'react';
import type { ButtonProps, MenuProps } from 'antd';
import { Button, Dropdown, Space } from 'antd';
import { cloneDeep, find, isEqual, update } from 'lodash-es';
import styled, { css } from 'styled-components';
import Icon from '@ant-design/icons';
import classNames from 'classnames';

import { ReactComponent as DropdownIcon } from '@/assets/svg/dropdown.svg';
import ViewContext from '@/view.context';
import { labelTool } from '@/constant';

const attributeHighlightStyle = css`
  .attribute-item__highlight-color {
    width: 3px;
    height: 13px;
    background-color: var(--attribute-color);
    margin-right: 0.25rem;
  }
`;

const StyledAttributeButton = styled<
  React.FC<
    ButtonProps & {
      active?: boolean;
    }
  >
>(Button)`
  border: 0;
  border-radius: var(--border-radius-xs);
  background-color: var(--attribute-color);
  padding: 0 8px 0 0;

  ${({ active }) =>
    active
      ? css`
          color: #ffffff;
          background-color: var(--attribute-color) !important;

          &:hover {
            color: #ffffff !important;
          }
        `
      : css`
          background-color: #fff;

          &:hover {
            color: var(--attribute-color) !important;
          }
        `}
  ${attributeHighlightStyle}
`;

const AttributeWrapper = styled.div``;

const AttributeDropdown = styled.div`
  .ant-dropdown-menu-item {
    padding: 0 !important;
    margin-bottom: 0.25rem !important;

    &:last-child {
      margin-bottom: 0 !important;
    }
  }

  .attribute-menu-item {
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-xs);

    &:hover {
      background-color: var(--attribute-color) !important;
      color: #ffffff !important;
    }

    &.active {
      background-color: var(--attribute-color) !important;
      color: #ffffff !important;
    }
  }

  ${attributeHighlightStyle}
`;

const AttributeOperation = () => {
  const { currentToolName, config, annotationEngine, selectedResult, setSelectedResult, result, setResult } =
    useContext(ViewContext);
  const toolInstance = annotationEngine?.toolInstance;
  const tools = config?.tools;
  const [attributeBoxLength, setAttributeBoxLength] = useState<number>(0);
  const [showAttributeCount, setShowAttributeCount] = useState<number>(0);
  const [chooseAttribute, setChoseAttribute] = useState<string>();
  const attributeMap = useMemo(
    () => toolInstance?.config?.attributeMap ?? new Map(),
    [toolInstance?.config?.attributeMap],
  );

  const currentAttributes = useMemo(() => {
    const labelTools = tools?.filter((tool) => labelTool.includes(tool.tool as EToolName));
    const currentToolConfig = find(labelTools, { tool: currentToolName });

    return [...(config?.attributes ?? []), ...(currentToolConfig?.config?.attributes ?? [])];
  }, [config?.attributes, currentToolName, tools]);

  const setActiveAttribute = useCallback(
    (attributeName: string) => {
      setChoseAttribute(attributeName);

      if (!selectedResult || chooseAttribute === attributeName) {
        return;
      }

      BasicToolOperation.Cache.set('activeAttribute', attributeName);
      const newResult = cloneDeep(result);

      update(newResult, [currentToolName, 'result'], (items) => {
        return items?.map((resultItem: any) => {
          if (resultItem.id === selectedResult.id && attributeName !== resultItem.attribute) {
            return {
              ...resultItem,
              attribute: attributeName,
            };
          }
          return resultItem;
        });
      });
      if (!isEqual(newResult, result)) {
        setResult(newResult);
      }

      setSelectedResult({
        ...selectedResult,
        attribute: attributeName,
      });
    },
    [chooseAttribute, result, selectedResult, currentToolName, setResult, setSelectedResult],
  );

  const handleAttributeClick = useCallback(
    ({ domEvent, key }) => {
      domEvent.stopPropagation();
      toolInstance.setDefaultAttribute(key);
      setActiveAttribute(key);
      if (selectedResult) {
        document.dispatchEvent(
          new CustomEvent('set-attribute', {
            detail: { result: { ...selectedResult, attribute: key }, e: domEvent },
          }),
        );
      }
    },
    [selectedResult, setActiveAttribute, toolInstance],
  );

  useEffect(() => {
    if (!selectedResult) {
      setActiveAttribute(toolInstance?.defaultAttribute);
    } else {
      setActiveAttribute(selectedResult.attribute!);
    }
  }, [selectedResult, setActiveAttribute, toolInstance]);

  // 计算attribute栏目 宽度
  useEffect(() => {
    const toolContainerWidth = document.getElementById('toolContainer')?.offsetWidth as number;
    setAttributeBoxLength(toolContainerWidth - 30);
  }, [config?.attributes]);

  // 计算可显示 attribute 个数
  useEffect(() => {
    if (attributeBoxLength > 0 && currentAttributes && currentAttributes.length > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // @ts-ignore
      ctx.font = '16px';
      let totalWidth = 0;
      let count = 0;
      for (let i = 0; i < currentAttributes.length; i++) {
        count++;
        if (totalWidth + 200 < attributeBoxLength) {
          let textMeasure = ctx?.measureText(currentAttributes[i].value + ' ' + i + 1);
          if (currentAttributes[i].value.length > 6) {
            textMeasure = ctx?.measureText(currentAttributes[i].value.substring(0, 6) + '... ' + i + 1);
          }
          totalWidth += Number(textMeasure?.width) * 1.38 + 26 + 8 + 5;
        } else {
          break;
        }
      }
      setShowAttributeCount(count);
    }
  }, [attributeBoxLength, currentAttributes]);

  const attributeMenu: MenuProps | undefined = useMemo(() => {
    if (currentAttributes.length >= showAttributeCount) {
      const items = currentAttributes.slice(showAttributeCount).map((item) => {
        return {
          label: (
            <a
              className={classNames('attribute-menu-item', {
                active: item.value === chooseAttribute,
              })}
              style={{
                // @ts-ignore
                '--attribute-color': item.color,
              }}
            >
              <div className="attribute-item__highlight-color" />
              <span className="attributeName">{item?.key}</span>
            </a>
          ),
          key: item.value,
        };
      });
      return {
        items: items,
        onClick: handleAttributeClick,
      };
    }
  }, [currentAttributes, showAttributeCount, handleAttributeClick, chooseAttribute]);

  return (
    <AttributeWrapper className="attributeBox" key={chooseAttribute}>
      {currentAttributes &&
        currentAttributes.length > 0 &&
        currentAttributes.map((attribute, index) => {
          const buttonNode = (
            <StyledAttributeButton
              onClick={(e: React.MouseEvent) => {
                handleAttributeClick?.({ domEvent: e, key: attribute.value });
              }}
              active={attribute.value === chooseAttribute}
              style={{
                // @ts-ignore
                '--attribute-color': attribute.color,
              }}
              key={attribute.value}
            >
              <div className="attribute-item__highlight-color" />
              <span title={attribute.value} className="attributeName">{`${attributeMap.get(attribute.value)?.key} ${
                index <= 8 ? index + 1 : ''
              }`}</span>
            </StyledAttributeButton>
          );
          if (index < showAttributeCount) {
            return buttonNode;
          }
          return <div key={index} />;
        })}
      {currentAttributes && showAttributeCount < currentAttributes.length && (
        <Dropdown
          menu={attributeMenu}
          trigger={['click']}
          dropdownRender={(menu) => <AttributeDropdown>{menu}</AttributeDropdown>}
        >
          <Button type="link">
            <Space style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
              更多
              <Icon component={DropdownIcon} />
            </Space>
          </Button>
        </Dropdown>
      )}
    </AttributeWrapper>
  );
};

export default AttributeOperation;
