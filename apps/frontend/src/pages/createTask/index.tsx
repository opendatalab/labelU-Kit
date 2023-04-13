import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button, Form } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import _, { isEmpty, size } from 'lodash-es';
import { omit } from 'lodash/fp';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import AnnotationOperation from '@label-u/components';

import { message, modal } from '@/StaticAnt';
import type { TaskResponse } from '@/services/types';
import { MediaType, TaskStatus } from '@/services/types';
import type { Dispatch, RootState } from '@/store';
import AnnotationConfig from '@/pages/createTask/partials/annotationConfig';
import type { QueuedFile } from '@/pages/createTask/partials/inputData';
import InputData, { UploadStatus } from '@/pages/createTask/partials/inputData';
import { createSamples } from '@/services/samples';

import InputInfoConfig from './partials/InputInfoConfig';
import currentStyles from './index.module.scss';
import type { StepData } from './components/Step';
import Step from './components/Step';
import commonController from '../../utils/common/common';
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
  updateFormData: (field: string) => (value: string) => void;
}

const CreateTask = () => {
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();
  const routeParams = useParams();
  const location = useLocation();
  const [annotationFormInstance] = Form.useForm();
  const [basicFormInstance] = Form.useForm();

  const taskId = routeParams.taskId ? parseInt(routeParams.taskId, 10) : 0;
  const [currentStep, setCurrentStep] = useState<StepEnum>(
    location.hash ? (location.hash.replace('#', '') as StepEnum) : StepEnum.Basic,
  );
  const [isAnnotationFormValid, toggleAnnotationFormValidation] = useState<boolean>(true);
  const attachmentsConnected = useRef<boolean>(false);

  // 缓存上传的文件清单
  const [uploadFileList, setUploadFileList] = useState<QueuedFile[]>([]);

  const updateCurrentStep = useCallback(
    (step: StepEnum) => {
      setCurrentStep(step);
      navigate({
        pathname: location.pathname,
        hash: step,
      });
    },
    [location.pathname, navigate],
  );

  const partials = useMemo(() => {
    return _.chain(partialMapping)
      .toPairs()
      .map(([key, Partial], index) => {
        return (
          <div key={index} style={{ display: currentStep === key ? 'block' : 'none' }}>
            <Partial />
          </div>
        );
      })
      .value();
  }, [currentStep]);

  const toolsConfig = useSelector((state: RootState) => state.task.config);
  const samples = useSelector((state: RootState) => state.sample.list);
  const taskData = useSelector((state: RootState) => state.task.item);
  const loading = useSelector(
    (state: RootState) => state.loading.effects.task.updateTaskConfig || state.loading.effects.task.createTask,
  );
  const isExistTask = taskId > 0;
  const taskStatus = _.get(taskData, 'status') as TaskStatus;
  const stepDataSource: TaskStep[] = useMemo(
    () => [
      {
        title: stepTitleMapping[StepEnum.Basic],
        value: StepEnum.Basic,
        isFinished: isExistTask,
      },
      {
        title: stepTitleMapping[StepEnum.Upload],
        value: StepEnum.Upload,
        isFinished: taskStatus && taskStatus !== TaskStatus.DRAFT,
      },
      {
        title: stepTitleMapping[StepEnum.Config],
        value: StepEnum.Config,
        isFinished: [TaskStatus.CONFIGURED, TaskStatus.FINISHED, TaskStatus.INPROGRESS].includes(taskStatus),
      },
    ],
    [isExistTask, taskStatus],
  );

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    setCurrentStep(location.hash.replace('#', '') as StepEnum);
  }, [location.hash]);

  // 将store中的task toolConfig数据同步到本地页面中
  useEffect(() => {
    annotationFormInstance.setFieldsValue(toolsConfig);
  }, [annotationFormInstance, toolsConfig]);

  useEffect(() => {
    basicFormInstance.setFieldsValue(taskData);
    annotationFormInstance.setFieldValue('media_type', taskData.media_type || MediaType.IMAGE);
  }, [annotationFormInstance, basicFormInstance, taskData]);

  useEffect(() => {
    if (isExistTask && _.isEmpty(taskData)) {
      dispatch.task.fetchTask(taskId);
    }
  }, [dispatch.task, isExistTask, taskData, taskId]);

  useEffect(() => {
    if (isEmpty(toolsConfig.tools)) {
      toggleAnnotationFormValidation(false);
    }
  }, [toolsConfig.tools]);

  const onAnnotationFormChange = useCallback(() => {
    annotationFormInstance.validateFields().then((values) => {
      toggleAnnotationFormValidation(size(values.tools) > 0);
    });
  }, [annotationFormInstance]);

  const handleSave = useCallback(
    async function () {
      try {
        await annotationFormInstance.validateFields();
      } catch (err) {
        commonController.notificationErrorMessage({ message: '请检查标注配置' }, 1);
        return;
      }

      const annotationConfig = annotationFormInstance.getFieldsValue();

      if (_.chain(annotationConfig).get('tools').isEmpty().value()) {
        commonController.notificationErrorMessage({ message: '请选择工具' }, 1);
        return;
      }

      return dispatch.task
        .updateTaskConfig({
          taskId: taskId,
          body: {
            ...taskData,
            ...basicFormInstance.getFieldsValue(),
            media_type: annotationConfig.media_type,
            config: omit(['media_type'])(annotationConfig),
          },
        })
        .then(() => {
          navigate('/tasks');
        });
    },
    [annotationFormInstance, basicFormInstance, dispatch.task, navigate, taskData, taskId],
  );

  const handleCancel = useCallback(() => {
    modal.confirm({
      title: '确定要取消吗？',
      content: '取消后，当前任务将不会被保存',
      okText: '保存并退出',
      cancelText: '取消',
      onOk: handleSave,
    });
  }, [handleSave]);

  const [previewVisible, setPreviewVisible] = useState(false);
  const handleOpenPreview = useCallback(() => {
    dispatch.sample.fetchSamples({ task_id: taskId });
    annotationFormInstance
      .validateFields()
      .then(() => {
        setPreviewVisible(true);
      })
      .catch(() => {
        commonController.notificationErrorMessage({ message: '请检查标注配置' }, 1);
      });
  }, [annotationFormInstance, dispatch.sample, taskId]);

  const transformedSample = useMemo(() => {
    const sample = samples?.data?.[0];
    if (!sample) {
      return [];
    }

    return commonController.transformFileList(sample.data, +sample.id!);
  }, [samples]);

  const submitForm: () => Promise<unknown> = useCallback(
    async function () {
      let basicFormValues;
      try {
        basicFormValues = await basicFormInstance.validateFields();
      } catch (err) {
        return Promise.reject();
      }

      if (isExistTask) {
        if (currentStep === StepEnum.Upload && !_.isEmpty(uploadFileList) && !attachmentsConnected.current) {
          await createSamples(
            taskId,
            _.chain(uploadFileList)
              .filter((item) => item.status === UploadStatus.Success)
              .map((item) => ({
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
              }))
              .value(),
          );

          // 切换到其他步骤后，再切换回来，不会再次创建样本
          attachmentsConnected.current = true;
        }

        const annotationConfig = annotationFormInstance.getFieldsValue();

        return dispatch.task.updateTaskConfig({
          taskId: taskId,
          body: {
            ...taskData,
            ...basicFormValues,
            media_type: annotationConfig.media_type,
            status: taskData.status === TaskStatus.DRAFT ? TaskStatus.IMPORTED : taskData.status,
            config: omit(['media_type'])(annotationConfig),
          },
        });
      } else {
        const newTask = await dispatch.task.createTask(basicFormValues);

        navigate(`/tasks/${newTask.id}/edit#${StepEnum.Upload}`);

        return Promise.reject();
      }
    },
    [
      annotationFormInstance,
      basicFormInstance,
      currentStep,
      dispatch.task,
      isExistTask,
      navigate,
      taskData,
      taskId,
      uploadFileList,
    ],
  );

  const handleNextStep = useCallback(
    async function (step: TaskStep | React.MouseEvent) {
      let nextStep = step;
      // 点击下一步时，step为事件参数
      if ((step as React.MouseEvent).target) {
        const stepIndex = stepDataSource.findIndex((item) => item.value === currentStep);
        nextStep = stepDataSource[stepIndex + 1];
      }

      // 如果是从基本信息步骤到下一步，需要校验基本信息表单
      if (currentStep === StepEnum.Basic) {
        try {
          await basicFormInstance.validateFields();
        } catch (err) {
          message.error('请填入任务名称');
          return;
        }
      }

      submitForm()
        .then(() => {
          updateCurrentStep((nextStep as TaskStep).value);
        })
        .catch(() => {});
    },
    [basicFormInstance, currentStep, stepDataSource, submitForm, updateCurrentStep],
  );

  const handlePrevStep = async (step: TaskStep, lastStep: TaskStep) => {
    // 如果是从标注配置步骤回到上一步，需要校验配置表单
    if (lastStep.value === StepEnum.Config) {
      try {
        await annotationFormInstance.validateFields();
      } catch (err) {
        message.error('请检查标注配置');
        return;
      }

      if (previewVisible) {
        setPreviewVisible(false);
      }
    }
    submitForm()
      .then(() => {
        updateCurrentStep(step.value);
      })
      .catch(() => {});
  };

  const actionNodes = useMemo(() => {
    if (currentStep === StepEnum.Config) {
      if (previewVisible) {
        return (
          <Button onClick={() => setPreviewVisible(false)}>
            <ArrowLeftOutlined />
            退出预览
          </Button>
        );
      }
      const previewDisabled = !isAnnotationFormValid || isEmpty(samples.data);
      return (
        <>
          <Button onClick={handleOpenPreview} disabled={previewDisabled || isEmpty(samples.data)}>
            进入预览
            <ArrowRightOutlined />
          </Button>
          <Button onClick={handleCancel}>取消</Button>
          <Button loading={loading} type="primary" onClick={commonController.debounce(handleSave, 200)}>
            保存
          </Button>
        </>
      );
    }

    return (
      <>
        <Button onClick={handleCancel}>取消</Button>

        <Button loading={loading} type="primary" onClick={commonController.debounce(handleNextStep, 100)}>
          下一步
        </Button>
      </>
    );
  }, [
    currentStep,
    handleCancel,
    loading,
    handleNextStep,
    previewVisible,
    isAnnotationFormValid,
    samples.data,
    handleOpenPreview,
    handleSave,
  ]);

  const taskCreationContextValue = useMemo(
    () => ({
      uploadFileList,
      setUploadFileList,
      annotationFormInstance,
      basicFormInstance,
      task: taskData,
      onAnnotationFormChange,
    }),
    [uploadFileList, annotationFormInstance, basicFormInstance, taskData, onAnnotationFormChange],
  );

  return (
    <div className={currentStyles.outerFrame}>
      <div className={currentStyles.stepsRow}>
        <div className={currentStyles.left}>
          <Step steps={stepDataSource} currentStep={currentStep} onNext={handleNextStep} onPrev={handlePrevStep} />
        </div>
        <div className={currentStyles.right}>{actionNodes}</div>
      </div>
      <div className={currentStyles.content}>
        <TaskCreationContext.Provider value={taskCreationContextValue}>
          <div className="form-content" style={{ display: previewVisible ? 'none' : 'block' }}>
            {partials}
          </div>
          {previewVisible && (
            <div className="preview-content">
              <AnnotationOperation
                topActionContent={null}
                isPreview
                sample={transformedSample[0]}
                config={annotationFormInstance.getFieldsValue()}
                isShowOrder={false}
              />
            </div>
          )}
        </TaskCreationContext.Provider>
      </div>
    </div>
  );
};

export default CreateTask;
