import { prefix } from '../../../constant';
import { EToolName } from '../../../data/enums/ToolType';
import { AppState } from '../../../store';
import { Sider } from '../../../types/main';
import StepUtils from '../../../utils/StepUtils';
import React, { useEffect, useState } from 'react';
import { Popconfirm, Tabs } from 'antd';
import { connect, useSelector } from 'react-redux';
import TextToolSidebar from './TextToolSidebar';
import TagSidebar from './TagSidebar';
import AttributeRusult from './AttributeRusult';
import ClearResultIcon from '../../../assets/annotation/common/clear_result.svg';
import { IFileItem } from '@/types/data';

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

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [textTab, setTextTab] = useState<any>();
  const [tabIndex, setTabIndex] = useState<string>('1');
  const [tagTab, setTagTab] = useState<any>(
    <div className='rightTab'>
    <p>分类</p>
    <span className='innerWord'>未完成
    </span>
  </div>
  );
  const [attributeTab, setAttributeTab] = useState<any>();

  const stepInfo = useSelector((state: AppState) =>
    StepUtils.getCurrentStepInfo(state.annotation.step, state.annotation.stepList),
  );
  const tagConfigList = useSelector((state: AppState) => state.annotation.tagConfigList);
  const textConfig = useSelector((state: AppState) => state.annotation.textConfig);
  const toolInstance = useSelector((state: AppState) => state.annotation.toolInstance);
  const toolName = stepInfo?.tool;

  // 删除标注结果
  const doClearAllResult = () => {
    toolInstance?.clearResult();
    toolInstance?.setPrevResultList([]);
  };

  const showPopconfirm = () => {
    setOpen(true);
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
          <span className='innerWord'>
            {textResultKeys &&
            textResultKeys.length > 0 &&
            textResultKeys.length === textConfig.length
              ? '已完成'
              : '未完成'}
          </span>
        </div>,
      );
      // 设置分类结果
      if(currentImgResult?.tagTool?.toolName){

        let tagResultKeys = currentImgResult?.tagTool
        ? Object.keys(currentImgResult?.tagTool.result[0]?.result)
        : [];
      setTagTab(
        <div className='rightTab'>
          <p>分类</p>
          <span className='innerWord'>
            {tagResultKeys &&
            tagResultKeys.length > 0 &&
            tagResultKeys.length === tagConfigList.length
              ? '已完成'
              : '未完成'}
          </span>
        </div>,
      );
      }

      // 设置标签件数
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
        </Tabs.TabPane>
        {textConfig && textConfig.length > 0 && (
          <Tabs.TabPane tab={textTab} key='3'>
            <div className={`${sidebarCls}`}>
              <TextToolSidebar />
            </div>
          </Tabs.TabPane>
        )}
      </Tabs>
      <Popconfirm
        title='确认清空标注？'
        open={open}
        okText='确认'
        cancelText='取消'
        onConfirm={handleOk}
        okButtonProps={{ loading: confirmLoading }}
        onCancel={handleCancel}
      >
        <img onClick={showPopconfirm} className='clrearResult' src={ClearResultIcon} />
      </Popconfirm>
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
