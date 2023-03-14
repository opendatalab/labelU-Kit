import type { BasicConfig } from '@label-u/components';
import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Col, Row, Input as SenseInput, Form, Select, Switch } from 'antd';
import { useForm } from 'antd/es/form/Form';

import DownWardIcon from '@/img/common/downWardIcon.svg';
import UpperIcon from '@/img/common/upperIcon.svg';

import { MapStateJSONTab } from '../../components/AttributeConfig';
import type { AttributeItem } from './rectConfigForm';
import { delayTime } from '../constants';
const { Option } = Select;

interface FormPolygonConfig {
  lineType: number;
  lowerLimitPointNum: number;
  upperLimitPointNum: number;
  edgeAdsorption: boolean;
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

  const [initVal, setInitVal] = useState<FormPolygonConfig>({
    lineType: 0,
    lowerLimitPointNum: 3,
    upperLimitPointNum: 100,
    attributeList: [
      {
        key: '',
        value: '',
      },
    ],
  } as FormPolygonConfig);

  const { children } = props;
  useMemo(() => {
    if (props.config) {
      const initV = {
        // @ts-ignore
        edgeAdsorption: props.config.edgeAdsorption ? props.config.edgeAdsorption : false,
        // @ts-ignore
        lineType: props.config.lineType ? props.config.lineType : 0,
        // @ts-ignore
        lowerLimitPointNum: props.config.lowerLimitPointNum ? props.config.lowerLimitPointNum : 3,
        // @ts-ignore
        upperLimitPointNum: props.config.upperLimitPointNum ? props.config.upperLimitPointNum : 100,
        // @ts-ignore
        attributeList: props.config.attributeList
          ? // @ts-ignore
            props.config.attributeList
          : [
              {
                key: '',
                value: '',
              },
            ],
      };

      setInitVal(initV);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // @ts-ignore
  const formSubmitThrottle = window.throttle(() => {
    form.submit();
  }, delayTime);
  return (
    <div>
      <div className="selectedMain">
        <Form {...formItemLayout} name={props.name} form={form} onChange={formSubmitThrottle}>
          <Form.Item name="lineType" label="线条类型" initialValue={initVal.lineType}>
            <Select
              placeholder="请选择线类型"
              onChange={() => {
                form.submit();
              }}
            >
              <Option value={0}>直线</Option>
              <Option value={1}>贝塞尔曲线</Option>
            </Select>
          </Form.Item>

          <Row className="double-input">
            <Col span={4}>
              <div className="selectedName">闭点个数</div>
            </Col>
            <Col span={9}>
              <Form.Item name="lowerLimitPointNum" initialValue={initVal.lowerLimitPointNum}>
                <SenseInput type="text" suffix={<img alt="downIcon" src={DownWardIcon} />} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
            <Col span={11}>
              <Form.Item name="upperLimitPointNum" initialValue={initVal.upperLimitPointNum}>
                <SenseInput type="text" suffix={<img alt="upIcon" src={UpperIcon} />} disabled={isAllReadOnly} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            valuePropName="checked"
            label={<span className="formTitle">边缘吸附</span>}
            name="edgeAdsorption"
            initialValue={initVal.edgeAdsorption}
          >
            <Switch
              disabled={isAllReadOnly}
              onChange={() => {
                form.submit();
              }}
            />
          </Form.Item>
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
