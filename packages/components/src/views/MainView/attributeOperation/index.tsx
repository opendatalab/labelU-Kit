import { Attribute, AttributeUtils } from '@label-u/annotation';
import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { AppState } from '../../../store';
import { BasicConfig } from '../../../interface/toolConfig';
import { Button, Dropdown, Space, Menu } from 'antd';
// import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import DropdowmIcon from '@/assets/toolStyle/dropdowm.svg';
import DropdowmIconA from '@/assets/toolStyle/dropdowmA.svg';
import { ReactComponent as CollapseIcon } from '@/assets/common/collapse.svg';
import { LabelUContext, useDispatch } from '@/store/ctx';
import { UseAttributes } from '@/components/pointCloudView/hooks/useAttribute';
import { PointCloudContext } from '@/components/pointCloudView/PointCloudContext';
import { updateResultCollapseStatus } from '@/store/toolStyle/actionCreators';
import ToolIcon from '@/components/ToolIcon';

interface AttributeOperationProps {
  attributeList: Attribute[];
  toolsBasicConfig: BasicConfig[];
  currentToolName: string;
  toolInstance: any;
  copytoolInstance: any;
  imgListCollapse: boolean;
  toolStyle: any;
}

export const getCombineAttributes = (
  toolsBasicConfig: BasicConfig[],
  attributeList: Attribute[],
) => {
  let tmpAttributesList: Attribute[] = [];
  if (attributeList && attributeList.length > 0) {
    tmpAttributesList = [...tmpAttributesList, ...attributeList];
  }
  if (toolsBasicConfig && toolsBasicConfig.length > 0) {
    for (let toolConfig of toolsBasicConfig) {
      // @ts-ignore
      if (toolConfig.config?.attributeList) {
        // @ts-ignore
        tmpAttributesList = [
          ...tmpAttributesList,
          // @ts-ignore
          ...toolConfig.config.attributeList,
        ];
      }
    }
  }
  return tmpAttributesList;
};

const AttributeOperation: FC<AttributeOperationProps> = (props) => {
  const [, forceRender] = useState(0);
  const {
    attributeList,
    toolsBasicConfig,
    currentToolName,
    toolInstance,
    copytoolInstance,
    toolStyle,
  } = props;
  const ptCtx = useContext(PointCloudContext);
  const [currentAttributeList, setCurrentAttributeList] = useState<Attribute[]>([] as Attribute[]);
  const [attributeBoxLength, setAttributeBoxLength] = useState<number>(0);
  const [shwoAttributeCount, setShwoAttributeCount] = useState<number>(0);
  const [chooseAttribute, setChoseAttribute] = useState<string>();
  const [isHoverDropdown, setIsHoverDropdown] = useState<boolean>(false);
  const [allAttributeList, setAllAttributeList] = useState<Attribute[]>([]);
  const { updateMainViewAttribute } = UseAttributes();
  const { resultCollapse } = toolStyle;

  const dispatch = useDispatch();

  useEffect(() => {
    if (copytoolInstance?.defaultAttribute) {
      setChoseAttribute(copytoolInstance?.defaultAttribute);
    } else if (ptCtx.mainViewInstance?.attribute) {
      setChoseAttribute(ptCtx.mainViewInstance?.attribute);
    }
  }, [copytoolInstance, ptCtx.mainViewInstance?.attribute]);

  // 计算attribute栏目 宽度
  useEffect(() => {
    if (attributeList && attributeList.length > 0) {
      const toolContainerWidth = window.innerWidth as number;
      setAttributeBoxLength(toolContainerWidth - 190);
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
                setChoseAttribute(item.value);
                if (toolInstance) {
                  toolInstance.setDefaultAttribute(item.key);
                }
                if (ptCtx.mainViewInstance) {
                  updateMainViewAttribute?.(item.key);
                }
                forceRender((s) => s + 1);
              }}
            >
              <div
                className='circle'
                style={{
                  backgroundColor:
                    toolStyle.attributeColor[
                      AttributeUtils.getAttributeIndex(item.key, allAttributeList ?? []) + 1
                    ].valid.stroke,
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
  }, [shwoAttributeCount, currentAttributeList, toolInstance, chooseAttribute]);

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
    setCurrentAttributeList(tmpCurrentAttributeList);
  }, [attributeList, toolsBasicConfig, currentToolName]);

  // 设置工具全量标签列表
  useEffect(() => {
    let tmpAttributesList = getCombineAttributes(props.toolsBasicConfig, props.attributeList);
    if (ptCtx?.mainViewInstance) {
      ptCtx?.mainViewInstance?.setAllAttributes(tmpAttributesList);
    } else if (toolInstance) {
      toolInstance?.setAllAttributes(tmpAttributesList);
    }
    setAllAttributeList(tmpAttributesList);
  }, [
    currentToolName,
    toolInstance?.isShowOrder,
    toolsBasicConfig,
    attributeList,
    ptCtx.mainViewInstance,
  ]);

  return (
    <div className='attributeCollapseRow'>
      <div className='attributeBox' key={chooseAttribute}>
        {currentAttributeList &&
          currentAttributeList.length > 0 &&
          currentAttributeList.map((attribute, index) => {
            const buttomDom = (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setChoseAttribute(attribute.key);
                  if (toolInstance) {
                    toolInstance.setDefaultAttribute(attribute.key);
                  }
                  if (ptCtx.mainViewInstance) {
                    updateMainViewAttribute?.(attribute.key);
                  }
                  forceRender((s) => s + 1);
                }}
                // className={classNames({
                //   chooseAttribute: attribute.key === chooseAttribute,
                // })}
                style={{
                  border: '0px',
                  borderRadius: '4px',
                  padding: '1px 8px',
                  backgroundColor:
                    attribute.key === chooseAttribute
                      ? toolStyle.attributeColor[
                          AttributeUtils.getAttributeIndex(attribute.key, allAttributeList ?? []) +
                            1
                        ].valid.stroke
                      : '#FFFFFF',
                  color: attribute.key === chooseAttribute ? '#ffffff' : '',
                  // backgroundColor: COLORS_ARRAY_LIGHT[(index - 1) % COLORS_ARRAY_LIGHT.length],
                }}
                key={attribute.key}
              >
                <div
                  className='circle'
                  style={{
                    backgroundColor:
                      toolStyle.attributeColor[
                        AttributeUtils.getAttributeIndex(attribute.key, allAttributeList ?? []) + 1
                      ].valid.stroke,
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
      <div
        className='collapseAction'
        onClick={(e) => {
          e.stopPropagation();
          dispatch(updateResultCollapseStatus(!resultCollapse));
          setTimeout(() => {
            ptCtx.mainViewInstance?.emit('resetAllView');
          }, 500);
        }}
      >
        <ToolIcon icon={CollapseIcon} className='collapseIcon' />
      </div>
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

export default connect(mapStateToProps, null, null, { context: LabelUContext })(AttributeOperation);
