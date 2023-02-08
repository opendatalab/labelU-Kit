import React, { useState } from 'react';
import { Input } from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import currentStyles from './index.module.scss';
import CommonController from '../../utils/common/common';
import { updateTaskDescription, updateTaskName, updateTaskTips } from '../../stores/task.store';

const InputInfoConfig = () => {
  const dispatch = useDispatch();
  // @ts-ignore
  const taskName = useSelector((state) => state.existTask.taskName);
  // @ts-ignore
  const taskDescription = useSelector((state) => state.existTask.taskDescription);
  // @ts-ignore
  const taskTips = useSelector((state) => state.existTask.taskTips);
  const [isErrorShow, setIsErrorShow] = useState(false);
  const changeTaskNamme = (event: any) => {
    const targetValue = event.target.value;
    const isNull = CommonController.isInputValueNull(targetValue);
    if (!isNull) {
      setIsErrorShow(false);
      const isOver = CommonController.isOverFontCount(targetValue, 50);
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
    const targetValue = event.target.value;
    const isNull = CommonController.isInputValueNull(targetValue);
    if (!isNull) {
      const isOver = CommonController.isOverFontCount(targetValue, 500);
      if (isOver) {
        return;
      }

      // if(isOver) return;
    }
    dispatch(updateTaskDescription(targetValue));
  };
  const changeTaskTips = (event: any) => {
    const targetValue = event.target.value;
    const isNull = CommonController.isInputValueNull(targetValue);
    if (!isNull) {
      const isOver = CommonController.isOverFontCount(targetValue, 1000);
      if (isOver) {
        return;
      }

      // if(isOver) return;
    }
    dispatch(updateTaskTips(targetValue));
  };

  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.title}>
        <div className={currentStyles.icon} />
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
    </div>
  );
};
export default InputInfoConfig;
