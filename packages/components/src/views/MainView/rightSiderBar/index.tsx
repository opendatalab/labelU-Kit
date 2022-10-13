import { prefix } from '../../../constant';
import { EToolName } from '../../../data/enums/ToolType';
import { AppState } from '../../../store';
import { Sider } from '../../../types/main';
import StepUtils from '../../../utils/StepUtils';
import React, { useState } from 'react';
import { Popconfirm, Tabs } from 'antd';
import { connect, useSelector } from 'react-redux';
import TextToolSidebar from './TextToolSidebar';
import TagSidebar from './TagSidebar';
import AttributeRusult from './AttributeRusult';
import ClearResultIcon from '../../../assets/annotation/common/clear_result.svg';
// const { EVideoToolName } = cTool;

interface IProps {
  toolName?: EToolName;
  sider?: Sider;
}

const sidebarCls = `${prefix}-sidebar`;
const RightSiderbar: React.FC<IProps> = ({ sider }) => {
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const stepInfo = useSelector((state: AppState) =>
    StepUtils.getCurrentStepInfo(state.annotation.step, state.annotation.stepList),
  );
  // const imgIndex = useSelector((state: AppState) => state.annotation.imgIndex);
  const tagConfigList = useSelector((state: AppState) => state.annotation.tagConfigList);
  const textConfig = useSelector((state: AppState) => state.annotation.textConfig);
  const toolInstance = useSelector((state: AppState) => state.annotation.toolInstance);
  const toolName = stepInfo?.tool;
  if (!toolName) {
    return null;
  }

  // 删除标注结果
  const doClearAllResult = () => {
    toolInstance?.clearResult();
    toolInstance?.setPrevResultList([])
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

  return (
    <div className={`${sidebarCls}`}>
      <Tabs defaultActiveKey='1'>
        {tagConfigList && tagConfigList.length > 0 && (
          <Tabs.TabPane tab='分类' key='1'>
            <div className={`${sidebarCls}`}>
              <TagSidebar />
            </div>
          </Tabs.TabPane>
        )}

        <Tabs.TabPane tab='标注结果' key='2'>
          <AttributeRusult />
        </Tabs.TabPane>
        {textConfig && textConfig.length > 0 && (
          <Tabs.TabPane tab='文本' key='3'>
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
    toolInstance: state.annotation.toolInstance,
    tagConfigList: state.annotation.tagConfigList,
    imgIndex: state.annotation.imgIndex,
  };
}

export default connect(mapStateToProps)(RightSiderbar);
