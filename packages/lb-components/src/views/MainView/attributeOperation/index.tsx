import { Attribute } from '@label-u/lb-annotation';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../../store';
import { BasicConfig } from '../../../interface/toolConfig';
import { Button, Dropdown, Space, Menu } from 'antd';
import { COLORS_ARRAY } from '@/data/Style';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import DropdowmIcon from '@/assets/toolStyle/dropdowm.svg';

interface AttributeOperationProps {
  attributeList: Attribute[];
  toolsBasicConfig: BasicConfig[];
  currentToolName: string;
  toolInstance: any;
  imgListCollapse: boolean;
}

const AttributeOperation: FC<AttributeOperationProps> = (props) => {
  const [_, forceRender] = useState(0);
  const { t } = useTranslation();
  const { attributeList, toolsBasicConfig, currentToolName, toolInstance } = props;
  const [currentAttributeList, setCurrentAttributeList] = useState<Attribute[]>([] as Attribute[]);
  const [attributeBoxLength, setAttributeBoxLength] = useState<number>(0);
  const [shwoAttributeCount, setShwoAttributeCount] = useState<number>(0);

  // 计算attribute栏目 宽度
  useEffect(() => {
    if (attributeList && attributeList.length > 0) {
      // const leftSliderDomWidth = document.getElementById('sliderBoxId')?.offsetWidth as number;
      // const rightSliderDomWidth = 240;
      // const attributeBoxLength = window.innerWidth - leftSliderDomWidth - rightSliderDomWidth;
      const toolContainerWidth = document.getElementById('toolContainer')?.offsetWidth as number;
      setAttributeBoxLength(toolContainerWidth - 30);
    }
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
        count ++;
        if (totalWidth + 200 < attributeBoxLength) {
          let textMeasure = ctx?.measureText(currentAttributeList[i].key + ' ' + i + 1);
          if(currentAttributeList[i].key.length>6){
            textMeasure = ctx?.measureText(currentAttributeList[i].key.substring(0,6) + '... '+ i +1)
          }
          totalWidth += Number(textMeasure?.width) * 1.38 + 26 + 8 + 5;
        } else {
          break;
        }
      }
      setShwoAttributeCount(count);
    }
  }, [attributeBoxLength,currentAttributeList]);

  const drowpDownIcon = <img src={DropdowmIcon} />;

  const attributeMenue = useCallback(() => {
    if (attributeList.length > shwoAttributeCount) {
      let items = attributeList.slice(shwoAttributeCount - 1).map((item, index) => {
        return {
          label: (
            <a
              className={classNames({
                chooseAttribute: item.key === toolInstance?.defaultAttribute,
              })}
              onClick={(e) => {
                e.stopPropagation();
                toolInstance.setDefaultAttribute(item.key);
                forceRender((s) => s + 1);
              }}
            >
              <div
                className='circle'
                style={{
                  backgroundColor:
                    COLORS_ARRAY[(index - 1 + shwoAttributeCount) % COLORS_ARRAY.length],
                  marginRight: 5,
                }}
              />
              <span className='attributeName'>
                {item.value + ' ' + Number(shwoAttributeCount + index + 1)}
              </span>
            </a>
          ),
          key: item.key,
        };
      });
      return <Menu items={items} />;
    } else {
      return <div />;
    }
  }, [shwoAttributeCount, attributeList, toolInstance]);

  // 根据工具名称的修改情况获取最新的attributeList
  useEffect(() => {
    let currentToolConfig: BasicConfig[] = [];
    let tmpCurrentAttributeList: Attribute[] = [];
    if (currentToolName && toolsBasicConfig && toolsBasicConfig.length > 0) {
      currentToolConfig = toolsBasicConfig.filter((item, index) => {
        return item.tool === currentToolName;
      });
      if (
        currentToolConfig?.[0].config &&
        Object.keys(currentToolConfig?.[0].config).indexOf('attributeList') > 0
      ) {
        // @ts-ignore
        tmpCurrentAttributeList = attributeList.concat(currentToolConfig?.[0].config.attributeList);
      }
    } else {
      tmpCurrentAttributeList = attributeList;
    }
    tmpCurrentAttributeList.unshift({ key: t('NoAttribute'), value: '' });
    setCurrentAttributeList(tmpCurrentAttributeList);
  }, [attributeList, toolsBasicConfig, currentToolName]);

  return (
    <div className='attributeBox' key={toolInstance?.defaultAttribute}>
      {currentAttributeList &&
        currentAttributeList.length > 0 &&
        currentAttributeList.map((attribute, index) => {
          const buttomDom = (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toolInstance.setDefaultAttribute(attribute.key);
                forceRender((s) => s + 1);
                // alert(attribute.key)
              }}
              className={classNames({
                chooseAttribute: attribute.key === toolInstance?.defaultAttribute,
              })}
              style={{
                border: '0px',
                borderRadius: '4px',
                padding: '1px 8px',
                backgroundColor: '#FFFFFF',
                // color: COLORS_ARRAY[(index - 1) % COLORS_ARRAY.length],
                // backgroundColor: COLORS_ARRAY_LIGHT[(index - 1) % COLORS_ARRAY_LIGHT.length],
              }}
              key={attribute.key}
            >
              <div
                className='circle'
                style={{
                  backgroundColor: COLORS_ARRAY[(index - 1) % COLORS_ARRAY.length],
                  marginRight: 5,
                }}
              />
              <span title={attribute.key} className='attributeName'>{`${attribute.key} ${index + 1}`}</span>
            </Button>
          );
          if (index < shwoAttributeCount) {
            return buttomDom;
          }
          return <div key={index} />;
        })}
      {
      shwoAttributeCount < currentAttributeList.length && (
        <Dropdown overlay={attributeMenue()} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()}>
            <Space style={{ marginLeft: '10px' }}>
              更多
              {currentAttributeList.length}
              {drowpDownIcon}
              {/* <DownOutlined /> */}
            </Space>
          </a>
        </Dropdown>
      )}
    </div>
  );
};

const mapStateToProps = (appState: AppState) => ({
  toolInstance: appState.annotation.toolInstance,
  attributeList: appState.annotation.attributeList,
  toolsBasicConfig: appState.annotation.toolsBasicConfig,
  currentToolName: appState.annotation.currentToolName,
  imgListCollapse: appState.toolStyle.imgListCollapse,
});

export default connect(mapStateToProps)(AttributeOperation);
