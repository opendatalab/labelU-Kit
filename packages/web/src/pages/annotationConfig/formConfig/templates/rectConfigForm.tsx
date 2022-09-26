import { BasicConfig } from '@label-u/components';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { Col, Row, Switch, Input as SenseInput, Form, FormInstance } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';

interface CommonFormItems {
  CommonFormItems: React.ReactNode;
  name: string;
}

export interface AttributeItem {
  key: string;
  label: string;
}
interface FormRectConfig {
  minWidth: number;
  minHeight: number;
  attributeList: AttributeItem[];
}

const RectConfigForm: FC<BasicConfig & CommonFormItems> = props => {
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
  const [initVal, setInitVal] = useState<FormRectConfig>({} as FormRectConfig);

  useMemo(() => {
    let initV = {
      // @ts-ignore
      minWidth: props.config.minWidth ? props.config.minWidth : 10,
      // @ts-ignore
      minHeight: props.config.minHeight ? props.config.minHeight : 10,
      // @ts-ignore
      attributeList: props.config.attributeList
        ? // @ts-ignore
          props.config.attributeList
        : [
            {
              key: 'tag1',
              label: 'tag1'
            }
          ]
    };
    setInitVal(initV);
  }, []);

  return (
    <div>
      <div className="selectedMain">
        <Form {...formItemLayout} name={props.name}>
          <Row>
            <Col span={4}>
              <div className="selectedName">最小尺寸</div>
            </Col>
            <Col span={8}>
              <Form.Item name="minWidth" initialValue={initVal.minWidth}>
                <SenseInput type="text" suffix={<div>W</div>} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
            <Col span={1} />
            <Col span={8}>
              <Form.Item name="minHeight" initialValue={initVal.minHeight}>
                <SenseInput type="text" suffix={<div>H</div>} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="标签配置" name="attributeList" initialValue={initVal.attributeList}>
            <MapStateJSONTab isAttributeList={true} readonly={isAllReadOnly} />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default RectConfigForm;
