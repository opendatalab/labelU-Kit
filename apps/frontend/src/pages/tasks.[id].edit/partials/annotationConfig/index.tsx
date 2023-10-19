import { useContext } from 'react';

import { MediaType } from '@/api/types';

import FormConfig from './formConfig';
import { TaskCreationContext } from '../../taskCreation.context';
import styles from './index.module.scss';
import TemplateModal from './templateModal';

// 配置页的config统一使用此组件的state
const AnnotationConfig = () => {
  const { task, onTemplateSelect } = useContext(TaskCreationContext);

  return (
    <div className={styles.wrapper}>
      <div className={styles.innerWrapper}>
        <div className={styles.header}>
          <span className={styles.title}>标注配置</span>
          {task && task?.media_type === MediaType.IMAGE && <TemplateModal onSelect={onTemplateSelect} />}
        </div>
        <div className={styles.content}>
          <FormConfig />
        </div>
      </div>
    </div>
  );
};

export default AnnotationConfig;
