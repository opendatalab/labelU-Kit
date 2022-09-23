import { BasicConfig } from '@label-u/components';
import React, { FC } from 'react';
import { Col, Row, Switch, Input as SenseInput, Form, FormInstance } from 'antd';
const RectConfigForm: FC<BasicConfig> = () => {
  const minWidth = 1,
    minHeight = 1;
  const isAllReadOnly = false;
  return (
    <div>
      <div className="selectedMain">
        <Form>
          <Row>
            <Col span={8}>
              <Form.Item name="minWidth" initialValue={minWidth}>
                <SenseInput type="text" suffix={<div>W</div>} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
            <Col span={1} />
            <Col span={8}>
              <Form.Item name="minHeight" initialValue={minHeight}>
                <SenseInput type="text" suffix={<div>H</div>} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default RectConfigForm;
