import { prefix } from '../../../constant';
import { EToolName } from '../../../data/enums/ToolType';
import { AppState } from '../../../store';
import { Sider } from '../../../types/main';
import StepUtils from '../../../utils/StepUtils';
import React from 'react';
import { Tabs } from 'antd';
import { connect, useSelector } from 'react-redux';
import TextToolSidebar from './TextToolSidebar';
import TagSidebar from './TagSidebar';
import AttributeRusult from './AttributeRusult';

// const { EVideoToolName } = cTool;

interface IProps {
  toolName?: EToolName;
  sider?: Sider;
}

const sidebarCls = `${prefix}-sidebar`;
const RightSiderbar: React.FC<IProps> = ({ sider }) => {
  const stepInfo = useSelector((state: AppState) =>
    StepUtils.getCurrentStepInfo(state.annotation.step, state.annotation.stepList),
  );
  // const imgIndex = useSelector((state: AppState) => state.annotation.imgIndex);
  const tagConfigList = useSelector((state: AppState) => state.annotation.tagConfigList);
  const textConfig = useSelector((state: AppState) => state.annotation.textConfig);
  const toolName = stepInfo?.tool;
  if (!toolName) {
    return null;
  }

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
