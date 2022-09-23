import { BasicConfig } from '@label-u/components';
import React, { FC } from 'react';
import { Col, Row, Switch, Input as SenseInput, Form, FormInstance, Select, Input } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';
import SvgIcon from '../../../../components/basic/svgIcon';
const { Option } = Select;
const pointConfigForm: FC<BasicConfig> = () => {
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
          <Form.Item
            name="upperLimit"
            label="上限点数"
            rules={[
              {
                required: true,
                message: 'Please select lineType!'
              }
            ]}
          >
            <Input />
          </Form.Item>

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
          </Form.Item>
          <Form.Item
            valuePropName="checked"
            label={<span className="formTitle">通用标签</span>}
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

export default pointConfigForm;
