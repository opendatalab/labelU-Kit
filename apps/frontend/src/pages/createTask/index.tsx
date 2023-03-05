import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash-es';
import { omit, set } from 'lodash/fp';

import type { TaskResponse } from '@/services/types';
import { TaskStatus, MediaType } from '@/services/types';
import type { Dispatch, RootState } from '@/store';
import AnnotationConfig from '@/pages/createTask/partials/annotationConfig';
import type { QueuedFile } from '@/pages/createTask/partials/inputData';
import InputData from '@/pages/createTask/partials/inputData';
import { createSamples } from '@/services/samples';

import InputInfoConfig from './partials/InputInfoConfig';
import currentStyles from './index.module.scss';
import type { StepData } from './components/Step';
import Step from './components/Step';
import commonController from '../../utils/common/common';
import type { TaskFormData } from './taskCreation.context';
import { TaskCreationContext } from './taskCreation.context';

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
  [StepEnum.Basic]: InputInfoConfig,
  [StepEnum.Upload]: InputData,
  [StepEnum.Config]: AnnotationConfig,
};

interface TaskStep extends StepData {
  value: StepEnum;
}

export interface PartialConfigProps {
  task: TaskResponse;
  formData: TaskFormData;
  updateFormData: (field: string) => (value: string) => void;
}

const CreateTask = () => {
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();
  const routeParams = useParams();
  const location = useLocation();

  const taskId = routeParams.taskId ? parseInt(routeParams.taskId, 10) : 0;
  const [currentStep, setCurrentStep] = useState<StepEnum>(
    location.hash ? (location.hash.replace('#', '') as StepEnum) : StepEnum.Basic,
  );
  const [formData, setFormData] = useState<TaskFormData>({} as TaskFormData);

  // 缓存上传的文件清单
  const [uploadFileList, setUploadFileList] = useState<QueuedFile[]>([]);

  const updateCurrentStep = (step: StepEnum) => {
    setCurrentStep(step);
    navigate({
      pathname: location.pathname,
      hash: step,
    });
  };

  const Partial = useMemo(() => {
    return partialMapping[currentStep];
  }, [currentStep]);

  const toolsConfig = useSelector((state: RootState) => state.task.config);
  const taskData = useSelector((state: RootState) => state.task.item);
  const loading = useSelector(
    (state: RootState) => state.loading.effects.task.updateTaskConfig || state.loading.effects.task.createTask,
  );
  const isExistTask = taskId > 0;
  const stepDataSource: TaskStep[] = [
    {
      title: stepTitleMapping[StepEnum.Basic],
      value: StepEnum.Basic,
      isFinished: isExistTask,
    },
    {
      title: stepTitleMapping[StepEnum.Upload],
      value: StepEnum.Upload,
      isFinished: [TaskStatus.IMPORTED, TaskStatus.CONFIGURED].includes(_.get(taskData, 'status') as TaskStatus),
    },
    {
      title: stepTitleMapping[StepEnum.Config],
      value: StepEnum.Config,
      isFinished: _.get(taskData, 'status') === TaskStatus.CONFIGURED,
    },
  ];

  const updateFormData = (field: string) => (value: any) => {
    setFormData(set(field)(value));
  };

  const taskCreationContextValue = useMemo(
    () => ({
      uploadFileList,
      setUploadFileList,
      setFormData,
      updateFormData,
      formData,
      task: taskData,
    }),
    [uploadFileList, formData, taskData],
  );

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    setCurrentStep(location.hash.replace('#', '') as StepEnum);
  }, [location.hash]);

  // 将store中的task toolConfig数据同步到本地页面中
  useEffect(() => {
    if (!toolsConfig) {
      return;
    }

    updateFormData('config')(toolsConfig);
  }, [toolsConfig]);

  // 将store中的task数据同步到本地页面中
  useEffect(() => {
    if (!taskData) {
      return;
    }

    setFormData((pre) => ({
      ...omit(['config'])(taskData),
      ...pre,
    }));
  }, [taskData]);

  useEffect(() => {
    if (isExistTask && _.isEmpty(taskData)) {
      dispatch.task.fetchTask(taskId);
    }
  }, [dispatch.task, isExistTask, taskData, taskId]);

  useEffect(() => {
    if (!isExistTask) {
      dispatch.task.clearItem();
    }
    // 当新建或编辑任务时，页面卸载时清空任务信息
    return () => {
      dispatch.task.clearItem();
    };
  }, [dispatch.task, isExistTask]);

  const handleSave = async function () {
    if (toolsConfig && toolsConfig.tools && toolsConfig.tools.length === 0) {
      commonController.notificationErrorMessage({ message: '请选择工具' }, 1);
      return;
    }

    return dispatch.task
      .updateTaskConfig({
        taskId: taskId,
        body: {
          ...formData,
          media_type: MediaType.IMAGE,
        },
      })
      .then(() => {
        navigate('/tasks');
      });
  };

  const handleCancel = () => {
    Modal.confirm({
      title: '确定要取消吗？',
      content: '取消后，当前任务将不会被保存',
      okText: '保存并退出',
      cancelText: '取消',
      onOk: handleSave,
    });
  };

  const submitForm: () => Promise<unknown> = async function () {
    if (!formData.name) {
      commonController.notificationErrorMessage({ message: '请填入任务名称' }, 1);
      return Promise.reject();
    }

    if (isExistTask) {
      if (currentStep === StepEnum.Upload && !_.isEmpty(uploadFileList)) {
        await createSamples(
          taskId,
          _.map(uploadFileList, (item) => ({
            attachement_ids: [item.id!],
            data: {
              fileNames: {
                [item.id!]: item.name!,
              },
              result: '{}',
              urls: {
                [item.id!]: item.url!,
              },
            },
          })),
        );
      }

      return dispatch.task.updateTaskConfig({
        taskId: taskId,
        body: formData,
      });
    } else {
      const newTask = await dispatch.task.createTask(formData);

      navigate(`/tasks/${newTask.id}/edit#${StepEnum.Upload}`);

      return Promise.reject();
    }
  };

  const handleNextStep = async function (step: TaskStep | React.MouseEvent) {
    let nextStep = step;
    // 点击下一步时，step为事件参数
    if ((step as React.MouseEvent).target) {
      const stepIndex = stepDataSource.findIndex((item) => item.value === currentStep);
      nextStep = stepDataSource[stepIndex + 1];
    }

    submitForm().then(() => {
      updateCurrentStep((nextStep as TaskStep).value);
    });
  };

  const handlePrevStep = async (step: TaskStep) => {
    submitForm().then(() => {
      updateCurrentStep(step.value);
    });
  };

  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.stepsRow}>
        <div className={currentStyles.left}>
          <Step steps={stepDataSource} currentStep={currentStep} onNext={handleNextStep} onPrev={handlePrevStep} />
        </div>
        <div className={currentStyles.right}>
          <Button type="primary" ghost onClick={handleCancel}>
            取消
          </Button>
          {currentStep === StepEnum.Config ? (
            <Button loading={loading} type="primary" onClick={commonController.debounce(handleSave, 200)}>
              保存
            </Button>
          ) : (
            <Button loading={loading} type="primary" onClick={commonController.debounce(handleNextStep, 100)}>
              下一步
            </Button>
          )}
        </div>
      </div>
      <div className={currentStyles.content}>
        <TaskCreationContext.Provider value={taskCreationContextValue}>
          <Partial task={taskData} formData={formData} updateFormData={updateFormData} />
        </TaskCreationContext.Provider>
      </div>
    </div>
  );
};

export default CreateTask;
