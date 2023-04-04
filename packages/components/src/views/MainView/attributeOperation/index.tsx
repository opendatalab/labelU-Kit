import { BasicToolOperation } from '@label-u/annotation';
import { useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, Space, Menu } from 'antd';
import { cloneDeep, find, isEqual, update } from 'lodash-es';

import DropdowmIcon from '@/assets/toolStyle/dropdowm.svg';
import DropdowmIconA from '@/assets/toolStyle/dropdowmA.svg';
import ViewContext from '@/view.context';

const AttributeOperation = () => {
  const { currentToolName, config, annotationEngine, selectedResult, setSelectedResult, result, setResult } =
    useContext(ViewContext);
  const toolInstance = annotationEngine?.toolInstance;
  const tools = config?.tools;
  // const [currentAttributeList, setCurrentAttributeList] = useState<Attribute[]>([] as Attribute[]);
  const [attributeBoxLength, setAttributeBoxLength] = useState<number>(0);
  const [showAttributeCount, setShowAttributeCount] = useState<number>(0);
  const [chooseAttribute, setChoseAttribute] = useState<string>();
  const [isHoverDropdown, setIsHoverDropdown] = useState<boolean>(false);
  const attributeMap = useMemo(
    () => toolInstance?.config?.attributeMap ?? new Map(),
    [toolInstance?.config?.attributeMap],
  );

  const currentAttributes = useMemo(() => {
    const currentToolConfig = find(tools, { tool: currentToolName });

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

  useEffect(() => {
    if (!selectedResult) {
      setActiveAttribute(toolInstance?.defaultAttribute);
    } else {
      setActiveAttribute(selectedResult.attribute);
    }
  }, [selectedResult, setActiveAttribute, toolInstance]);

  // 计算attribute栏目 宽度
  useEffect(() => {
    const toolContainerWidth = document.getElementById('toolContainer')?.offsetWidth as number;
    setAttributeBoxLength(toolContainerWidth - 30);
  }, [config?.attributes, config?.imgListCollapse]);

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

  const drowpDownIcon = <img style={{ width: 14, marginLeft: -4, marginBottom: 3 }} src={DropdowmIcon} />;
  const drowpUpIconA = <img style={{ width: 14, marginLeft: -4, marginBottom: 3 }} src={DropdowmIconA} />;

  const attributeMenue = useCallback(() => {
    if (currentAttributes.length >= showAttributeCount) {
      const items = currentAttributes.slice(showAttributeCount).map((item) => {
        return {
          label: (
            <a
              style={{
                background: item.value === chooseAttribute ? item.color : '#fff',
                color: item.value === chooseAttribute ? '#fff' : '#000',
              }}
              onClick={(e) => {
                e.stopPropagation();
                toolInstance.setDefaultAttribute(item.value);
                setActiveAttribute(item.value);

                if (selectedResult) {
                  document.dispatchEvent(
                    new CustomEvent('set-attribute', {
                      detail: { result: { ...selectedResult, attribute: item.value }, e },
                    }),
                  );
                }
              }}
            >
              <div
                className="circle"
                style={{
                  backgroundColor: item.color,
                  marginRight: 5,
                }}
              />
              <span className="attributeName">{item?.key}</span>
            </a>
          ),
          key: item.value,
        };
      });
      return <Menu items={items} />;
    } else {
      return <div />;
    }
  }, [currentAttributes, showAttributeCount, chooseAttribute, toolInstance, setActiveAttribute, selectedResult]);

  return (
    <div className="attributeBox" key={chooseAttribute}>
      {currentAttributes &&
        currentAttributes.length > 0 &&
        currentAttributes.map((attribute, index) => {
          const buttomDom = (
            <Button
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                toolInstance.setDefaultAttribute(attribute.value);
                setActiveAttribute(attribute.value);
                if (selectedResult) {
                  document.dispatchEvent(
                    new CustomEvent('set-attribute', {
                      detail: { result: { ...selectedResult, attribute: attribute.value }, e },
                    }),
                  );
                }
              }}
              style={{
                border: '0px',
                borderRadius: '4px',
                padding: '1px 8px',
                backgroundColor: attribute.value === chooseAttribute ? attribute.color : '#FFFFFF',
                color: attribute.value === chooseAttribute ? '#ffffff' : '',
              }}
              key={attribute.value}
            >
              <div
                className="circle"
                style={{
                  backgroundColor: attribute.color,
                  marginRight: 5,
                }}
              />
              <span title={attribute.value} className="attributeName">{`${attributeMap.get(attribute.value)?.key} ${
                index <= 8 ? index + 1 : ''
              }`}</span>
            </Button>
          );
          if (index < showAttributeCount) {
            return buttomDom;
          }
          return <div key={index} />;
        })}
      {currentAttributes && showAttributeCount < currentAttributes.length && (
        <Dropdown overlay={attributeMenue()} trigger={['click']}>
          <a
            onMouseEnter={(e) => {
              e.preventDefault();
              setIsHoverDropdown(true);
            }}
            onMouseLeave={(e) => {
              e.preventDefault();
              setIsHoverDropdown(false);
            }}
            onClick={(e) => e.preventDefault()}
            className="dropdowm-a"
          >
            <Space style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
              更多
              {isHoverDropdown ? drowpUpIconA : drowpDownIcon}
            </Space>
          </a>
        </Dropdown>
      )}
    </div>
  );
};

export default AttributeOperation;
