import { BasicConfig } from '@label-u/components';
import React, { FC } from 'react';
import { Col, Row, Switch, Input as SenseInput, Form, FormInstance, Select } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';
// import DownWardIcon from '../../../../img/common/downWardIcon.svg';
// import UpperIcon from '../../../../img/common/upperIcon.svg';
import SvgIcon from '../../../../components/basic/svgIcon';
const { Option } = Select;
const lineConfigForm: FC<BasicConfig> = () => {
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
            name="lineType"
            label="线条类型"
            rules={[
              {
                required: true,
                message: 'Please select lineType!'
              }
            ]}
          >
            <Select placeholder="请选择线类型">
              <Option value="0">直线</Option>
              <Option value="1">贝塞尔曲线</Option>
            </Select>
          </Form.Item>

          <Row>
            <Col span={4}>
              <div className="selectedName">闭点个数</div>
            </Col>
            <Col span={8}>
              <Form.Item name="lowerLimitPointNum" initialValue={minWidth}>
                <SenseInput type="text" suffix={<SvgIcon name="common-downWardIcon" />} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
            <Col span={1} />
            <Col span={8}>
              <Form.Item name="upperLimitPointNum" initialValue={minHeight}>
                <SenseInput type="text" suffix={<SvgIcon name="common-upperIcon" />} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            valuePropName="checked"
            label={<span className="formTitle">边缘吸附</span>}
            name="attributeConfigurable"
            initialValue={false}
          >
            <Switch disabled={isAllReadOnly} />
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

export default lineConfigForm;
