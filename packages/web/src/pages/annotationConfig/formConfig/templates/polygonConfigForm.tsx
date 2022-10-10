import { BasicConfig } from '@label-u/components';
import React, { FC, useMemo, useState } from 'react';
import { Col, Row, Input as SenseInput, Form, Select } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';
// import SvgIcon from '../../../../components/basic/svgIcon';
import DownWardIcon from '../../../../img/common/downWardIcon.svg';
import UpperIcon from '../../../../img/common/upperIcon.svg';
import { AttributeItem } from './rectConfigForm';
import { useForm } from 'antd/es/form/Form';
const { Option } = Select;

interface FormPolygonConfig {
  lineType: number;
  lowerLimitPointNum: number;
  upperLimitPointNum: number;
  attributeList: AttributeItem[];
}

const RectConfigForm: FC<BasicConfig & { name: string }> = props => {
  const isAllReadOnly = false;
  const [form] = useForm();
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

  const [initVal, setInitVal] = useState<FormPolygonConfig>({
    lineType: 0,
    lowerLimitPointNum: 10,
    upperLimitPointNum: 100,
    attributeList: [
      {
        key: 'polygonTool',
        value: 'polygonTool'
      }
    ]
  } as FormPolygonConfig);

  useMemo(() => {
    if (props.config) {
      let initV = {
        // @ts-ignore
        lineType: props.config.lineType ? props.config.lineType : 0,
        // @ts-ignore
        lowerLimitPointNum: props.config.lowerLimitPointNum ? props.config.lowerLimitPointNum : 10,
        // @ts-ignore
        upperLimitPointNum: props.config.upperLimitPointNum ? props.config.upperLimitPointNum : 100,
        // @ts-ignore
        attributeList: props.config.attributeList
          ? // @ts-ignore
            props.config.attributeList
          : [
              {
                key: 'polygonTool',
                value: 'polygonTool'
              }
            ]
      };

      setInitVal(initV);
    }
  }, []);

  return (
    <div>
      <div className="selectedMain">
        <Form
          {...formItemLayout}
          name={props.name}
          form={form}
          onChange={e => {
            e.stopPropagation();
            form.submit();
          }}
        >
          <Form.Item
            name="lineType"
            label="线条类型"
            initialValue={initVal.lineType}
            rules={[
              {
                required: true,
                message: 'Please select lineType!'
              }
            ]}
          >
            <Select
              placeholder="请选择线类型"
              onChange={e => {
                form.submit();
              }}
            >
              <Option value={0}>直线</Option>
              <Option value={1}>贝塞尔曲线</Option>
            </Select>
          </Form.Item>

          <Row>
            <Col span={4}>
              <div className="selectedName">闭点个数</div>
            </Col>
            <Col span={8}>
              <Form.Item name="lowerLimitPointNum" initialValue={initVal.lowerLimitPointNum}>
                <SenseInput type="text" suffix={<img alt="downIcon" src={DownWardIcon} />} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
            <Col span={1} />
            <Col span={8}>
              <Form.Item name="upperLimitPointNum" initialValue={initVal.upperLimitPointNum}>
                <SenseInput type="text" suffix={<img alt="upIcon" src={UpperIcon} />} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="标签配置" name="attributeList" initialValue={initVal.attributeList}>
            <MapStateJSONTab
              onChange={e => {
                form.submit();
              }}
              isAttributeList={true}
              readonly={isAllReadOnly}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default RectConfigForm;
