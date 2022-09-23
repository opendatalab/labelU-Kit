import { BasicConfig } from '@label-u/components';
import React, { FC } from 'react';
import { Col, Row, Switch, Input as SenseInput, Form, FormInstance } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';

const RectConfigForm: FC<BasicConfig> = () => {
  const minWidth = 1,
    minHeight = 1;
  const isAllReadOnly = false;
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
    <div>
      <div className="selectedMain">
        <Form {...formItemLayout}>
          <Row>
            <Col span={4}>
              <div className="selectedName">最小尺寸</div>
            </Col>
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
          <Form.Item
            label="标签配置"
            name="attributeList"
            initialValue={[
              {
                key: '类别1',
                value: '类别1'
              }
            ]}
          >
            <MapStateJSONTab isAttributeList={true} readonly={isAllReadOnly} />
          </Form.Item>
          {/* <Form.Item
            valuePropName="checked"
            label={<span className="formTitle">目标外标注</span>}
            name="attributeConfigurable"
            initialValue={false}
          >
            <Switch disabled={isAllReadOnly} />
          </Form.Item>
          <Form.Item
            valuePropName="checked"
            label={<span className="formTitle">属性配置</span>}
            name="attributeConfigurable"
            initialValue={false}
          >
            <Switch disabled={isAllReadOnly} />
          </Form.Item> */}
        </Form>
      </div>
    </div>
  );
};

export default RectConfigForm;
