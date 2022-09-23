import { BasicConfig } from '@label-u/components';
import React, { FC } from 'react';
import { Col, Row, Switch, Input as SenseInput, Form, FormInstance } from 'antd';
import TextList from '../../components/TextList';
export const defaultValue = {
  label: '文本',
  key: 'text',
  required: false,
  default: '',
  maxLength: 1000
};
const TextConfigForm: FC<BasicConfig> = () => {


  return (
    <div>
      <div className="selectedMain">
        <Form.Item
          label={<span className="formTitle">文本列表</span>}
          name="configList"
          initialValue={[{ ...defaultValue }]}
        >
          <TextList />
        </Form.Item>
      </div>
    </div>
  );
};

export default TextConfigForm;
