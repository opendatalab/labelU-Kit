import React, { memo, useContext } from 'react';
import { Form, Input, Select } from 'antd';
import styled from 'styled-components';
import { FlexLayout } from '@labelu/components-react';

import { MediaType } from '@/api/types';

import { TaskCreationContext } from '../../taskCreation.context';

const Inner = styled(FlexLayout)`
  width: 740px;
  margin: auto;
`;

const InputInfoConfig = () => {
  const { basicFormInstance } = useContext(TaskCreationContext);

  return (
    <FlexLayout padding="1rem" flex="column">
      <Inner flex="column">
        <h2>基础配置</h2>
        <FlexLayout.Content>
          <Form form={basicFormInstance} labelCol={{ span: 3 }} wrapperCol={{ span: 21 }}>
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
                  {
                    label: '音频',
                    value: MediaType.AUDIO,
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
        </FlexLayout.Content>
      </Inner>
    </FlexLayout>
  );
};
export default memo(InputInfoConfig);
