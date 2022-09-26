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
  const formItemLayout = {
    labelCol: {
      xs: {
        span: 24
      },
      sm: {
        span: 4
      }
    },
    wrapperCol: {
      xs: {
        span: 24
      },
      sm: {
        span: 16
      }
    }
  };
  return (
    <div className="selectedMain">
      <Form {...formItemLayout}>
        <Form.Item
          label={<span className="formTitle">文本列表</span>}
          name="configList"
          initialValue={[{ ...defaultValue }]}
        >
          <TextList />
        </Form.Item>
      </Form>
    </div>
  );
};

export default TextConfigForm;
