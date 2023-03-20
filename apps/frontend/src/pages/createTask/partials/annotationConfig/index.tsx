import { useEffect, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from 'antd';

import type { Dispatch } from '@/store';

import FormConfig from './formConfig';
import { TaskCreationContext } from '../../taskCreation.context';
import styles from './index.module.scss';

// 配置页的config统一使用此组件的state
const AnnotationConfig = () => {
  const dispatch = useDispatch<Dispatch>();
  const { task = {}, annotationFormInstance } = useContext(TaskCreationContext);
  const taskId = task.id;

  useEffect(() => {
    if (!taskId) {
      return;
    }

    dispatch.sample.fetchSamples({
      task_id: taskId,
      pageNo: 1,
      pageSize: 1,
    });
  }, [dispatch.sample, taskId]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.innerWrapper}>
        <div className={styles.header}>
          <span className={styles.title}>配置方式</span>
          <Button type="link">选择模板</Button>
        </div>
        <div className={styles.content}>
          <FormConfig form={annotationFormInstance} />
        </div>
      </div>
    </div>
  );
};

export default AnnotationConfig;
