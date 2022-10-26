import { prefix } from '../../../constant';
import { EToolName } from '../../../data/enums/ToolType';
import { AppState } from '../../../store';
import { Sider } from '../../../types/main';
import StepUtils from '../../../utils/StepUtils';
import React, { useEffect, useState } from 'react';
import { Popconfirm, Tabs } from 'antd';
import { connect, useDispatch, useSelector } from 'react-redux';
import TextToolSidebar from './TextToolSidebar';
import TagSidebar from './TagSidebar';
import AttributeRusult from './AttributeRusult';
import ClearResultIconHover from '../../../assets/annotation/common/clear_result_hover.svg';
import ClearResultIcon from '../../../assets/annotation/common/clear_result.svg';
import { IFileItem } from '@/types/data';
import { labelTool } from '../toolHeader/headerOption';
import { UpdateImgList } from '@/store/annotation/actionCreators';
import { PrevResult } from '@label-u/annotation';
import { toolList } from '../toolHeader/ToolOperation';
import classNames from 'classnames';

interface IProps {
  toolName?: EToolName;
  sider?: Sider;
  dispatch: Function;
  imgList: IFileItem[];
  imgIndex: number;
  currentToolName?: EToolName;
}

const sidebarCls = `${prefix}-sidebar`;
const RightSiderbar: React.FC<IProps> = (props) => {
  const { imgList, imgIndex, currentToolName } = props;

  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [textTab, setTextTab] = useState<any>();
  const [tabIndex, setTabIndex] = useState<string>('1');
  const [tagTab, setTagTab] = useState<any>(
    <div className='rightTab'>
      <p>分类</p>
      <span className='innerWord'>未完成</span>
    </div>,
  );
  const [attributeTab, setAttributeTab] = useState<any>();
  const [isClearnHover,setIsClearHover] = useState<boolean>(false);
  const stepInfo = useSelector((state: AppState) =>
    StepUtils.getCurrentStepInfo(state.annotation.step, state.annotation.stepList),
  );
  const [isShowClear, setIsShowClear] = useState(false);
  const tagConfigList = useSelector((state: AppState) => state.annotation.tagConfigList);
  const textConfig = useSelector((state: AppState) => state.annotation.textConfig);
  const toolInstance = useSelector((state: AppState) => state.annotation.toolInstance);
  const toolName = stepInfo?.tool;

  // 删除标注结果
  // const doClearAllResult = () => {
  //   toolInstance?.clearResult();
  //   toolInstance?.setPrevResultList([]);
  // };

  const showPopconfirm = () => {
    setOpen(true);
  };

  // 更新pre 标注结果
  const updateCanvasView = (newLabelResult: any) => {
    const prevResult: PrevResult[] = [];
    for (let oneTool of toolList) {
      if (oneTool.toolName !== currentToolName && newLabelResult[oneTool.toolName]) {
        let onePrevResult = {
          toolName: oneTool.toolName,
          result: newLabelResult[oneTool.toolName].result,
        };
        prevResult.push(onePrevResult);
      }
      if (oneTool.toolName === currentToolName) {
        toolInstance.setResult(newLabelResult[oneTool.toolName].result);
      }
    }
    toolInstance.setPrevResultList(prevResult);
    toolInstance.render();
  };

  // 删除标注结果
  const doClearAllResult = () => {
    let oldImgResult = JSON.parse(imgList[imgIndex].result as string);
    for (let tool of labelTool) {
      let tmpResult = oldImgResult[tool]?.result;
      if (tmpResult && tmpResult.length > 0) {
        oldImgResult[tool].result = [];
      }
    }
    imgList[imgIndex].result = JSON.stringify(oldImgResult);
    dispatch(UpdateImgList(imgList));
    updateCanvasView(oldImgResult);
  };

  const handleOk = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      doClearAllResult();
      setOpen(false);
      setConfirmLoading(false);
    }, 100);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (imgList && imgList.length > 0) {
      let currentImgResult = JSON.parse(imgList[imgIndex].result as string);
      let textResultKeys = currentImgResult?.textTool ? currentImgResult?.textTool : [];
      // 设置文本描述结果
      setTextTab(
        <div className='rightTab'>
          <p>文本描述</p>
          <span className={classNames({
              'innerWord':true,
              'finish': textResultKeys &&
              textResultKeys.length > 0 &&
              textResultKeys.length === textConfig.length

            })}>
            {textResultKeys &&
            textResultKeys.length > 0 &&
            textResultKeys.length === textConfig.length
              ? '已完成'
              : '未完成'}
          </span>
        </div>,
      );
      // 设置分类结果
      if (currentImgResult?.tagTool?.toolName) {
        let tagResultKeys = currentImgResult?.tagTool
          ? Object.keys(currentImgResult?.tagTool.result[0]?.result)
          : [];
        setTagTab(
          <div className='rightTab'>
            <p>分类</p>
            <span className={classNames({
              'innerWord':true,
              'finish': tagResultKeys &&
              tagResultKeys.length > 0 &&
              tagResultKeys.length === tagConfigList.length

            })}>
              {tagResultKeys &&
              tagResultKeys.length > 0 &&
              tagResultKeys.length === tagConfigList.length
                ? '已完成'
                : '未完成'}
            </span>
          </div>,
        );
      }

      // 设置标注件数
      let rectResult = currentImgResult?.rectTool ? currentImgResult.rectTool.result : [];
      let polygonResult = currentImgResult?.polygonTool ? currentImgResult.polygonTool.result : [];
      let lineResult = currentImgResult?.lineTool ? currentImgResult.lineTool.result : [];
      let pointResult = currentImgResult?.pointTool ? currentImgResult.pointTool.result : [];
      let count = rectResult.length + polygonResult.length + lineResult.length + pointResult.length;
      setAttributeTab(
        <div className='rightTab'>
          <p>标注结果</p>
          <span className='innerWord'>{count}件</span>
        </div>,
      );
      if (count > 0) {
        setIsShowClear(true);
      } else {
        setIsShowClear(false);
      }
    }
  }, [currentToolName, tabIndex, imgList, imgIndex]);

  if (!toolName) {
    return null;
  }

  return (
    <div className={`${sidebarCls}`}>
      <Tabs
        defaultActiveKey='1'
        onChange={(e) => {
          setTabIndex(e);
        }}
      >
        {tagConfigList && tagConfigList.length > 0 && (
          <Tabs.TabPane tab={tagTab} key='1'>
            <div className={`${sidebarCls}`}>
              <TagSidebar />
            </div>
          </Tabs.TabPane>
        )}
        <Tabs.TabPane tab={attributeTab} key='2'>
          <AttributeRusult />
          {isShowClear && (
            <Popconfirm
              title='确认清空标注？'
              open={open}
              okText='确认'
              cancelText='取消'
              onConfirm={handleOk}
              okButtonProps={{ loading: confirmLoading }}
              onCancel={handleCancel}
            >
              <img onMouseEnter={e=>{
                e.stopPropagation();
                setIsClearHover(true)
              }} 
               onMouseLeave={
                e=>{
                  e.stopPropagation();
                  setIsClearHover(false);
                }
               }
              onClick={showPopconfirm} className='clrearResult' src={isClearnHover?ClearResultIconHover:ClearResultIcon} />
            </Popconfirm>
          )}
        </Tabs.TabPane>
        {textConfig && textConfig.length > 0 && (
          <Tabs.TabPane tab={textTab} key='3'>
            <div className={`${sidebarCls}`}>
              <TextToolSidebar />
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
