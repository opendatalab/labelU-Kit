import { BasicConfig } from '@label-u/components';
import React, { FC, useMemo, useState } from 'react';
import { Col, Row, Switch, Input as SenseInput, Form, Select } from 'antd';
import { MapStateJSONTab } from '../../components/AttributeConfig';
import DownWardIcon from '../../../../img/common/downWardIcon.svg';
import UpperIcon from '../../../../img/common/upperIcon.svg';
import { AttributeItem } from './rectConfigForm';
import { useForm } from 'antd/es/form/Form';
const { Option } = Select;
interface FormLineConfig {
  lineType: number;
  lowerLimitPointNum: number;
  upperLimitPointNum: number;
  attributeList: AttributeItem[];
}

const LineConfigForm: FC<BasicConfig & { name: string }> = props => {
  const [form] = useForm();
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

  const [initVal, setInitVal] = useState<FormLineConfig>({
    lineType: 0,
    lowerLimitPointNum: 10,
    upperLimitPointNum: 100,
    attributeList: [
      {
        key: 'lineTool',
        value: 'lineTool'
      }
    ]
  } as FormLineConfig);

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
                key: 'lineTool',
                value: 'lineTool'
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
            rules={[
              {
                required: true,
                message: 'Please select lineType!'
              }
            ]}
            initialValue={initVal.lineType + ''}
          >
            <Select
              placeholder="请选择线类型"
              onChange={e => {
                form.submit();
              }}
            >
              <Option value="0">直线</Option>
              <Option value="2">贝塞尔曲线</Option>
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
                <SenseInput type="text" suffix={<img alt="downIcon" src={UpperIcon} />} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            valuePropName="checked"
            label={<span className="formTitle">边缘吸附</span>}
            name="attributeConfigurable"
            initialValue={false}
          >
            <Switch
              disabled={isAllReadOnly}
              onChange={e => {
                form.submit();
              }}
            />
          </Form.Item>

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

export default LineConfigForm;
