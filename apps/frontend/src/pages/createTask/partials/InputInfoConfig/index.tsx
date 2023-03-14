import React, { memo, useContext } from 'react';
import { Form, Input } from 'antd';

import styles from './index.module.scss';
import { TaskCreationContext } from '../../taskCreation.context';

const InputInfoConfig = () => {
  const { task = {}, formData, updateFormData } = useContext(TaskCreationContext);
  const { name, description, tips } = task;

  const handleFieldChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const targetValue = event.target.value;
    updateFormData(field)(targetValue);
  };

  return (
    <div className={styles.outerFrame}>
      <div className={styles.title}>
        <div className={styles.icon} />
        <div className={styles.titleText}>基础配置</div>
      </div>
      <Form>
        <div className={styles.content}>
          <div className={styles.item}>
            <div className={styles.itemLabel}>
              <div style={{ color: 'red', width: '8px' }}>*</div>
              任务名称
            </div>
            <div className={styles.itemInput}>
              <Input
                placeholder="请输入50字以内的任务名称"
                onChange={handleFieldChange('name')}
                maxLength={50}
                defaultValue={name}
                value={formData.name}
              />
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.itemLabel}>任务描述</div>
            <div className={styles.itemInput}>
              <Input.TextArea
                placeholder="请输入500字以内的任务描述"
                onChange={handleFieldChange('description')}
                autoSize={{ minRows: 6, maxRows: 10 }}
                maxLength={500}
                defaultValue={description}
                value={formData.description}
              />
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.itemLabel}>任务提示</div>
            <div className={styles.itemInput}>
              <Input.TextArea
                placeholder="请输入1000字以内的标注任务提示，在标注过程中为标注者提供帮助"
                onChange={handleFieldChange('tips')}
                maxLength={1000}
                autoSize={{ minRows: 6, maxRows: 10 }}
                defaultValue={tips}
                value={formData.tips}
              />
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};
export default memo(InputInfoConfig);
