import React, { memo, useContext } from 'react';
import { Form, Input, Select } from 'antd';

import { MediaType } from '@/services/types';

import styles from './index.module.scss';
import { TaskCreationContext } from '../../taskCreation.context';

const InputInfoConfig = () => {
  const { basicFormInstance } = useContext(TaskCreationContext);

  return (
    <div className={styles.wrapper}>
      <div className={styles.innerWrapper}>
        <div className={styles.header}>
          <span className={styles.title}>基础配置</span>
        </div>
        <div className={styles.content}>
          <Form form={basicFormInstance} className={styles.basicForm} labelCol={{ span: 3 }} wrapperCol={{ span: 21 }}>
            <Form.Item label="任务名称" name="name" required rules={[{ required: true, message: '任务名称不可为空' }]}>
              <Input placeholder="请输入50字以内的任务名称" maxLength={50} />
            </Form.Item>
            <Form.Item label="数据类型" name="media_type" rules={[{ required: true, message: '数据类型不可为空' }]}>
              <Select
                placeholder="请选择数据类型"
                options={[
                  {
                    label: '图片',
                    value: MediaType.IMAGE,
                  },
                  {
                    label: '视频',
                    value: MediaType.VIDEO,
                  },
                ]}
              />
            </Form.Item>
            <Form.Item label="任务描述" name="description">
              <Input.TextArea placeholder="请输入500字以内的任务描述" maxLength={500} rows={6} />
            </Form.Item>
            <Form.Item label="任务提示" name="tips">
              <Input.TextArea
                placeholder="请输入1000字以内的标注任务提示，在标注过程中为标注者提供帮助"
                maxLength={1000}
                rows={6}
              />
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};
export default memo(InputInfoConfig);
