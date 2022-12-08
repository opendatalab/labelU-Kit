import { Attribute,AttributeUtils } from '@label-u/annotation';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../../store';
import { BasicConfig } from '../../../interface/toolConfig';
import { Button, Dropdown, Space, Menu } from 'antd';
import { COLORS_ARRAY } from '@/data/Style';
// import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import DropdowmIcon from '@/assets/toolStyle/dropdowm.svg';
import DropdowmIconA from '@/assets/toolStyle/dropdowmA.svg';

interface AttributeOperationProps {
  attributeList: Attribute[];
  toolsBasicConfig: BasicConfig[];
  currentToolName: string;
  toolInstance: any;
  copytoolInstance: any;
  imgListCollapse: boolean;
  toolStyle:any;
}

const AttributeOperation: FC<AttributeOperationProps> = (props) => {
  const [_, forceRender] = useState(0);
  const { attributeList, toolsBasicConfig, currentToolName, toolInstance, copytoolInstance,toolStyle } =
    props;
  const [currentAttributeList, setCurrentAttributeList] = useState<Attribute[]>([] as Attribute[]);
  const [attributeBoxLength, setAttributeBoxLength] = useState<number>(0);
  const [shwoAttributeCount, setShwoAttributeCount] = useState<number>(0);
  const [chooseAttribute, setChoseAttribute] = useState<string>();
  const [isHoverDropdown, setIsHoverDropdown] = useState<boolean>(false);
  const [allAttributeList,setAllAttributeList] = useState<Attribute[]>([])

  useEffect(() => {
    if (copytoolInstance && copytoolInstance?.defaultAttribute) {
      setChoseAttribute(copytoolInstance?.defaultAttribute);
    }
  }, [copytoolInstance]);

  // useEffect(() => {
  //   if (toolInstance) {
  //     toolInstance.singleOn('changeAttributeSidebar', (index: number) => {
  //       forceRender((s) => s + 1);

  //     });
  //   }
  //   return () => {
  //     toolInstance.unbindAll('changeAttributeSidebar');
  //   };
  // }, [toolInstance]);

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
        count++;
        if (totalWidth + 200 < attributeBoxLength) {
          let textMeasure = ctx?.measureText(currentAttributeList[i].key + ' ' + i + 1);
          if (currentAttributeList[i].key.length > 6) {
            textMeasure = ctx?.measureText(
              currentAttributeList[i].key.substring(0, 6) + '... ' + i + 1,
            );
          }
          totalWidth += Number(textMeasure?.width) * 1.38 + 26 + 8 + 5;
        } else {
          break;
        }
      }
      setShwoAttributeCount(count);
    }
  }, [attributeBoxLength, currentAttributeList]);

  const drowpDownIcon = (
    <img style={{ width: 14, marginLeft: -4, marginBottom: 3 }} src={DropdowmIcon} />
  );
  const drowpUpIconA = (
    <img style={{ width: 14, marginLeft: -4, marginBottom: 3 }} src={DropdowmIconA} />
  );

  const attributeMenue = useCallback(() => {
    if (currentAttributeList.length >= shwoAttributeCount) {
      let items = currentAttributeList.slice(shwoAttributeCount).map((item, index) => {
        return {
          label: (
            <a
              className={classNames({
                chooseAttribute: item.key === chooseAttribute,
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
                    COLORS_ARRAY[(index + shwoAttributeCount) % COLORS_ARRAY.length],
                  marginRight: 5,
                }}
              />
              <span className='attributeName'>{item.value}</span>
            </a>
          ),
          key: item.key,
        };
      });
      return <Menu items={items} />;
    } else {
      return <div />;
    }
  }, [shwoAttributeCount, currentAttributeList, toolInstance,chooseAttribute]);

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
    // tmpCurrentAttributeList.unshift({ key: t('NoAttribute'), value: '' });
    setCurrentAttributeList(tmpCurrentAttributeList);
  }, [attributeList, toolsBasicConfig, currentToolName]);



  
  useEffect(()=>{
    if(toolInstance){
        let tmpAttributesList:Attribute[] = []
        if(props.attributeList&&props.attributeList.length>0){
          tmpAttributesList = [...tmpAttributesList,...props.attributeList]
        }
        if(props.toolsBasicConfig&&props.toolsBasicConfig.length>0){
          for(let i=0;i<props.toolsBasicConfig.length;i++){
            // @ts-ignore
            if(props.toolsBasicConfig[i].config?.attributeList){
              // @ts-ignore
              tmpAttributesList = [...tmpAttributesList,...props.toolsBasicConfig[i].config?.attributeList]
            }
          }
        }
        toolInstance?.setAllAttributes(tmpAttributesList)
        setAllAttributeList(tmpAttributesList);
    }
  },[currentToolName,toolInstance?.isShowOrder,toolsBasicConfig,attributeList])




  return (
    <div className='attributeBox' key={chooseAttribute}>
      {currentAttributeList &&
        currentAttributeList.length > 0 &&
        currentAttributeList.map((attribute, index) => {
          const buttomDom = (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setChoseAttribute(attribute.key);
                toolInstance.setDefaultAttribute(attribute.key);
                forceRender((s) => s + 1);
                // alert(attribute.key)
              }}
              // className={classNames({
              //   chooseAttribute: attribute.key === chooseAttribute,
              // })}
              style={{
                border: '0px',
                borderRadius: '4px',
                padding: '1px 8px',
                backgroundColor:  attribute.key === chooseAttribute? toolStyle.attributeColor[AttributeUtils.getAttributeIndex(attribute.key, allAttributeList ?? [])+1].valid.stroke :'#FFFFFF',
                color: attribute.key === chooseAttribute ? '#ffffff':'',
                // backgroundColor: COLORS_ARRAY_LIGHT[(index - 1) % COLORS_ARRAY_LIGHT.length],
              }}
              key={attribute.key}
            >
              <div
                className='circle'
                style={{
                  backgroundColor:toolStyle.attributeColor[AttributeUtils.getAttributeIndex(attribute.key, allAttributeList ?? [])+1].valid.stroke,
                  marginRight: 5,
                }}
              />
              <span title={attribute.key} className='attributeName'>{`${attribute.key} ${
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
            className='dropdowm-a'
          >
            <Space style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
              更多
              {/* {currentAttributeList.length} */}
              {isHoverDropdown ? drowpUpIconA : drowpDownIcon}
              {/* <DownOutlined /> */}
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
  toolStyle: appState.toolStyle,
});

export default connect(mapStateToProps)(AttributeOperation);
