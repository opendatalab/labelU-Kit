import { Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import _ from 'lodash-es';

import type { IFileItem } from '@/types/data';

import { prefix } from '../../../constant';
import type { EToolName } from '../../../data/enums/ToolType';
import type { AppState } from '../../../store';
import type { Sider } from '../../../types/main';
import StepUtils from '../../../utils/StepUtils';
import { toolList } from '../toolHeader/ToolOperation';
import AttributeRusult from './AttributeRusult';
import TagSidebar from './TagSidebar';
import TextToolSidebar from './TextToolSidebar';

interface IProps {
  toolName?: EToolName;
  sider?: Sider;
  dispatch: Function;
  imgList: IFileItem[];
  imgIndex: number;
  currentToolName?: EToolName;
  isPreview: boolean;
}

const sidebarCls = `${prefix}-sidebar`;
const RightSiderbar: React.FC<IProps> = (props) => {
  const { imgList, imgIndex, currentToolName, isPreview } = props;
  const [textTab, setTextTab] = useState<any>();
  const [tabIndex, setTabIndex] = useState<string>('1');
  const [tagTab, setTagTab] = useState<any>(
    <div className="rightTab">
      <p>分类</p>
      <span className="innerWord">未完成</span>
    </div>,
  );
  const [attributeTab, setAttributeTab] = useState<any>();
  const stepInfo = useSelector((state: AppState) =>
    StepUtils.getCurrentStepInfo(state.annotation.step, state.annotation.stepList),
  );
  const [isShowClear, setIsShowClear] = useState(false);
  const tagConfigList = useSelector((state: AppState) => state.annotation.tagConfigList);
  const textConfig = useSelector((state: AppState) => state.annotation.textConfig);
  const toolName = stepInfo?.tool;

  // 删除标注结果
  // const doClearAllResult = () => {
  //   toolInstance?.clearResult();
  //   toolInstance?.setPrevResultList([]);
  // };

  useEffect(() => {
    if (imgList && imgList.length > 0) {
      const currentImgResult = JSON.parse(imgList[imgIndex].result as string);
      const textResultKeys = currentImgResult?.textTool ? currentImgResult?.textTool.result : [];
      // 设置文本描述结果
      setTextTab(
        <div className="rightTab">
          <p>文本描述</p>
          <span
            className={classNames({
              innerWord: true,
              finish: textResultKeys && textResultKeys.length > 0 && textResultKeys.length === textConfig.length,
            })}
          >
            {textResultKeys && textResultKeys.length > 0 && textResultKeys.length === textConfig.length
              ? '已完成'
              : '未完成'}
          </span>
        </div>,
      );
      // 设置分类结果
      const tagResultKeys = Object.keys(_.get(currentImgResult, 'tagTool.result[0].result', {}));
      setTagTab(
        <div className="rightTab">
          <p>分类</p>
          <span
            className={classNames({
              innerWord: true,
              finish: tagResultKeys && tagResultKeys.length > 0 && tagResultKeys.length === tagConfigList.length,
            })}
          >
            {tagResultKeys && tagResultKeys.length > 0 && tagResultKeys.length === tagConfigList.length
              ? '已完成'
              : '未完成'}
          </span>
        </div>,
      );
      // }
      // 设置标注件数
      // let rectResult = currentImgResult?.rectTool ? currentImgResult.rectTool.result : [];
      // let polygonResult = currentImgResult?.polygonTool ? currentImgResult.polygonTool.result : [];
      // let lineResult = currentImgResult?.lineTool ? currentImgResult.lineTool.result : [];
      // let pointResult = currentImgResult?.pointTool ? currentImgResult.pointTool.result : [];
      const imgResult = JSON.parse(imgList[imgIndex].result as string);
      let count = 0;
      let order: number[] = [];
      for (const item of toolList) {
        if (item.toolName !== 'tagTool') {
          if (
            imgResult[item.toolName] &&
            imgResult[item.toolName]?.result &&
            imgResult[item.toolName]?.result?.length > 0
          ) {
            for (let i = 0; i < imgResult[item.toolName].result.length; i++) {
              if (order.indexOf(imgResult[item.toolName].result[i].order) < 0) {
                order.push(imgResult[item.toolName].result[i].order);
              }
            }
            count += order.length;
            order = [];
          }
        }
      }

      // let count = rectResult.length + polygonResult.length + lineResult.length + pointResult.length;
      setAttributeTab(
        <div className="rightTab">
          <p>标注结果</p>
          <span className="innerWord">{count}件</span>
        </div>,
      );
      if (count > 0) {
        setIsShowClear(true);
      } else {
        setIsShowClear(false);
      }
    }
  }, [currentToolName, tabIndex, imgList, imgIndex, textConfig.length, tagConfigList.length]);

  if (!toolName) {
    return null;
  }

  return (
    <div className={`${sidebarCls}`}>
      <Tabs
        defaultActiveKey="1"
        onChange={(e) => {
          setTabIndex(e);
        }}
      >
        {tagConfigList && tagConfigList.length > 0 && (
          <Tabs.TabPane tab={tagTab} key="1">
            <div className={`${sidebarCls}`}>
              <TagSidebar isPreview={isPreview} />
            </div>
          </Tabs.TabPane>
        )}
        <Tabs.TabPane tab={attributeTab} key="2">
          <AttributeRusult isPreview={isPreview} isShowClear={isShowClear} />
        </Tabs.TabPane>
        {textConfig && textConfig.length > 0 && (
          <Tabs.TabPane tab={textTab} key="3">
            <div className={`${sidebarCls}`}>
              <TextToolSidebar isPreview={isPreview} />
            </div>
          </Tabs.TabPane>
        )}
      </Tabs>
    </div>
  );
};

function mapStateToProps(state: AppState) {
  return {
    currentToolName: state.annotation.currentToolName,
    imgList: [...state.annotation.imgList],
    toolInstance: state.annotation.toolInstance,
    tagConfigList: state.annotation.tagConfigList,
    textConfig: state.annotation.textConfig,
    imgIndex: state.annotation.imgIndex,
  };
}

export default connect(mapStateToProps)(RightSiderbar);
