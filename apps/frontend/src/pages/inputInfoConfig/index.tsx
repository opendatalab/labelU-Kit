import React, { useEffect, useState } from 'react';
import currentStyles from './index.module.scss';
import { Input } from 'antd';
import { submitBasicConfig } from '../../services/createTask';
import CommonController from '../../utils/common/common';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateConfigStep,
  updateHaveConfigedStep,
  updateTask,
  updateTaskDescription,
  updateTaskName,
  updateTaskTips,
} from '../../stores/task.store';
import { getTask } from '../../services/samples';
import { updateAllConfig } from '../../stores/toolConfig.store';
import commonController from '../../utils/common/common';
const InputInfoConfig = () => {
  const dispatch = useDispatch();
  let taskName = useSelector((state) => state.existTask.taskName);
  let taskDescription = useSelector((state) => state.existTask.taskDescription);
  let taskTips = useSelector((state) => state.existTask.taskTips);
  const [isErrorShow, setIsErrorShow] = useState(false);
  const changeTaskNamme = (event: any) => {
    let targetValue = event.target.value;
    let isNull = CommonController.isInputValueNull(targetValue);
    if (!isNull) {
      setIsErrorShow(false);
      let isOver = commonController.isOverFontCount(targetValue, 50);
      if (isOver) {
        return;
      }
      dispatch(updateTaskName(targetValue));
      // if(isOver) return;
      // setTaskDescription(targetValue);
    } else {
      dispatch(updateTaskName(targetValue));
      setIsErrorShow(true);
    }
  };
  const changeTaskDescription = (event: any) => {
    let targetValue = event.target.value;
    let isNull = CommonController.isInputValueNull(targetValue);
    if (!isNull) {
      let isOver = commonController.isOverFontCount(targetValue, 500);
      if (isOver) {
        return;
      }

      // if(isOver) return;
    }
    dispatch(updateTaskDescription(targetValue));
  };
  const changeTaskTips = (event: any) => {
    let targetValue = event.target.value;
    let isNull = CommonController.isInputValueNull(targetValue);
    if (!isNull) {
      let isOver = commonController.isOverFontCount(targetValue, 1000);
      if (isOver) {
        return;
      }

      // if(isOver) return;
    }
    dispatch(updateTaskTips(targetValue));
  };

  const tijiao = async function () {
    try {
      let res: any = submitBasicConfig({ name: taskName, description: taskDescription, tips: taskTips });
      alert(res.id);
    } catch (error) {}
  };

  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.title}>
        <div className={currentStyles.icon}></div>
        <div className={currentStyles.titleText}>基础配置</div>
      </div>
      <div className={currentStyles.content}>
        <div className={currentStyles.item}>
          <div className={currentStyles.itemLabel}>
            <div style={{ color: 'red', width: '8px' }}>*</div>
            任务名称
          </div>
          <div className={currentStyles.itemInput}>
            {
              <Input
                placeholder="请输入50字以内的任务名称"
                onChange={changeTaskNamme}
                defaultValue={taskName}
                value={taskName}
              />
            }
            {/*{!taskName && <Input placeholder = '请输入50字以内的任务名称' onChange = {changeTaskNamme}/>}*/}
            {isErrorShow && <div style={{ color: 'red' }}>请输入内容</div>}
          </div>
        </div>
        <div className={currentStyles.item}>
          <div className={currentStyles.itemLabel}>任务描述</div>
          <div className={currentStyles.itemInput}>
            <Input.TextArea
              placeholder="请输入500字以内的任务描述"
              onChange={changeTaskDescription}
              autoSize={{ minRows: 6, maxRows: 10 }}
              defaultValue={taskDescription}
              value={taskDescription}
            />
          </div>
        </div>
        <div className={currentStyles.item}>
          <div className={currentStyles.itemLabel}>任务提示</div>
          <div className={currentStyles.itemInput}>
            <Input.TextArea
              placeholder="请输入1000字以内的标注任务提示，在标注过程中为标注者提供帮助"
              onChange={changeTaskTips}
              autoSize={{ minRows: 6, maxRows: 10 }}
              defaultValue={taskTips}
              value={taskTips}
            />
          </div>
        </div>
      </div>

      {/*<div onClick = {tijiao}>*/}
      {/*    提交*/}
      {/*</div>*/}
    </div>
  );
};
export default InputInfoConfig;
