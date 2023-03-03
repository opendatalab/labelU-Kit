// @ts-ignore
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal } from 'antd';
import { useLocation, useNavigate, useParams, useRouteLoaderData, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash-es';

import { useHash } from '@/hooks/useHash';
import type { TaskResponse } from '@/services/types';
import { MediaType } from '@/services/types';
import type { Dispatch, RootState } from '@/store';
import AnnotationConfig from '@/pages/annotationConfig';
import InputInfoConfig from '@/pages/inputInfoConfig';
import InputData from '@/pages/inputData';
import history from '@/routes/history';

import currentStyles from './index.module.scss';
import Step from './components/Step';
import { getTask, createTaskWithBasicConfig, updateTaskConfig } from '../../services/task';
import { updateHaveConfigedStep, updateTask, updateTaskId, updateStatus } from '../../stores/task.store';
import commonController from '../../utils/common/common';
import { createSamples } from '../../services/samples';
import { updateAllConfig } from '../../stores/toolConfig.store';

enum StepEnum {
  Basic = 'basic',
  Upload = 'upload',
  Config = 'config',
}

const stepTitleMapping = {
  [StepEnum.Basic]: '基础配置',
  [StepEnum.Upload]: '数据导入',
  [StepEnum.Config]: '标注配置',
};

const partialMapping = {
  [StepEnum.Basic]: () => <div />, //AnnotationConfig,
  [StepEnum.Upload]: () => <div />, // InputData,
  [StepEnum.Config]: () => <div />, //InputInfoConfig,
};

interface TaskStep {
  title: string;
  value: StepEnum;
  isFinished: boolean;
}

const CreateTask = () => {
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();
  const routeParams = useParams();
  const [searchParams] = useSearchParams();
  const taskData = useRouteLoaderData('task') as TaskResponse;
  const taskId = _.get(taskData, 'id');
  const taskIdInUrl = routeParams.taskId ? parseInt(routeParams.taskId, 10) : 0;
  const statusInUrl = searchParams.get('currentStatus');
  const [currentStep, setCurrentStep] = useState<StepEnum>(StepEnum.Basic);
  const location = useLocation();

  const stepDataSource: TaskStep[] = [
    {
      title: stepTitleMapping[StepEnum.Basic],
      value: StepEnum.Basic,
      isFinished: Boolean(taskData),
    },
    {
      title: stepTitleMapping[StepEnum.Upload],
      value: StepEnum.Upload,
      isFinished: Boolean(taskData),
    },
    {
      title: stepTitleMapping[StepEnum.Config],
      value: StepEnum.Config,
      isFinished: Boolean(taskData),
    },
  ];

  const Partial = useMemo(() => {
    return partialMapping[currentStep];
  }, [currentStep]);

  const newSamples = useSelector((state: RootState) => state.sample.list);
  // @ts-ignore
  const toolsConfig = useSelector((state) => state.toolsConfig);

  // 默认显示第一个步骤「基础配置」
  useEffect(() => {
    if (!location.hash) {
      history.replace(location.pathname + '#basic');
    }
  }, [location.hash, location.pathname]);

  const finallySave = async function () {
    if (toolsConfig && toolsConfig.tools && toolsConfig.tools.length === 0) {
      commonController.notificationErrorMessage({ message: '请选择工具' }, 1);
      return;
    }

    await updateTaskConfig(taskId!, {
      config: JSON.stringify(toolsConfig),
      media_type: MediaType.IMAGE,
    });

    navigate('/tasks/' + taskId);
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
    // @ts-ignore
    dispatch(updateHaveConfigedStep(result));
  };
  const updateTaskIdLocal = (id: number) => {
    // @ts-ignore
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
        res = await createTaskWithBasicConfig({ name: taskName, description: taskDescription, tips: taskTips });
      }

      const { status, id } = res.data;
      updateStep(status);
      updateTaskIdLocal(id);
      result = id;
    } catch (error) {
      result = false;
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
      const { data } = await createSamples(taskId, newSamples);
      updateStep('IMPORTED');
      dispatch(updateStatus(data.status));
      result = false;
      commonController.notificationErrorMessage(data, 1);
    } catch (error) {
      result = false;
    }
    return result;
  };
  const handleNextStep = async function (step: TaskStep) {
    setCurrentStep(step.value);
  };

  const handlePrevStep = (step: TaskStep) => {
    setCurrentStep(step.value);
  };

  useEffect(() => {
    let currentStatus = 1;
    if (statusInUrl) {
      currentStatus = +statusInUrl;
    }
    if (taskIdInUrl > 0) {
      getTask(taskIdInUrl)
        .then(({ data }) => {
          // @ts-ignore
          dispatch(updateTask({ data, configStatus: currentStatus }));
          dispatch(updateAllConfig(JSON.parse(data.config!)));
        })
        .catch((error) => commonController.notificationErrorMessage(error, 1));
    } else {
      // new created task
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    switch (currentStep) {
      case -1:
        const isSuccess0 = await nextWhen0();
        if (!isSuccess0) return;
        break;
      case 0:
        const isSuccess1 = await nextWhen1();
        if (!isSuccess1) return;
        break;
      case 1:
        const isNullToolConfigResult = isNullToolConfig();
        if (isNullToolConfigResult) {
          return;
        }
        await finallySave();
        break;
    }
    navigate('/tasks');
  };
  const clickModalCancel = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowCancelModal(false);
    navigate('/tasks');
  };
  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.stepsRow}>
        <div className={currentStyles.left}>
          <Step
            steps={stepDataSource}
            currentStep={currentStep}
            showStepNumber={!taskData}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        </div>
        <div className={currentStyles.right}>
          <Button type="primary" ghost onClick={cancelOption}>
            取消
          </Button>
          {currentStep === StepEnum.Config ? (
            <Button type="primary" onClick={commonController.debounce(finallySave, 200)}>
              保存
            </Button>
          ) : (
            <Button type="primary" onClick={commonController.debounce(handleNextStep, 100)}>
              下一步
            </Button>
          )}
        </div>
      </div>
      <div className={currentStyles.content}>
        <Partial />
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

export default CreateTask;
