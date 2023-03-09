import type { BasicConfig } from '@label-u/components';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EToolName } from '@label-u/annotation';
import { Popconfirm } from 'antd';

import type { ToolsConfigState } from '@/types/toolConfig';
import type { RootState } from '@/store';
import { TaskStatus } from '@/services/types';

import RectConfigForm from './templates/rectConfigForm';
import CuboidConfigForm from './templates/cuboildConfigForm';
import LineConfigForm from './templates/lineConfigForm';
import PointConfigForm from './templates/pointConfigForm';
import TagConfigForm from './templates/tagConfigForm';
import TextConfigForm from './templates/textConfigForm';
import PolygonConfigForm from './templates/polygonConfigForm';
import './formEngine.scss';

interface FormEngineProps {
  toolName: string;
  toolConfig: BasicConfig;
  config: ToolsConfigState;
  updateTagList: (value: any) => void;
  updateTextConfig: (value: any) => void;
  updateTools: (value: any) => void;
}

const FormMapping: Record<string, React.FC<any>> = {
  [EToolName.Rect]: RectConfigForm,
  [EToolName.Point]: PointConfigForm,
  [EToolName.Line]: LineConfigForm,
  [EToolName.Polygon]: PolygonConfigForm,
  [EToolName.Tag]: TagConfigForm,
  [EToolName.Text]: TextConfigForm,
  [EToolName.Cuboid]: CuboidConfigForm,
};

const FormEngine: FC<FormEngineProps> = (props) => {
  const { updateTextConfig, updateTagList, updateTools, toolName, config, toolConfig } = props;
  const { tagList, textConfig, tools } = config;

  const taskStatus = useSelector((state: RootState) => state.task.item.status);
  const taskDoneAmount = useSelector((state: RootState) => state.task.item.stats?.done);
  const ConfigTool = useMemo(() => {
    if (!toolName) {
      return null;
    }

    return FormMapping[toolName];
  }, [toolName]);

  // 进行中和已完成的任务不允许删除工具
  const deletable = useMemo(() => {
    if ([TaskStatus.INPROGRESS, TaskStatus.FINISHED].includes(taskStatus as TaskStatus) || taskDoneAmount) {
      return false;
    }

    return true;
  }, [taskStatus, taskDoneAmount]);

  // 删除工具
  const deleteTool = (_toolName: string) => {
    if (_toolName === EToolName.Text) {
      updateTextConfig([]);
    } else if (_toolName === EToolName.Tag) {
      updateTagList([]);
    }

    updateTools(
      tools.filter((tool: any) => {
        return tool.tool !== _toolName;
      }),
    );
  };

  const handleOk = () => {
    deleteTool(toolName);
  };

  return (
    <div>
      {ConfigTool && (
        <ConfigTool tagList={tagList} textConfig={textConfig} name={toolName} {...toolConfig}>
          <Popconfirm title="您确定要删除该工具吗？" okText="确认" cancelText="取消" onConfirm={handleOk}>
            {deletable && <span className="deleteTab">删除工具</span>}
          </Popconfirm>
        </ConfigTool>
      )}
    </div>
  );
};
export default React.memo(FormEngine);
