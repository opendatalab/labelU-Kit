import type { Attribute } from '@label-u/annotation';
import { BasicToolOperation } from '@label-u/annotation';
import type { FC } from 'react';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Button, Dropdown, Space, Menu } from 'antd';

import DropdowmIcon from '@/assets/toolStyle/dropdowm.svg';
import DropdowmIconA from '@/assets/toolStyle/dropdowmA.svg';

import type { BasicConfig } from '../../../interface/toolConfig';
import type { AppState } from '../../../store';

interface AttributeOperationProps {
  attributeList: Attribute[];
  toolsBasicConfig: BasicConfig[];
  currentToolName: string;
  toolInstance: any;
  copytoolInstance: any;
  imgListCollapse: boolean;
}

const AttributeOperation: FC<AttributeOperationProps> = (props) => {
  const { attributeList, toolsBasicConfig, currentToolName, toolInstance, copytoolInstance } = props;
  const [currentAttributeList, setCurrentAttributeList] = useState<Attribute[]>([] as Attribute[]);
  const [attributeBoxLength, setAttributeBoxLength] = useState<number>(0);
  const [shwoAttributeCount, setShwoAttributeCount] = useState<number>(0);
  const [chooseAttribute, setChoseAttribute] = useState<string>();
  const [isHoverDropdown, setIsHoverDropdown] = useState<boolean>(false);
  const attributeMap = useMemo(
    () => toolInstance?.config?.attributeMap ?? new Map(),
    [toolInstance?.config?.attributeMap],
  );

  const setActiveAttribute = (attributeName: string) => {
    BasicToolOperation.Cache.set('activeAttribute', attributeName);
    setChoseAttribute(attributeName);
  };

  useEffect(() => {
    if (copytoolInstance && copytoolInstance?.defaultAttribute) {
      setActiveAttribute(copytoolInstance?.defaultAttribute);
    }
  }, [copytoolInstance]);

  useEffect(() => {
    const handleAttributeChange = ({ detail }: CustomEvent<any>) => {
      toolInstance.setDefaultAttribute(detail);
      setActiveAttribute(detail);
    };

    document.addEventListener('attribute::change', handleAttributeChange as EventListener);

    return () => {
      document.removeEventListener('attribute::change', handleAttributeChange as EventListener);
    };
  }, [toolInstance]);

  // 计算attribute栏目 宽度
  useEffect(() => {
    const toolContainerWidth = document.getElementById('toolContainer')?.offsetWidth as number;
    setAttributeBoxLength(toolContainerWidth - 30);
  }, [attributeList, props.imgListCollapse]);

  // 计算可显示 attribute 个数
  useEffect(() => {
    if (attributeBoxLength > 0 && currentAttributeList && currentAttributeList.length > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // @ts-ignore
      ctx.font = '16px';
      let totalWidth = 0;
      let count = 0;
      for (let i = 0; i < currentAttributeList.length; i++) {
        count++;
        if (totalWidth + 200 < attributeBoxLength) {
          let textMeasure = ctx?.measureText(currentAttributeList[i].value + ' ' + i + 1);
          if (currentAttributeList[i].value.length > 6) {
            textMeasure = ctx?.measureText(currentAttributeList[i].value.substring(0, 6) + '... ' + i + 1);
          }
          totalWidth += Number(textMeasure?.width) * 1.38 + 26 + 8 + 5;
        } else {
          break;
        }
      }
      setShwoAttributeCount(count);
    }
  }, [attributeBoxLength, currentAttributeList]);

  const drowpDownIcon = <img style={{ width: 14, marginLeft: -4, marginBottom: 3 }} src={DropdowmIcon} />;
  const drowpUpIconA = <img style={{ width: 14, marginLeft: -4, marginBottom: 3 }} src={DropdowmIconA} />;

  const attributeMenue = useCallback(() => {
    if (currentAttributeList.length >= shwoAttributeCount) {
      const items = currentAttributeList.slice(shwoAttributeCount).map((item) => {
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
  }, [currentAttributeList, shwoAttributeCount, chooseAttribute, toolInstance]);

  // 根据工具名称的修改情况获取最新的attributeList
  useEffect(() => {
    let currentToolConfig: BasicConfig[] = [];
    let tmpCurrentAttributeList: Attribute[] = [];
    if (currentToolName && toolsBasicConfig && toolsBasicConfig.length > 0) {
      currentToolConfig = toolsBasicConfig.filter((item) => {
        return item.tool === currentToolName;
      });
      if (currentToolConfig?.[0].config && Object.keys(currentToolConfig?.[0].config).indexOf('attributes') > 0) {
        // @ts-ignore
        tmpCurrentAttributeList = attributeList.concat(currentToolConfig?.[0].config.attributes);
      }
    } else {
      tmpCurrentAttributeList = attributeList;
    }
    // tmpCurrentAttributeList.unshift({ key: t('NoAttribute'), value: '' });
    setCurrentAttributeList(tmpCurrentAttributeList);
  }, [attributeList, toolsBasicConfig, currentToolName]);

  // REVIEW: 这里删除了原先的useEffect（用于设置attributeList）

  return (
    <div className="attributeBox" key={chooseAttribute}>
      {currentAttributeList &&
        currentAttributeList.length > 0 &&
        currentAttributeList.map((attribute, index) => {
          const buttomDom = (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toolInstance.setDefaultAttribute(attribute.value);
                setActiveAttribute(attribute.value);
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
          if (index < shwoAttributeCount) {
            return buttomDom;
          }
          return <div key={index} />;
        })}
      {shwoAttributeCount < currentAttributeList.length && (
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

const mapStateToProps = (appState: AppState) => ({
  copytoolInstance: { ...appState.annotation.toolInstance },
  toolInstance: appState.annotation.toolInstance,
  attributeList: appState.annotation.attributeList,
  toolsBasicConfig: appState.annotation.toolsBasicConfig,
  currentToolName: appState.annotation.currentToolName,
  imgListCollapse: appState.toolStyle.imgListCollapse,
});

export default connect(mapStateToProps)(AttributeOperation);
