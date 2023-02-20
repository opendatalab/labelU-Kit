import type { BasicConfig } from '@label-u/components';
import type { FC } from 'react';
import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EToolName } from '@label-u/annotation';
import { Popconfirm } from 'antd';

import type { ToolsConfigState } from '@/types/toolConfig';

import RectConfigForm from './templates/rectConfigForm';
import LineConfigForm from './templates/lineConfigForm';
import PointConfigForm from './templates/pointConfigForm';
import TagConfigForm from './templates/tagConfigForm';
import TextConfigForm from './templates/textConfigForm';
import PolygonConfigForm from './templates/polygonConfigForm';
import './formEngine.less';
import { updateStatus } from '../../../stores/task.store';
interface FormEngineProps {
  toolName: string;
  toolConfig: BasicConfig;
  config: ToolsConfigState;
  updateConfig: (field: string) => (value: any) => void;
}

const FormMapping: Record<string, React.ReactNode> = {
  [EToolName.Rect]: RectConfigForm,
  [EToolName.Point]: PointConfigForm,
  [EToolName.Line]: LineConfigForm,
  [EToolName.Polygon]: PolygonConfigForm,
  [EToolName.Tag]: TagConfigForm,
  [EToolName.Text]: TextConfigForm,
};

const FormEngine: FC<FormEngineProps> = (props) => {
  const { updateConfig, toolName, config, toolConfig } = props;
  // @ts-ignore
  const { tagList, textConfig, tools } = config;
  // @ts-ignore
  const taskStatus = useSelector((state) => state.existTask.status);
  const dispatch = useDispatch();
  const ConfigTool = useMemo(() => {
    if (toolName) {
      return FormMapping[toolName];
    }
    return null;
  }, [toolName]);

  // 删除工具
  const deleteTool = (_toolName: string) => {
    if (_toolName === EToolName.Text) {
      updateConfig('textConfig')([]);
    } else if (_toolName === EToolName.Tag) {
      updateConfig('tagList')([]);
    }

    updateConfig('tools')(
      tools.filter((tool: any) => {
        return tool.tool !== _toolName;
      }),
    );
  };

  const handleOk = () => {
    deleteTool(toolName);
  };

  const [isShowDelete, setIsShowDelete] = useState(true);
  useEffect(() => {
    if (!taskStatus) {
      // @ts-ignore
      dispatch(updateStatus('IMPORTED'));
      setIsShowDelete(true);
    } else {
      if (taskStatus !== 'DRAFT' && taskStatus !== 'IMPORTED' && taskStatus !== 'CONFIGURED') {
        setIsShowDelete(false);
      }
    }
  }, [dispatch, taskStatus]);
  return (
    <div>
      {ConfigTool && (
        <ConfigTool tagList={tagList} textConfig={textConfig} name={toolName} {...toolConfig}>
          <Popconfirm title="您确定要删除该工具吗？" okText="确认" cancelText="取消" onConfirm={handleOk}>
            {isShowDelete && <span className="deleteTab">删除工具</span>}
          </Popconfirm>
        </ConfigTool>
      )}
    </div>
  );
};
export default FormEngine;
