// @ts-ignore
import React, { useState, useEffect } from 'react';
import { Breadcrumb, Modal, Steps } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { connect, useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import currentStyles from './index.module.scss';
import commonStyles from '../../utils/common/common.module.scss';
import Step from '../../components/step';
import Separator from '../../components/separator';
import { submitBasicConfig, updateTaskConfig, deleteTask } from '../../services/createTask';
import constant from '../../constants';
import {
  updateHaveConfigedStep,
  updateTask,
  updateConfigStep,
  updateTaskId,
  updateStatus,
} from '../../stores/task.store';
import commonController from '../../utils/common/common';
import { createSamples, getTask } from '../../services/samples';
import { updateAllConfig } from '../../stores/toolConfig.store';

const CreateTask = (props: any) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const configStep = useSelector((state) => state.existTask.configStep);
  const haveConfigedStep = useSelector((state) => state.existTask.haveConfigedStep);
  const taskName = useSelector((state) => state.existTask.taskName);
  const taskDescription = useSelector((state) => state.existTask.taskDescription);
  const taskTips = useSelector((state) => state.existTask.taskTips);
  const taskId = useSelector((state) => state.existTask.taskId);

  const newSamples = useSelector((state) => state.samples.newSamples);
  const toolsConfig = useSelector((state) => state.toolsConfig);
  const taskStatus = useSelector((state) => state.existTask.status);
  const steps = [
    {
      title: '基础配置',
      index: 1,
      contentUrl: `/tasks/${taskId}/edit/basic`,
    },
    {
      title: '数据导入',
      index: 2,
      contentUrl: `/tasks/${taskId}/edit/upload`,
    },
    {
      title: '标注配置',
      index: 3,
      contentUrl: `/tasks/${taskId}/edit/config`,
    },
  ];
  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent(current + 1);
  };
  const prev = () => {
    setCurrent(current - 1);
  };
  const items = steps.map((item) => ({ key: item.title, title: item.title }));
  const tempBao = true;

  const finallySave = async function () {
    if (toolsConfig && toolsConfig.tools && toolsConfig.tools.length === 0) {
      commonController.notificationErrorMessage({ message: '请选择工具' }, 1);
      return;
    }
    if (toolsConfig && toolsConfig.tools && toolsConfig.tools.length > 0) {
      const currentTools = toolsConfig.tools;
      for (let toolIndex = 0; toolIndex < currentTools.length; toolIndex++) {
        const currentConfig = currentTools[toolIndex];
        // if (currentConfig.tool === 'pointTool') {
        //     // @ts-ignore
        //     if (!currentConfig?.config?.upperLimit) {
        //         commonController.notificationErrorMessage({message : '请输入上限点数'},1)
        //         return;
        //     }
        // }
      }
    }
    const res = await updateTaskConfig(taskId, {
      config: JSON.stringify(toolsConfig),
      media_type: 'IMAGE',
    });
    if (!res) {
      commonController.notificationErrorMessage({ message: '配置不成功' }, 1);
      return;
    } else {
      if (res.status === 200) {
        // navigate(constant.urlTurnToTaskList);
        navigate('/tasks/' + taskId);
      }
    }
  };

  const updateStep = (status: string) => {
    let result = 0;
    switch (status) {
      case 'DRAFT':
        result = 1;
        break;
      case 'IMPORTED':
        result = 2;
        break;
      default:
        result = 3;
        break;
    }
    dispatch(updateHaveConfigedStep(result));
  };
  const updateTaskIdLocal = (id: number) => {
    dispatch(updateTaskId(id));
  };
  const nextWhen0 = async function () {
    let result = true;
    if (!taskName) {
      commonController.notificationErrorMessage({ message: '请填入任务名称' }, 1);
      return false;
    }
    const isTaskNameOver = commonController.isOverFontCount(taskName, 50);
    if (isTaskNameOver) {
      return false;
    }
    const isTaskDescriptionOver = commonController.isOverFontCount(taskDescription, 500);
    if (isTaskDescriptionOver) {
      return false;
    }
    const isTaskTipsOver = commonController.isOverFontCount(taskTips, 1000);
    if (isTaskTipsOver) {
      return false;
    }
    try {
      let res: any;
      if (haveConfigedStep !== 0) {
        res = await updateTaskConfig(taskId, { name: taskName, description: taskDescription, tips: taskTips });
      } else {
        res = await submitBasicConfig({ name: taskName, description: taskDescription, tips: taskTips });
      }

      if (res.status === 201 || res.status === 200) {
        const { status, id } = res.data.data;
        updateStep(status);
        updateTaskIdLocal(id);
        result = id;
      } else {
        result = false;
        commonController.notificationErrorMessage(res.data, 1);
      }
    } catch (error) {
      result = false;
      commonController.notificationErrorMessage(error, 1);
    }
    return result;
  };
  const nextWhen1 = async function () {
    let result = true;
    if (newSamples.length === 0 && (taskStatus === 'DRAFT' || taskStatus === 'IMPORTED' || !taskStatus)) {
      commonController.notificationWarnMessage({ message: '请导入数据,再进行下一步操作' }, 1);
      return false;
    }
    if (newSamples.length === 0 && taskStatus === 'CONFIGURED') {
      return true;
    }
    try {
      const res: any = await createSamples(taskId, newSamples);
      if (res.status === 201) {
        const { status, id } = res.data.data;
        updateStep('IMPORTED');
        dispatch(updateStatus(status));
      } else {
        result = false;
        commonController.notificationErrorMessage(res.data, 1);
      }
    } catch (error) {
      result = false;
      commonController.notificationErrorMessage(error, 1);
    }
    return result;
  };
  const nextStep = async function () {
    let currentStep = -1;
    let childOutlet = `/tasks/${taskId}/edit/basic`;
    switch (configStep) {
      case -1:
        const isSuccess0 = await nextWhen0();
        if (!isSuccess0) return;
        currentStep = 0;
        childOutlet = `/tasks/${isSuccess0}/edit/upload`;
        break;
      case 0:
        const isSuccess1 = await nextWhen1();
        if (!isSuccess1) return;
        currentStep = 1;
        childOutlet = `/tasks/${taskId}/edit/config`;
        break;
      case 1:
        break;
    }
    dispatch(updateConfigStep(currentStep));
    navigate(childOutlet);
  };

  useEffect(() => {
    const taskId = parseInt(window.location.pathname.split('/')[2]);
    const searchString = window.location.search;
    // bad name
    let currentStatus = 1;
    if (searchString.indexOf('currentStatus=2') > -1) {
      currentStatus = 2;
    }
    if (searchString.indexOf('currentStatus=3') > -1) {
      currentStatus = 3;
    }
    if (taskId > 0) {
      getTask(taskId)
        .then((res: any) => {
          if (res.status === 200) {
            dispatch(updateTask({ data: res.data.data, configStatus: currentStatus }));
            if (res.data.data.config) {
              dispatch(updateAllConfig(JSON.parse(res.data.data.config)));
            } else {
              // new task, not configured yet
            }
          } else {
            commonController.notificationErrorMessage({ message: '请求任务状态不是200' }, 1);
          }
        })
        .catch((error) => commonController.notificationErrorMessage(error, 1));
    } else {
      // new created task
    }
  }, []);
  const [isShowCancelModal, setIsShowCancelModal] = useState(false);
  const cancelOption = () => {
    setIsShowCancelModal(true);
  };

  const isNullToolConfig = () => {
    let result = false;
    if (!toolsConfig || !toolsConfig.tools || toolsConfig.tools.length === 0) {
      result = true;
      commonController.notificationErrorMessage({ message: '请选择工具' }, 1);
    }
    return result;
  };
  const clickModalOk = async function (e: any) {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowCancelModal(false);
    switch (configStep) {
      case -1:
        const isSuccess0 = await nextWhen0();
        if (!isSuccess0) return;
        break;
      case 0:
        const isSuccess1 = await nextWhen1();
        if (!isSuccess1) return;
        break;
      case 1:
        return;
        const isNullToolConfigResult = isNullToolConfig();
        if (isNullToolConfigResult) {
          return;
        }
        const isSuccess2 = await finallySave();
        // if (!isSuccess2) return;
        break;
    }
    navigate('/tasks');
  };
  const clickModalCancel = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowCancelModal(false);
    // if(taskId === 0) {
    //     navigate('/tasks');
    //     return;
    // }
    // deleteTask(taskId).then((res:any)=>{
    //   if(res.status === 200){
    //
    //   }else{
    //     commonController.notificationErrorMessage({message : '删除任务不成功'},1);
    //   }
    // }).catch((error:any)=>commonController.notificationErrorMessage(error, 1));
    navigate('/tasks');
  };
  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.stepsRow}>
        <div className={currentStyles.left}>
          {steps.map((step: any, stepIndex: number) => {
            if (stepIndex === steps.length - 1) {
              return <Step ordinalNumber={step.index} title={step.title} contentUrl={step.contentUrl} key={uuidv4()} />;
            } else {
              return (
                <React.Fragment>
                  <Step key={uuidv4()} ordinalNumber={step.index} title={step.title} contentUrl={step.contentUrl} />
                  <Separator />
                </React.Fragment>
              );
            }
          })}
        </div>
        <div className={currentStyles.right}>
          <div className={`${commonStyles.cancelButton}  ${currentStyles.cancelButton}`} onClick={cancelOption}>
            取消
          </div>
          {configStep !== 1 && (
            <div
              className={`${commonStyles.commonButton} ${currentStyles.nextButton}`}
              onClick={commonController.debounce(nextStep, 100)}
            >
              下一步
            </div>
          )}
          {configStep === 1 && (
            <div
              className={`${commonStyles.commonButton} ${currentStyles.nextButton}`}
              onClick={commonController.debounce(finallySave, 200)}
            >
              保存
            </div>
          )}
        </div>
      </div>
      <div className={currentStyles.content}>
        <Outlet />
      </div>
      <Modal
        open={isShowCancelModal}
        onOk={clickModalOk}
        onCancel={clickModalCancel}
        centered
        okText={'保存并退出'}
        cancelText={'不保存'}
      >
        <p>
          <img src="/src/icons/warning.png" alt="" />
          是否保存已编辑的内容？
        </p>
      </Modal>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return state.toolsConfig;
};

const mapDispatchToProps = () => {};

export default connect(mapStateToProps)(CreateTask);
