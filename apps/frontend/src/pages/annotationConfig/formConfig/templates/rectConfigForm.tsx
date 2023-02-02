import type { BasicConfig } from '@label-u/components';
import type { FC } from 'react';
import React, { useMemo, useState } from 'react';
import { Col, Row, Input as SenseInput, Form } from 'antd';
import { useForm } from 'antd/es/form/Form';

import { MapStateJSONTab } from '../../components/AttributeConfig';
import { delayTime } from '../constants';
export interface AttributeItem {
  key: string;
  value: string;
}
interface FormRectConfig {
  minWidth: number;
  minHeight: number;
  attributeList: AttributeItem[];
}

const RectConfigForm: FC<BasicConfig & { name: string }> = (props) => {
  const isAllReadOnly = false;
  const [form] = useForm();
  const formItemLayout = {
    labelCol: {
      xs: {
        span: 24,
      },
      sm: {
        span: 4,
      },
    },
    wrapperCol: {
      xs: {
        span: 24,
      },
      sm: {
        span: 16,
      },
    },
  };
  const [initVal, setInitVal] = useState<FormRectConfig>({
    minWidth: 1,
    minHeight: 1,
    attributeList: [
      {
        key: 'rectTool',
        value: 'rectTool',
      },
    ],
  } as FormRectConfig);

  useMemo(() => {
    if (props.config) {
      const initV = {
        // @ts-ignore
        minWidth: props.config.minWidth ? props.config.minWidth : 1,
        // @ts-ignore
        minHeight: props.config.minHeight ? props.config.minHeight : 1,
        // @ts-ignore
        attributeList: props.config.attributeList
          ? // @ts-ignore
            props.config.attributeList
          : [
              {
                key: 'rectTool',
                value: 'rectTool',
              },
            ],
      };
      setInitVal(initV);
    }
  }, []);
  const { children } = props;

  // @ts-ignore
  const formSubmitThrottle = window.throttle(() => {
    form.submit();
  }, delayTime);

  return (
    <div>
      <div className="selectedMain">
        <Form {...formItemLayout} name={props.name} form={form} onChange={formSubmitThrottle}>
          <Row className="double-input">
            <Col span={4}>
              <div className="selectedName">最小尺寸</div>
            </Col>
            <Col span={9}>
              <Form.Item label="" name="minWidth" initialValue={initVal.minWidth}>
                <SenseInput type="text" suffix={<div>W</div>} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
            <Col span={11}>
              <Form.Item name="minHeight" initialValue={initVal.minHeight}>
                <SenseInput type="text" suffix={<div>H</div>} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="标签配置" name="attributeList" initialValue={initVal.attributeList}>
            <MapStateJSONTab
              onSubmitAction={() => {
                form.submit();
              }}
              isAttributeList={true}
              readonly={isAllReadOnly}
            />
          </Form.Item>
        </Form>
        {children}
      </div>
    </div>
  );
};

export default RectConfigForm;
