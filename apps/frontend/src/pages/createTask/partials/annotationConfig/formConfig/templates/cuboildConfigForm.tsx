import type { BasicConfig } from '@label-u/components';
import type { FC } from 'react';
import React, { useMemo, useState } from 'react';
import { Col, Row, Input as SenseInput, Form } from 'antd';
import { useForm } from 'antd/es/form/Form';

import { delayTime } from '@/pages/createTask/partials/annotationConfig/formConfig/constants';

export interface AttributeItem {
  key: string;
  value: string;
}
interface FormCuboidConfig {
  minWidth: number;
  minHeight: number;
}

const CuboidConfigForm: FC<BasicConfig & { name: string }> = (props) => {
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
  const [initVal, setInitVal] = useState<FormCuboidConfig>({
    minWidth: 1,
    minHeight: 1,
  } as FormCuboidConfig);

  useMemo(() => {
    if (props.config) {
      const initV = {
        // @ts-ignore
        minWidth: props.config.minWidth ? props.config.minWidth : 1,
        // @ts-ignore
        minHeight: props.config.minHeight ? props.config.minHeight : 1,
      };
      setInitVal(initV);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        </Form>
        {children}
      </div>
    </div>
  );
};

export default CuboidConfigForm;
