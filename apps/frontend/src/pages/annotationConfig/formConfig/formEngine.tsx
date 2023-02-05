import type { BasicConfig } from '@label-u/components';
import type { FC } from 'react';
import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EToolName } from '@label-u/annotation';
import { Popconfirm } from 'antd';

import RectConfigForm from './templates/rectConfigForm';
import LineConfigForm from './templates/lineConfigForm';
import PointConfigForm from './templates/pointConfigForm';
import TagConfigForm from './templates/tagConfigForm';
import TextConfigForm from './templates/textConfigForm';
import PolygonConfigForm from './templates/polygonConfigForm';
import './formEngine.less';
// import { toolnames, types,toolnameT } from './constants';
import { updateTagConfigList, updateTextConfig, updateToolsConfig } from '../../../stores/toolConfig.store';
import { updateStatus } from '../../../stores/task.store';
// import Dynamic from 'components/basic/dynamic';
interface FormEngineProps {
  toolname: string;
  config: BasicConfig;
}

const FormEngine: FC<FormEngineProps> = (props) => {
  // @ts-ignore
  const { tagList, textConfig, tools } = useSelector((state) => state.toolsConfig);
  // @ts-ignore
  const taskStatus = useSelector((state) => state.existTask.status);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const ConfigTool = useMemo(() => {
    if (props.toolname) {
      if (props.toolname === EToolName.Rect) {
        return RectConfigForm;
      }
      if (props.toolname === EToolName.Point) {
        return PointConfigForm;
      }
      if (props.toolname === EToolName.Line) {
        return LineConfigForm;
      }
      if (props.toolname === EToolName.Polygon) {
        return PolygonConfigForm;
      }
      if (props.toolname === EToolName.Tag) {
        return TagConfigForm;
      }
      if (props.toolname === EToolName.Text) {
        return TextConfigForm;
      }
    }
    return null;
  }, [props.toolname]);

  // 删除工具
  const deleteTool = (toolName: string) => {
    if (toolName === EToolName.Text) {
      dispatch(updateTextConfig([]));
    } else if (toolName === EToolName.Tag) {
      dispatch(updateTagConfigList([]));
    }
    const newTools = tools.filter((tool: any) => {
      return tool.tool !== toolName;
    });
    dispatch(updateToolsConfig(newTools));
  };

  const showPopconfirm = () => {
    setOpen(true);
  };
  const handleOk = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setOpen(false);
      setConfirmLoading(false);
    }, 2000);
    deleteTool(props.toolname);
  };

  const handleCancel = () => {
    setOpen(false);
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
        <ConfigTool tagList={tagList} textConfig={textConfig} name={props.toolname} {...props.config}>
          <Popconfirm
            title="您确定要删除该工具吗？"
            open={open}
            okText="确认"
            cancelText="取消"
            onConfirm={handleOk}
            okButtonProps={{ loading: confirmLoading }}
            onCancel={handleCancel}
          >
            {isShowDelete && (
              <span onClick={showPopconfirm} className="deleteTab">
                删除工具
              </span>
            )}
          </Popconfirm>
        </ConfigTool>
      )}
    </div>
  );
};
export default FormEngine;
